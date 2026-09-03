"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_EMAIL } from "@/utils/brand";
import { CONTACT_TOPIC_IDS } from "@/utils/contact/constants";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import "./contact.css";

export default function ContactPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [thanksName, setThanksName] = useState("");
  const topics = useMemo(
    () =>
      CONTACT_TOPIC_IDS.map((id) => ({
        id,
        label: t(`contact.topics.${id}`),
      })),
    [t],
  );

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      topic: String(data.get("topic") || ""),
      message: String(data.get("message") || ""),
      company: String(data.get("company") || ""),
    };

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(
          json.error === "rate_limited"
            ? t("contact.rateLimited")
            : json.error === "validation"
              ? t("contact.required")
              : t("contact.error"),
        );
        return;
      }
      setThanksName(payload.name.trim().split(/\s+/)[0] || payload.name);
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t("contact.error"));
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-wrap contact-grid">
        <figure className="contact-visual">
          <Image
            src="/contact/welcome-terrace.png"
            alt={t("contact.imageAlt")}
            fill
            priority
            quality={90}
            sizes="(max-width: 899px) 100vw, 46vw"
          />
          <div className="contact-visual__scrim" aria-hidden="true" />
          <figcaption className="contact-visual__copy">
            <p className="contact-kicker">{t("contact.kicker")}</p>
            <h1>{t("contact.title")}</h1>
            <p className="contact-lede">{t("contact.lede")}</p>
            <a className="contact-inbox" href={`mailto:${BRAND_EMAIL}`}>
              <span>{t("contact.inboxLabel")}</span>
              <strong>{BRAND_EMAIL}</strong>
            </a>
          </figcaption>
        </figure>

        <div className="contact-card">
          {status === "success" ? (
            <div className="contact-success">
              <h2>{t("contact.successTitle", { name: thanksName })}</h2>
              <p>{t("contact.successBody")}</p>
              <Link href="/properties" className="contact-submit">
                {t("contact.browse")}
              </Link>
            </div>
          ) : (
            <form className="contact-form" onSubmit={onSubmit} noValidate>
              <h2>{t("contact.formTitle")}</h2>
              <p className="contact-form__lede">{t("contact.formLede")}</p>

              <div className="contact-field">
                <label htmlFor="contact-name">{t("contact.name")} *</label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">{t("contact.email")} *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  maxLength={254}
                />
              </div>
              <div className="contact-field">
                <span>{t("contact.topic")} *</span>
                <div className="contact-topics" role="radiogroup" aria-label={t("contact.topic")}>
                  {topics.map((topic) => (
                    <label key={topic.id}>
                      <input type="radio" name="topic" value={topic.id} required />
                      {topic.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="contact-field">
                <label htmlFor="contact-message">{t("contact.message")} *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={12}
                  maxLength={4000}
                  placeholder={t("contact.messageHint")}
                />
              </div>

              <div className="contact-hp" aria-hidden="true">
                <label htmlFor="contact-company">Company</label>
                <input
                  id="contact-company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {error ? <p className="contact-form__err">{error}</p> : null}

              <button
                type="submit"
                className="contact-submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? t("contact.sending") : t("contact.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
