"use client";

import { PriorityLevel, Bucket, PRIORITY_CONFIG, BUCKET_LABELS } from "@/lib/types";

interface FilterBarProps {
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  bucketFilter: string;
  setBucketFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredCount: number;
  totalCount: number;
}

const priorities: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "standard", label: "Standard" },
  { key: "low", label: "Low" },
];

const buckets: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical_redeploy", label: "Critical Redeploy" },
  { key: "redeploy_window", label: "Redeploy Window" },
  { key: "approaching_end", label: "Approaching End" },
  { key: "active_working", label: "Active Working" },
  { key: "signed_next", label: "Signed Next" },
  { key: "between_assignments", label: "Between" },
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
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Priority pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider mr-1 w-14">
          Priority
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
          Bucket
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
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, facility, specialty..."
            className="w-80 pl-3 pr-8 py-2 rounded-md border border-border bg-surface-1
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
            ? `${totalCount} shown`
            : `${filteredCount} of ${totalCount} shown`}
        </span>
      </div>
    </div>
  );
}
