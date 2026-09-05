"use client";

import { useEffect, useMemo, useState } from "react";
import { BROADCAST_AUDIENCES } from "@/utils/ops/broadcastAudience";

export default function OpsBroadcastPanel() {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("become_a_host");
  const [audience, setAudience] = useState("guests");
  const [force, setForce] = useState(false);
  const [attachPdf, setAttachPdf] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

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
    if (!templateId || !audience) return;
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
  }, [templateId, audience, force]);

  const canSend =
    Boolean(template) &&
    !sending &&
    !loadingPreview &&
    Number(preview?.nextCount || preview?.eligible || 0) > 0 &&
    Number(preview?.hourlyRemaining || 0) > 0;

  const sendBatch = async () => {
    if (!canSend) return;
    const n = Number(preview.nextCount || 0);
    const fr = Number(preview.nextFr || 0);
    const en = Number(preview.nextEn || 0);
    const ok = window.confirm(
      `Send “${template?.label || "this letter"}” to ${n} recipient${
        n === 1 ? "" : "s"
      } in each person’s language (${fr} French, ${en} English)?`,
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
    } catch (err) {
      setNotice({ tone: "err", text: err.message || "Send failed" });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mb-10 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--kama-ink-muted)]">
        Send a template
      </h2>
      <p className="mt-1.5 text-sm text-[var(--kama-ink-muted)]">
        Bulk email to people already on Isisel. Each person gets French or
        English from the language they use on the site (or their country if they
        have not chosen yet). Skips staff, banned accounts, and anyone who
        already received this letter. Cap: 25 per hour.
      </p>

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
      </div>

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

      <button
        type="button"
        disabled={!canSend}
        onClick={sendBatch}
        className="mt-4 rounded-xl bg-[#1B5C57] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164e4a] disabled:cursor-not-allowed disabled:bg-[#1B5C57]/40"
      >
        {sending ? "Sending…" : "Send this batch"}
      </button>
    </section>
  );
}
