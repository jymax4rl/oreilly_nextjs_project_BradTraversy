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
 */
export default function HostPushPrompt() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;

    const permission = Notification.permission;
    if (permission === "granted") {
      subscribeHostPush().catch(() => {});
      return;
    }
    if (permission === "denied") return;
    if (wasPushPromptDismissed()) return;

    if (isIosSafari() && !isStandaloneDisplay()) {
      setIosInstall(true);
      setVisible(true);
      return;
    }

    setVisible(true);
  }, []);

  if (!visible && !enabled) return null;

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      await subscribeHostPush();
      dismissPushPrompt();
      setEnabled(true);
      setVisible(false);
    } catch (err) {
      setError(err.message || t("hostConsole.push.failed"));
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return (
      <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
        {t("hostConsole.push.enabled")}
      </p>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
          <Bell size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--kama-ink)]">
            {t("hostConsole.push.title")}
          </p>
          <p className="mt-0.5 text-sm text-[var(--kama-ink-muted)]">
            {iosInstall ? t("hostConsole.push.iosInstall") : t("hostConsole.push.body")}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            dismissPushPrompt();
            setVisible(false);
          }}
          className="rounded-xl border border-[var(--kama-border)] px-3 py-2 text-xs font-semibold text-[var(--kama-ink)]"
        >
          {t("hostConsole.push.later")}
        </button>
        {!iosInstall ? (
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
