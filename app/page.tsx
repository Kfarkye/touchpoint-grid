"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchTouchpointGrid } from "@/lib/supabase";
import { TouchpointRow } from "@/lib/types";
import { StatsBar } from "@/components/stats-bar";
import { FilterBar } from "@/components/filter-bar";
import { TouchpointTable } from "@/components/touchpoint-table";

export default function Page() {
  const [data, setData] = useState<TouchpointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await fetchTouchpointGrid();
      setData(rows as TouchpointRow[]);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load grid data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered data
  const filtered = data.filter((row) => {
    if (
      priorityFilter !== "all" &&
      row.priority_level !== priorityFilter
    )
      return false;
    if (bucketFilter !== "all" && row.bucket !== bucketFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        row.candidate_name.toLowerCase().includes(q) ||
        (row.current_facility ?? "").toLowerCase().includes(q) ||
        (row.specialty ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: data.length,
    critical: data.filter((r) => r.priority_level === "critical").length,
    high: data.filter((r) => r.priority_level === "high").length,
    signedNext: data.filter((r) => r.has_next_assignment).length,
    needsTouch: data.filter((r) => r.days_since_touch > 14).length,
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-text-primary tracking-tight">
              Touchpoint Grid
            </span>
            <span className="text-xs text-text-tertiary font-mono">
              internal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xs text-text-tertiary font-mono">
              {lastRefresh.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 text-xs text-text-secondary border border-border
                         rounded-md hover:border-border-hover hover:text-text-primary
                         transition-all duration-150 disabled:opacity-40"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Touchpoint Priority
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {data.length} candidates &middot; ranked by outreach urgency
          </p>
        </div>

        {/* Stats row */}
        <StatsBar stats={stats} loading={loading} />

        {/* Filters */}
        <FilterBar
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          bucketFilter={bucketFilter}
          setBucketFilter={setBucketFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredCount={filtered.length}
          totalCount={data.length}
        />

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Grid */}
        <TouchpointTable data={filtered} loading={loading} />
      </main>
    </div>
  );
}
