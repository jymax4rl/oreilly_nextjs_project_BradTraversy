"use client";

import { useEffect, useMemo, useState } from "react";
import { BROADCAST_AUDIENCES } from "@/utils/ops/broadcastAudience";

const SEARCH_DEBOUNCE_MS = 280;

function hostLabel(user) {
  if (user?.hostStatus === "verified" || user?.role === "host") return "Host";
  if (user?.hostStatus === "onboarding") return "Applicant";
  if (user?.hostStatus === "rejected") return "Rejected";
  return "Guest";
}

function languageLabel(locale) {
  return locale === "fr" ? "French" : "English";
}

export default function OpsBroadcastPanel() {
  const [mode, setMode] = useState("one");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("become_a_host");
  const [audience, setAudience] = useState("guests");
  const [force, setForce] = useState(false);
  const [attachPdf, setAttachPdf] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [personPreview, setPersonPreview] = useState(null);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) || templates[0] || null,
    [templates, templateId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ops/marketing/templates", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load templates");
        const data = await res.json();
        if (cancelled) return;
        const list = data.templates || [];
        setTemplates(list);
        setTemplateId((current) =>
          list.some((t) => t.id === current) ? current : list[0]?.id || "",
        );
      } catch (err) {
        if (!cancelled) setPreviewError(err.message || "Could not load templates");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (mode !== "one") return;
    if (searchQuery.length < 2) {
      setMatches([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          filter: "all",
          q: searchQuery,
        });
        const res = await fetch(`/api/ops/users?${params}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not search people");
        setMatches(
          (data.users || [])
            .filter(
              (user) =>
                !user.banned &&
                user.role !== "admin" &&
                user.role !== "superadmin",
            )
            .slice(0, 8),
        );
      } catch (err) {
        if (err?.name === "AbortError") return;
        setMatches([]);
      } finally {
        setSearching(false);
      }
    };
    load();
    return () => controller.abort();
  }, [mode, searchQuery]);

  useEffect(() => {
    if (mode !== "audience" || !templateId || !audience) return;
    const controller = new AbortController();
    const load = async () => {
      setLoadingPreview(true);
      setPreviewError("");
      try {
        const params = new URLSearchParams({
          templateId,
          audience,
          force: force ? "1" : "0",
        });
        const res = await fetch(`/api/ops/messages/broadcast?${params}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not count recipients");
        }
        setPreview(data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setPreview(null);
        setPreviewError(err.message || "Could not count recipients");
      } finally {
        setLoadingPreview(false);
      }
    };
    load();
    return () => controller.abort();
  }, [mode, templateId, audience, force]);

  useEffect(() => {
    if (mode !== "one" || !selected?._id || !templateId) {
      setPersonPreview(null);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoadingPreview(true);
      setPreviewError("");
      try {
        const params = new URLSearchParams({
          templateId,
          userId: selected._id,
        });
        const res = await fetch(`/api/ops/messages/broadcast?${params}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not load this person");
        }
        setPersonPreview(data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setPersonPreview(null);
        setPreviewError(err.message || "Could not load this person");
      } finally {
        setLoadingPreview(false);
      }
    };
    load();
    return () => controller.abort();
  }, [mode, selected?._id, templateId]);

  const pickPerson = (user) => {
    setSelected(user);
    setSearchInput("");
    setSearchQuery("");
    setMatches([]);
    setNotice(null);
  };

  const refreshAudiencePreview = async () => {
    const params = new URLSearchParams({
      templateId,
      audience,
      force: force ? "1" : "0",
    });
    const refresh = await fetch(`/api/ops/messages/broadcast?${params}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (refresh.ok) setPreview(await refresh.json());
  };

  const sendOne = async () => {
    if (!template || !selected?._id || sending) return;
    const recipient = personPreview?.recipient;
    const locale = recipient?.locale === "fr" ? "French" : "English";
    const already = personPreview?.alreadySent && !force;
    if (already) {
      setNotice({
        tone: "err",
        text: "They already received this letter. Tick the override to send again.",
      });
      return;
    }
    const name = recipient?.name || selected.username || selected.email;
    const ok = window.confirm(
      `Send “${template.label}” to ${name} in ${locale}?`,
    );
    if (!ok) return;

    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ops/messages/broadcast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          userId: selected._id,
          force,
          attachPdf,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Send failed");
      }
      setNotice({
        tone: "ok",
        text: `Sent to ${data.result?.email || selected.email} in ${
          data.result?.locale === "fr" ? "French" : "English"
        }.`,
      });
      const params = new URLSearchParams({
        templateId,
        userId: selected._id,
      });
      const refresh = await fetch(`/api/ops/messages/broadcast?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (refresh.ok) setPersonPreview(await refresh.json());
    } catch (err) {
      setNotice({ tone: "err", text: err.message || "Send failed" });
    } finally {
      setSending(false);
    }
  };

  const sendBatch = async () => {
    if (!template || sending) return;
    const n = Number(preview?.nextCount || 0);
    if (n <= 0) return;
    const fr = Number(preview.nextFr || 0);
    const en = Number(preview.nextEn || 0);
    const ok = window.confirm(
      `Send “${template.label}” to ${n} recipient${n === 1 ? "" : "s"} in each person’s language (${fr} French, ${en} English)?`,
    );
    if (!ok) return;

    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ops/messages/broadcast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          audience,
          force,
          attachPdf,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Send failed");
      }
      setNotice({
        tone: data.failed ? "warn" : "ok",
        text: `Sent ${data.sent} (${data.sentFr || 0} French, ${
          data.sentEn || 0
        } English). Failed ${data.failed}. ${
          data.remainingEligible
            ? `${data.remainingEligible} still waiting — send another batch after the hourly cap resets.`
            : "This audience is done for this template."
        }`,
      });
      await refreshAudiencePreview();
    } catch (err) {
      setNotice({ tone: "err", text: err.message || "Send failed" });
    } finally {
      setSending(false);
    }
  };

  const canSendOne =
    Boolean(template) &&
    Boolean(selected?._id) &&
    Boolean(personPreview?.recipient) &&
    !sending &&
    !loadingPreview &&
    Number(personPreview?.hourlyRemaining || 0) > 0 &&
    (!personPreview?.alreadySent || force);

  const canSendBatch =
    Boolean(template) &&
    !sending &&
    !loadingPreview &&
    Number(preview?.nextCount || 0) > 0 &&
    Number(preview?.hourlyRemaining || 0) > 0;

  return (
    <section className="mb-10 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--kama-ink-muted)]">
        Send a template
      </h2>
      <p className="mt-1.5 text-sm text-[var(--kama-ink-muted)]">
        Email a letter to one person, or to a whole audience. Each recipient
        gets French or English from the language they use on the site. Cap: 25
        per hour.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "one", label: "One person" },
          { id: "audience", label: "Audience" },
        ].map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setNotice(null);
                setPreviewError("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gray-900 text-white"
                  : "border bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-gray-800">Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3 text-sm outline-none focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.labelFr ? ` / ${t.labelFr}` : ""}
              </option>
            ))}
          </select>
        </label>

        {mode === "audience" ? (
          <label className="block text-sm">
            <span className="font-medium text-gray-800">Audience</span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3 text-sm outline-none focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
            >
              {BROADCAST_AUDIENCES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm sm:col-span-1">
            <span className="font-medium text-gray-800">Person</span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or email"
              className="mt-1 h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3 text-sm outline-none focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
            />
          </label>
        )}
      </div>

      {mode === "one" && searchQuery.length >= 2 ? (
        <ul className="mt-2 divide-y overflow-hidden rounded-lg border border-[var(--kama-border)] bg-white text-sm">
          {searching ? (
            <li className="px-3 py-2 text-gray-500">Searching…</li>
          ) : matches.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">No matching account.</li>
          ) : (
            matches.map((user) => (
              <li key={user._id}>
                <button
                  type="button"
                  onClick={() => pickPerson(user)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span>
                    <span className="font-medium text-gray-900">
                      {user.username || "—"}
                    </span>
                    <span className="mt-0.5 block text-gray-600">{user.email}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {hostLabel(user)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {mode === "one" && selected ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-[var(--kama-border)] bg-white px-3 py-3 text-sm">
          <div>
            <p className="font-medium text-gray-900">
              {selected.username || personPreview?.recipient?.name || "—"}
            </p>
            <p className="text-gray-600">{selected.email}</p>
            <p className="mt-1 text-gray-500">
              {hostLabel(selected)}
              {personPreview?.recipient?.locale
                ? ` · ${languageLabel(personPreview.recipient.locale)}`
                : loadingPreview
                  ? " · …"
                  : ""}
              {personPreview?.alreadySent ? " · already received this letter" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setPersonPreview(null);
            }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Change
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 text-sm text-gray-700">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={attachPdf}
            onChange={(e) => setAttachPdf(e.target.checked)}
          />
          Attach the host PDF
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          Send even if they already received this template
        </label>
      </div>

      {mode === "audience" ? (
        <p className="mt-3 text-sm text-gray-600">
          {loadingPreview
            ? "Counting recipients…"
            : preview
              ? `${preview.eligible} eligible (${preview.eligibleFr || 0} French, ${
                  preview.eligibleEn || 0
                } English) · this batch ${preview.nextCount || 0} (${
                  preview.nextFr || 0
                } French, ${preview.nextEn || 0} English) · ${
                  preview.alreadySent
                } already received this · ${preview.hourlyRemaining} sends left this hour`
              : previewError || "—"}
        </p>
      ) : (
        <p className="mt-3 text-sm text-gray-600">
          {previewError
            ? previewError
            : personPreview
              ? `${personPreview.hourlyRemaining} sends left this hour`
              : selected
                ? loadingPreview
                  ? "Checking this person…"
                  : "—"
                : "Search for someone who already has an Isisel account."}
        </p>
      )}

      {notice ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            notice.tone === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : notice.tone === "warn"
                ? "bg-amber-50 text-amber-900"
                : "bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {notice.text}
        </p>
      ) : null}

      {mode === "one" ? (
        <button
          type="button"
          disabled={!canSendOne}
          onClick={sendOne}
          className="mt-4 rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164e4a] disabled:cursor-not-allowed disabled:bg-[#1B5C57]/40"
        >
          {sending ? "Sending…" : "Send to this person"}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canSendBatch}
          onClick={sendBatch}
          className="mt-4 rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164e4a] disabled:cursor-not-allowed disabled:bg-[#1B5C57]/40"
        >
          {sending ? "Sending…" : "Send this batch"}
        </button>
      )}
    </section>
  );
}
