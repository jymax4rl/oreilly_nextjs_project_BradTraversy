"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { horizonPage } from "@/app/horizon/content";
import { useScrollNav } from "@/contexts/ScrollNavContext";

const LeadCtx = createContext(null);

export function useHorizonLead() {
  const ctx = useContext(LeadCtx);
  if (!ctx) {
    throw new Error("useHorizonLead must be used within HorizonLeadProvider");
  }
  return ctx;
}

export function HorizonLeadProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("call");
  const [sticky, setSticky] = useState(false);
  const { bottomChromeVisible } = useScrollNav();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#call") {
      setMode("call");
      setOpen(true);
    }
    if (window.location.hash === "#contact") {
      setMode("contact");
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const hero = document.getElementById("horizon-hero");
    const close = document.getElementById("horizon-close");
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
    if (close) {
      closeIo = new IntersectionObserver(
        ([entry]) => {
          closeIn = entry.isIntersecting;
          sync();
        },
        { threshold: 0.2, rootMargin: "0px 0px -12% 0px" },
      );
      closeIo.observe(close);
    }
    return () => {
      heroIo.disconnect();
      closeIo?.disconnect();
    };
  }, []);

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

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash === "#call" || hash === "#contact") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  };

  return (
    <LeadCtx.Provider value={{ open, mode, openLead, close }}>
      {children}
      <HorizonLeadModal open={open} mode={mode} onClose={close} />
      {sticky && !open ? (
        <div
          className={`horizon-sticky${bottomChromeVisible ? " is-on" : ""}`}
        >
          <button
            type="button"
            className="horizon-btn horizon-btn--solid"
            onClick={() => openLead("call")}
          >
            {horizonPage.hero.primaryCta}
          </button>
          <button
            type="button"
            className="horizon-btn horizon-btn--ghost"
            onClick={() => openLead("contact")}
          >
            {horizonPage.hero.secondaryCta}
          </button>
        </div>
      ) : null}
    </LeadCtx.Provider>
  );
}

export function HorizonLeadButton({ mode = "call", className, children }) {
  const { openLead } = useHorizonLead();
  return (
    <button
      type="button"
      className={className}
      onClick={() => openLead(mode)}
    >
      {children}
    </button>
  );
}

function HorizonLeadModal({ open, mode, onClose }) {
  const dialogRef = useRef(null);
  const form = horizonPage.form;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError("");
    }
  }, [open, mode]);

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
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
    } catch {
      setStatus("error");
      setError(form.error);
    }
  }

  const isCall = mode === "call";

  return (
    <dialog
      ref={dialogRef}
      className="horizon-dialog"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="horizon-dialog__head">
        <div>
          <h2>{isCall ? form.titleCall : form.titleContact}</h2>
          <p>{isCall ? form.introCall : form.introContact}</p>
        </div>
        <button
          type="button"
          className="horizon-dialog__x"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {status === "success" ? (
        <div className="horizon-dialog__ok">
          <p>{form.success}</p>
          <button
            type="button"
            className="horizon-btn horizon-btn--sea"
            onClick={onClose}
          >
            {form.close}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            {form.name}
            <input name="name" autoComplete="name" required maxLength={120} />
          </label>
          <label>
            {form.email}
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
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required={isCall}
              maxLength={40}
            />
          </label>
          <label>
            Interest
            <select name="intent" defaultValue={isCall ? "call" : "message"}>
              <option value="call">{form.intentCall}</option>
              <option value="message">{form.intentMessage}</option>
            </select>
          </label>
          <label>
            {form.message}
            <textarea
              name="message"
              placeholder={form.messagePlaceholder}
              maxLength={4000}
              required={!isCall}
            />
          </label>
          <label className="horizon-dialog__hp" aria-hidden="true">
            Fax
            <input name="fax" tabIndex={-1} autoComplete="off" />
          </label>
          {error ? (
            <p className="horizon-dialog__err" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="horizon-btn horizon-btn--sea"
            disabled={status === "sending"}
          >
            {status === "sending" ? form.sending : form.submit}
          </button>
        </form>
      )}
    </dialog>
  );
}
