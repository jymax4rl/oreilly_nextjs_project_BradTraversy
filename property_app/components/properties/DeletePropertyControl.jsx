"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import DeletePropertyModal from "./DeletePropertyModal";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Opens the type-to-confirm delete modal and calls DELETE /api/properties/[id].
 */
export default function DeletePropertyControl({
  propertyId,
  propertyName,
  onDeleted,
  redirectTo = "/properties/my-listings",
  variant = "button",
  className = "",
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("hostConsole.delete.failed"));
      }
      setOpen(false);
      if (typeof onDeleted === "function") {
        onDeleted(propertyId);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError(err.message || t("hostConsole.delete.failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerClass =
    variant === "link"
      ? `inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition hover:text-red-700 ${className}`
      : `inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 ${className}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={triggerClass}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {t("hostConsole.delete.button")}
      </button>

      <DeletePropertyModal
        open={open}
        propertyName={propertyName}
        isDeleting={isDeleting}
        error={error}
        onCancel={() => !isDeleting && setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
