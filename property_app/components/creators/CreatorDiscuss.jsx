"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { creatorPage } from "@/app/influencers/content";

const DiscussCtx = createContext(null);

export function useCreatorDiscuss() {
  const ctx = useContext(DiscussCtx);
  if (!ctx) {
    throw new Error("useCreatorDiscuss must be used within CreatorDiscussProvider");
  }
  return ctx;
}

function track(event, extra = {}) {
  try {
    fetch("/api/creators/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...extra }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

export function CreatorDiscussProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    track("page_visit");
    if (typeof window !== "undefined" && window.location.hash === "#discuss") {
      setOpen(true);
      track("form_opened");
    }
  }, []);

  useEffect(() => {
    const hero = document.getElementById("creator-hero");
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

  const openDiscuss = (source = "cta") => {
    setOpen(true);
    track("cta_click", { source });
    track("form_opened");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#discuss");
    }
  };

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#discuss") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <DiscussCtx.Provider value={{ open, openDiscuss, close, track }}>
      {children}
      <CreatorDiscussModal open={open} onClose={close} track={track} />
      {sticky && !open ? (
        <div className="creator-sticky">
          <button
            type="button"
            className="creator-btn creator-btn--light"
            onClick={() => openDiscuss("sticky")}
          >
            {creatorPage.primaryCta}
          </button>
        </div>
      ) : null}
    </DiscussCtx.Provider>
  );
}

function CreatorDiscussModal({ open, onClose, track }) {
  const dialogRef = useRef(null);
  const form = creatorPage.form;
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [thanksName, setThanksName] = useState("");
  const started = useRef(false);

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

  const onFirstEdit = () => {
    if (started.current) return;
    started.current = true;
    track("form_started");
  };

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      platform: String(data.get("platform") || ""),
      profileUrl: String(data.get("profileUrl") || ""),
      message: String(data.get("message") || ""),
      website: String(data.get("website") || ""),
    };

    setStatus("sending");
    setError("");
    track("form_completed");
    try {
      const res = await fetch("/api/creators/leads", {
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
      track("lead_submitted", { platform: payload.platform });
      started.current = false;
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
      aria-labelledby="creator-discuss-title"
    >
      <form className="creator-form" onSubmit={onSubmit}>
        {status === "success" ? (
          <div className="creator-success">
            <h2 id="creator-discuss-title">{form.successTitle(thanksName)}</h2>
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
            <h2 id="creator-discuss-title">{form.title}</h2>
            <p className="creator-form__lede">{form.lede}</p>

            <div className="creator-field">
              <label htmlFor="creator-name">{form.name} *</label>
              <input
                id="creator-name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                onChange={onFirstEdit}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="creator-email">{form.email} *</label>
              <input
                id="creator-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                onChange={onFirstEdit}
              />
            </div>

            <fieldset className="creator-field" style={{ border: 0, padding: 0, margin: "0 0 0.8rem" }}>
              <legend
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 650,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#3d4f4e",
                  marginBottom: "0.4rem",
                }}
              >
                {form.platform}
              </legend>
              <div className="creator-platforms">
                {form.platforms.map((item) => (
                  <label key={item.id}>
                    <input
                      type="radio"
                      name="platform"
                      value={item.id}
                      onChange={() => {
                        onFirstEdit();
                        track("platform_selected", { platform: item.id });
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="creator-field">
              <label htmlFor="creator-profile">{form.profile}</label>
              <input
                id="creator-profile"
                name="profileUrl"
                type="text"
                inputMode="url"
                placeholder="instagram.com/… or youtube.com/…"
                maxLength={500}
                onChange={onFirstEdit}
              />
            </div>
            <div className="creator-field">
              <label htmlFor="creator-message">{form.message}</label>
              <textarea
                id="creator-message"
                name="message"
                maxLength={2000}
                placeholder={form.messageHint}
                onChange={onFirstEdit}
              />
            </div>

            <div className="creator-hp" aria-hidden="true">
              <label htmlFor="creator-website">Website</label>
              <input id="creator-website" name="website" tabIndex={-1} autoComplete="off" />
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

export function DiscussButton({
  children,
  className = "creator-btn creator-btn--light",
  source = "cta",
}) {
  const { openDiscuss } = useCreatorDiscuss();
  return (
    <button type="button" className={className} onClick={() => openDiscuss(source)}>
      {children}
    </button>
  );
}
