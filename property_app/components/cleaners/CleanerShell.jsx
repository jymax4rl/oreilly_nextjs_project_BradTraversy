"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Sparkles, UserRound } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import CleanerPushPrompt from "@/components/cleaners/CleanerPushPrompt";
import "./cleaner-shell.css";

const NAV = [
  { href: "/cleaners", label: "Home", exact: true, Icon: Home },
  { href: "/cleaners/jobs", label: "Jobs", Icon: Sparkles },
  { href: "/cleaners/requests", label: "Requests", Icon: CalendarDays },
  { href: "/cleaners/profile", label: "Me", Icon: UserRound },
];

export default function CleanerShell({ children, name }) {
  const pathname = usePathname() || "";
  const hideChrome = pathname.startsWith("/cleaners/join");

  if (hideChrome) {
    return (
      <div className="min-h-dvh bg-[var(--kama-canvas-soft)] text-[var(--kama-ink)]">
        {children}
      </div>
    );
  }

  return (
    <div className="cleaner-shell">
      <header className="sticky top-0 z-40 border-b border-[var(--kama-border)] bg-[var(--kama-surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <BrandLogo href="/cleaners" className="h-8 w-auto" />
          <span className="rounded-full bg-[var(--kama-accent-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-accent)]">
            Cleaners
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-5">
        <CleanerPushPrompt />
        {children}
      </main>
      <nav className="cleaner-bottom" aria-label="Cleaner">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.Icon;
          return (
            <Link key={item.href} href={item.href} data-active={active ? "true" : "false"}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {name ? <span className="sr-only">Signed in as {name}</span> : null}
    </div>
  );
}
