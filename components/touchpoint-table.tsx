"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Check, Copy, ExternalLink, Mail, MessageSquare, Phone } from "lucide-react";
import { formatDisplay, hasPhone, toE164 } from "@/lib/phone";
import type { TableColumnId, TouchpointBoardPayload } from "@/lib/payload-contract";
import type { KnownPriorityLevel, TouchpointRow } from "@/lib/types";

interface Props {
  data: TouchpointRow[];
  loading: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onVisibleRowsChange?: (rows: TouchpointRow[]) => void;
  tableContract: TouchpointBoardPayload["sections"]["table"];
  semantics: TouchpointBoardPayload["semantics"];
  nullPolicy: TouchpointBoardPayload["null_policy"];
}

const REQUIRED_COLUMN_IDS: TableColumnId[] = [
  "priority",
  "score",
  "name",
  "facility",
  "days_to_end",
  "weeks",
  "lifecycle",
  "touch",
  "bucket",
  "actions",
];

const PRIORITY_STYLE: Record<
  KnownPriorityLevel,
  { color: string; bg: string }
> = {
  critical: {
    color: "text-priority-critical",
    bg: "bg-[#cc4f3f14]",
  },
  high: {
    color: "text-priority-high",
    bg: "bg-[#cc7f3f14]",
  },
  medium: {
    color: "text-priority-medium",
    bg: "bg-[#9f8a4d14]",
  },
  standard: {
    color: "text-text-secondary",
    bg: "bg-[#8a8f9812]",
  },
  low: {
    color: "text-priority-low",
    bg: "bg-[#3e9a6814]",
  },
};

function PriorityBadge({
  level,
  suggestedAction,
  semantics,
}: {
  level: string;
  suggestedAction: string;
  semantics: TouchpointBoardPayload["semantics"];
}) {
  const knownLevel = level in PRIORITY_STYLE ? (level as KnownPriorityLevel) : null;
  const cfg = knownLevel
    ? PRIORITY_STYLE[knownLevel]
    : { color: "text-text-secondary", bg: "bg-[#8a8f9812]" };
  const semanticEntry = semantics.priority[level] ?? semantics.priority_fallback;
  const label = semanticEntry.label;

  return (
    <span
      title={suggestedAction}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}
    >
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const fillClass =
    score >= 60
      ? "bg-tone-green"
      : score <= 40
      ? "bg-border"
      : "bg-text-tertiary";

  return (
    <div className="flex items-center gap-2">
      <div className="h-[3px] w-16 overflow-hidden rounded-full bg-[#E8E7E3]">
        <div
          className={`h-full rounded-full ${fillClass} transition-all duration-500`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs text-text-tertiary">
        {Math.round(score)}
      </span>
    </div>
  );
}

function DaysToEnd({
  days,
  hasNext,
  nullPolicy,
  tableContract,
}: {
  days: number | null;
  hasNext: boolean;
  nullPolicy: TouchpointBoardPayload["null_policy"];
  tableContract: TouchpointBoardPayload["sections"]["table"];
}) {
  if (days === null) {
    return <span className="text-text-tertiary">{nullPolicy.value_placeholder}</span>;
  }

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
      {days <= 0 ? `${Math.abs(days)}${tableContract.days_over_suffix}` : `${days}d`}
    </span>
  );
}

function LifecycleTag({
  row,
  nullPolicy,
}: {
  row: TouchpointRow;
  nullPolicy: TouchpointBoardPayload["null_policy"];
}) {
  if (row.has_next_assignment) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex max-w-[180px] truncate rounded-full bg-tone-green-muted px-2 py-0.5 text-[11px] text-tone-green">
          {row.next_facility ?? nullPolicy.booked_next_assignment}
        </span>
      </div>
    );
  }
  if (row.bucket === "between_assignments" || row.bucket === "prospect") {
    return (
      <span className="inline-flex rounded-full bg-accent-muted px-2 py-0.5 text-[11px] text-accent">
        {nullPolicy.missing_next_assignment}
      </span>
    );
  }
  return null;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) return null;
  return <span className="ml-0.5 text-[10px] text-text-primary">▼</span>;
}

function CandidateCell({
  row,
  tableContract,
  nullPolicy,
}: {
  row: TouchpointRow;
  tableContract: TouchpointBoardPayload["sections"]["table"];
  nullPolicy: TouchpointBoardPayload["null_policy"];
}) {
  const novaHref = row.nova_id
    ? `${tableContract.nova_candidate_url_base}/${row.nova_id}/new-profile/about`
    : null;
  const phoneDisplay = hasPhone(row.phone) ? formatDisplay(row.phone) : nullPolicy.missing_phone;
  const emailValue = row.email?.trim() ?? "";

  return (
    <div className="min-w-0">
      {novaHref ? (
        <a
          href={novaHref}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm font-semibold text-text-primary hover:text-accent"
          title={tableContract.row_actions.nova_title}
        >
          {row.candidate_name}
        </a>
      ) : (
        <div className="text-sm font-semibold text-text-primary">{row.candidate_name}</div>
      )}
      <div className="text-[11px] font-normal text-text-secondary">
        {row.specialty || nullPolicy.missing_specialty}
      </div>
      <div className="font-mono text-[11px] text-text-secondary">{phoneDisplay}</div>
      {emailValue ? (
        <div
          className="max-w-[240px] truncate text-[11px] text-text-tertiary"
          title={emailValue}
        >
          {emailValue}
        </div>
      ) : (
        <div className="text-[11px] text-text-tertiary/60">{nullPolicy.missing_email}</div>
      )}
    </div>
  );
}

function RowActions({
  row,
  tableContract,
}: {
  row: TouchpointRow;
  tableContract: TouchpointBoardPayload["sections"]["table"];
}) {
  const [copied, setCopied] = useState(false);

  const phoneRaw = row.phone ?? "";
  const phoneAvailable = hasPhone(phoneRaw);
  const phoneE164 = phoneAvailable ? toE164(phoneRaw) : "";
  const phoneTel = phoneRaw.replace(/\s+/g, "");

  const emailValue = row.email?.trim() ?? "";
  const novaHref = row.nova_id
    ? `${tableContract.nova_candidate_url_base}/${row.nova_id}/new-profile/about`
    : null;

  const actionClass =
    "inline-flex items-center justify-center text-text-tertiary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-30";

  const onCall = () => {
    if (!phoneAvailable) return;

    window.location.href = `rcmobile://call?number=${phoneE164}`;
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.href = `tel:${phoneTel}`;
      }
    }, 700);
  };

  const onCopy = async () => {
    if (!phoneAvailable) return;
    try {
      await navigator.clipboard.writeText(phoneRaw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions vary by browser context; no-op on failure.
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onCall}
        disabled={!phoneAvailable}
        title={tableContract.row_actions.call_title}
        className={actionClass}
      >
        <Phone className="h-5 w-5" />
      </button>

      <a
        href={phoneAvailable ? `rcmobile://sms?number=${phoneE164}` : undefined}
        title={tableContract.row_actions.text_title}
        className={`${actionClass} ${
          !phoneAvailable ? "pointer-events-none cursor-not-allowed opacity-30" : ""
        }`}
        aria-disabled={!phoneAvailable}
        onClick={(event) => {
          if (!phoneAvailable) event.preventDefault();
        }}
      >
        <MessageSquare className="h-5 w-5" />
      </a>

      <button
        type="button"
        disabled={!emailValue}
        title={emailValue || tableContract.row_actions.email_fallback_title}
        className={actionClass}
        onClick={() => {
          if (emailValue) {
            window.location.href = `mailto:${emailValue}`;
          }
        }}
      >
        <Mail className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onCopy}
        disabled={!phoneAvailable}
        title={copied ? tableContract.row_actions.copied_title : tableContract.row_actions.copy_title}
        className={actionClass}
      >
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
      </button>

      {novaHref && (
        <a
          href={novaHref}
          target="_blank"
          rel="noreferrer noopener"
          title={tableContract.row_actions.nova_title}
          className={actionClass}
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}

function useColumns(
  tableContract: TouchpointBoardPayload["sections"]["table"],
  semantics: TouchpointBoardPayload["semantics"],
  nullPolicy: TouchpointBoardPayload["null_policy"]
): ColumnDef<TouchpointRow>[] {
  const columnMetaById = useMemo(
    () => {
      const indexed = {} as Partial<Record<TableColumnId, { label: string; sortable: boolean }>>;
      for (const column of tableContract.columns) {
        indexed[column.id] = {
          label: column.label,
          sortable: column.sortable,
        };
      }

      for (const id of REQUIRED_COLUMN_IDS) {
        if (!indexed[id]) {
          throw new Error(`Missing table column contract: ${id}`);
        }
      }

      return indexed as Record<TableColumnId, { label: string; sortable: boolean }>;
    },
    [tableContract.columns]
  );

  return useMemo(
    () => [
      {
        id: "priority",
        header: columnMetaById.priority.label,
        accessorKey: "priority_score",
        cell: ({ row }) => (
      <PriorityBadge
            level={row.original.priority_level}
            suggestedAction={row.original.suggested_action}
            semantics={semantics}
          />
        ),
        size: 110,
        sortingFn: "basic",
        enableSorting: columnMetaById.priority.sortable,
      },
      {
        id: "score",
        header: columnMetaById.score.label,
        accessorKey: "priority_score",
        cell: ({ row }) => <ScoreBar score={row.original.priority_score} />,
        size: 110,
        sortingFn: "basic",
        enableSorting: columnMetaById.score.sortable,
      },
      {
        id: "name",
        header: columnMetaById.name.label,
        accessorKey: "candidate_name",
        cell: ({ row }) => (
          <CandidateCell
            row={row.original}
            tableContract={tableContract}
            nullPolicy={nullPolicy}
          />
        ),
        size: 260,
        sortingFn: "text",
        enableSorting: columnMetaById.name.sortable,
      },
      {
        id: "facility",
        header: columnMetaById.facility.label,
        accessorKey: "current_facility",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <div className="truncate text-sm text-text-secondary">
              {row.original.current_facility ?? nullPolicy.value_placeholder}
            </div>
            {row.original.current_facility_state && (
              <div className="text-[11px] text-text-tertiary">
                {row.original.current_facility_state}
              </div>
            )}
          </div>
        ),
        size: 220,
        sortingFn: "text",
        enableSorting: columnMetaById.facility.sortable,
      },
      {
        id: "days_to_end",
        header: columnMetaById.days_to_end.label,
        accessorKey: "days_to_end",
        cell: ({ row }) => (
          <DaysToEnd
            days={row.original.days_to_end}
            hasNext={row.original.has_next_assignment}
            nullPolicy={nullPolicy}
            tableContract={tableContract}
          />
        ),
        size: 90,
        sortingFn: "basic",
        enableSorting: columnMetaById.days_to_end.sortable,
      },
      {
        id: "weeks",
        header: columnMetaById.weeks.label,
        accessorKey: "week_of_contract",
        cell: ({ row }) =>
          row.original.week_of_contract !== null ? (
            <span className="font-mono text-xs text-text-secondary">
              W{row.original.week_of_contract}
              <span className="text-text-tertiary">
                /
                {Math.round(
                  (row.original.weeks_remaining ?? 0) +
                    (row.original.week_of_contract ?? 0)
                )}
              </span>
            </span>
          ) : (
            <span className="text-text-tertiary">{nullPolicy.value_placeholder}</span>
          ),
        size: 75,
        enableSorting: columnMetaById.weeks.sortable,
      },
      {
        id: "lifecycle",
        header: columnMetaById.lifecycle.label,
        accessorFn: (row) => (row.has_next_assignment ? 1 : 0),
        cell: ({ row }) => (
          <LifecycleTag row={row.original} nullPolicy={nullPolicy} />
        ),
        size: 160,
        sortingFn: "basic",
        enableSorting: columnMetaById.lifecycle.sortable,
      },
      {
        id: "touch",
        header: columnMetaById.touch.label,
        accessorKey: "days_since_touch",
        cell: ({ row }) => {
          const days = row.original.days_since_touch;
          const overdue = days > 14;

          return (
            <div className="flex items-center gap-1.5">
              {overdue && <span className="h-1.5 w-1.5 rounded-full bg-priority-high" />}
              <span
                className={`font-mono text-xs ${
                  overdue ? "text-priority-high" : "text-text-tertiary"
                }`}
              >
                {days}
                {tableContract.days_ago_suffix}
              </span>
            </div>
          );
        },
        size: 100,
        sortingFn: "basic",
        enableSorting: columnMetaById.touch.sortable,
      },
      {
        id: "bucket",
        header: columnMetaById.bucket.label,
        accessorKey: "bucket",
        cell: ({ row }) => {
          const stageLabel =
            (semantics.bucket[row.original.bucket] ?? semantics.bucket_fallback).label;
          const tagTone =
            row.original.bucket === "signed_next"
              ? "bg-tone-green-muted text-tone-green"
              : row.original.bucket === "critical_redeploy" ||
                row.original.bucket === "redeploy_window" ||
                row.original.bucket === "approaching_end"
              ? "bg-accent-muted text-accent"
              : "bg-tone-blue-muted text-tone-blue";

          return (
            <span
              title={row.original.suggested_action}
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${tagTone}`}
            >
              {stageLabel}
            </span>
          );
        },
        size: 140,
        sortingFn: "text",
        enableSorting: columnMetaById.bucket.sortable,
      },
      {
        id: "actions",
        header: columnMetaById.actions.label,
        accessorFn: (row) => row.phone,
        cell: ({ row }) => <RowActions row={row.original} tableContract={tableContract} />,
        size: 145,
        enableSorting: columnMetaById.actions.sortable,
      },
    ],
    [columnMetaById, nullPolicy, semantics, tableContract]
  );
}

function formatLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-z_]+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function TouchpointTable({
  data,
  loading,
  sorting,
  onSortingChange,
  onVisibleRowsChange,
  tableContract,
  semantics,
  nullPolicy,
}: Props) {
  const columns = useColumns(tableContract, semantics, nullPolicy);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (!onVisibleRowsChange) return;
    onVisibleRowsChange(table.getRowModel().rows.map((row) => row.original));
  }, [data, onVisibleRowsChange, sorting, table]);

  if (loading && data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-1 p-12 text-center">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        <p className="mt-3 text-sm text-text-tertiary">{tableContract.loading_label}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <div className="overflow-x-auto xl:overflow-x-visible">
        <table className="w-full min-w-[1240px] xl:min-w-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? `sort-header text-[11px] uppercase tracking-wider font-medium ${
                                  sorted ? "sort-header-active" : ""
                                }`
                              : "text-[11px] uppercase tracking-wider text-text-tertiary font-medium"
                          }
                          onClick={
                            canSort ? header.column.getToggleSortingHandler() : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && <SortIcon direction={sorted} />}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className="grid-row"
                style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
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

      {data.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <span className="text-[11px] text-text-tertiary">
            {formatLabel(tableContract.footer_count_label, {
              count: table.getRowModel().rows.length,
            })}
          </span>
          <span className="font-mono text-[11px] text-text-tertiary">
            {tableContract.footer_order_label}{" "}
            {sorting[0]
              ? `${tableContract.sort_labels[
                  sorting[0].id as keyof typeof tableContract.sort_labels
                ] ?? sorting[0].id} ${
                  sorting[0].desc
                    ? tableContract.sort_direction_desc_label
                    : tableContract.sort_direction_asc_label
                }`
              : tableContract.default_sort_label}
          </span>
        </div>
      )}
    </div>
  );
}
