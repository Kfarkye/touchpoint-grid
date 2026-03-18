"use client";

interface StatsBarProps {
  stats: {
    total: number;
    critical: number;
    high: number;
    signedNext: number;
    needsTouch: number;
  };
  loading: boolean;
}

const cards = [
  { key: "critical" as const, label: "Immediate", color: "text-red-700" },
  { key: "high" as const, label: "High This Week", color: "text-amber-700" },
  { key: "needsTouch" as const, label: "Overdue", color: "text-yellow-700" },
  { key: "signedNext" as const, label: "Rebooked", color: "text-emerald-700" },
  { key: "total" as const, label: "Roster", color: "text-text-primary" },
];

export function StatsBar({ stats, loading }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-[0_1px_0_rgba(15,23,42,0.03)] lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="border-b border-r border-border px-3 py-2.5 last:border-r-0 lg:border-b-0"
        >
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary">
            {card.label}
          </div>
          <div className={`mt-0.5 text-base font-semibold font-mono ${card.color}`}>
            {loading ? (
              <span className="inline-block h-4 w-8 animate-pulse rounded bg-surface-3" />
            ) : (
              stats[card.key]
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
