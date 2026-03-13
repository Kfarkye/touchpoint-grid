"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { TouchpointRow, PRIORITY_CONFIG, BUCKET_LABELS, PriorityLevel, Bucket } from "@/lib/types";

interface Props {
  data: TouchpointRow[];
  loading: boolean;
}

/* ------------------------------------------------------------------ */
/*  Priority badge                                                     */
/* ------------------------------------------------------------------ */
function PriorityBadge({ level }: { level: PriorityLevel }) {
  const cfg = PRIORITY_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px]
                  font-medium ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          level === "critical"
            ? "bg-red-400 animate-pulse"
            : level === "high"
            ? "bg-orange-400"
            : level === "medium"
            ? "bg-yellow-400"
            : level === "low"
            ? "bg-emerald-400"
            : "bg-zinc-400"
        }`}
      />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Score bar — horizontal micro-visualization                         */
/* ------------------------------------------------------------------ */
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-red-400"
      : score >= 50
      ? "bg-orange-400"
      : score >= 25
      ? "bg-yellow-400"
      : score >= 15
      ? "bg-zinc-500"
      : "bg-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-tertiary w-7 text-right">
        {Math.round(score)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Days indicator — color-coded urgency                               */
/* ------------------------------------------------------------------ */
function DaysToEnd({
  days,
  hasNext,
}: {
  days: number | null;
  hasNext: boolean;
}) {
  if (days === null) return <span className="text-text-tertiary">—</span>;

  const color = hasNext
    ? "text-emerald-400"
    : days <= 0
    ? "text-red-400 font-semibold"
    : days <= 14
    ? "text-red-400"
    : days <= 30
    ? "text-orange-400"
    : days <= 45
    ? "text-yellow-400"
    : "text-text-secondary";

  return (
    <span className={`font-mono text-xs ${color}`}>
      {days <= 0 ? `${Math.abs(days)}d over` : `${days}d`}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Lifecycle indicator — shows signed next inline                     */
/* ------------------------------------------------------------------ */
function LifecycleTag({ row }: { row: TouchpointRow }) {
  if (row.has_next_assignment) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] text-emerald-400 truncate max-w-[140px]">
          {row.next_facility ?? "Signed"}
        </span>
      </div>
    );
  }
  if (row.bucket === "between_assignments" || row.bucket === "prospect") {
    return (
      <span className="text-[11px] text-text-tertiary italic">
        No assignment
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Sort icon                                                          */
/* ------------------------------------------------------------------ */
function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction)
    return (
      <span className="text-text-tertiary/40 text-[10px] ml-0.5">↕</span>
    );
  return (
    <span className="text-accent text-[10px] ml-0.5">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Column definitions                                                 */
/* ------------------------------------------------------------------ */
function useColumns(): ColumnDef<TouchpointRow>[] {
  return useMemo(
    () => [
      {
        id: "priority",
        header: "Priority",
        accessorKey: "priority_score",
        cell: ({ row }) => <PriorityBadge level={row.original.priority_level} />,
        size: 100,
        sortingFn: "basic",
      },
      {
        id: "score",
        header: "Score",
        accessorKey: "priority_score",
        cell: ({ row }) => <ScoreBar score={row.original.priority_score} />,
        size: 110,
        sortingFn: "basic",
      },
      {
        id: "name",
        header: "Candidate",
        accessorKey: "candidate_name",
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-text-primary font-medium">
              {row.original.candidate_name}
            </div>
            <div className="text-[11px] text-text-tertiary">
              {row.original.specialty}
            </div>
          </div>
        ),
        size: 180,
        sortingFn: "text",
      },
      {
        id: "facility",
        header: "Facility",
        accessorKey: "current_facility",
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <div className="text-sm text-text-secondary truncate">
              {row.original.current_facility ?? "—"}
            </div>
            {row.original.current_facility_state && (
              <div className="text-[11px] text-text-tertiary">
                {row.original.current_facility_state}
              </div>
            )}
          </div>
        ),
        size: 200,
        sortingFn: "text",
      },
      {
        id: "days_to_end",
        header: "Days Left",
        accessorKey: "days_to_end",
        cell: ({ row }) => (
          <DaysToEnd
            days={row.original.days_to_end}
            hasNext={row.original.has_next_assignment}
          />
        ),
        size: 80,
        sortingFn: "basic",
      },
      {
        id: "weeks",
        header: "Week",
        accessorKey: "week_of_contract",
        cell: ({ row }) =>
          row.original.week_of_contract !== null ? (
            <span className="font-mono text-xs text-text-secondary">
              W{row.original.week_of_contract}
              <span className="text-text-tertiary">
                /{Math.round((row.original.weeks_remaining ?? 0) + (row.original.week_of_contract ?? 0))}
              </span>
            </span>
          ) : (
            <span className="text-text-tertiary">—</span>
          ),
        size: 70,
      },
      {
        id: "lifecycle",
        header: "Next",
        accessorFn: (row) => (row.has_next_assignment ? 1 : 0),
        cell: ({ row }) => <LifecycleTag row={row.original} />,
        size: 160,
        sortingFn: "basic",
      },
      {
        id: "touch",
        header: "Last Touch",
        accessorKey: "days_since_touch",
        cell: ({ row }) => {
          const d = row.original.days_since_touch;
          const overdue = d > 14;
          return (
            <div className="flex items-center gap-1.5">
              {overdue && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              )}
              <span
                className={`font-mono text-xs ${
                  overdue ? "text-yellow-400" : "text-text-tertiary"
                }`}
              >
                {d}d ago
              </span>
            </div>
          );
        },
        size: 90,
        sortingFn: "basic",
      },
      {
        id: "bucket",
        header: "Bucket",
        accessorKey: "bucket",
        cell: ({ row }) => (
          <span className="text-[11px] text-text-tertiary">
            {BUCKET_LABELS[row.original.bucket as Bucket] ?? row.original.bucket}
          </span>
        ),
        size: 130,
        sortingFn: "text",
      },
      {
        id: "action",
        header: "Action",
        accessorKey: "suggested_action",
        cell: ({ row }) => (
          <span className="text-[11px] text-text-secondary leading-tight line-clamp-2">
            {row.original.suggested_action}
          </span>
        ),
        size: 220,
        enableSorting: false,
      },
    ],
    []
  );
}

/* ------------------------------------------------------------------ */
/*  Table component                                                    */
/* ------------------------------------------------------------------ */
export function TouchpointTable({ data, loading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "priority", desc: true },
  ]);

  const columns = useColumns();

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading && data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-1 p-12 text-center">
        <div className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-text-tertiary mt-3">Loading grid data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`sort-header text-[11px] uppercase tracking-wider font-medium ${
                          header.column.getIsSorted()
                            ? "sort-header-active"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <SortIcon
                            direction={header.column.getIsSorted()}
                          />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className="grid-row"
                style={{
                  animationDelay: `${Math.min(i * 15, 300)}ms`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2.5 align-middle"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">
            {table.getRowModel().rows.length} rows
          </span>
          <span className="text-[11px] text-text-tertiary font-mono">
            sorted by{" "}
            {sorting[0]
              ? `${sorting[0].id} ${sorting[0].desc ? "desc" : "asc"}`
              : "default"}
          </span>
        </div>
      )}
    </div>
  );
}
