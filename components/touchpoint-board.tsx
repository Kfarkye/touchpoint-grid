"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { QuickLinks } from "@/components/quick-links";
import { StatsBar } from "@/components/stats-bar";
import { TouchpointTable } from "@/components/touchpoint-table";
import type { TouchpointBoardPayload } from "@/lib/payload-contract";
import type { TouchpointRow } from "@/lib/types";

interface Props {
  initialPayload: TouchpointBoardPayload;
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function formatLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-z_]+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function TouchpointBoard({ initialPayload }: Props) {
  const [payload, setPayload] = useState<TouchpointBoardPayload>(initialPayload);
  const [visibleRows, setVisibleRows] = useState<TouchpointRow[]>(initialPayload.rows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(
    new Date(initialPayload.generated_at)
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "priority", desc: true },
  ]);

  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(payload.resource.json_url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Payload fetch failed (${response.status})`);
      }

      const nextPayload = (await response.json()) as TouchpointBoardPayload;
      setPayload(nextPayload);
      setVisibleRows(nextPayload.rows);
      setLastRefresh(new Date(nextPayload.generated_at));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load the touchpoint board right now");
    } finally {
      setLoading(false);
    }
  }, [payload.resource.json_url]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (event.key === "Escape") {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(
    () =>
      payload.rows.filter((row) => {
        if (priorityFilter !== "all" && row.priority_level !== priorityFilter) {
          return false;
        }

        if (bucketFilter !== "all" && row.bucket !== bucketFilter) {
          return false;
        }

        if (!searchQuery) {
          return true;
        }

        const query = searchQuery.toLowerCase();
        return (
          row.candidate_name.toLowerCase().includes(query) ||
          (row.current_facility ?? "").toLowerCase().includes(query) ||
          (row.specialty ?? "").toLowerCase().includes(query)
        );
      }),
    [bucketFilter, payload.rows, priorityFilter, searchQuery]
  );

  const filteredStats = useMemo(
    () => ({
      total: filtered.length,
      critical: filtered.filter((row) => row.priority_level === "critical").length,
      high: filtered.filter((row) => row.priority_level === "high").length,
      signed_next: filtered.filter((row) => row.has_next_assignment).length,
      needs_touch: filtered.filter((row) => row.days_since_touch > 14).length,
    }),
    [filtered]
  );

  const clearFilters = useCallback(() => {
    setPriorityFilter("all");
    setBucketFilter("all");
    setSearchQuery("");
    searchInputRef.current?.blur();
  }, []);

  const onVisibleRowsChange = useCallback((rows: TouchpointRow[]) => {
    setVisibleRows((prev) => {
      if (
        prev.length === rows.length &&
        prev.every((prevRow, index) => prevRow.candidate_id === rows[index]?.candidate_id)
      ) {
        return prev;
      }
      return rows;
    });
  }, []);

  const exportRows = filtered.length === 0 ? [] : visibleRows.length > 0 ? visibleRows : filtered;

  const exportCsv = useCallback(() => {
    const rows = exportRows;
    if (!rows.length) return;

    const bucketMap = payload.semantics.bucket;
    const priorityMap = payload.semantics.priority;
    const header = payload.sections.table.export_columns;

    const records = rows.map((row) => [
      row.candidate_name,
      row.phone,
      row.email,
      row.current_facility ?? "",
      row.current_facility_state ?? "",
      row.assignment_end ?? "",
      row.days_to_end ?? "",
      (priorityMap[row.priority_level] ?? payload.semantics.priority_fallback).label,
      (bucketMap[row.bucket] ?? payload.semantics.bucket_fallback).label,
      row.suggested_action,
    ]);

    const csv = [header, ...records]
      .map((line) => line.map((value) => csvEscape(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `${payload.sections.hero.actions.export_filename_prefix}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportRows, payload.sections.hero.actions.export_filename_prefix, payload.semantics]);

  const filterCountLabel =
    filtered.length === payload.rows.length
      ? formatLabel(payload.sections.filters.count_labels.all, {
          total: payload.rows.length,
        })
      : formatLabel(payload.sections.filters.count_labels.filtered, {
          filtered: filtered.length,
          total: payload.rows.length,
        });

  const sectionContent: Record<
    TouchpointBoardPayload["section_order"][number],
    ReactNode
  > = {
    hero: (
      <section className="rounded-xl border border-border bg-surface-1 px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              {payload.sections.hero.page_title}
            </h1>
            <p className="mt-1 text-sm text-text-tertiary">
              {payload.sections.hero.page_subtitle}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-text-secondary">
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1">
              {filteredStats.total}{" "}
              {payload.sections.hero.chips.find((chip) => chip.id === "in_view")?.label}
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1">
              {filteredStats.critical}{" "}
              {
                payload.sections.hero.chips.find((chip) => chip.id === "critical_follow_up")
                  ?.label
              }
            </span>
          </div>
        </div>
      </section>
    ),
    stats: (
      <StatsBar
        cards={payload.sections.stats.cards}
        values={filteredStats}
        loading={loading}
        loadingValueLabel={payload.sections.stats.loading_value_label}
      />
    ),
    quick_links: (
      <QuickLinks
        title={payload.sections.quick_links.title}
        links={payload.sections.quick_links.links}
      />
    ),
    filters: (
      <FilterBar
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        bucketFilter={bucketFilter}
        setBucketFilter={setBucketFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        priorityLabel={payload.sections.filters.priority_label}
        stageLabel={payload.sections.filters.stage_label}
        searchPlaceholder={payload.sections.filters.search_placeholder}
        clearSearchLabel={payload.sections.filters.clear_search_label}
        priorityOptions={payload.sections.filters.priority_options}
        bucketOptions={payload.sections.filters.bucket_options}
        countLabel={filterCountLabel}
      />
    ),
    table: (
      <>
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-1 px-6 py-14 text-center">
            <p className="text-sm text-text-secondary">
              {payload.sections.filters.empty_state_message}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              {payload.sections.filters.clear_filters_label}
            </button>
          </div>
        ) : (
          <TouchpointTable
            data={filtered}
            loading={loading}
            sorting={sorting}
            onSortingChange={setSorting}
            onVisibleRowsChange={onVisibleRowsChange}
            tableContract={payload.sections.table}
            semantics={payload.semantics}
            nullPolicy={payload.null_policy}
          />
        )}
      </>
    ),
    footer: (
      <section className="flex justify-end">
        <span className="rounded-full border border-border bg-surface-1 px-2.5 py-1 font-mono text-2xs text-text-tertiary">
          {payload.sections.footer.baseline_label}: {payload.sections.footer.baseline_value}
        </span>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-border bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent/70" />
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              {payload.sections.hero.board_title}
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-2xs text-text-tertiary">
              {payload.sections.hero.board_badge}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-mono text-2xs text-text-tertiary">
              {payload.sections.hero.actions.last_sync_label}{" "}
              {lastRefresh.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <button
              onClick={exportCsv}
              disabled={exportRows.length === 0 || loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs text-text-secondary transition-all duration-150 hover:border-border-hover hover:text-text-primary disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              {payload.sections.hero.actions.export_label}
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs text-text-secondary transition-all duration-150 hover:border-border-hover hover:text-text-primary disabled:opacity-40"
            >
              {loading
                ? payload.sections.hero.actions.syncing_label
                : payload.sections.hero.actions.sync_label}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        {payload.section_order.map((section) => (
          <div key={section}>{sectionContent[section]}</div>
        ))}
      </main>
    </div>
  );
}
