"use client";

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnVisibilityState,
  OnChangeFn,
  PaginationState,
  RowData,
  SortingState,
} from "@tanstack/react-table";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, placeholderKeys } from "@/lib/utils";

/** Shared TanStack Table v9 feature set for all app data tables. */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

export type DataTableFeatures = typeof dataTableFeatures;

/** Typed column helper bound to the shared feature set. */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

// ─── Column meta & presets ───────────────────────────────────────────────────

export type DataTableColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
  skeleton?: React.ReactNode;
  skeletonVariant?:
    | "text"
    | "subtitle"
    | "avatar-text"
    | "icon-text"
    | "badge"
    | "number"
    | "date"
    | "icon"
    | "actions-buttons"
    | "actions-wide";
};

export const dataTableActionColumnMeta = {
  icon: {
    width: "3rem",
    skeletonVariant: "icon" as const,
    headerClassName: "w-12 text-end",
    cellClassName: "w-12 text-end",
  },
  buttons: {
    width: "5rem",
    skeletonVariant: "actions-buttons" as const,
    headerClassName: "w-20 text-end",
    cellClassName: "text-end",
  },
  wide: {
    width: "18rem",
    skeletonVariant: "actions-wide" as const,
    cellClassName: "text-end",
  },
} satisfies Record<string, DataTableColumnMeta>;

export type TableSortQuery = {
  sortBy?: string;
  sortDesc?: boolean;
};

/** Map TanStack sorting state to server list query fields. */
export function sortingToQuery(sorting: SortingState): TableSortQuery {
  const active = sorting[0];
  if (!active?.id) return {};
  return { sortBy: active.id, sortDesc: active.desc === true };
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

type SkeletonVariant = NonNullable<DataTableColumnMeta["skeletonVariant"]>;

const BADGE_COLUMN_IDS = new Set(["status", "active", "role", "priority"]);
const DATE_COLUMN_IDS = /(?:At|Date)$|updated|applied|submitted/i;

function inferSkeletonVariant(columnId: string): SkeletonVariant {
  if (columnId === "actions") return "icon";
  if (BADGE_COLUMN_IDS.has(columnId)) return "badge";
  if (DATE_COLUMN_IDS.test(columnId)) return "date";
  if (columnId.includes("Count")) return "number";
  return "text";
}

function columnMeta<TData extends RowData, TValue>(
  column: Column<DataTableFeatures, TData, TValue>,
): DataTableColumnMeta | undefined {
  return column.columnDef.meta as DataTableColumnMeta | undefined;
}

function DataTableCellSkeleton({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case "avatar-text":
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full max-w-40" />
            <Skeleton className="h-3 w-2/3 max-w-32" />
          </div>
        </div>
      );
    case "badge":
      return <Skeleton className="h-5 w-14 rounded-full" />;
    case "number":
      return <Skeleton className="h-5 w-8" />;
    case "date":
      return <Skeleton className="h-5 w-18" />;
    case "actions-buttons":
      return (
        <div className="ms-auto flex justify-end gap-1">
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      );
    case "actions-wide":
      return <Skeleton className="ms-auto h-8 w-44 max-w-full" />;
    case "icon":
      return <Skeleton className="ms-auto size-8" />;
    default:
      return <Skeleton className="h-5 w-24 max-w-full" />;
  }
}

// ─── Sort header ─────────────────────────────────────────────────────────────

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type SortContextValue = {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

const SortContext = React.createContext<SortContextValue | null>(null);

function sortDirectionForColumn(
  sorting: SortingState,
  columnId: string,
): false | "asc" | "desc" {
  const entry = sorting.find((item) => item.id === columnId);
  if (!entry) return false;
  return entry.desc ? "desc" : "asc";
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}) {
  const sortCtx = React.useContext(SortContext);

  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  const sorted = sortCtx
    ? sortDirectionForColumn(sortCtx.sorting, column.id)
    : column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ms-2 h-7 px-1.5 font-normal text-inherit hover:bg-white/15 hover:text-inherit dark:hover:bg-black/15"
      onClick={() => {
        if (sortCtx) {
          const entry = sortCtx.sorting.find((item) => item.id === column.id);
          const nextDesc = entry ? !entry.desc : false;
          sortCtx.onSortingChange([{ id: column.id, desc: nextDesc }]);
          return;
        }
        column.toggleSorting(sorted === "asc");
      }}
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUpIcon
          className="size-3.5 shrink-0 opacity-90"
          data-icon="inline-end"
        />
      ) : sorted === "desc" ? (
        <ArrowDownIcon
          className="size-3.5 shrink-0 opacity-90"
          data-icon="inline-end"
        />
      ) : (
        <ArrowUpDownIcon
          className="size-3.5 shrink-0 opacity-70"
          data-icon="inline-end"
        />
      )}
    </Button>
  );
}

/** Shorthand: `header: sortableColumnHeader("Name")` */
export function sortableColumnHeader<TData extends RowData, TValue>(
  title: string,
) {
  return ({ column }: { column: Column<DataTableFeatures, TData, TValue> }) => (
    <DataTableColumnHeader column={column} title={title} />
  );
}

// ─── DataTable ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [5, 7, 10, 20, 30, 40, 50] as const;
const EMPTY_DATA: never[] = [];

export interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  data: TData[];
  /** Debounced toolbar search — filters `searchKey` column (client) or calls `onSearchChange` (server). */
  searchKey?: string;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  customSearch?: React.ReactNode;
  hideSearch?: boolean;
  hideColumns?: boolean;
  initialColumnVisibility?: ColumnVisibilityState;
  defaultPageSize?: number;
  emptyMessage?: string;
  /** Server-driven pagination */
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Server-driven filtering */
  manualFiltering?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Server-driven sorting */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  manualSorting?: boolean;
  /** Total row count for server pagination footer */
  totalItems?: number;
  meta?: Record<string, unknown>;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search…",
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  onRowClick,
  loading = false,
  leftActions,
  rightActions,
  customSearch,
  hideSearch = false,
  hideColumns = false,
  initialColumnVisibility = {},
  defaultPageSize = 10,
  emptyMessage = "No results.",
  manualPagination = false,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  manualFiltering = false,
  searchValue,
  onSearchChange,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  totalItems,
  meta,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>(initialColumnVisibility);
  const [searchDraft, setSearchDraft] = React.useState(searchValue ?? "");
  const [clientPagination, setClientPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: defaultPageSize,
    });

  const noColumnFilters = React.useMemo<ColumnFiltersState>(() => [], []);
  const isServerDriven = manualPagination || manualSorting;
  const resolvedSorting = controlledSorting ?? internalSorting;
  const sortingChangeHandler = onSortingChange ?? setInternalSorting;

  const handleSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      sortingChangeHandler(updater);
      if (manualPagination && onPaginationChange) {
        onPaginationChange((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
        );
        return;
      }
      if (!manualPagination) {
        setClientPagination((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
        );
      }
    },
    [sortingChangeHandler, manualPagination, onPaginationChange],
  );

  const debouncedSearch = useDebouncedValue(searchDraft, searchDebounceMs);
  const lastDebouncedSearchRef = React.useRef(debouncedSearch);

  React.useEffect(() => {
    if (manualFiltering && searchValue !== undefined) {
      setSearchDraft(searchValue);
    }
  }, [manualFiltering, searchValue]);

  React.useEffect(() => {
    if (lastDebouncedSearchRef.current === debouncedSearch) return;
    lastDebouncedSearchRef.current = debouncedSearch;

    if (manualFiltering) {
      onSearchChange?.(debouncedSearch);
      if (
        manualPagination &&
        controlledPagination &&
        controlledPagination.pageIndex !== 0
      ) {
        onPaginationChange?.({
          pageIndex: 0,
          pageSize: controlledPagination.pageSize,
        });
      }
      return;
    }

    setColumnFilters((prev) => {
      const rest = prev.filter((filter) => filter.id !== searchKey);
      if (!debouncedSearch.trim()) return rest;
      return [...rest, { id: searchKey, value: debouncedSearch }];
    });

    if (!manualPagination) {
      setClientPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    }
  }, [
    debouncedSearch,
    manualFiltering,
    onSearchChange,
    manualPagination,
    controlledPagination,
    onPaginationChange,
    searchKey,
  ]);

  const resolvedPagination =
    manualPagination && controlledPagination
      ? controlledPagination
      : clientPagination;
  const paginationChangeHandler = manualPagination
    ? onPaginationChange
    : setClientPagination;

  const table = useTable({
    features: dataTableFeatures,
    data: data.length > 0 ? data : (EMPTY_DATA as TData[]),
    columns,
    meta,
    state: {
      sorting: resolvedSorting,
      columnFilters:
        customSearch || hideSearch ? noColumnFilters : columnFilters,
      columnVisibility,
      pagination: resolvedPagination,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: paginationChangeHandler,
    manualPagination,
    manualSorting: isServerDriven,
    manualFiltering,
    rowCount: manualPagination ? totalItems : undefined,
    pageCount: manualPagination ? pageCount : undefined,
    enableSortingRemoval: false,
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const showSkeleton = loading && data.length === 0;
  const isRefreshing = loading && data.length > 0;
  const itemCount =
    totalItems ??
    (manualPagination ? data.length : table.getFilteredRowModel().rows.length);

  return (
    <SortContext.Provider
      value={{ sorting: resolvedSorting, onSortingChange: handleSortingChange }}
    >
      <div className="flex flex-col gap-2">
        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {customSearch ? (
            customSearch
          ) : hideSearch ? (
            <div />
          ) : (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="bg-background pl-9"
              />
            </div>
          )}

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {leftActions}
            {rightActions}
            {!hideColumns ? (
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="sm">
                        Columns <ChevronDown className="ms-2 size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((col) => col.getCanHide())
                      .map((col) => (
                        <DropdownMenuCheckboxItem
                          key={col.id}
                          className="capitalize"
                          checked={col.getIsVisible()}
                          onCheckedChange={(value) =>
                            col.toggleVisibility(!!value)
                          }
                        >
                          {col.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-primary hover:bg-primary/90"
                >
                  {headerGroup.headers.map((header) => {
                    const meta = columnMeta(header.column);
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "text-primary-foreground [&_button]:text-primary-foreground [&_svg]:text-primary-foreground",
                          meta?.headerClassName,
                        )}
                        style={meta?.width ? { width: meta.width } : undefined}
                      >
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody
              className={cn(isRefreshing && "pointer-events-none opacity-50")}
            >
              {showSkeleton ? (
                placeholderKeys(8, "sk").map((rowKey) => (
                  <TableRow key={rowKey}>
                    {visibleColumns.map((column) => {
                      const meta = columnMeta(column);
                      const variant =
                        meta?.skeletonVariant ??
                        inferSkeletonVariant(column.id);
                      return (
                        <TableCell
                          key={column.id}
                          className={meta?.cellClassName}
                        >
                          {meta?.skeleton ?? (
                            <DataTableCellSkeleton variant={variant} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={onRowClick ? "cursor-pointer" : undefined}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = columnMeta(cell.column);
                      return (
                        <TableCell
                          key={cell.id}
                          className={meta?.cellClassName}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 0 ? (
          <div className="flex flex-col gap-3 px-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                Rows per page
              </span>
              <Select
                value={String(table.state.pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      className="text-xs"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-1">
              <span className="me-2 text-xs whitespace-nowrap text-muted-foreground">
                Page {table.state.pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </SortContext.Provider>
  );
}
