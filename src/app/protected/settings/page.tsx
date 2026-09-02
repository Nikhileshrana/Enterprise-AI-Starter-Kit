"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { authClient, useSession } from "@/lib/auth/client";

type Member = {
  id: string;
  role: string;
  userId: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
  };
};

const MANAGE_ROLES = new Set(["owner", "admin"]);

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [members, setMembers] = React.useState<Member[]>([]);
  const [orgName, setOrgName] = React.useState<string>("Organization");
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const currentUserId = session?.user.id;
  const myMembership = members.find(
    (member) => member.userId === currentUserId || member.user?.id === currentUserId,
  );
  const canManage = MANAGE_ROLES.has(myMembership?.role ?? "");

  const loadMembers = React.useCallback(async () => {
    setLoading(true);
    const full = await authClient.organization.getFullOrganization();
    if (full.error) {
      toast.add({
        title: "Could not load organization",
        description: full.error.message,
      });
      setLoading(false);
      return;
    }

    setOrgName(full.data?.name ?? "Organization");
    setMembers((full.data?.members ?? []) as Member[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !canManage) return;
    setBusyId("invite");
    const { error } = await authClient.organization.inviteMember({
      email: email.trim(),
      role: inviteRole as "member" | "admin" | "owner",
    });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Invite failed", description: error.message });
      return;
    }
    toast.add({ title: "Invitation sent", description: email.trim() });
    setEmail("");
    await loadMembers();
    router.refresh();
  }

  async function removeMember(member: Member) {
    if (!canManage) return;
    setBusyId(member.id);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: member.id,
    });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Could not remove member", description: error.message });
      return;
    }
    toast.add({ title: "Member removed" });
    await loadMembers();
    router.refresh();
  }

  async function makeOwner(member: Member) {
    if (!canManage) return;
    setBusyId(member.id);
    const { error } = await authClient.organization.updateMemberRole({
      memberId: member.id,
      role: "owner",
    });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Could not update role", description: error.message });
      return;
    }
    toast.add({ title: "Member is now an owner" });
    await loadMembers();
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage members for {orgName}.
        </p>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>
              Send an invitation email to add someone to this organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={inviteMember}>
              <FieldGroup className="gap-4 md:flex-row md:items-end">
                <Field className="flex-1">
                  <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="colleague@company.com"
                    disabled={busyId === "invite"}
                  />
                </Field>
                <Field className="w-full md:w-40">
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => {
                      if (value) setInviteRole(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Button type="submit" disabled={busyId === "invite"}>
                  {busyId === "invite" ? <Spinner data-icon="inline-start" /> : null}
                  Invite
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {canManage
              ? "Owners and admins can invite, remove, or promote members."
              : "You can view members. Ask an admin to change access."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {canManage ? <TableHead className="text-end">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf =
                    member.userId === currentUserId ||
                    member.user?.id === currentUserId;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user?.name ?? "—"}
                        {isSelf ? (
                          <span className="ms-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{member.user?.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      {canManage ? (
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-2">
                            {member.role !== "owner" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === member.id}
                                onClick={() => void makeOwner(member)}
                              >
                                Make owner
                              </Button>
                            ) : null}
                            {!isSelf ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyId === member.id}
                                onClick={() => void removeMember(member)}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
