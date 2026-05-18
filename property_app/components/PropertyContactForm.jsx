"use client";

import { useState } from "react";
import Link from "next/link";
import { sendMessage } from "@/utils/actions/messageActions";

export default function PropertyContactForm({
  propertyId,
  recipientId,
  propertyName,
  ownerName,
  defaultName = "",
  defaultEmail = "",
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    formData.set("propertyId", propertyId);
    formData.set("recipientId", recipientId);

    const result = await sendMessage(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-emerald-900">Message sent</p>
        <p className="mt-2 text-sm text-emerald-700">
          {ownerName
            ? `${ownerName} will get back to you soon.`
            : "The host will get back to you soon."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/messages"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View your messages
          </Link>
          <Link
            href={`/properties/${propertyId}`}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Back to listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            required
            defaultValue={defaultName}
            placeholder="Full name"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Phone{" "}
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            name="phone"
            placeholder="+237 6XX XXX XXX"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label
            htmlFor="contact-body"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-body"
            name="body"
            required
            rows={5}
            autoFocus
            placeholder={
              propertyName
                ? `Hi, I'm interested in ${propertyName}...`
                : "Hi, I'm interested in this property..."
            }
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
