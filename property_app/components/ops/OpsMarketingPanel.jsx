"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isOpsStaff } from "@/utils/opsAuth";
import { Paperclip, Search, Send } from "lucide-react";

const SEARCH_DEBOUNCE_MS = 280;

const PLAYBOOK = [
  {
    title: "Hosts in Africa",
    body: "Owners of villas, apartments, guesthouses, and lodges. Lead with founding-host terms and the host console — not a generic “list with us.”",
  },
  {
    title: "Lifestyle & travel creators",
    body: "Two nights in West Africa when the host they introduce is approved. Stay-for-listing, not a paid post. Attach the partnership brief.",
  },
  {
    title: "Property managers",
    body: "People who already operate inventory. Offer a portfolio walkthrough instead of a single listing form.",
  },
  {
    title: "Diaspora owners",
    body: "Family homes that sit empty. You approve every request — nothing books itself.",
  },
  {
    title: "Also worth a letter",
    body: "Boutique hotels, wedding planners, tourism boards, university alumni groups, and African food / culture accounts that already send people home.",
  },
];

function interpolate(text, name) {
  const safe = String(name || "").trim() || "there";
  return String(text || "").replaceAll("{{name}}", safe);
}

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function OpsMarketingPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [sends, setSends] = useState([]);
  const [priorCount, setPriorCount] = useState(0);
  const [alreadySent, setAlreadySent] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [logLoading, setLogLoading] = useState(true);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) || templates[0] || null,
    [templates, templateId],
  );

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setSearchQuery(searchInput),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;
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
        setTemplates(data.templates || []);
        setEmailConfigured(Boolean(data.emailConfigured));
        setTemplateId((current) => current || data.templates?.[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setNotice({
            tone: "error",
            text: err.message || "Could not load templates",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session]);

  const loadSends = useCallback(
    async ({ q = "", lookupEmail = "" } = {}) => {
      const params = new URLSearchParams();
      if (lookupEmail) params.set("email", lookupEmail);
      else if (q) params.set("q", q);
      const res = await fetch(`/api/ops/marketing/sends?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not load send history");
      return res.json();
    },
    [],
  );

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;
    const controller = new AbortController();
    (async () => {
      setLogLoading(true);
      try {
        const data = await loadSends({ q: searchQuery });
        if (controller.signal.aborted) return;
        setSends(data.sends || []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setSends([]);
      } finally {
        if (!controller.signal.aborted) setLogLoading(false);
      }
    })();
    return () => controller.abort();
  }, [status, session, searchQuery, loadSends]);

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setPriorCount(0);
      setAlreadySent([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const data = await loadSends({ lookupEmail: trimmed });
        setPriorCount(data.priorCount || 0);
        setAlreadySent(data.alreadySentTemplateIds || []);
      } catch {
        setPriorCount(0);
        setAlreadySent([]);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [email, loadSends]);

  async function onSend(force = false) {
    setNotice(null);
    setConflict(null);
    setSending(true);
    try {
      const res = await fetch("/api/ops/marketing/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          templateId: template?.id,
          attachPdf,
          force,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.code === "already_sent") {
        setConflict(data);
        setSending(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || `Send failed (${res.status})`);
      }
      setNotice({
        tone: "ok",
        text: data.attachmentMissing
          ? `Sent to ${email.trim()}. PDF was not on disk — email went without the attachment.`
          : `Sent to ${email.trim()}.`,
      });
      setConflict(null);
      const dataLog = await loadSends({ q: searchQuery });
      setSends(dataLog.sends || []);
      const again = await loadSends({ lookupEmail: email.trim().toLowerCase() });
      setPriorCount(again.priorCount || 0);
      setAlreadySent(again.alreadySentTemplateIds || []);
    } catch (err) {
      setNotice({ tone: "error", text: err.message || "Send failed" });
    } finally {
      setSending(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="ops-card text-sm text-[var(--kama-ink-muted)]">
        Loading marketing…
      </div>
    );
  }

  const previewSubject = template
    ? interpolate(template.subject, name)
    : "";
  const previewBody = template
    ? interpolate(template.body?.[0] || "", name)
    : "";
  const thisTemplateSent = template
    ? alreadySent.includes(template.id)
    : false;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {PLAYBOOK.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-white/15 bg-white/90 p-4 shadow-sm backdrop-blur-sm"
          >
            <h2 className="text-sm font-semibold text-[var(--kama-ink)]">
              {item.title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--kama-ink-muted)]">
              {item.body}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form
          className="ops-card space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSend(false);
          }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
              Compose
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Send a launch letter
            </h2>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              Sends as a plain letter from Camara — not a branded campaign
              layout. Name and address are merged in. Do not paste purchased
              lists.
            </p>
          </div>

          {!emailConfigured ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Resend is not configured in this environment. You can still preview
              templates. Sends use Camara Djehuty
              &lt;camara-djehuty@isisel.com&gt;.
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Template
            </span>
            <select
              value={template?.id || ""}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {template ? (
              <span className="mt-1.5 block text-xs text-[var(--kama-ink-muted)]">
                Audience: {template.audience}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
                Name
              </span>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
                placeholder="Amina Diallo"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--kama-ink-muted)]">
                Email
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
                placeholder="amina@example.com"
              />
            </label>
          </div>

          {priorCount > 0 ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                thisTemplateSent
                  ? "border border-amber-200 bg-amber-50 text-amber-950"
                  : "border border-[var(--kama-border)] bg-[var(--kama-field)] text-[var(--kama-ink)]"
              }`}
            >
              {priorCount} earlier email{priorCount === 1 ? "" : "s"} to this
              address
              {thisTemplateSent
                ? " — this template was already sent. Sending again needs confirmation."
                : "."}
            </p>
          ) : null}

          {template?.pdf ? (
            <label className="flex items-start gap-3 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-3.5 py-3 text-sm">
              <input
                type="checkbox"
                checked={attachPdf}
                onChange={(e) => setAttachPdf(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach {template.pdf.label}
                </span>
                <span className="mt-1 block text-xs text-[var(--kama-ink-muted)]">
                  The letter stays plain. Uncheck this if Gmail still files the
                  PDF in Promotions.
                </span>
                <a
                  href={`/api/ops/marketing/assets/${template.pdf.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-[var(--kama-accent)] underline underline-offset-2"
                >
                  Preview PDF
                </a>
              </span>
            </label>
          ) : (
            <p className="text-xs text-[var(--kama-ink-muted)]">
              This follow-up does not attach a PDF.
            </p>
          )}

          {template ? (
            <div className="rounded-xl border border-[var(--kama-border)] bg-[#fbfaf6] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
                Preview
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--kama-ink)]">
                {previewSubject}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
                {previewBody}
              </p>
            </div>
          ) : null}

          {notice ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                notice.tone === "ok"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
              role="status"
            >
              {notice.text}
            </p>
          ) : null}

          {conflict ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              <p>
                Already sent {formatWhen(conflict.prior?.createdAt)}. Send this
                template again?
              </p>
              <button
                type="button"
                onClick={() => onSend(true)}
                disabled={sending || !emailConfigured}
                className="mt-2 rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Send anyway
              </button>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={sending || !emailConfigured || !template}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#1B5C57] px-5 text-[15px] font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send email"}
          </button>
        </form>

        <section className="ops-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
                Ledger
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Sent emails
              </h2>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kama-ink-muted)]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or email"
                className="h-11 w-full rounded-lg border border-[var(--kama-border-strong)] bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--kama-accent)] focus:shadow-[var(--kama-focus-ring)]"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--kama-border)] text-[11px] uppercase tracking-wide text-[var(--kama-ink-muted)]">
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Recipient</th>
                  <th className="py-2 pr-3 font-semibold">Template</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-[var(--kama-ink-muted)]">
                      Loading history…
                    </td>
                  </tr>
                ) : sends.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-[var(--kama-ink-muted)]">
                      No emails match that search yet.
                    </td>
                  </tr>
                ) : (
                  sends.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--kama-border)] last:border-0"
                    >
                      <td className="py-3 pr-3 align-top text-xs text-[var(--kama-ink-muted)]">
                        {formatWhen(row.createdAt)}
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <div className="font-medium">{row.recipientName}</div>
                        <div className="text-xs text-[var(--kama-ink-muted)]">
                          {row.recipientEmail}
                        </div>
                      </td>
                      <td className="py-3 pr-3 align-top text-xs">
                        {templates.find((t) => t.id === row.templateId)?.label ||
                          row.templateId}
                        {row.attachment ? (
                          <div className="mt-0.5 text-[11px] text-[var(--kama-ink-muted)]">
                            {row.attachment}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 align-top">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "sent"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
