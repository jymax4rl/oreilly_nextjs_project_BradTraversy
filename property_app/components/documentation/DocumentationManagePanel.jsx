"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function DocumentationManagePanel() {
  const [articles, setArticles] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seedMsg, setSeedMsg] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        manage: "1",
        status,
        limit: "200",
      });
      if (q.trim()) params.set("q", q.trim());
      if (category.trim()) params.set("category", category.trim());
      const res = await fetch(`/api/ops/documentation?${params}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load");
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status, q, category]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          manage: "1",
          status,
          limit: "200",
        });
        const res = await fetch(`/api/ops/documentation?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load");
        setArticles(data.articles || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, reloadToken]);

  const reseed = async () => {
    setSeedMsg(null);
    const res = await fetch("/api/ops/documentation/seed", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setSeedMsg(data.error || "Seed failed");
      return;
    }
    setSeedMsg(
      `Seed ${data.seedVersion}: created ${data.created}, updated ${data.updated}, skipped ${data.skipped}`,
    );
    setReloadToken((n) => n + 1);
  };

  const archive = async (id) => {
    if (!window.confirm("Archive this article?")) return;
    const res = await fetch(`/api/ops/documentation/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Archive failed");
      return;
    }
    setReloadToken((n) => n + 1);
  };

  const categories = [...new Set(articles.map((a) => a.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <label className="mb-1 block text-xs font-semibold text-[var(--kama-ink-muted)]">
            Search
          </label>
          <input
            className="w-full rounded-lg border border-[var(--kama-border)] px-3 py-2 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter articles"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--kama-ink-muted)]">
            Category
          </label>
          <select
            className="rounded-lg border border-[var(--kama-border)] px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--kama-ink-muted)]">
            Status
          </label>
          <select
            className="rounded-lg border border-[var(--kama-border)] px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="outdated">Outdated</option>
            <option value="deprecated">Deprecated</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          type="button"
          className="docs-btn"
          onClick={() => {
            void load();
          }}
        >
          Refresh
        </button>
        <Link href="/documentation/manage/new" className="docs-btn docs-btn--primary">
          New article
        </Link>
        <button type="button" className="docs-btn" onClick={() => void reseed()}>
          Re-seed system docs
        </button>
      </div>

      {seedMsg ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">{seedMsg}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--kama-border)] bg-white">
          <table className="docs-manage-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles
                .filter((a) => !category || a.category === category)
                .filter((a) => {
                  const needle = q.trim().toLowerCase();
                  if (!needle) return true;
                  return (
                    a.title.toLowerCase().includes(needle) ||
                    a.summary.toLowerCase().includes(needle) ||
                    a.slug.toLowerCase().includes(needle)
                  );
                })
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={`/documentation/${a.slug}`}
                        className="font-semibold text-[var(--kama-accent)]"
                      >
                        {a.title}
                      </Link>
                      <div className="text-xs text-[var(--kama-ink-muted)]">
                        {a.slug}
                      </div>
                    </td>
                    <td>{a.category}</td>
                    <td>
                      <span className={`docs-badge docs-badge--${a.status}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.updatedAt
                        ? new Date(a.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <div className="docs-actions">
                        <Link
                          href={`/documentation/manage/${a.id}`}
                          className="docs-btn"
                        >
                          Edit
                        </Link>
                        {a.status !== "archived" ? (
                          <button
                            type="button"
                            className="docs-btn"
                            onClick={() => void archive(a.id)}
                          >
                            Archive
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
