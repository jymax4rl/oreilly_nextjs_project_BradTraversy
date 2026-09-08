"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { horizonPage } from "@/app/horizon/content";

const LeadCtx = createContext(null);

export function useHorizonLead() {
  const ctx = useContext(LeadCtx);
  if (!ctx) {
    throw new Error("useHorizonLead must be used within HorizonLeadProvider");
  }
  return ctx;
}

function hashMode() {
  if (typeof window === "undefined") return null;
  if (window.location.hash === "#contact") return "contact";
  if (window.location.hash === "#call") return "call";
  return null;
}

function clearLeadHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (hash !== "#call" && hash !== "#contact") return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function HorizonLeadProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("call");
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const syncHash = () => {
      const next = hashMode();
      if (next) {
        setMode(next);
        setOpen(true);
        return;
      }
      setOpen(false);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  useEffect(() => {
    const hero = document.getElementById("horizon-hero");
    const closeSec = document.getElementById("horizon-close");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setSticky(true);
      return undefined;
    }
    let heroOut = false;
    let closeIn = false;
    const sync = () => setSticky(heroOut && !closeIn);
    const heroIo = new IntersectionObserver(
      ([entry]) => {
        heroOut = !entry.isIntersecting;
        sync();
      },
      { threshold: 0.12 },
    );
    heroIo.observe(hero);
    let closeIo;
    if (closeSec) {
      closeIo = new IntersectionObserver(
        ([entry]) => {
          closeIn = entry.isIntersecting;
          sync();
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      closeIo.observe(closeSec);
    }
    return () => {
      heroIo.disconnect();
      closeIo?.disconnect();
    };
  }, []);

  const close = () => {
    setOpen(false);
    clearLeadHash();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openLead = (nextMode = "call") => {
    setMode(nextMode);
    setOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        nextMode === "contact" ? "#contact" : "#call",
      );
    }
  };

  return (
    <LeadCtx.Provider value={{ open, mode, openLead, close }}>
      {children}
      <HorizonLeadModal open={open} mode={mode} onClose={close} />
      {sticky && !open ? (
        <div className="hz-dock is-on">
          <a className="hz-dock__btn hz-dock__btn--solid" href="#call">
            {horizonPage.hero.primaryCta}
          </a>
          <a className="hz-dock__btn" href="#contact">
            {horizonPage.hero.secondaryCta}
          </a>
        </div>
      ) : null}
    </LeadCtx.Provider>
  );
}

export function HorizonLeadButton({ mode = "call", className, children, ...rest }) {
  const { openLead } = useHorizonLead();
  return (
    <a
      href={mode === "contact" ? "#contact" : "#call"}
      className={className}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        openLead(mode);
      }}
    >
      {children}
    </a>
  );
}

export function HorizonLeadForm({
  mode = "call",
  onSuccess,
  showHeading = true,
  titleId = "hz-tour-title",
}) {
  const form = horizonPage.form;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const isCall = mode === "call";

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") || "");
    const lastName = String(data.get("lastName") || "");
    const payload = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      subject: String(data.get("subject") || ""),
      zip: String(data.get("zip") || ""),
      intent: String(data.get("intent") || mode),
      message: String(data.get("message") || ""),
      fax: String(data.get("fax") || ""),
    };

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/horizon/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(
          json.error === "rate_limited"
            ? "Please wait a moment before sending again."
            : json.error === "validation"
              ? form.required
              : form.error,
        );
        return;
      }
      setStatus("success");
      onSuccess?.();
    } catch {
      setStatus("error");
      setError(form.error);
    }
  }

  return (
    <div className="hz-tour__form">
      {showHeading ? (
        <>
          <h2 id={titleId}>{isCall ? form.titleCall : form.titleContact}</h2>
          <p className="hz-tour__lede">
            {isCall ? form.introCall : form.introContact}
          </p>
        </>
      ) : null}

      {status === "success" ? (
        <div className="hz-tour__ok">
          <p>{form.success}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="hz-tour__row">
            <label>
              {form.firstName} *
              <input
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={60}
              />
            </label>
            <label>
              {form.lastName} *
              <input
                name="lastName"
                autoComplete="family-name"
                required
                maxLength={60}
              />
            </label>
          </div>
          <div className="hz-tour__row">
            <label>
              {form.email} *
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={180}
              />
            </label>
            <label>
              {form.phone}
              {isCall ? " *" : ""}
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required={isCall}
                maxLength={40}
              />
            </label>
          </div>
          <div className="hz-tour__row">
            <label>
              {form.subject}
              <select name="intent" defaultValue={isCall ? "call" : "message"}>
                <option value="call">{form.intentCall}</option>
                <option value="message">{form.intentMessage}</option>
              </select>
            </label>
            <label>
              {form.zip}
              <input name="zip" autoComplete="postal-code" maxLength={20} />
            </label>
          </div>
          <label className="hz-tour__full">
            {form.message}
            <textarea
              name="message"
              placeholder={form.messagePlaceholder}
              maxLength={4000}
              required={!isCall}
            />
          </label>
          <label className="hz-hp" aria-hidden="true">
            Fax
            <input name="fax" tabIndex={-1} autoComplete="off" />
          </label>
          {error ? (
            <p className="hz-tour__err" role="alert">
              {error}
            </p>
          ) : null}
          <div className="hz-tour__foot">
            <p>{form.legal}</p>
            <button
              type="submit"
              className="hz-tour__submit"
              disabled={status === "sending"}
            >
              {status === "sending" ? form.sending : form.submit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function HorizonLeadModal({ open, mode, onClose }) {
  const form = horizonPage.form;

  if (!open) return null;

  return (
    <div
      className="hz-tour is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hz-tour-title"
      onClick={onClose}
    >
      <div
        className="hz-tour__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="hz-tour__x"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="hz-tour__grid">
          <HorizonLeadForm mode={mode} />
          <figure className="hz-tour__visual">
            <img src="/horizon/street-twilight.jpg" alt={form.imageAlt} />
          </figure>
        </div>
      </div>
    </div>
  );
}
