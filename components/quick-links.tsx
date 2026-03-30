"use client";

import { Briefcase, Calculator, ExternalLink, LayoutDashboard } from "lucide-react";
import type { QuickLinkContract } from "@/lib/payload-contract";

interface QuickLinksProps {
  title: string;
  links: QuickLinkContract[];
}

const ICON_MAP = {
  dashboard: LayoutDashboard,
  briefcase: Briefcase,
  calculator: Calculator,
  external: ExternalLink,
} as const;

export function QuickLinks({ title, links }: QuickLinksProps) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-surface-1 to-surface-2 px-4 py-3">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-text-tertiary">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {links.map((link) => {
          const Icon = ICON_MAP[link.icon];
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
