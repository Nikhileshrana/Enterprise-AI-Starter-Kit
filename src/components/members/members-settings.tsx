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
import { authClient, useSession } from "@/lib/auth/client";
import {
  isOrganizationManager,
  roleHas,
  type MemberRow,
} from "@/lib/types";

type MemberTableMeta = {
  currentUserId?: string;
  canManage: boolean;
  busyId: string | null;
  onMakeOwner: (member: MemberRow) => void;
  onRemove: (member: MemberRow) => void;
};

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

function mapMember(member: {
  id: string;
  role: string;
  userId: string;
  createdAt?: Date | string;
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
  };
}): MemberRow {
  return {
    id: member.id,
    role: member.role,
    userId: member.userId,
    name: member.user?.name ?? "",
    email: member.user?.email ?? "",
    image: member.user?.image ?? null,
    createdAt: member.createdAt ? String(member.createdAt) : null,
  };
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
  const [organizationId, setOrganizationId] = React.useState<string | null>(
    null,
  );
  const [organizationName, setOrganizationName] = React.useState("Organization");
  const [currentRole, setCurrentRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [addRole, setAddRole] = React.useState("member");
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
    setMembers((listed.data?.members ?? []).map(mapMember));
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

  const canManage = isOrganizationManager(currentRole);
  const ownerCount = members.filter((member) =>
    roleHas(member.role, "owner"),
  ).length;
  const isSoleOwner = roleHas(currentRole, "owner") && ownerCount <= 1;

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

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !canManage) return;
    setBusyId("add");
    const response = await fetch("/api/organization/members", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role: addRole }),
    });
    setBusyId(null);
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!response.ok) {
      toast.add({
        title: "Could not add member",
        description: body?.error ?? response.statusText,
      });
      return;
    }
    toast.add({
      title: "Member added",
      description: `${email.trim()} is now in the organization.`,
    });
    setEmail("");
    await loadMembers();
    router.refresh();
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
    router.replace("/protected/dashboard");
    router.refresh();
  }

  async function confirmDeleteOrganization() {
    if (!organizationId || !canManage) return;
    setBusyId("delete");
    const { error } = await authClient.organization.delete({ organizationId });
    setBusyId(null);
    if (error) {
      toast.add({ title: "Could not delete", description: error.message });
      return;
    }
    setDeleteOpen(false);
    toast.add({ title: "Organization deleted" });
    router.replace("/protected/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage members for {organizationName}.
        </p>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add member</CardTitle>
            <CardDescription>
              Add someone who already signed in with Google. They join
              immediately — no invite link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void addMember(event)}>
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
                    disabled={busyId === "add"}
                  />
                </Field>
                <Field className="w-full md:w-40">
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={addRole}
                    onValueChange={(value) => {
                      if (value) setAddRole(value);
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
                <Button type="submit" disabled={busyId === "add"}>
                  {busyId === "add" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Add
                </Button>
              </FieldGroup>
            </form>
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
            Leave this organization, or delete it if you manage it.
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
          {canManage ? (
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
