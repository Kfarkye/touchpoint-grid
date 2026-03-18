"use client";

import type { RefObject } from "react";
import { BUCKET_LABELS, type Bucket } from "@/lib/types";

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
  { key: "all", label: "All" },
  { key: "critical", label: "Immediate" },
  { key: "high", label: "High" },
  { key: "medium", label: "Med" },
  { key: "standard", label: "Std" },
  { key: "low", label: "Low" },
];

const stageOptions = (
  [
    "critical_redeploy",
    "redeploy_window",
    "approaching_end",
    "active_working",
    "signed_next",
    "between_assignments",
    "prospect",
  ] as Bucket[]
).map((key) => ({
  key,
  label: BUCKET_LABELS[key],
}));

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
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 xl:flex-row xl:items-center">
          <div className="relative w-full max-w-[370px]">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search clinician, facility, or specialty"
            className="w-full rounded-md border border-border bg-surface-0 px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none"
          />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-text-secondary"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="hidden items-center gap-1 xl:flex">
            {priorities.map((priority) => (
              <button
                key={priority.key}
                type="button"
                onClick={() => setPriorityFilter(priority.key)}
                className={`pill ${priorityFilter === priority.key ? "pill-active" : ""}`}
              >
                {priority.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
              Stage
            </span>
            <select
              value={bucketFilter}
              onChange={(event) => setBucketFilter(event.target.value)}
              className="min-w-[170px] rounded-md border border-border bg-surface-0 px-2.5 py-2 text-xs text-text-secondary focus:border-accent/40 focus:outline-none"
            >
              <option value="all">All Stages</option>
              {stageOptions.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-text-tertiary">
          Showing {filteredCount} / {totalCount}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1 xl:hidden">
        {priorities.map((priority) => (
          <button
            key={priority.key}
            type="button"
            onClick={() => setPriorityFilter(priority.key)}
            className={`pill ${priorityFilter === priority.key ? "pill-active" : ""}`}
          >
            {priority.label}
          </button>
        ))}
      </div>
    </div>
  );
}
