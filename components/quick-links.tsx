"use client";

import { Briefcase, Calculator, ExternalLink, LayoutDashboard } from "lucide-react";

const LINKS = [
  {
    label: "Nova Workspace",
    href: "https://nova.ayahealthcare.com/",
    icon: LayoutDashboard,
  },
  {
    label: "Pre-Start Pipeline",
    href: "https://nova.ayahealthcare.com/",
    icon: Briefcase,
  },
  {
    label: "Margin Calculator",
    href: "https://nova.ayahealthcare.com/",
    icon: Calculator,
  },
  {
    label: "Aya Marketplace",
    href: "https://www.ayahealthcare.com/travel-nursing/jobs",
    icon: ExternalLink,
  },
] as const;

export function QuickLinks() {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wider text-text-tertiary">
        Recruiter Shortcuts
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
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
