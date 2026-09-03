"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { authClient, hardResetForOrganization } from "@/lib/auth/client";
import type {
  Organization,
  OrganizationDialogProps,
  OrganizationGateProps,
} from "@/lib/types";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org"
  );
}

/** Create-organization dialog (optional first-run / switcher). */
export function OrganizationDialog({
  open,
  onOpenChange,
  title = "Create organization",
  description = "You will be the owner of this organization.",
  required = false,
  onCreated,
}: OrganizationDialogProps) {
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setName("");
  }, [open]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    const { data, error } = await authClient.organization.create({
      name: name.trim(),
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      keepCurrentActiveOrganization: false,
    });

    if (error || !data) {
      setSubmitting(false);
      toast.add({
        title: "Could not create organization",
        description: error?.message ?? "Something went wrong",
      });
      return;
    }

    const organization: Organization = {
      id: data.id,
      name: data.name,
      slug: data.slug,
    };

    toast.add({
      title: "Organization created",
      description: `You’re the owner of ${organization.name}.`,
    });
    onOpenChange(false);
    await onCreated?.(organization);
    hardResetForOrganization("/protected/dashboard");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && required) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!required}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void onSubmit(event)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-org-name">
                Organization name
              </FieldLabel>
              <Input
                id="create-org-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Inc"
                required
                autoFocus
                disabled={submitting}
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? <Spinner data-icon="inline-start" /> : null}
                Create organization
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * First-run gate: accept pending invitations, force create when the user has
 * zero orgs, otherwise ensure an active org and resume.
 */
export function OrganizationGate({ userId }: OrganizationGateProps) {
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Join any pending invites for this Google email (Better Auth `invitation`).
      const userInvites = await authClient.organization.listUserInvitations();
      if (!cancelled && !userInvites.error) {
        const pending = (userInvites.data ?? []).filter(
          (invite) => invite.status === "pending",
        );
        for (const invite of pending) {
          await authClient.organization.acceptInvitation({
            invitationId: invite.id,
          });
        }
      }

      const [{ data: orgs, error }, session] = await Promise.all([
        authClient.organization.list(),
        authClient.getSession(),
      ]);

      if (cancelled) return;

      if (error) {
        toast.add({
          title: "Could not load organizations",
          description: error.message,
        });
        setReady(true);
        return;
      }

      const list = (orgs ?? []) as Organization[];
      const activeId = session.data?.session.activeOrganizationId ?? null;

      if (list.length === 0) {
        setOpen(true);
        setReady(true);
        return;
      }

      if (!activeId || !list.some((org) => org.id === activeId)) {
        const { error: activeError } = await authClient.organization.setActive({
          organizationId: list[0]!.id,
        });
        if (activeError) {
          toast.add({
            title: "Could not resume organization",
            description: activeError.message,
          });
        } else {
          hardResetForOrganization();
          return;
        }
      }

      setOpen(false);
      setReady(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!ready) return null;

  return (
    <OrganizationDialog
      open={open}
      onOpenChange={setOpen}
      required
      title="Create your organization"
      description="You need an organization to continue. You will be the owner."
      onCreated={() => {
        setOpen(false);
      }}
    />
  );
}
