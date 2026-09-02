"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import type { MemberRow } from "@/app/api/organization/members/route";
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

type MembersResponse = {
  data: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  organizationName: string;
  canManage: boolean;
};

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
      const isSelf =
        row.original.userId === meta?.currentUserId ||
        row.original.id === meta?.currentUserId;
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
      const isSelf =
        member.userId === meta.currentUserId ||
        member.id === meta.currentUserId;
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
  const [payload, setPayload] = React.useState<MembersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const sort = sorting[0];
  const sortBy = sort?.id ?? "name";
  const sortDir = sort?.desc ? "desc" : "asc";

  const loadMembers = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.pageIndex + 1),
      pageSize: String(pagination.pageSize),
      search: debouncedSearch,
      sortBy,
      sortDir,
    });
    const response = await fetch(`/api/organization/members?${params}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast.add({
        title: "Could not load members",
        description: body?.error ?? response.statusText,
      });
      setLoading(false);
      return;
    }
    const json = (await response.json()) as MembersResponse;
    setPayload(json);
    setLoading(false);
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, sortBy, sortDir]);

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [debouncedSearch, sortBy, sortDir]);

  const canManage = payload?.canManage ?? false;

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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage members for {payload?.organizationName ?? "your organization"}.
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

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Search is debounced. Sorting and pagination hit the members API.
          </CardDescription>
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

          {loading && !payload ? (
            <MembersTableSkeleton />
          ) : (
            <div className={loading ? "opacity-60" : undefined}>
              <DataTable
                columns={memberColumns}
                data={payload?.data ?? []}
                rowCount={payload?.total ?? 0}
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
    </div>
  );
}

function MembersTableSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
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
      <div className="mt-3 flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}
