"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

function highlight(text, q) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-100 px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function DocumentationSearch({ large = false, initialQuery = "" }) {
  const inputId = useId();
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const trimmed = q.trim();
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    if (!canSearch) return undefined;

    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ops/documentation?q=${encodeURIComponent(trimmed)}&status=all&limit=30`,
        );
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Search failed");
        setResults(data.articles || []);
      } catch (err) {
        setError(err.message || "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [canSearch, trimmed]);

  const visibleResults = canSearch ? results : [];
  const visibleError = canSearch ? error : null;

  const countLabel = useMemo(() => {
    if (!canSearch) return null;
    if (loading) return "Searching…";
    return `${visibleResults.length} result${visibleResults.length === 1 ? "" : "s"}`;
  }, [canSearch, loading, visibleResults.length]);

  return (
    <div className="docs-search">
      <label htmlFor={inputId} className="sr-only">
        Search Isisel documentation
      </label>
      <input
        id={inputId}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Isisel documentation..."
        autoComplete="off"
        style={large ? { fontSize: "1.05rem", padding: "1rem 1.1rem" } : undefined}
      />
      {countLabel ? (
        <p className="text-xs text-[var(--kama-ink-muted)]" aria-live="polite">
          {countLabel}
        </p>
      ) : null}
      {visibleError ? (
        <p className="text-sm text-red-700" role="alert">
          {visibleError}
        </p>
      ) : null}
      {visibleResults.length > 0 ? (
        <ul className="space-y-2" role="listbox" aria-label="Search results">
          {visibleResults.map((article) => (
            <li key={article.id || article.slug}>
              <Link href={`/documentation/${article.slug}`} className="docs-card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="docs-card__cat">{article.category}</span>
                  <span className={`docs-badge docs-badge--${article.status}`}>
                    {article.status}
                  </span>
                </div>
                <h3 className="docs-card__title">
                  {highlight(article.title, trimmed)}
                </h3>
                <p className="docs-card__summary">
                  {highlight(article.summary || "", trimmed)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
