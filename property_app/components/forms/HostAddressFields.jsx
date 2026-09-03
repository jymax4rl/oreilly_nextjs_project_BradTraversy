"use client";

import GoogleAddressAutocomplete from "@/components/forms/GoogleAddressAutocomplete";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const inputClass =
  "h-12 w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 text-[15px] text-[var(--kama-ink)] outline-none transition placeholder:text-[var(--kama-ink-muted)] focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent)]/15";

const labelClass = "mb-1.5 block text-sm font-medium text-[var(--kama-ink)]";

export default function HostAddressFields({ address, onChange, disabled = false }) {
  const { t } = useLanguage();
  const setField = (name, value) => {
    onChange({ ...address, [name]: value });
  };

  const handlePlaceSelect = (parsed) => {
    onChange({ ...address, ...parsed });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>{t("host.searchAddress")}</label>
        <GoogleAddressAutocomplete
          value={address.formatted || address.streetLine1}
          onChange={(value) =>
            onChange({
              ...address,
              formatted: value,
              streetLine1: value,
            })
          }
          onPlaceSelect={handlePlaceSelect}
          disabled={disabled}
          placeholder={t("host.addressSearchPh")}
        />
      </div>

      <div>
        <label htmlFor="streetLine1" className={labelClass}>
          {t("host.street")} <span className="text-red-500">*</span>
        </label>
        <input
          id="streetLine1"
          name="streetLine1"
          type="text"
          required
          disabled={disabled}
          value={address.streetLine1}
          onChange={(e) => setField("streetLine1", e.target.value)}
          placeholder={t("host.streetPh")}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="streetLine2" className={labelClass}>
          {t("host.apt")}{" "}
          <span className="text-zinc-400">{t("host.optional")}</span>
        </label>
        <input
          id="streetLine2"
          name="streetLine2"
          type="text"
          disabled={disabled}
          value={address.streetLine2}
          onChange={(e) => setField("streetLine2", e.target.value)}
          placeholder={t("host.aptPh")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>
            {t("host.city")} <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            disabled={disabled}
            value={address.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Dakar"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>
            {t("host.state")}
          </label>
          <input
            id="state"
            name="state"
            type="text"
            disabled={disabled}
            value={address.state}
            onChange={(e) => setField("state", e.target.value)}
            placeholder="Dakar Region"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="postalCode" className={labelClass}>
            {t("host.postal")}
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            disabled={disabled}
            value={address.postalCode}
            onChange={(e) => setField("postalCode", e.target.value)}
            placeholder="11000"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>
            {t("host.country")} <span className="text-red-500">*</span>
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            disabled={disabled}
            value={address.country}
            onChange={(e) => setField("country", e.target.value)}
            placeholder="Senegal"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
