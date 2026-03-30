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
    <div className="rounded-xl border border-border bg-surface-1 px-4 py-3">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-text-tertiary">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {links.map((link) => {
          const Icon = ICON_MAP[link.icon];
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 border-b border-transparent px-0.5 py-1 text-xs text-text-secondary transition-colors hover:text-accent hover:border-accent/40"
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
