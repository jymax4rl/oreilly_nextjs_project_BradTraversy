"use client";

import { Phone, MessageCircle, Mail, Globe, Copy, Calendar, StickyNote, Headset } from "lucide-react";
import { telHref, whatsappHref } from "@/utils/acquisition/constants";
import Link from "next/link";

export default function AcquisitionQuickActions({
  prospect,
  onFollowUp,
  onNote,
  compact = false,
}) {
  const phone = prospect?.phone || prospect?.whatsapp;
  const callHref = telHref(phone);
  const waHref = whatsappHref(prospect?.whatsapp || prospect?.phone);
  const mailHref = prospect?.email ? `mailto:${prospect.email}` : null;
  const webHref = prospect?.website
    ? prospect.website.startsWith("http")
      ? prospect.website
      : `https://${prospect.website}`
    : null;

  const copyPhone = async () => {
    const value = phone || "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="acq-actions" onClick={(e) => e.stopPropagation()}>
      {callHref ? (
        <a href={callHref} aria-label="Call">
          <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Call"}
        </a>
      ) : null}
      {waHref ? (
        <a href={waHref} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "WhatsApp"}
        </a>
      ) : null}
      {mailHref ? (
        <a href={mailHref} aria-label="Email">
          <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Email"}
        </a>
      ) : null}
      {webHref ? (
        <a href={webHref} target="_blank" rel="noreferrer" aria-label="Website">
          <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Site"}
        </a>
      ) : null}
      {phone ? (
        <button type="button" onClick={copyPhone} aria-label="Copy phone">
          <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Copy"}
        </button>
      ) : null}
      {prospect?.id ? (
        <Link
          href={`/ops/marketing/acquisition/copilot?id=${prospect.id}`}
          aria-label="Open sales copilot"
        >
          <Headset className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Copilot"}
        </Link>
      ) : null}
      {onFollowUp ? (
        <button type="button" onClick={onFollowUp} aria-label="Schedule follow-up">
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Follow-up"}
        </button>
      ) : null}
      {onNote ? (
        <button type="button" onClick={onNote} aria-label="Add note">
          <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
          {compact ? null : "Note"}
        </button>
      ) : null}
    </div>
  );
}
