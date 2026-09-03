"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  createDataTableColumnHelper,
  DataTable,
  DataTableColumnHeader,
} from "@/components/ui/data-table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { authClient, hardResetForOrganization, useSession } from "@/lib/auth/client";
import {
  canDeleteOrganization,
  canManageMembers,
  hasOwnerRole,
} from "@/lib/auth/permissions";
import type {
  InvitationRow,
  MemberRow,
  MemberTableMeta,
  OrganizationRole,
} from "@/lib/types";

const columnHelper = createDataTableColumnHelper<MemberRow>();

const memberColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as MemberTableMeta | undefined;
      const isSelf = row.original.userId === meta?.currentUserId;
      return (
        <span className="font-medium">
          {row.original.name || "—"}
          {isSelf ? (
            <span className="ms-2 text-xs text-muted-foreground">(you)</span>
          ) : null}
        </span>
      );
    },
    sortFn: "text",
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ getValue }) => getValue() || "—",
    sortFn: "text",
  }),
  columnHelper.accessor("role", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
    sortFn: "text",
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-end">Actions</div>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as MemberTableMeta | undefined;
      if (!meta?.canManage) return null;

      const member = row.original;
      const isSelf = member.userId === meta.currentUserId;
      const busy = meta.busyId === member.id;

      return (
        <div className="flex justify-end gap-2">
          {member.role !== "owner" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => meta.onMakeOwner(member)}
            >
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Make owner
            </Button>
          ) : null}
          {!isSelf ? (
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => meta.onRemove(member)}
            >
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Remove
            </Button>
          ) : null}
        </div>
      );
    },
  }),
]);

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function MembersSettings() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [members, setMembers] = React.useState<MemberRow[]>([]);
  const [invitations, setInvitations] = React.useState<InvitationRow[]>([]);
  const [organizationId, setOrganizationId] = React.useState<string | null>(
    null,
  );
  const [organizationName, setOrganizationName] = React.useState("Organization");
  const [currentRole, setCurrentRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<OrganizationRole>("member");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const loadMembers = React.useCallback(async () => {
    setLoading(true);
    const [activeMember, listed, fullOrg] = await Promise.all([
      authClient.organization.getActiveMember(),
      authClient.organization.listMembers({ query: { limit: 100, offset: 0 } }),
      authClient.organization.getFullOrganization(),
    ]);

    if (activeMember.error || listed.error || fullOrg.error) {
      toast.add({
        title: "Could not load members",
        description:
          activeMember.error?.message ??
          listed.error?.message ??
          fullOrg.error?.message ??
          "Unknown error",
      });
      setLoading(false);
      return;
    }

    setCurrentRole(activeMember.data?.role ?? null);
    setMembers(
      (listed.data?.members ?? []).map(
        (member): MemberRow => ({
          id: member.id,
          role: member.role,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image ?? null,
        }),
      ),
    );
    setInvitations(
      (fullOrg.data?.invitations ?? [])
        .filter((invite) => invite.status === "pending")
        .map(
          (invite): InvitationRow => ({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            status: invite.status,
          }),
        ),
    );
    setOrganizationId(fullOrg.data?.id ?? null);
    setOrganizationName(fullOrg.data?.name ?? "Organization");
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [debouncedSearch, sorting]);

  const canManage = canManageMembers(currentRole);
  const canDelete = canDeleteOrganization(currentRole);
  const ownerCount = members.filter((member) =>
    hasOwnerRole(member.role),
  ).length;
  const isSoleOwner = hasOwnerRole(currentRole) && ownerCount <= 1;

  const filtered = React.useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    let rows = members;
    if (search) {
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(search) ||
          row.email.toLowerCase().includes(search) ||
          row.role.toLowerCase().includes(search),
      );
    }

    const sort = sorting[0];
    const key = (sort?.id ?? "name") as keyof MemberRow;
    const dir = sort?.desc ? -1 : 1;
    return [...rows].sort((a, b) => {
      const left = String(a[key] ?? "").toLowerCase();
      const right = String(b[key] ?? "").toLowerCase();
      if (left < right) return -1 * dir;
      if (left > right) return 1 * dir;
      return 0;
    });
  }, [members, debouncedSearch, sorting]);

  const pageRows = filtered.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize,
  );

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !canManage) return;
    setBusyId("invite");
    const { error } = await authClient.organization.inviteMember({
      email: email.trim(),
      role: inviteRole,
      resend: true,
    });
    setBusyId(null);
    if (error) {
      toast.add({
        title: "Could not invite member",
        description: error.message,
      });
      return;
    }
    toast.add({
      title: "Invitation created",
      description: `${email.trim()} can join after signing in with Google.`,
    });
    setEmail("");
    await loadMembers();
    router.refresh();
  }

  async function cancelInvitation(invitation: InvitationRow) {
    if (!canManage) return;
    setBusyId(invitation.id);
    const { error } = await authClient.organization.cancelInvitation({
      invitationId: invitation.id,
    });
    setBusyId(null);
    if (error) {
      toast.add({
        title: "Could not cancel invitation",
        description: error.message,
      });
      return;
    }
    toast.add({ title: "Invitation canceled" });
    await loadMembers();
  }

  async function removeMember(member: MemberRow) {
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

  async function makeOwner(member: MemberRow) {
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

  async function leaveOrganization() {
    if (!organizationId || isSoleOwner) return;
    setBusyId("leave");
    const { error } = await authClient.organization.leave({ organizationId });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Could not leave", description: error.message });
      return;
    }
    toast.add({ title: "Left organization" });
    hardResetForOrganization("/protected/dashboard");
  }

  async function confirmDeleteOrganization() {
    if (!organizationId || !canDelete) return;
    setBusyId("delete");
    const { error } = await authClient.organization.delete({ organizationId });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Could not delete", description: error.message });
      return;
    }
    setDeleteOpen(false);
    toast.add({ title: "Organization deleted" });
    hardResetForOrganization("/protected/dashboard");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage members for {organizationName}.
        </p>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
            <CardDescription>
              Creates a Better Auth invitation. They join after signing in with
              Google (same email).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void inviteMember(event)}>
              <FieldGroup className="gap-4 md:flex-row md:items-end">
                <Field className="flex-1">
                  <FieldLabel htmlFor="member-email">Email</FieldLabel>
                  <Input
                    id="member-email"
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
                      if (value === "member" || value === "admin" || value === "owner") {
                        setInviteRole(value);
                      }
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
                  {busyId === "invite" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Invite
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {canManage && invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              Waiting for these people to sign in with Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{invitation.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Role: {invitation.role}
                  </p>
                </div>
                <Badge variant="secondary">Pending</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === invitation.id}
                  onClick={() => void cancelInvitation(invitation)}
                >
                  {busyId === invitation.id ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Cancel
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Search, sort, and page through members.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="member-search">Search</FieldLabel>
            <Input
              id="member-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, or role…"
            />
          </Field>

          {loading && members.length === 0 ? (
            <MembersTableSkeleton />
          ) : (
            <div className={loading ? "opacity-60" : undefined}>
              <DataTable
                columns={memberColumns}
                data={pageRows}
                rowCount={filtered.length}
                pagination={pagination}
                onPaginationChange={setPagination}
                sorting={sorting}
                onSortingChange={setSorting}
                manualPagination
                manualSorting
                manualFiltering
                emptyMessage="No members found."
                meta={{
                  currentUserId: session?.user.id,
                  canManage,
                  busyId,
                  onMakeOwner: (member: MemberRow) => void makeOwner(member),
                  onRemove: (member: MemberRow) => void removeMember(member),
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Leave this organization, or delete it if you are an owner.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {!isSoleOwner ? (
            <Button
              type="button"
              variant="outline"
              disabled={!organizationId || busyId === "leave"}
              onClick={() => void leaveOrganization()}
            >
              {busyId === "leave" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Leave organization
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are the only owner. Delete the organization or make someone
              else an owner before leaving.
            </p>
          )}
          {canDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={!organizationId || busyId === "delete"}
              onClick={() => setDeleteOpen(true)}
            >
              Delete organization
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &quot;{organizationName}&quot; and removes
              all members. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId === "delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busyId === "delete"}
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteOrganization();
              }}
            >
              {busyId === "delete" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MembersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex gap-4 border-b px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="ms-auto h-4 w-20" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="ms-auto h-7 w-24" />
        </div>
      ))}
    </div>
  );
}
