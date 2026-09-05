"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  dismissPushPrompt,
  isIosSafari,
  isStandaloneDisplay,
  pushSupported,
  subscribeHostPush,
  wasPushPromptDismissed,
} from "@/utils/push/client";

/**
 * Ask verified hosts to enable lock-screen alerts for new reservations.
 * The OS permission dialog only appears after they tap Enable (browsers block auto-prompts).
 */
export default function HostPushPrompt({ compact = false }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isIosSafari() && !isStandaloneDisplay()) {
      setIosInstall(true);
      setVisible(true);
      return;
    }

    if (!pushSupported()) {
      setUnsupported(true);
      setVisible(true);
      return;
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      subscribeHostPush().catch(() => {});
      if (compact) setEnabled(true);
      return;
    }
    if (permission === "denied") {
      setDenied(true);
      setVisible(true);
      return;
    }
    if (!compact && wasPushPromptDismissed()) return;

    setVisible(true);
  }, [compact]);

  if (!visible && !enabled) return null;

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      await subscribeHostPush();
      dismissPushPrompt();
      setEnabled(true);
      setVisible(false);
      setDenied(false);
    } catch (err) {
      setError(err.message || t("hostConsole.push.failed"));
    } finally {
      setBusy(false);
    }
  };

  const boxClass = compact
    ? "rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
    : "mb-4 rounded-2xl border-2 border-[var(--kama-accent)] bg-[var(--kama-accent-soft)] px-4 py-3.5";

  if (enabled) {
    return (
      <p
        className={
          compact
            ? "rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900"
            : "mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900"
        }
      >
        {t("hostConsole.push.enabled")}
      </p>
    );
  }

  const body = denied
    ? t("hostConsole.push.denied")
    : unsupported
      ? t("hostConsole.push.unsupported")
      : iosInstall
        ? t("hostConsole.push.iosInstall")
        : t("hostConsole.push.body");

  const canEnable = !iosInstall && !unsupported && !denied;

  return (
    <div className={`${boxClass} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent)] text-white">
          <Bell size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--kama-ink)]">
            {t("hostConsole.push.title")}
          </p>
          <p className="mt-0.5 text-sm text-[var(--kama-ink-muted)]">{body}</p>
          {error ? (
            <p className="mt-1 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {!compact && !denied && !unsupported ? (
          <button
            type="button"
            onClick={() => {
              dismissPushPrompt();
              setVisible(false);
            }}
            className="rounded-xl border border-[var(--kama-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--kama-ink)]"
          >
            {t("hostConsole.push.later")}
          </button>
        ) : null}
        {canEnable ? (
          <button
            type="button"
            disabled={busy}
            onClick={enable}
            className="rounded-xl bg-[var(--kama-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? t("hostConsole.push.enabling") : t("hostConsole.push.enable")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
