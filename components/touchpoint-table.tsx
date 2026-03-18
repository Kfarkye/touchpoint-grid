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
import {
  AlarmClockOff,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { formatDisplay, hasPhone, toE164 } from "@/lib/phone";
import {
  logTouch,
  snoozeCandidate,
  unsnoozeCandidate,
  type TouchChannel,
  type TouchOutcome,
} from "@/lib/supabase";
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
  onRefresh?: () => Promise<void> | void;
}

const NOVA_BASE = "https://nova.ayahealthcare.com/#/recruiting/candidates";

function getNovaHref(novaId: string | null): string | null {
  if (!novaId) return null;
  return `${NOVA_BASE}/${novaId}/new-profile/about`;
}

const SORT_LABELS: Record<string, string> = {
  priority: "priority",
  score: "need score",
  name: "clinician",
  facility: "facility",
  days_to_end: "days left",
  weeks: "contract week",
  lifecycle: "next job",
  touch: "last touch",
  bucket: "stage",
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

const SNOOZE_PRESETS = [
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "2 Months", days: 60 },
] as const;

const SNOOZE_REASON_OPTIONS = [
  "Not traveling right now, check back later",
  "Waiting on candidate to confirm availability",
  "Set follow-up in Nova",
  "Extension pending, waiting on facility",
] as const;

const CUSTOM_REASON_VALUE = "__custom_reason__";

function isoDateFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

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
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-11 overflow-hidden rounded-full bg-surface-3">
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
        Ready for next assignment
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
  const novaHref = getNovaHref(row.nova_id);
  const phoneDisplay = hasPhone(row.phone)
    ? formatDisplay(row.phone)
    : "No phone";
  const emailValue = row.email?.trim() ?? "";
  const specialtyValue = row.specialty?.trim() || "—";
  const summaryLine = [specialtyValue, phoneDisplay, emailValue || "No email"].join(
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
  onRefresh,
}: {
  row: TouchpointRow;
  onRefresh?: () => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [channel, setChannel] = useState<TouchChannel>("phone");
  const [outcome, setOutcome] = useState<TouchOutcome>("connected");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(() => isoDateFromToday(7));
  const [reasonValue, setReasonValue] = useState<string>(SNOOZE_REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [savingLog, setSavingLog] = useState(false);
  const [savingSnooze, setSavingSnooze] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [snoozeError, setSnoozeError] = useState<string | null>(null);

  const phoneRaw = row.phone ?? "";
  const phoneAvailable = hasPhone(phoneRaw);
  const phoneE164 = phoneAvailable ? toE164(phoneRaw) : "";
  const snoozeDueLabel = formatDueDate(row.next_touch_due);
  const phoneTel = phoneRaw.replace(/\s+/g, "");

  const emailValue = row.email?.trim() ?? "";
  const emailAvailable = Boolean(emailValue);
  const novaHref = getNovaHref(row.nova_id);

  const actionClass =
    "inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-text-tertiary transition-colors hover:border-border hover:bg-surface-2 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30";

  const canLogChannel = (nextChannel: TouchChannel) =>
    nextChannel === "email" ? emailAvailable : phoneAvailable;

  const launchRingCentral = (mode: "call" | "sms") => {
    if (!phoneAvailable) return;

    const primaryUri = `rcmobile://${mode}?number=${phoneE164}`;
    const fallbackUri = mode === "call" ? `tel:${phoneTel}` : `sms:${phoneTel}`;
    let appOpened = false;

    const onBlur = () => {
      appOpened = true;
      cleanup();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        appOpened = true;
        cleanup();
      }
    };

    const cleanup = () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    window.location.href = primaryUri;

    window.setTimeout(() => {
      cleanup();
      if (!appOpened && document.visibilityState === "visible") {
        window.location.href = fallbackUri;
      }
    }, 1100);
  };

  const onCall = () => {
    setChannel("phone");
    launchRingCentral("call");
  };

  const onText = () => {
    setChannel("text");
    launchRingCentral("sms");
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
      await onRefresh?.();
    } catch (error: unknown) {
      setLogError(
        error instanceof Error ? error.message : "We couldn't save that touch. Try again."
      );
    } finally {
      setSavingLog(false);
    }
  };

  const onToggleSnooze = () => {
    setSnoozeError(null);
    setSnoozeOpen((current) => !current);
    setLogOpen(false);
    if (!row.is_snoozed) {
      setSelectedDate(isoDateFromToday(7));
      setReasonValue(SNOOZE_REASON_OPTIONS[0]);
      setCustomReason("");
    }
  };

  const submitSnooze = async () => {
    if (savingSnooze) return;

    const resolvedReason =
      reasonValue === CUSTOM_REASON_VALUE ? customReason.trim() : reasonValue.trim();
    if (!resolvedReason) {
      setSnoozeError("Add a reason before saving.");
      return;
    }

    setSavingSnooze(true);
    setSnoozeError(null);

    try {
      await snoozeCandidate({
        candidateId: row.candidate_id,
        dueDate: selectedDate,
        reason: resolvedReason,
      });
      setSnoozeOpen(false);
      await onRefresh?.();
    } catch (error: unknown) {
      setSnoozeError(
        error instanceof Error ? error.message : "We couldn't set that follow-up date."
      );
    } finally {
      setSavingSnooze(false);
    }
  };

  const submitUnsnooze = async () => {
    if (savingSnooze) return;

    setSavingSnooze(true);
    setSnoozeError(null);

    try {
      await unsnoozeCandidate(row.candidate_id);
      setSnoozeOpen(false);
      await onRefresh?.();
    } catch (error: unknown) {
      setSnoozeError(
        error instanceof Error ? error.message : "We couldn't clear that snooze."
      );
    } finally {
      setSavingSnooze(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onCall}
          disabled={!phoneAvailable}
          title="Call in RingCentral"
          className={actionClass}
        >
          <Phone className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onText}
          title="Text in RingCentral"
          className={`${actionClass} ${
            !phoneAvailable ? "pointer-events-none cursor-not-allowed opacity-30" : ""
          }`}
          disabled={!phoneAvailable}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          disabled={!emailAvailable}
          title={emailValue || "No email on file"}
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
          title="Copy number"
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
          onClick={onToggleSnooze}
          disabled={savingSnooze}
          title={row.is_snoozed ? "Unsnooze" : "Snooze"}
          className={actionClass}
        >
          {row.is_snoozed ? (
            <AlarmClockOff className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!canLogChannel(channel)) return;
            setLogError(null);
            setSnoozeOpen(false);
            setLogOpen((current) => !current);
          }}
          disabled={!canLogChannel(channel)}
          className="ml-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
          title={`Log ${CHANNEL_LABELS[channel]}`}
        >
          Log
        </button>
      </div>

      {logOpen && (
        <div className="w-[232px] rounded-md border border-border bg-surface-2 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-tertiary">
              Log Follow-Up
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
            <label className="block text-[10px] font-medium text-text-tertiary">
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

            <label className="block text-[10px] font-medium text-text-tertiary">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: Open to extension at current facility"
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

      {snoozeOpen && (
        <div className="w-[232px] rounded-md border border-border bg-surface-2 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-tertiary">
              {row.is_snoozed ? "Snoozed Follow-Up" : "Snooze Follow-Up"}
            </span>
            <button
              type="button"
              onClick={() => setSnoozeOpen(false)}
              className="text-[10px] text-text-tertiary hover:text-text-secondary"
            >
              Close
            </button>
          </div>

          {row.is_snoozed ? (
            <div className="space-y-2">
              <div className="rounded border border-border bg-surface-1 px-2 py-1.5">
                <p className="text-[10px] text-text-tertiary">
                  Due {snoozeDueLabel ?? "scheduled"}
                </p>
                <p
                  title={row.followup_reason ?? undefined}
                  className="truncate text-[11px] text-text-secondary"
                >
                  {row.followup_reason ?? "Follow-up scheduled"}
                </p>
              </div>

              {snoozeError && <p className="text-[10px] text-red-700">{snoozeError}</p>}

              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSnoozeOpen(false)}
                  className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary hover:border-border-hover hover:text-text-primary"
                >
                  Keep Snooze
                </button>
                <button
                  type="button"
                  onClick={submitUnsnooze}
                  disabled={savingSnooze}
                  className="rounded border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] text-accent hover:border-accent disabled:opacity-50"
                >
                  {savingSnooze ? "Updating..." : "Unsnooze"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1">
                {SNOOZE_PRESETS.map((preset) => {
                  const presetDate = isoDateFromToday(preset.days);
                  const selected = presetDate === selectedDate;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedDate(presetDate)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] ${
                        selected
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border text-text-secondary"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-text-tertiary">
                  Reason
                </label>
                <select
                  value={reasonValue}
                  onChange={(event) => setReasonValue(event.target.value)}
                  className="w-full rounded border border-border bg-surface-1 px-2 py-1 text-[11px] text-text-primary focus:border-accent/40 focus:outline-none"
                >
                  {SNOOZE_REASON_OPTIONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value={CUSTOM_REASON_VALUE}>Custom...</option>
                </select>

                {reasonValue === CUSTOM_REASON_VALUE && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(event) => setCustomReason(event.target.value)}
                    placeholder="Type custom follow-up reason"
                    className="w-full rounded border border-border bg-surface-1 px-2 py-1 text-[11px] text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none"
                    maxLength={220}
                  />
                )}

                {snoozeError && <p className="text-[10px] text-red-700">{snoozeError}</p>}

                <div className="mt-1.5 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSnoozeOpen(false)}
                    className="rounded border border-border px-2 py-1 text-[10px] text-text-secondary hover:border-border-hover hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitSnooze}
                    disabled={savingSnooze}
                    className="rounded border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] text-accent hover:border-accent disabled:opacity-50"
                  >
                    {savingSnooze ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function useColumns(
  onRefresh?: () => Promise<void> | void
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
        size: 92,
        sortingFn: "basic",
      },
      {
        id: "score",
        header: "Need Score",
        accessorKey: "priority_score",
        cell: ({ row }) => <ScoreBar score={row.original.priority_score} />,
        size: 98,
        sortingFn: "basic",
      },
      {
        id: "name",
        header: "Clinician",
        accessorKey: "candidate_name",
        cell: ({ row }) => <CandidateCell row={row.original} />,
        size: 232,
        sortingFn: "text",
      },
      {
        id: "facility",
        header: "Facility",
        accessorKey: "current_facility",
        cell: ({ row }) => (
          <div className="max-w-[180px]">
            <div className="truncate text-[13px] text-text-secondary">
              {row.original.current_facility ?? "—"}
            </div>
            {row.original.current_facility_state && (
              <div className="truncate text-[10px] text-text-tertiary">
                {row.original.current_facility_state}
              </div>
            )}
          </div>
        ),
        size: 180,
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
        size: 76,
        sortingFn: "basic",
      },
      {
        id: "weeks",
        header: "Week",
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
        size: 68,
      },
      {
        id: "lifecycle",
        header: "Next Job",
        accessorFn: (row) => (row.has_next_assignment ? 1 : 0),
        cell: ({ row }) => <LifecycleTag row={row.original} />,
        size: 126,
        sortingFn: "basic",
      },
      {
        id: "touch",
        header: "Last Touch",
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
        size: 86,
        sortingFn: "basic",
      },
      {
        id: "bucket",
        header: "Stage",
        accessorKey: "bucket",
        cell: ({ row }) => {
          const dueLabel = formatDueDate(row.original.next_touch_due);
          const stageLabel = BUCKET_LABELS[row.original.bucket as Bucket] ?? row.original.bucket;

          if (row.original.is_snoozed && dueLabel) {
            const reasonLabel = (row.original.followup_reason ?? "Follow-up scheduled").trim();
            return (
              <div className="max-w-[140px] leading-tight">
                <span
                  className="block truncate text-[10px] text-text-tertiary"
                >
                  Snoozed {"->"} {dueLabel}
                </span>
                <span title={reasonLabel} className="mt-0.5 block truncate text-[10px] text-text-tertiary/80">
                  {reasonLabel}
                </span>
              </div>
            );
          }

          return (
            <span title={row.original.suggested_action} className="text-[10px] text-text-tertiary">
              {stageLabel}
            </span>
          );
        },
        size: 148,
        sortingFn: "text",
      },
      {
        id: "actions",
        header: "Actions",
        accessorFn: (row) => row.phone,
        cell: ({ row }) => (
          <RowActions row={row.original} onRefresh={onRefresh} />
        ),
        size: 210,
        enableSorting: false,
      },
    ],
    [onRefresh]
  );
}

export function TouchpointTable({
  data,
  loading,
  sorting,
  onSortingChange,
  onVisibleRowsChange,
  onRefresh,
}: Props) {
  const columns = useColumns(onRefresh);

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
          Loading your follow-up list...
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto xl:overflow-x-visible">
        <table className="w-full min-w-[1148px] xl:min-w-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="sticky top-0 z-10 bg-surface-1/95 px-2 py-[6px] text-left backdrop-blur"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? `sort-header text-[10px] uppercase tracking-wide font-medium ${
                                  sorted ? "sort-header-active" : ""
                                }`
                              : "text-[10px] uppercase tracking-wide font-medium text-text-tertiary"
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
                className={`grid-row ${index % 2 ? "bg-surface-2/35" : ""}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-1 align-middle"
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
        <div className="flex items-center justify-between border-t border-border bg-surface-2/40 px-2.5 py-1.5">
          <span className="text-[10px] text-text-tertiary">
            {table.getRowModel().rows.length} clinicians in view
          </span>
          <span className="font-mono text-[10px] text-text-tertiary">
            {sorting[0]
              ? `${SORT_LABELS[sorting[0].id] ?? sorting[0].id} ${
                  sorting[0].desc ? "↓" : "↑"
                }`
              : "priority ↓"}
          </span>
        </div>
      )}
    </div>
  );
}
