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
  const isConnectionError = error?.toLowerCase().includes("not connected yet") ?? false;

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
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-serif text-lg font-semibold tracking-tight text-text-primary">
              Recruiter Follow-Up Desk
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden font-mono text-2xs text-text-tertiary sm:inline">
              Updated{" "}
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
              <span className="hidden sm:inline">Download List</span>
              <span className="sm:hidden">Export</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-all duration-150 hover:border-border-hover hover:text-text-primary disabled:opacity-40"
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-4 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-tertiary">
            Start at the top and work down. The list is already sorted by who needs a touch first.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-text-secondary">
            <span className="rounded border border-border px-2 py-1">
              {exportRows.length} in view
            </span>
            <span className="rounded border border-border px-2 py-1">
              {stats.critical} urgent now
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

        {error &&
          (isConnectionError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <h2 className="font-serif text-base font-semibold text-amber-900">
                This list is almost ready
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                We can’t pull live clinician data yet. Once the board connection is finished,
                your follow-up list will appear here.
              </p>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:border-amber-400 disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ))}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-1 px-6 py-12 text-center">
            <h2 className="font-serif text-lg font-semibold text-text-primary">
              No matches in this view
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              No clinicians match these filters.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Clear filters
              </button>
              <button
                type="button"
                onClick={loadData}
                className="rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Refresh list
              </button>
            </div>
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
