"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isOpsStaff } from "@/utils/opsAuth";
import { composeMarketingLetter } from "@/utils/marketing/templates";
import { Mail, Search, SlidersHorizontal } from "lucide-react";

const SEARCH_DEBOUNCE_MS = 280;
const GMAIL_COMPOSE = "https://mail.google.com/mail/?view=cm&fs=1&tf=1";
const GMAIL_URL_MAX = 7000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildGmailComposeUrl(to, subject, body) {
  const toPart = to ? `&to=${encodeURIComponent(to)}` : "";
  const su = encodeURIComponent(subject);
  const gmailBody = String(body || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\r\n");
  const withBody = `${GMAIL_COMPOSE}${toPart}&su=${su}&body=${encodeURIComponent(gmailBody)}`;
  if (withBody.length <= GMAIL_URL_MAX) {
    return { href: withBody, bodyInUrl: true };
  }
  return {
    href: `${GMAIL_COMPOSE}${toPart}&su=${su}`,
    bodyInUrl: false,
  };
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

function templateLabel(template, locale) {
  if (!template) return "Letter";
  return locale === "fr" ? template.labelFr || template.label : template.label;
}

export default function OpsMarketingPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [locale, setLocale] = useState("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [originalSubject, setOriginalSubject] = useState("");
  const [subjectOption, setSubjectOption] = useState(0);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [letterDirty, setLetterDirty] = useState(false);
  const [logging, setLogging] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [sends, setSends] = useState([]);
  const [priorCount, setPriorCount] = useState(0);
  const [alreadySent, setAlreadySent] = useState([]);
  const [priorAtByTemplate, setPriorAtByTemplate] = useState({});
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
        setTemplateId((current) => current || data.templates?.[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setNotice({
            tone: "err",
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
      setPriorAtByTemplate({});
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const data = await loadSends({ lookupEmail: trimmed });
        setPriorCount(data.priorCount || 0);
        setAlreadySent(data.alreadySentTemplateIds || []);
        const at = {};
        for (const row of data.sends || []) {
          if (row.isTest || row.status !== "sent" || at[row.templateId]) continue;
          at[row.templateId] = row.createdAt;
        }
        setPriorAtByTemplate(at);
      } catch {
        setPriorCount(0);
        setAlreadySent([]);
        setPriorAtByTemplate({});
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [email, loadSends]);

  useEffect(() => {
    setLetterDirty(false);
    setSubjectOption(0);
  }, [templateId, locale]);

  const composeVars = useMemo(
    () => ({
      firstName: name,
      propertyName,
      businessName: propertyName,
      city,
      country,
      originalSubject,
      socialUrl,
    }),
    [name, propertyName, city, country, originalSubject, socialUrl],
  );

  const composed = useMemo(
    () =>
      composeMarketingLetter(template, {
        ...composeVars,
        locale,
        subjectOption,
      }),
    [template, composeVars, locale, subjectOption],
  );

  useEffect(() => {
    if (!template || letterDirty) return;
    setDraftSubject(composed.subject);
    setDraftBody(composed.body);
  }, [template, composed.subject, composed.body, letterDirty]);

  const thisTemplateSent = template
    ? alreadySent.includes(template.id)
    : false;

  useEffect(() => {
    if (!modifyOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") setModifyOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modifyOpen]);

  async function logGmailCompose({ force = false } = {}) {
    const res = await fetch("/api/ops/marketing/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        via: "gmail",
        name: name.trim(),
        email: email.trim(),
        templateId: template?.id,
        force,
        locale,
        subject: draftSubject,
        body: draftBody,
        propertyName: propertyName.trim(),
        businessName: propertyName.trim(),
        city: city.trim(),
        country: country.trim(),
        originalSubject: originalSubject.trim(),
        socialUrl: socialUrl.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && data.code === "already_sent") {
      return { conflict: data };
    }
    if (!res.ok) {
      throw new Error(data.error || `Could not log this send (${res.status})`);
    }
    return { ok: true, send: data.send };
  }

  async function openInGmail(force = false) {
    setNotice(null);
    if (name.trim().length < 2) {
      setNotice({ tone: "err", text: "Enter the recipient's name." });
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setNotice({ tone: "err", text: "Enter a valid email address." });
      return;
    }
    if (
      !template ||
      draftSubject.trim().length < 3 ||
      draftBody.trim().length < 20
    ) {
      setModifyOpen(true);
      setNotice({
        tone: "err",
        text: "Modify the letter before opening Gmail.",
      });
      return;
    }
    if (thisTemplateSent && !force) {
      setConflict({
        prior: { createdAt: priorAtByTemplate[template.id] || null },
      });
      return;
    }

    const { href, bodyInUrl } = buildGmailComposeUrl(
      email.trim(),
      draftSubject.trim(),
      draftBody.trim(),
    );
    const popup = window.open(href, "_blank");
    if (popup) popup.opener = null;
    if (!bodyInUrl) {
      navigator.clipboard.writeText(draftBody.trim()).catch(() => {});
    }
    if (!popup) {
      setNotice({
        tone: "err",
        text: "Allow pop-ups for this site so Gmail can open.",
      });
      return;
    }

    setModifyOpen(false);
    setConflict(null);
    setLogging(true);
    try {
      const result = await logGmailCompose({
        force: force || thisTemplateSent,
      });
      const loggedTo = result.send?.recipientEmail || email.trim();
      setNotice({
        tone: "ok",
        text: bodyInUrl
          ? `Opened Gmail for ${loggedTo}.`
          : `Opened Gmail for ${loggedTo}. The letter was copied — paste it if the body is empty.`,
      });
      const dataLog = await loadSends({ q: searchQuery });
      setSends(dataLog.sends || []);
      const again = await loadSends({ lookupEmail: email.trim().toLowerCase() });
      setPriorCount(again.priorCount || 0);
      setAlreadySent(again.alreadySentTemplateIds || []);
      const at = {};
      for (const row of again.sends || []) {
        if (row.isTest || row.status !== "sent" || at[row.templateId]) continue;
        at[row.templateId] = row.createdAt;
      }
      setPriorAtByTemplate(at);
    } catch (err) {
      setNotice({
        tone: "err",
        text: err.message || "Gmail opened, but the send was not logged.",
      });
    } finally {
      setLogging(false);
    }
  }

  if (status === "loading") {
    return <div className="mkt-compose mkt-empty">Loading marketing…</div>;
  }

  const summaryBits = [
    templateLabel(template, locale),
    locale.toUpperCase(),
    letterDirty ? "edited" : null,
  ].filter(Boolean);

  return (
    <div className="mkt">
      <form
        className="mkt-compose"
        data-mkt-surface="compose"
        data-mkt-variant="control"
        onSubmit={(e) => {
          e.preventDefault();
          openInGmail(false);
        }}
      >
        <div className="mkt-compose__head">
          <p className="mkt-kicker">Gmail</p>
          <p className="mkt-from">Opens in your Gmail</p>
        </div>

        <div className="mkt-duo">
          <label className="mkt-label">
            <span>Name</span>
            <input
              required
              minLength={2}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mkt-input"
              placeholder="Amina"
            />
          </label>
          <label className="mkt-label">
            <span>Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mkt-input"
              placeholder="amina@example.com"
            />
          </label>
        </div>
        <label className="mkt-label mkt-social">
          <span>
            Social URL
            <em className="mkt-opt">optional</em>
          </span>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="mkt-input"
            placeholder="instagram.com/…"
          />
        </label>

        <p className="mkt-summary">
          <strong>{summaryBits[0]}</strong>
          {summaryBits.slice(1).map((bit) => (
            <span key={bit}> · {bit}</span>
          ))}
        </p>

        {priorCount > 0 ? (
          <p
            className={`mkt-note ${
              thisTemplateSent ? "mkt-note--warn" : "mkt-note--mute"
            }`}
          >
            {priorCount} earlier email{priorCount === 1 ? "" : "s"} to this
            address
            {thisTemplateSent
              ? " — this letter was already opened in Gmail."
              : "."}
          </p>
        ) : null}

        {notice ? (
          <p
            className={`mkt-note ${
              notice.tone === "ok" ? "mkt-note--ok" : "mkt-note--err"
            }`}
            role="status"
          >
            {notice.text}
          </p>
        ) : null}

        {conflict ? (
          <div className="mkt-note mkt-note--warn">
            <p>
              Already opened {formatWhen(conflict.prior?.createdAt)}. Open this
              letter in Gmail again?
            </p>
            <button
              type="button"
              onClick={() => openInGmail(true)}
              disabled={logging || !template}
              className="mkt-tool mkt-tool--primary"
              style={{ marginTop: "0.5rem", width: "auto", padding: "0 0.85rem" }}
            >
              Open anyway
            </button>
          </div>
        ) : null}

        <div className="mkt-actions">
          <button
            type="submit"
            disabled={logging || !template}
            className="mkt-send"
          >
            <Mail className="h-4 w-4" />
            {logging ? "Opening…" : "Open in Gmail"}
          </button>
          <div className="mkt-tools">
            <button
              type="button"
              className="mkt-tool"
              onClick={() => setModifyOpen(true)}
              aria-expanded={modifyOpen}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Modify
            </button>
          </div>
        </div>
      </form>

      {modifyOpen ? (
        <div
          className="mkt-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mkt-modify-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModifyOpen(false);
          }}
        >
          <div className="mkt-sheet">
            <div className="mkt-sheet__bar">
              <h2 id="mkt-modify-title">Modify letter</h2>
              <button
                type="button"
                className="mkt-sheet__done"
                onClick={() => setModifyOpen(false)}
              >
                Done
              </button>
            </div>
            <div className="mkt-sheet__body">
              <div className="mkt-grid mkt-grid--2">
                <label className="mkt-label" style={{ gridColumn: "1 / -1" }}>
                  <span>Letter</span>
                  <select
                    value={template?.id || ""}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="mkt-input"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {locale === "fr" ? t.labelFr || t.label : t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="mkt-label">
                  <span>Language</span>
                  <div className="mkt-lang">
                    <button
                      type="button"
                      aria-pressed={locale === "en"}
                      onClick={() => setLocale("en")}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      aria-pressed={locale === "fr"}
                      onClick={() => setLocale("fr")}
                    >
                      FR
                    </button>
                  </div>
                </fieldset>
              </div>

              {template ? (
                <p className="mkt-summary" style={{ marginTop: 0 }}>
                  {locale === "fr"
                    ? template.audienceFr || template.audience
                    : template.audience}
                </p>
              ) : null}

              <div className="mkt-grid mkt-grid--2">
                <label className="mkt-label" style={{ gridColumn: "1 / -1" }}>
                  <span>Property / business / hotel</span>
                  <input
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="mkt-input"
                    placeholder="Only if you know it"
                  />
                </label>
                <label className="mkt-label">
                  <span>City</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mkt-input"
                    placeholder="Dakar"
                  />
                </label>
                <label className="mkt-label">
                  <span>Country</span>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mkt-input"
                    placeholder="Senegal"
                  />
                </label>
                {template?.followUp ? (
                  <label className="mkt-label" style={{ gridColumn: "1 / -1" }}>
                    <span>Original subject</span>
                    <input
                      value={originalSubject}
                      onChange={(e) => setOriginalSubject(e.target.value)}
                      className="mkt-input"
                      placeholder="Subject of the first note"
                    />
                  </label>
                ) : null}
              </div>

              {template?.pdf ? (
                <p className="mkt-summary" style={{ marginTop: 0 }}>
                  <a
                    href={`/api/ops/marketing/assets/${template.pdf.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#171717] underline underline-offset-2"
                  >
                    Preview {template.pdf.label}
                  </a>
                  {" · attach in Gmail only if you need it"}
                </p>
              ) : null}

              {template ? (
                <>
                  {composed.subjectOptions?.length > 1 ? (
                    <label className="mkt-label">
                      <span>Subject line</span>
                      <select
                        className="mkt-input"
                        value={Math.min(
                          subjectOption,
                          Math.max(0, composed.subjectOptions.length - 1),
                        )}
                        onChange={(e) => {
                          setSubjectOption(Number(e.target.value));
                          setLetterDirty(false);
                        }}
                      >
                        {composed.subjectOptions.map((option, index) => (
                          <option key={`${option}-${index}`} value={index}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="mkt-label">
                    <span>Subject</span>
                    <input
                      minLength={3}
                      value={draftSubject}
                      onChange={(e) => {
                        setLetterDirty(true);
                        setDraftSubject(e.target.value);
                      }}
                      className="mkt-input"
                    />
                  </label>
                  <label className="mkt-label">
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      Letter
                      {letterDirty ? (
                        <button
                          type="button"
                          className="mkt-reset"
                          onClick={() => {
                            setDraftSubject(composed.subject);
                            setDraftBody(composed.body);
                            setLetterDirty(false);
                          }}
                        >
                          Reset
                        </button>
                      ) : null}
                    </span>
                    <textarea
                      minLength={20}
                      rows={10}
                      value={draftBody}
                      onChange={(e) => {
                        setLetterDirty(true);
                        setDraftBody(e.target.value);
                      }}
                      className="mkt-letter"
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className="mkt-sheet__foot">
              <button
                type="button"
                className="mkt-send"
                disabled={logging || !template}
                onClick={() => openInGmail(false)}
              >
                <Mail className="h-4 w-4" />
                {logging ? "Opening…" : "Open in Gmail"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mkt-ledger">
        <div className="mkt-ledger__head">
          <div>
            <p className="mkt-kicker">Sent</p>
            <h2>Emails</h2>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email"
              className="mkt-input"
              style={{ paddingLeft: "2.25rem" }}
            />
          </label>
        </div>

        {logLoading ? (
          <p className="mkt-empty">Loading history…</p>
        ) : sends.length === 0 ? (
          <p className="mkt-empty">No emails match that search yet.</p>
        ) : (
          <>
            <div className="mkt-cards">
              {sends.map((row) => (
                <article key={row.id} className="mkt-card">
                  <div className="mkt-card__top">
                    <div>
                      <div className="mkt-card__name">{row.recipientName}</div>
                      <div className="mkt-card__email">{row.recipientEmail}</div>
                    </div>
                    <span
                      className={`mkt-pill ${
                        row.status === "sent" ? "mkt-pill--ok" : "mkt-pill--err"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <div className="mkt-card__meta">
                    {templates.find((t) => t.id === row.templateId)?.label ||
                      row.templateId}
                    {" · "}
                    {(row.locale || "en").toUpperCase()}
                    {row.channel === "gmail" ? " · Gmail" : ""}
                    {row.isTest ? " · test" : ""}
                    {row.attachment ? ` · ${row.attachment}` : ""}
                    {row.socialUrl
                      ? ` · ${String(row.socialUrl).replace(/^https?:\/\//i, "")}`
                      : ""}
                  </div>
                  <div className="mkt-card__when">{formatWhen(row.createdAt)}</div>
                </article>
              ))}
            </div>
            <div className="mkt-table-wrap">
              <table className="mkt-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Recipient</th>
                    <th>Letter</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sends.map((row) => (
                    <tr key={`t-${row.id}`}>
                      <td className="text-xs text-[#8a8a8a]">
                        {formatWhen(row.createdAt)}
                      </td>
                      <td>
                        <div className="font-medium">{row.recipientName}</div>
                        <div className="text-xs text-[#8a8a8a]">
                          {row.recipientEmail}
                        </div>
                      </td>
                      <td className="text-xs">
                        {templates.find((t) => t.id === row.templateId)?.label ||
                          row.templateId}
                        <div className="mt-0.5 text-[11px] text-[#8a8a8a]">
                          {(row.locale || "en").toUpperCase()}
                          {row.channel === "gmail" ? " · Gmail" : ""}
                          {row.isTest ? " · test" : ""}
                          {row.attachment ? ` · ${row.attachment}` : ""}
                          {row.socialUrl
                            ? ` · ${String(row.socialUrl).replace(/^https?:\/\//i, "")}`
                            : ""}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`mkt-pill ${
                            row.status === "sent"
                              ? "mkt-pill--ok"
                              : "mkt-pill--err"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
