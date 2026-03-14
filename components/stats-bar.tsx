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
  {
    key: "critical" as const,
    label: "Immediate Follow-Up",
    color: "text-red-400",
    border: "border-red-500/20",
  },
  {
    key: "high" as const,
    label: "Priority This Week",
    color: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    key: "needsTouch" as const,
    label: "Overdue Outreach",
    sub: "14+ days since touch",
    color: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  {
    key: "signedNext" as const,
    label: "Rebooked",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    key: "total" as const,
    label: "Active Roster",
    color: "text-text-primary",
    border: "border-border",
  },
];

export function StatsBar({ stats, loading }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-lg border ${card.border} bg-surface-1 px-4 py-3
                      transition-all duration-200 hover:bg-surface-2`}
        >
          <div className="text-[11px] text-text-tertiary uppercase tracking-wider">
            {card.label}
          </div>
          <div className={`text-2xl font-semibold mt-1 ${card.color} font-mono`}>
            {loading ? (
              <span className="inline-block w-8 h-7 bg-surface-3 rounded animate-pulse" />
            ) : (
              stats[card.key]
            )}
          </div>
          {card.sub && (
            <div className="text-[10px] text-text-tertiary mt-0.5">
              {card.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
