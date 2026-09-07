"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { investorPage } from "@/app/investors/content";
import { useScrollNav } from "@/contexts/ScrollNavContext";

const DiscussCtx = createContext(null);

export function useInvestorDiscuss() {
  const ctx = useContext(DiscussCtx);
  if (!ctx) {
    throw new Error("useInvestorDiscuss must be used within InvestorDiscussProvider");
  }
  return ctx;
}

export function InvestorDiscussProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const { bottomChromeVisible } = useScrollNav();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#proposal") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const hero = document.getElementById("investor-hero");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setSticky(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => setSticky(!entry.isIntersecting),
      { threshold: 0.12 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const openDiscuss = () => {
    setOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#proposal");
    }
  };

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#proposal") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <DiscussCtx.Provider value={{ open, openDiscuss, close }}>
      {children}
      <InvestorProposalModal open={open} onClose={close} />
      {sticky && !open ? (
        <div className={`creator-sticky${bottomChromeVisible ? " is-on" : ""}`}>
          <button
            type="button"
            className="creator-btn creator-btn--light"
            onClick={openDiscuss}
          >
            {investorPage.primaryCta}
          </button>
        </div>
      ) : null}
    </DiscussCtx.Provider>
  );
}

function InvestorProposalModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const form = investorPage.form;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [thanksName, setThanksName] = useState("");

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
  }, [open]);

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      organization: String(data.get("organization") || ""),
      role: String(data.get("role") || ""),
      firmUrl: String(data.get("firmUrl") || ""),
      proposal: String(data.get("proposal") || ""),
      fax: String(data.get("fax") || ""),
    };

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/investors/leads", {
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
      setThanksName(payload.name.trim().split(/\s+/)[0] || payload.name);
      setStatus("success");
    } catch {
      setStatus("error");
      setError(form.error);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="creator-dialog"
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="investor-proposal-title"
    >
      <form className="creator-form" onSubmit={onSubmit}>
        {status === "success" ? (
          <div className="creator-success">
            <h2 id="investor-proposal-title">{form.successTitle(thanksName)}</h2>
            <p className="creator-form__lede">{form.successBody}</p>
            <button
              type="button"
              className="creator-btn creator-btn--light"
              onClick={onClose}
            >
              {form.close}
            </button>
          </div>
        ) : (
          <>
            <h2 id="investor-proposal-title">{form.title}</h2>
            <p className="creator-form__lede">{form.lede}</p>

            <div className="creator-field">
              <label htmlFor="investor-name">{form.name} *</label>
              <input
                id="investor-name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="investor-email">{form.email} *</label>
              <input
                id="investor-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="investor-org">{form.organization}</label>
              <input
                id="investor-org"
                name="organization"
                autoComplete="organization"
                maxLength={160}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="investor-role">{form.role}</label>
              <input
                id="investor-role"
                name="role"
                autoComplete="organization-title"
                maxLength={120}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="investor-url">{form.firmUrl}</label>
              <input
                id="investor-url"
                name="firmUrl"
                type="text"
                inputMode="url"
                placeholder="linkedin.com/in/… or firm website"
                maxLength={500}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="investor-proposal">{form.proposal} *</label>
              <textarea
                id="investor-proposal"
                name="proposal"
                required
                minLength={20}
                maxLength={6000}
                placeholder={form.proposalHint}
              />
            </div>

            <div className="creator-hp" aria-hidden="true">
              <label htmlFor="investor-fax">Fax</label>
              <input id="investor-fax" name="fax" tabIndex={-1} autoComplete="off" />
            </div>

            {error ? <p className="creator-form__err">{error}</p> : null}

            <div className="creator-form__actions">
              <button
                type="submit"
                className="creator-btn creator-btn--light"
                disabled={status === "sending"}
              >
                {status === "sending" ? form.sending : form.submit}
              </button>
              <button
                type="button"
                className="creator-btn creator-btn--ghost"
                onClick={onClose}
              >
                {form.close}
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}

export function InvestorDiscussButton({
  children,
  className = "creator-btn creator-btn--light",
}) {
  const { openDiscuss } = useInvestorDiscuss();
  return (
    <button type="button" className={className} onClick={openDiscuss}>
      {children}
    </button>
  );
}
