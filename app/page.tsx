"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { StatsBar } from "@/components/stats-bar";
import { TouchpointTable } from "@/components/touchpoint-table";
import { formatDisplay } from "@/lib/phone";
import { fetchTouchpointGrid } from "@/lib/supabase";
import { BUCKET_LABELS, PRIORITY_CONFIG, type Bucket, type TouchpointRow } from "@/lib/types";

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function Page() {
  const [data, setData] = useState<TouchpointRow[]>([]);
  const [visibleRows, setVisibleRows] = useState<TouchpointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
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
      const rows = await fetchTouchpointGrid();
      setData(rows);
      setVisibleRows(rows);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Unable to load the recruiter board right now"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      data.filter((row) => {
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
    [bucketFilter, data, priorityFilter, searchQuery]
  );

  const stats = useMemo(
    () => ({
      total: data.length,
      critical: data.filter((row) => row.priority_level === "critical").length,
      high: data.filter((row) => row.priority_level === "high").length,
      signedNext: data.filter((row) => row.has_next_assignment).length,
      needsTouch: data.filter((row) => row.days_since_touch > 14).length,
    }),
    [data]
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

    const header = [
      "Name",
      "Phone",
      "Email",
      "Facility",
      "State",
      "End Date",
      "Days Left",
      "Priority",
      "Bucket",
      "Suggested Action",
    ];

    const records = rows.map((row) => [
      row.candidate_name,
      formatDisplay(row.phone),
      row.email,
      row.current_facility ?? "",
      row.current_facility_state ?? "",
      row.assignment_end ?? "",
      row.days_to_end ?? "",
      PRIORITY_CONFIG[row.priority_level].label,
      BUCKET_LABELS[row.bucket as Bucket] ?? row.bucket,
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
    link.download = `touchpoint-grid-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportRows]);

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-0/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              Candidate Follow-Up Board
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-mono text-2xs text-text-tertiary">
              Last sync{" "}
              {lastRefresh.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <button
              onClick={exportCsv}
              disabled={exportRows.length === 0 || loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-all duration-150 hover:border-border-hover hover:text-text-primary disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-all duration-150 hover:border-border-hover hover:text-text-primary disabled:opacity-40"
            >
              {loading ? "Syncing..." : "Sync Roster"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-4 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">
            Work queue sorted by urgency and last outreach.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-text-secondary">
            <span className="rounded-full border border-border px-2.5 py-1">
              {exportRows.length} in view
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {stats.critical} immediate
            </span>
          </div>
        </div>

        <StatsBar stats={stats} loading={loading} />

        <FilterBar
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          bucketFilter={bucketFilter}
          setBucketFilter={setBucketFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredCount={filtered.length}
          totalCount={data.length}
          searchInputRef={searchInputRef}
        />

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-1 px-6 py-14 text-center">
            <p className="text-sm text-text-secondary">
              No clinicians match this view
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <TouchpointTable
            data={filtered}
            loading={loading}
            sorting={sorting}
            onSortingChange={setSorting}
            onVisibleRowsChange={onVisibleRowsChange}
            onTouchLogged={loadData}
          />
        )}
      </main>
    </div>
  );
}
