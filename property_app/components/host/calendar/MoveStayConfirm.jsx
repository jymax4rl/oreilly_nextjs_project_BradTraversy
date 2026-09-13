"use client";

import { formatGuestDate } from "@/utils/availability/validateStay";
import { firstName } from "@/utils/host/reservationsCalendar";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function MoveStayConfirm({
  booking,
  fromProperty,
  toProperty,
  busy,
  error,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();
  if (!booking || !toProperty) return null;
  const guest =
    firstName(booking.guestName) || t("hostConsole.guest");
  const dates = `${formatGuestDate(booking.checkIn)} – ${formatGuestDate(booking.checkOut)}`;

  return (
    <>
      <button
        type="button"
        className="rc-scrim"
        aria-label={t("hostConsole.resCal.close")}
        onClick={onCancel}
      />
      <aside className="rc-drawer" role="dialog" aria-modal="true">
        <div className="rc-drawer__top">
          <p className="rc-drawer__kicker">{t("hostConsole.resCal.move")}</p>
        </div>
        <div className="rc-drawer__body">
          <p className="text-sm leading-relaxed text-[var(--kama-ink)]">
            {t("hostConsole.resCal.moveAsk", {
              guest,
              from: fromProperty?.name || t("hostConsole.stay"),
              to: toProperty.name,
              dates,
            })}
          </p>
          <p className="mt-3 text-xs text-[var(--kama-ink-muted)]">
            {t("hostConsole.resCal.moveHint")}
          </p>
          {error ? (
            <p className="mt-3 text-sm text-[var(--kama-danger)]">{error}</p>
          ) : null}
          <div className="rc-actions">
            <button
              type="button"
              className="rc-btn rc-btn--accent"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy
                ? t("hostConsole.resCal.moving")
                : t("hostConsole.resCal.confirmMove")}
            </button>
            <button
              type="button"
              className="rc-btn"
              disabled={busy}
              onClick={onCancel}
            >
              {t("hostConsole.cal.cancel")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
