"use client";

import GoogleAddressAutocomplete from "@/components/forms/GoogleAddressAutocomplete";

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

export default function HostAddressFields({ address, onChange, disabled = false }) {
  const setField = (name, value) => {
    onChange({ ...address, [name]: value });
  };

  const handlePlaceSelect = (parsed) => {
    onChange({ ...address, ...parsed });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Search address</label>
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
        />
      </div>

      <div>
        <label htmlFor="streetLine1" className={labelClass}>
          Street address <span className="text-red-500">*</span>
        </label>
        <input
          id="streetLine1"
          name="streetLine1"
          type="text"
          required
          disabled={disabled}
          value={address.streetLine1}
          onChange={(e) => setField("streetLine1", e.target.value)}
          placeholder="House number and street"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="streetLine2" className={labelClass}>
          Apartment, suite, etc. <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="streetLine2"
          name="streetLine2"
          type="text"
          disabled={disabled}
          value={address.streetLine2}
          onChange={(e) => setField("streetLine2", e.target.value)}
          placeholder="Apt 4B, Floor 2, etc."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>
            City <span className="text-red-500">*</span>
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
            State / region
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
            Postal code
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
            Country <span className="text-red-500">*</span>
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
