"use client";

import type { StatCardContract } from "@/lib/payload-contract";

interface StatsBarProps {
  cards: StatCardContract[];
  values: {
    total: number;
    critical: number;
    high: number;
    signed_next: number;
    needs_touch: number;
  };
  loading: boolean;
  loadingValueLabel: string;
}

const TONE_STYLE: Record<
  StatCardContract["tone"],
  { color: string; border: string }
> = {
  critical: { color: "text-red-400", border: "border-red-500/20" },
  high: { color: "text-orange-400", border: "border-orange-500/20" },
  medium: { color: "text-yellow-400", border: "border-yellow-500/20" },
  standard: { color: "text-zinc-400", border: "border-zinc-500/20" },
  low: { color: "text-emerald-400", border: "border-emerald-500/20" },
  neutral: { color: "text-text-primary", border: "border-border" },
};

export function StatsBar({ cards, values, loading, loadingValueLabel }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`rounded-lg border ${TONE_STYLE[card.tone].border} bg-surface-1 px-4 py-3
                      transition-all duration-200 hover:bg-surface-2`}
        >
          <div className="text-[11px] text-text-tertiary uppercase tracking-wider">
            {card.label}
          </div>
          <div className={`text-2xl font-semibold mt-1 ${TONE_STYLE[card.tone].color} font-mono`}>
            {loading ? (
              <span
                title={loadingValueLabel}
                className="inline-block w-8 h-7 bg-surface-3 rounded animate-pulse"
              />
            ) : (
              values[card.id]
            )}
          </div>
          {card.sub_label && (
            <div className="text-[10px] text-text-tertiary mt-0.5">
              {card.sub_label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
