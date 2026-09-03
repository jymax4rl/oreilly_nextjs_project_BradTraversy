"use client";

import { useState } from "react";
import {
  ACQUISITION_STAGES,
  ACQUISITION_SOURCES,
  ACQUISITION_PRIORITIES,
  CONTACT_METHODS,
  CONTACT_STATUSES,
  PROPERTY_TYPES,
  EXISTING_PLATFORMS,
} from "@/utils/acquisition/constants";

const empty = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  whatsapp: "",
  website: "",
  country: "",
  city: "",
  address: "",
  propertyCount: 1,
  propertyTypes: [],
  estimatedListings: "",
  existingPlatforms: [],
  estimatedBookingVolume: "",
  estimatedMonthlyRevenue: "",
  propertyNotes: "",
  source: "airbnb",
  sourceUrl: "",
  discoveryMethod: "",
  priority: "medium",
  stage: "new",
  preferredContactMethod: "whatsapp",
  bestTimeToContact: "",
  contactStatus: "not_contacted",
  followUpDate: "",
  followUpTime: "09:00",
  followUpReason: "",
  followUpNotes: "",
  notes: "",
  assignSelf: true,
};

function Field({ label, children }) {
  return (
    <label className="acq-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Multi({ options, value, onChange }) {
  const toggle = (item) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item],
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              on ? "border-[#111] bg-[#111] text-white" : "border-[#ececec] bg-white"
            }`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function AcquisitionProspectForm({
  open,
  onClose,
  onSaved,
  staff = [],
  sessionUser,
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const assignedTo = form.assignSelf
        ? {
            id: sessionUser?.id,
            email: sessionUser?.email,
            name: sessionUser?.name,
          }
        : form.assignedToId
          ? staff.find((u) => u._id === form.assignedToId)
          : null;
      const res = await fetch("/api/ops/acquisition/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          assignedTo: assignedTo
            ? {
                id: assignedTo.id || assignedTo._id,
                email: assignedTo.email,
                name: assignedTo.name || assignedTo.username,
              }
            : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save prospect");
      setForm(empty);
      onSaved?.(data.prospect);
      onClose?.();
    } catch (err) {
      setError(err.message || "Could not save prospect");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="acq-modal" role="dialog" aria-labelledby="acq-add-title">
      <form className="acq-modal__panel" onSubmit={submit}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="acq-add-title" className="text-lg font-semibold tracking-tight">
              Add prospect
            </h2>
            <p className="mt-1 text-[13px] text-[#6b6b6b]">
              Capture what you know. Everything except the property name is optional.
            </p>
          </div>
          <button type="button" className="text-sm text-[#6b6b6b]" onClick={onClose}>
            Close
          </button>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          Basic information
        </h3>
        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Business / property name *">
            <input
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </Field>
          <Field label="Owner / contact name">
            <input
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Website">
            <input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={form.country} onChange={(e) => set("country", e.target.value)} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
        </div>

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          Property information
        </h3>
        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Number of properties">
            <input
              type="number"
              min="0"
              value={form.propertyCount}
              onChange={(e) => set("propertyCount", e.target.value)}
            />
          </Field>
          <Field label="Estimated listings">
            <input
              type="number"
              min="0"
              value={form.estimatedListings}
              onChange={(e) => set("estimatedListings", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Property types">
              <Multi
                options={PROPERTY_TYPES}
                value={form.propertyTypes}
                onChange={(v) => set("propertyTypes", v)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Existing booking platforms">
              <Multi
                options={EXISTING_PLATFORMS}
                value={form.existingPlatforms}
                onChange={(v) => set("existingPlatforms", v)}
              />
            </Field>
          </div>
          <Field label="Estimated booking volume">
            <input
              value={form.estimatedBookingVolume}
              onChange={(e) => set("estimatedBookingVolume", e.target.value)}
              placeholder="e.g. 12 nights / month"
            />
          </Field>
          <Field label="Estimated monthly revenue">
            <input
              value={form.estimatedMonthlyRevenue}
              onChange={(e) => set("estimatedMonthlyRevenue", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes about the properties">
              <textarea
                value={form.propertyNotes}
                onChange={(e) => set("propertyNotes", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          Acquisition
        </h3>
        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Source">
            <select value={form.source} onChange={(e) => set("source", e.target.value)}>
              {ACQUISITION_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source URL">
            <input
              value={form.sourceUrl}
              onChange={(e) => set("sourceUrl", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="How we discovered them">
              <input
                value={form.discoveryMethod}
                onChange={(e) => set("discoveryMethod", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {ACQUISITION_PRIORITIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Initial stage">
            <select value={form.stage} onChange={(e) => set("stage", e.target.value)}>
              {ACQUISITION_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
          Contact & follow-up
        </h3>
        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Preferred contact method">
            <select
              value={form.preferredContactMethod}
              onChange={(e) => set("preferredContactMethod", e.target.value)}
            >
              {CONTACT_METHODS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Best time to contact">
            <input
              value={form.bestTimeToContact}
              onChange={(e) => set("bestTimeToContact", e.target.value)}
            />
          </Field>
          <Field label="Contact status">
            <select
              value={form.contactStatus}
              onChange={(e) => set("contactStatus", e.target.value)}
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Next follow-up date">
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => set("followUpDate", e.target.value)}
            />
          </Field>
          <Field label="Follow-up time">
            <input
              type="time"
              value={form.followUpTime}
              onChange={(e) => set("followUpTime", e.target.value)}
            />
          </Field>
          <Field label="Follow-up notes">
            <input
              value={form.followUpNotes}
              onChange={(e) => set("followUpNotes", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Internal notes">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.assignSelf}
              onChange={(e) => set("assignSelf", e.target.checked)}
            />
            Assign to me
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save prospect"}
          </button>
        </div>
      </form>
    </div>
  );
}
