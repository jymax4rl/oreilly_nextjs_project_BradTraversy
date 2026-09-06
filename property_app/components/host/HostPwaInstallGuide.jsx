"use client";

import { useEffect, useId, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Home,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import usePwaInstall from "@/hooks/usePwaInstall";
import { HOST_INSTALL_SEEN_KEY } from "@/utils/hostPwaInstall";

const LS_DONE = HOST_INSTALL_SEEN_KEY;

function iosSteps(t) {
  return [
    {
      title: t("pwa.ios1Title"),
      body: t("pwa.ios1Body"),
      icon: Share,
    },
    {
      title: t("pwa.ios2Title"),
      body: t("pwa.ios2Body"),
      icon: Home,
      highlight: t("pwa.ios2Highlight"),
    },
    {
      title: t("pwa.ios3Title"),
      body: t("pwa.ios3Body"),
      icon: CheckCircle2,
    },
  ];
}

function StepDots({ total, active }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === active
              ? "w-5 bg-[var(--kama-accent)]"
              : "w-1.5 bg-[var(--kama-border-strong)]"
          }`}
        />
      ))}
    </div>
  );
}

function ShareGlyph() {
  return (
    <span
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--kama-border-strong)] bg-[var(--kama-field)] text-[var(--kama-accent)]"
      aria-hidden
    >
      <Share size={22} strokeWidth={2.25} />
    </span>
  );
}

function installErrorMessage(t, code) {
  if (code === "unavailable") return t("pwa.errUnavailable");
  if (code === "dialog") return t("pwa.errDialog");
  return "";
}

/**
 * Hybrid host PWA install guide:
 * - Chromium: one-tap Install when beforeinstallprompt is available
 * - iOS: step-by-step Share → Add to Home Screen / Sur l’écran d’accueil
 * Copy follows the visitor’s region language (EN/FR).
 */
export default function HostPwaInstallGuide({
  variant = "page",
  onDismiss,
  className = "",
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const {
    ready,
    installed,
    platform,
    canOneTapInstall,
    promptInstall,
    installError,
    needsIosGuide,
  } = usePwaInstall();
  const [iosStep, setIosStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const steps = iosSteps(t);

  useEffect(() => {
    if (installed) {
      try {
        localStorage.setItem(LS_DONE, "1");
      } catch {
        /* ignore */
      }
    }
  }, [installed]);

  const markSeen = () => {
    try {
      localStorage.setItem(LS_DONE, "1");
    } catch {
      /* ignore */
    }
    onDismiss?.();
  };

  const onInstallClick = async () => {
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div
        className={`flex min-h-[12rem] items-center justify-center ${className}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
      </div>
    );
  }

  const shell =
    variant === "modal"
      ? "relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-2xl sm:rounded-2xl"
      : "w-full max-w-md rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-sm";

  return (
    <div className={`${shell} ${className}`} aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--kama-border)] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
            <Smartphone size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--kama-ink)]"
            >
              {t("pwa.useLikeApp")}
            </h2>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              {t("pwa.hostsFaster")}
            </p>
          </div>
        </div>
        {variant === "modal" && onDismiss ? (
          <button
            type="button"
            onClick={markSeen}
            className="kama-focus-ring -mr-1 rounded-lg p-1.5 text-[var(--kama-ink-muted)] hover:bg-[var(--kama-field)] hover:text-[var(--kama-ink)]"
            aria-label={t("pwa.close")}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="overflow-y-auto px-5 py-5">
        {installed ? (
          <div className="text-center">
            <CheckCircle2
              className="mx-auto mb-3 text-[var(--kama-accent)]"
              size={40}
              aria-hidden
            />
            <p className="text-base font-semibold text-[var(--kama-ink)]">
              {t("pwa.alreadyTitle")}
            </p>
            <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
              {t("pwa.alreadyBody")}
            </p>
            {onDismiss ? (
              <button
                type="button"
                onClick={markSeen}
                className="kama-cta kama-focus-ring mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold"
              >
                {t("pwa.continue")}
              </button>
            ) : null}
          </div>
        ) : canOneTapInstall ? (
          <div>
            <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
              {t("pwa.oneTapBody")}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={onInstallClick}
              className="kama-cta kama-focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold disabled:opacity-60"
            >
              <Download size={18} aria-hidden />
              {busy ? t("pwa.opening") : t("pwa.installApp")}
            </button>
            {installError ? (
              <p className="mt-3 text-sm text-[var(--kama-danger)]" role="alert">
                {installErrorMessage(t, installError)}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-[var(--kama-ink-muted)]">
              {t("pwa.confirmHint")}
            </p>
          </div>
        ) : needsIosGuide ? (
          <div>
            {!platform.isSafari ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                {t("pwa.safariFirst")}
              </div>
            ) : null}

            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--kama-field)] px-3 py-3">
              <ShareGlyph />
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-[var(--kama-ink)]">
                  {t("pwa.stepOf", {
                    current: iosStep + 1,
                    total: steps.length,
                  })}
                </p>
                <p className="text-xs text-[var(--kama-ink-muted)]">
                  {t("pwa.appleNoOneTap")}
                </p>
              </div>
            </div>

            {(() => {
              const step = steps[iosStep];
              const Icon = step.icon;
              return (
                <div className="rounded-xl border border-[var(--kama-border)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[var(--kama-accent)]">
                    <Icon size={20} aria-hidden />
                    <h3 className="text-base font-semibold text-[var(--kama-ink)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
                    {step.body}
                  </p>
                  {step.highlight ? (
                    <p className="mt-3 rounded-lg border border-dashed border-[var(--kama-border-strong)] bg-[var(--kama-accent-soft)] px-3 py-2 text-center text-sm font-semibold text-[var(--kama-accent)]">
                      {t("pwa.lookFor", { label: step.highlight })}
                    </p>
                  ) : null}
                </div>
              );
            })()}

            <div className="mt-5">
              <StepDots total={steps.length} active={iosStep} />
            </div>

            <div className="mt-5 flex gap-2">
              {iosStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setIosStep((s) => Math.max(0, s - 1))}
                  className="kama-focus-ring h-11 flex-1 rounded-xl border border-[var(--kama-border-strong)] bg-[var(--kama-surface)] text-sm font-semibold text-[var(--kama-ink)]"
                >
                  {t("pwa.back")}
                </button>
              ) : null}
              {iosStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setIosStep((s) => Math.min(steps.length - 1, s + 1))
                  }
                  className="kama-cta kama-focus-ring inline-flex h-11 flex-[1.4] items-center justify-center gap-1 rounded-xl text-sm font-semibold"
                >
                  {t("pwa.next")}
                  <ChevronRight size={16} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={markSeen}
                  className="kama-cta kama-focus-ring h-11 flex-[1.4] rounded-xl text-sm font-semibold"
                >
                  {t("pwa.done")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
              {platform.isAndroid || platform.isChromium
                ? t("pwa.chromeHint")
                : t("pwa.genericHint")}
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--kama-ink)]">
              <li>{t("pwa.menuStep")}</li>
              <li>{t("pwa.chooseStep")}</li>
              <li>{t("pwa.confirmStep")}</li>
            </ol>
            {onDismiss ? (
              <button
                type="button"
                onClick={markSeen}
                className="kama-cta kama-focus-ring mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold"
              >
                {t("pwa.gotIt")}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bottom-sheet / centered modal wrapper for the install guide.
 */
export function HostPwaInstallModal({ open, onClose }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={t("pwa.closeDialog")}
        onClick={onClose}
      />
      <HostPwaInstallGuide variant="modal" onDismiss={onClose} />
    </div>
  );
}

/**
 * Compact CTA card used on pending / host surfaces.
 */
export function HostPwaInstallCard({ className = "" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { ready, installed, canOneTapInstall, promptInstall, needsIosGuide } =
    usePwaInstall();
  const [busy, setBusy] = useState(false);

  if (!ready || installed) return null;

  const onPrimary = async () => {
    if (canOneTapInstall) {
      setBusy(true);
      try {
        await promptInstall();
      } finally {
        setBusy(false);
      }
      return;
    }
    setOpen(true);
  };

  const cardBody = canOneTapInstall
    ? t("pwa.cardOneTap")
    : needsIosGuide
      ? t("pwa.cardIos")
      : t("pwa.cardGeneric");

  return (
    <>
      <div
        className={`rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] p-4 text-left ${className}`}
      >
        <p className="text-sm font-semibold text-[var(--kama-ink)]">
          {t("pwa.cardTitle")}
        </p>
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">{cardBody}</p>
        <button
          type="button"
          disabled={busy}
          onClick={onPrimary}
          className="kama-cta kama-focus-ring mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
        >
          <Download size={16} aria-hidden />
          {busy
            ? t("pwa.opening")
            : canOneTapInstall
              ? t("pwa.installApp")
              : t("pwa.showMeHow")}
        </button>
      </div>
      <HostPwaInstallModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
