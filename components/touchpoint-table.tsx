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
import { logTouch, type TouchChannel, type TouchOutcome } from "@/lib/supabase";
import {
  BUCKET_LABELS,
  PRIORITY_CONFIG,
  type Bucket,
  type PriorityLevel,
  type TouchpointRow,
} from "@/lib/types";

interface Props {
  data: TouchpointRow[];
  loading: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onVisibleRowsChange?: (rows: TouchpointRow[]) => void;
  onTouchLogged?: () => Promise<void> | void;
}

const NOVA_BASE = "https://nova.ayahealthcare.com/#/candidates";

const SORT_LABELS: Record<string, string> = {
  priority: "urgency",
  score: "priority score",
  name: "clinician",
  facility: "facility",
  days_to_end: "days left",
  weeks: "contract week",
  lifecycle: "next placement",
  touch: "last outreach",
  bucket: "workflow stage",
};

const CHANNEL_LABELS: Record<TouchChannel, string> = {
  phone: "Call",
  text: "Text",
  email: "Email",
};

const OUTCOME_OPTIONS: Array<{ value: TouchOutcome; label: string }> = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No Answer" },
];

function PriorityBadge({
  level,
  suggestedAction,
}: {
  level: PriorityLevel;
  suggestedAction: string;
}) {
  const cfg = PRIORITY_CONFIG[level];

  return (
    <span
      title={suggestedAction}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "critical"
            ? "bg-red-600 animate-pulse"
            : level === "high"
            ? "bg-amber-600"
            : level === "medium"
            ? "bg-yellow-600"
            : level === "low"
            ? "bg-emerald-600"
            : "bg-slate-500"
        }`}
      />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-red-500"
      : score >= 50
      ? "bg-amber-500"
      : score >= 25
      ? "bg-yellow-500"
      : score >= 15
      ? "bg-slate-400"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[11px] text-text-tertiary">
        {Math.round(score)}
      </span>
    </div>
  );
}

function DaysToEnd({
  days,
  hasNext,
}: {
  days: number | null;
  hasNext: boolean;
}) {
  if (days === null) return <span className="text-text-tertiary">—</span>;

  const color = hasNext
    ? "text-emerald-700"
    : days <= 0
    ? "text-red-700 font-semibold"
    : days <= 14
    ? "text-red-600"
    : days <= 30
    ? "text-amber-600"
    : days <= 45
    ? "text-yellow-700"
    : "text-text-secondary";

  return (
    <span className={`font-mono text-[11px] ${color}`}>
      {days <= 0 ? `${Math.abs(days)}d over` : `${days}d`}
    </span>
  );
}

function LifecycleTag({ row }: { row: TouchpointRow }) {
  if (row.has_next_assignment) {
    return (
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        <span className="max-w-[120px] truncate text-[10px] text-emerald-700">
          {row.next_facility ?? "Booked"}
        </span>
      </div>
    );
  }

  if (row.bucket === "between_assignments" || row.bucket === "prospect") {
    return (
      <span className="text-[10px] italic text-text-tertiary">
        Open to next assignment
      </span>
    );
  }

  return null;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) {
    return <span className="ml-0.5 text-[10px] text-text-tertiary/40">↕</span>;
  }

  return (
    <span className="ml-0.5 text-[10px] text-accent">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function CandidateCell({ row }: { row: TouchpointRow }) {
  const novaHref = row.nova_id ? `${NOVA_BASE}/${row.nova_id}` : null;
  const phoneDisplay = hasPhone(row.phone)
    ? formatDisplay(row.phone)
    : "Phone not listed";
  const emailValue = row.email?.trim() ?? "";
  const specialtyValue = row.specialty?.trim() || "No specialty";
  const summaryLine = [specialtyValue, phoneDisplay, emailValue || "Email not listed"].join(
    " | "
  );

  return (
    <div className="min-w-0">
      {novaHref ? (
        <a
          href={novaHref}
          target="_blank"
          rel="noreferrer noopener"
          className="block truncate text-[13px] font-semibold leading-tight text-text-primary hover:text-accent"
          title="Open in Nova"
        >
          {row.candidate_name}
        </a>
      ) : (
        <div className="truncate text-[13px] font-semibold leading-tight text-text-primary">
          {row.candidate_name}
        </div>
      )}
      <div
        className="truncate pt-0.5 text-[10px] text-text-tertiary"
        title={summaryLine}
      >
        {summaryLine}
      </div>
    </div>
  );
}

function RowActions({
  row,
  onTouchLogged,
}: {
  row: TouchpointRow;
  onTouchLogged?: () => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [channel, setChannel] = useState<TouchChannel>("phone");
  const [outcome, setOutcome] = useState<TouchOutcome>("connected");
  const [note, setNote] = useState("");
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const phoneRaw = row.phone ?? "";
  const phoneAvailable = hasPhone(phoneRaw);
  const phoneE164 = phoneAvailable ? toE164(phoneRaw) : "";
  const phoneTel = phoneRaw.replace(/\s+/g, "");

  const emailValue = row.email?.trim() ?? "";
  const emailAvailable = Boolean(emailValue);
  const novaHref = row.nova_id ? `${NOVA_BASE}/${row.nova_id}` : null;

  const actionClass =
    "inline-flex h-6 w-6 items-center justify-center rounded border border-border/70 text-slate-500 transition-colors hover:border-border-hover hover:text-accent disabled:cursor-not-allowed disabled:opacity-30";

  const canLogChannel = (nextChannel: TouchChannel) =>
    nextChannel === "email" ? emailAvailable : phoneAvailable;

  const onCall = () => {
    if (!phoneAvailable) return;

    setChannel("phone");
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

  const submitLog = async () => {
    if (savingLog) return;

    setSavingLog(true);
    setLogError(null);

    try {
      await logTouch({
        candidateId: row.candidate_id,
        channel,
        outcome,
        note,
        direction: "outbound",
      });

      setLogOpen(false);
      setNote("");
      await onTouchLogged?.();
    } catch (error: unknown) {
      setLogError(error instanceof Error ? error.message : "Unable to save touch log");
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onCall}
          disabled={!phoneAvailable}
          title="Call in RingCentral"
          className={actionClass}
        >
          <Phone className="h-3.5 w-3.5" />
        </button>

        <a
          href={phoneAvailable ? `rcmobile://sms?number=${phoneE164}` : undefined}
          title="Text in RingCentral"
          className={`${actionClass} ${
            !phoneAvailable ? "pointer-events-none cursor-not-allowed opacity-30" : ""
          }`}
          aria-disabled={!phoneAvailable}
          onClick={(event) => {
            if (!phoneAvailable) {
              event.preventDefault();
              return;
            }
            setChannel("text");
          }}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </a>

        <button
          type="button"
          disabled={!emailAvailable}
          title={emailValue || "No email"}
          className={actionClass}
          onClick={() => {
            if (emailAvailable) {
              setChannel("email");
              window.location.href = `mailto:${emailValue}`;
            }
          }}
        >
          <Mail className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onCopy}
          disabled={!phoneAvailable}
          title="Copy phone number"
          className={actionClass}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {novaHref && (
          <a
            href={novaHref}
            target="_blank"
            rel="noreferrer noopener"
            title="Open in Nova"
            className={actionClass}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <button
          type="button"
          onClick={() => {
            if (!canLogChannel(channel)) return;
            setLogError(null);
            setLogOpen((current) => !current);
          }}
          disabled={!canLogChannel(channel)}
          className="ml-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
          title={`Log ${CHANNEL_LABELS[channel]}`}
        >
          Log {CHANNEL_LABELS[channel]}
        </button>
      </div>

      {logOpen && (
        <div className="w-[240px] rounded-md border border-border bg-surface-2 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-text-tertiary">
              Log Touch
            </span>
            <button
              type="button"
              onClick={() => setLogOpen(false)}
              className="text-[10px] text-text-tertiary hover:text-text-secondary"
            >
              Close
            </button>
          </div>

          <div className="mb-1.5 flex items-center gap-1">
            {(Object.keys(CHANNEL_LABELS) as TouchChannel[]).map((itemChannel) => (
              <button
                key={itemChannel}
                type="button"
                disabled={!canLogChannel(itemChannel)}
                onClick={() => setChannel(itemChannel)}
                className={`rounded border px-1.5 py-0.5 text-[10px] ${
                  channel === itemChannel
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-text-secondary"
                } disabled:cursor-not-allowed disabled:opacity-30`}
              >
                {CHANNEL_LABELS[itemChannel]}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-text-tertiary">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value as TouchOutcome)}
              className="w-full rounded border border-border bg-surface-1 px-2 py-1 text-[11px] text-text-primary focus:border-accent/40 focus:outline-none"
            >
              {OUTCOME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="block text-[10px] uppercase tracking-wider text-text-tertiary">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: Discussed extension; interested"
              className="w-full rounded border border-border bg-surface-1 px-2 py-1 text-[11px] text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none"
              maxLength={220}
            />

            {logError && <p className="text-[10px] text-red-700">{logError}</p>}

            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary hover:border-border-hover hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitLog}
                disabled={savingLog}
                className="rounded border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] text-accent hover:border-accent disabled:opacity-50"
              >
                {savingLog ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useColumns(
  onTouchLogged?: () => Promise<void> | void
): ColumnDef<TouchpointRow>[] {
  return useMemo(
    () => [
      {
        id: "priority",
        header: "Urgency",
        accessorKey: "priority_score",
        cell: ({ row }) => (
          <PriorityBadge
            level={row.original.priority_level}
            suggestedAction={row.original.suggested_action}
          />
        ),
        size: 95,
        sortingFn: "basic",
      },
      {
        id: "score",
        header: "Priority Score",
        accessorKey: "priority_score",
        cell: ({ row }) => <ScoreBar score={row.original.priority_score} />,
        size: 105,
        sortingFn: "basic",
      },
      {
        id: "name",
        header: "Clinician",
        accessorKey: "candidate_name",
        cell: ({ row }) => <CandidateCell row={row.original} />,
        size: 240,
        sortingFn: "text",
      },
      {
        id: "facility",
        header: "Facility",
        accessorKey: "current_facility",
        cell: ({ row }) => (
          <div className="max-w-[190px]">
            <div className="truncate text-[13px] text-text-secondary">
              {row.original.current_facility ?? "—"}
            </div>
            <div className="truncate text-[10px] text-text-tertiary">
              {row.original.current_facility_state ?? "No state"}
            </div>
          </div>
        ),
        size: 190,
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
        size: 78,
        sortingFn: "basic",
      },
      {
        id: "weeks",
        header: "Contract Week",
        accessorKey: "week_of_contract",
        cell: ({ row }) =>
          row.original.week_of_contract !== null ? (
            <span className="font-mono text-[11px] text-text-secondary">
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
            <span className="text-text-tertiary">—</span>
          ),
        size: 72,
      },
      {
        id: "lifecycle",
        header: "Next Placement",
        accessorFn: (row) => (row.has_next_assignment ? 1 : 0),
        cell: ({ row }) => <LifecycleTag row={row.original} />,
        size: 132,
        sortingFn: "basic",
      },
      {
        id: "touch",
        header: "Last Outreach",
        accessorKey: "days_since_touch",
        cell: ({ row }) => {
          const days = row.original.days_since_touch;
          const overdue = days > 14;

          return (
            <div className="flex items-center gap-1.5">
              {overdue && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              <span
                className={`font-mono text-[11px] ${
                  overdue ? "text-amber-700" : "text-text-tertiary"
                }`}
              >
                {days}d ago
              </span>
            </div>
          );
        },
        size: 92,
        sortingFn: "basic",
      },
      {
        id: "bucket",
        header: "Workflow Stage",
        accessorKey: "bucket",
        cell: ({ row }) => (
          <span
            title={row.original.suggested_action}
            className="text-[10px] text-text-tertiary"
          >
            {BUCKET_LABELS[row.original.bucket as Bucket] ?? row.original.bucket}
          </span>
        ),
        size: 118,
        sortingFn: "text",
      },
      {
        id: "actions",
        header: "Outreach",
        accessorFn: (row) => row.phone,
        cell: ({ row }) => (
          <RowActions row={row.original} onTouchLogged={onTouchLogged} />
        ),
        size: 210,
        enableSorting: false,
      },
    ],
    [onTouchLogged]
  );
}

export function TouchpointTable({
  data,
  loading,
  sorting,
  onSortingChange,
  onVisibleRowsChange,
  onTouchLogged,
}: Props) {
  const columns = useColumns(onTouchLogged);

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
        <p className="mt-3 text-sm text-text-tertiary">
          Pulling current candidate priorities...
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <div className="overflow-x-auto xl:overflow-x-visible">
        <table className="w-full min-w-[1232px] xl:min-w-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="sticky top-0 z-10 bg-surface-1 px-2.5 py-2 text-left"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? `sort-header text-[10px] uppercase tracking-wider font-medium ${
                                  sorted ? "sort-header-active" : ""
                                }`
                              : "text-[10px] uppercase tracking-wider text-text-tertiary font-medium"
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
                    className="px-2.5 py-1.5 align-middle"
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
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-[10px] text-text-tertiary">
            {table.getRowModel().rows.length} clinicians in view
          </span>
          <span className="font-mono text-[10px] text-text-tertiary">
            ordered by{" "}
            {sorting[0]
              ? `${SORT_LABELS[sorting[0].id] ?? sorting[0].id} ${
                  sorting[0].desc ? "(high to low)" : "(low to high)"
                }`
              : "default urgency"}
          </span>
        </div>
      )}
    </div>
  );
}
