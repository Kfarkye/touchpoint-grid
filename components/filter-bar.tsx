"use client";

import type { RefObject } from "react";
import type { FilterOption } from "@/lib/payload-contract";

interface FilterBarProps {
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  bucketFilter: string;
  setBucketFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  priorityLabel: string;
  stageLabel: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  priorityOptions: FilterOption[];
  bucketOptions: FilterOption[];
  countLabel: string;
}

export function FilterBar({
  priorityFilter,
  setPriorityFilter,
  bucketFilter,
  setBucketFilter,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  priorityLabel,
  stageLabel,
  searchPlaceholder,
  clearSearchLabel,
  priorityOptions,
  bucketOptions,
  countLabel,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider mr-1 w-14">
          {priorityLabel}
        </span>
        {priorityOptions.map((p) => (
          <button
            key={p.key}
            onClick={() => setPriorityFilter(p.key)}
            className={`filter-tab ${priorityFilter === p.key ? "filter-tab-active" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider mr-1 w-14">
          {stageLabel}
        </span>
        {bucketOptions.map((b) => (
          <button
            key={b.key}
            onClick={() => setBucketFilter(b.key)}
            className={`filter-tab font-mono ${
              bucketFilter === b.key ? "filter-tab-active" : ""
            }`}
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
            placeholder={searchPlaceholder}
            className="w-full pl-3 pr-8 py-2 rounded-md border border-border bg-surface-1
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20
                       transition-all duration-150"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              title={clearSearchLabel}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary
                         hover:text-text-secondary text-xs"
            >
              &times;
            </button>
          )}
        </div>
        <span className="text-xs text-text-tertiary font-mono">
          {countLabel}
        </span>
      </div>
    </div>
  );
}
