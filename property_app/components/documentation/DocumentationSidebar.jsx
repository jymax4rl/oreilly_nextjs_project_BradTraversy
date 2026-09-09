"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DocumentationSidebar({ initialNav = [] }) {
  const pathname = usePathname() || "";
  const [nav, setNav] = useState(initialNav);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (initialNav?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ops/documentation/nav");
        const data = await res.json();
        if (!cancelled && data.ok) setNav(data.nav || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialNav]);

  const body = (
    <>
      <p className="docs-sidebar__title">Documentation</p>
      <Link href="/documentation" className="mb-2 block text-sm font-semibold text-[var(--kama-accent)]">
        Home
      </Link>
      <Link
        href="/documentation/manage"
        className="mb-3 block text-xs text-[var(--kama-ink-muted)] hover:text-[var(--kama-ink)]"
      >
        Manage articles
      </Link>
      {nav.map((group) => (
        <details key={group.category} open>
          <summary>{group.category}</summary>
          <div className="space-y-0.5 pb-2">
            {group.articles.map((a) => {
              const href = `/documentation/${a.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={a.slug}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {a.title}
                </Link>
              );
            })}
          </div>
        </details>
      ))}
    </>
  );

  return (
    <>
      <div className="docs-mobile-nav">
        <button
          type="button"
          className="docs-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide navigation" : "Browse documentation"}
        </button>
        {open ? <div className="docs-sidebar mt-2">{body}</div> : null}
      </div>
      <aside className="docs-sidebar docs-sidebar--desktop" aria-label="Documentation sections">
        {body}
      </aside>
    </>
  );
}
