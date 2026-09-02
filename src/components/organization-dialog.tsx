"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function OrganizationDialog({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const { data: orgs, error } = await authClient.organization.list();
    if (error) {
      toast.add({
        title: "Could not load organizations",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    const list = (orgs ?? []) as Organization[];
    setOrganizations(list);

    const session = await authClient.getSession();
    const activeId = session.data?.session.activeOrganizationId ?? null;

    // Force picker when user has no active organization
    setOpen(!activeId);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function selectOrganization(organizationId: string) {
    setSubmitting(true);
    const { error } = await authClient.organization.setActive({
      organizationId,
    });
    setSubmitting(false);
    if (error) {
      toast.add({ title: "Could not select organization", description: error.message });
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function createOrganization(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const slug = slugify(name) || `org-${Date.now()}`;
    const { data, error } = await authClient.organization.create({
      name: name.trim(),
      slug,
    });
    if (error) {
      setSubmitting(false);
      toast.add({ title: "Could not create organization", description: error.message });
      return;
    }
    if (data?.id) {
      await authClient.organization.setActive({ organizationId: data.id });
    }
    setSubmitting(false);
    setName("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select organization</DialogTitle>
          <DialogDescription>
            Choose an organization to continue, or create a new one.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-3 py-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="mt-2 h-7 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {organizations.length > 0 ? (
              <div className="flex flex-col gap-2">
                {organizations.map((org) => (
                  <Button
                    key={org.id}
                    variant="outline"
                    className="justify-start"
                    disabled={submitting}
                    onClick={() => void selectOrganization(org.id)}
                  >
                    {org.name}
                  </Button>
                ))}
              </div>
            ) : null}

            <form onSubmit={createOrganization}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Acme Inc"
                    required
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
