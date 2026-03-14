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
  { key: "critical" as const, label: "Immediate", color: "text-red-400" },
  { key: "high" as const, label: "High This Week", color: "text-orange-400" },
  { key: "needsTouch" as const, label: "Overdue", color: "text-yellow-400" },
  { key: "signedNext" as const, label: "Rebooked", color: "text-emerald-400" },
  { key: "total" as const, label: "Roster", color: "text-text-primary" },
];

export function StatsBar({ stats, loading }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-md border border-border bg-surface-1 px-3 py-2"
        >
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {card.label}
          </div>
          <div className={`mt-1 text-xl font-semibold font-mono ${card.color}`}>
            {loading ? (
              <span className="inline-block h-6 w-8 animate-pulse rounded bg-surface-3" />
            ) : (
              stats[card.key]
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
