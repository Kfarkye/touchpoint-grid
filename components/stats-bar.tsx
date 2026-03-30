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
  critical: { color: "text-priority-critical", border: "border-[#cc4f3f30]" },
  high: { color: "text-priority-high", border: "border-[#cc7f3f30]" },
  medium: { color: "text-priority-medium", border: "border-[#9f8a4d30]" },
  standard: { color: "text-text-secondary", border: "border-border" },
  low: { color: "text-priority-low", border: "border-[#3e9a6830]" },
  neutral: { color: "text-text-primary", border: "border-border" },
};

export function StatsBar({ cards, values, loading, loadingValueLabel }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`rounded-lg border ${TONE_STYLE[card.tone].border} bg-surface-1 px-4 py-3 transition-colors duration-150 hover:bg-surface-2`}
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
