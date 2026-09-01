"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addressFromLegacy } from "@/utils/address";
import HostApplicationForm from "@/components/host/HostApplicationForm";
import HostPitchModal from "@/components/onboarding/HostPitchModal";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function HostOnboardingPage() {
  const { data: session, status, update } = useSession();
  const { t } = useLanguage();
  const router = useRouter();

  const hostStatus = session?.user?.hostStatus;
  const isResubmission = hostStatus === "rejected";
  const isPendingHost = hostStatus === "onboarding";
  const isVerifiedHost = hostStatus === "verified";

  const [initialData, setInitialData] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pitchOpen, setPitchOpen] = useState(true);

  const closePitch = useCallback(() => {
    setPitchOpen(false);
  }, []);

  const finishPitch = useCallback(() => {
    setPitchOpen(false);
    if (!session?.user) {
      router.push(getLoginUrl("/host/onboarding"));
      return;
    }
    if (hostStatus === "verified") {
      router.push("/properties/add");
      return;
    }
    if (hostStatus === "onboarding") {
      router.push("/host/pending");
    }
  }, [router, session?.user, hostStatus]);

  useEffect(() => {
    if (!isResubmission) {
      setInitialData({});
      return;
    }

    setLoadingExisting(true);
    fetch("/api/host/onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.application) {
          const { phone, idType, idNumber, address, bio } = data.application;
          setInitialData({
            phone: phone || "",
            idType: idType || "passport",
            idNumber: idNumber || "",
            address: addressFromLegacy(address),
            bio: bio || "",
          });
        } else {
          setInitialData({});
        }
      })
      .catch((err) => console.error("Failed to load existing application:", err))
      .finally(() => setLoadingExisting(false));
  }, [isResubmission]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError("");

    try {
      const method = isResubmission ? "PUT" : "POST";
      const res = await fetch("/api/host/onboarding", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Submission failed");

      await update();
      router.push("/host/pending");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting || (isResubmission && initialData === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--kama-canvas)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
      </div>
    );
  }

  const signedIn = Boolean(session?.user);
  const showForm = signedIn && !isPendingHost && !isVerifiedHost;
  const finishLabel = !signedIn
    ? t("host.logInApply")
    : isVerifiedHost
      ? t("host.listProperty")
      : isPendingHost
        ? t("host.seeStatus")
        : t("host.startApp");

  return (
    <div className="min-h-screen bg-[var(--kama-canvas)]">
      <HostPitchModal
        open={pitchOpen}
        signedIn={signedIn}
        finishLabel={finishLabel}
        onDismiss={closePitch}
        onFinish={finishPitch}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center sm:text-left">
          {isResubmission ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left">
              <p className="text-sm font-semibold text-red-800">
                {t("host.rejectedTitle")}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {t("host.rejectedBody")}
              </p>
            </div>
          ) : null}

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
            {t("host.application")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--kama-ink)] sm:text-4xl">
            {isResubmission ? t("host.update") : t("host.become")}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--kama-ink-muted)]">
            {t("host.intro")}
          </p>
          <button
            type="button"
            onClick={() => setPitchOpen(true)}
            className="mt-3 text-sm font-semibold text-[var(--kama-accent)] hover:underline"
          >
            {t("host.whyHost")}
          </button>
        </div>

        {status === "loading" ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
          </div>
        ) : showForm ? (
          <HostApplicationForm
            key={isResubmission ? "resubmit" : "new"}
            initialData={initialData || {}}
            isResubmission={isResubmission}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        ) : isVerifiedHost ? (
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-8 text-center shadow-sm">
            <p className="mb-6 text-[var(--kama-ink-muted)]">
              {t("host.alreadyHost")}
            </p>
            <Link
              href="/properties/add"
              className="kama-cta inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold"
            >
              {t("host.listProperty")}
            </Link>
          </div>
        ) : isPendingHost ? (
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-8 text-center shadow-sm">
            <p className="mb-6 text-[var(--kama-ink-muted)]">
              {t("host.pending")}
            </p>
            <Link
              href="/host/pending"
              className="kama-cta inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold"
            >
              {t("host.seeStatus")}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-8 text-center shadow-sm">
            <p className="mb-6 text-[var(--kama-ink-muted)]">
              {t("host.signInToApply")}
            </p>
            <Link
              href={getLoginUrl("/host/onboarding")}
              className="kama-cta inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold"
            >
              {t("host.logInOrSignUp")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
