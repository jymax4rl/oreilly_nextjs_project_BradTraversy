"use client";

import { useState } from "react";
import {
  Phone,
  IdCard,
  MapPin,
  UserRound,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { emptyAddress } from "@/utils/address";
import HostAddressFields from "@/components/forms/HostAddressFields";
import { isAddressComplete } from "@/utils/address";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const inputClass =
  "h-12 w-full rounded-xl border border-[var(--kama-border)] bg-white px-4 text-[15px] text-[var(--kama-ink)] outline-none transition placeholder:text-[var(--kama-ink-muted)] focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent-soft)]";

const labelClass =
  "mb-1.5 block text-sm font-medium text-[var(--kama-ink)]";

const steps = [
  { id: "contact", labelKey: "host.contact", icon: Phone },
  { id: "identity", labelKey: "host.identity", icon: IdCard },
  { id: "address", labelKey: "host.homeAddress", icon: MapPin },
  { id: "about", labelKey: "host.about", icon: UserRound },
];

export default function HostApplicationForm({
  initialData,
  isResubmission,
  onSubmit,
  submitting,
  error,
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    phone: initialData?.phone || "",
    idType: initialData?.idType || "passport",
    idNumber: initialData?.idNumber || "",
    address: initialData?.address || emptyAddress(),
    bio: initialData?.bio || "",
  });

  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAddressComplete(formData.address)) {
      setFormError(t("host.addressError"));
      return;
    }
    setFormError("");
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="flex items-center gap-2 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-accent-soft)] px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--kama-accent)] text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Icon className="mb-0.5 h-3.5 w-3.5 text-[var(--kama-accent)]" />
                <p className="truncate text-xs font-semibold text-[var(--kama-ink)]">
                  {t(step.labelKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {(error || formError) ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error || formError}
        </div>
      ) : null}

      {/* Contact */}
      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
            <Phone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--kama-ink)]">{t("host.contact")}</h2>
            <p className="text-sm text-[var(--kama-ink-muted)]">
              {t("host.contactHint")}
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t("host.phone")} <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="+221 77 123 4567"
          />
        </div>
      </section>

      {/* Identity */}
      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
            <IdCard className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--kama-ink)]">{t("host.identity")}</h2>
            <p className="text-sm text-[var(--kama-ink-muted)]">
              {t("host.identityHint")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="idType" className={labelClass}>
              {t("host.idType")} <span className="text-red-500">*</span>
            </label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="passport">{t("host.passport")}</option>
              <option value="national_id">{t("host.nationalId")}</option>
              <option value="drivers_license">{t("host.driversLicense")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="idNumber" className={labelClass}>
              {t("host.idNumber")} <span className="text-red-500">*</span>
            </label>
            <input
              id="idNumber"
              type="text"
              name="idNumber"
              required
              value={formData.idNumber}
              onChange={handleChange}
              className={inputClass}
              placeholder={t("host.idNumberPh")}
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--kama-ink)]">{t("host.homeAddress")}</h2>
            <p className="text-sm text-[var(--kama-ink-muted)]">
              {t("host.addressHint")}
            </p>
          </div>
        </div>
        <HostAddressFields
          address={formData.address}
          onChange={(address) =>
            setFormData((prev) => ({ ...prev, address }))
          }
          disabled={submitting}
        />
      </section>

      {/* About */}
      <section className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--kama-ink)]">{t("host.about")}</h2>
            <p className="text-sm text-[var(--kama-ink-muted)]">
              {t("host.aboutHint")}
            </p>
          </div>
        </div>
        <textarea
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleChange}
          className={`${inputClass} min-h-[120px] resize-y py-3`}
          placeholder={t("host.bioPh")}
        />
      </section>

      <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-4 py-3 text-sm text-[var(--kama-ink-muted)]">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--kama-accent)]" />
          <p>
            {t("host.reviewNote")}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !isAddressComplete(formData.address)}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--kama-accent)] text-[16px] font-semibold text-white transition hover:bg-[var(--kama-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? t("host.submitting")
          : isResubmission
            ? t("host.resubmit")
            : t("host.submit")}
        {!submitting ? <ChevronRight className="h-5 w-5" /> : null}
      </button>
    </form>
  );
}
