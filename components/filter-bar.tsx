"use client";

import type { RefObject } from "react";

interface FilterBarProps {
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  bucketFilter: string;
  setBucketFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredCount: number;
  totalCount: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

const priorities: { key: string; label: string }[] = [
  { key: "all", label: "All Levels" },
  { key: "critical", label: "Immediate" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "standard", label: "Standard" },
  { key: "low", label: "Low" },
];

const buckets: { key: string; label: string }[] = [
  { key: "all", label: "All Stages" },
  { key: "critical_redeploy", label: "Urgent Redeploy" },
  { key: "redeploy_window", label: "Redeploy Window" },
  { key: "approaching_end", label: "Approaching End" },
  { key: "active_working", label: "Active Assignment" },
  { key: "signed_next", label: "Signed Next" },
  { key: "between_assignments", label: "Between Assignments" },
  { key: "prospect", label: "Prospect" },
];

export function FilterBar({
  priorityFilter,
  setPriorityFilter,
  bucketFilter,
  setBucketFilter,
  searchQuery,
  setSearchQuery,
  filteredCount,
  totalCount,
  searchInputRef,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Priority pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider mr-1 w-14">
          Urgency
        </span>
        {priorities.map((p) => (
          <button
            key={p.key}
            onClick={() => setPriorityFilter(p.key)}
            className={`pill ${priorityFilter === p.key ? "pill-active" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Bucket pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider mr-1 w-14">
          Stage
        </span>
        {buckets.map((b) => (
          <button
            key={b.key}
            onClick={() => setBucketFilter(b.key)}
            className={`pill ${bucketFilter === b.key ? "pill-active" : ""}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Search + count */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clinician, facility, or specialty..."
            className="w-full pl-3 pr-8 py-2 rounded-md border border-border bg-surface-1
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                       transition-all duration-150"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary
                         hover:text-text-secondary text-xs"
            >
              &times;
            </button>
          )}
        </div>
        <span className="text-xs text-text-tertiary font-mono">
          {filteredCount === totalCount
            ? `${totalCount} clinicians in view`
            : `${filteredCount} of ${totalCount} clinicians in view`}
        </span>
      </div>
    </div>
  );
}
