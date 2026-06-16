"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { needsHostWelcome } from "@/utils/hostWelcomeOnboarding";
import { addressFromLegacy } from "@/utils/address";
import HostApplicationForm from "@/components/host/HostApplicationForm";
import KamaLogo from "@/assets/images/Kama logo - blue.svg";

export default function HostOnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const isResubmission = session?.user?.hostStatus === "rejected";

  const [initialData, setInitialData] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <Image
            src={KamaLogo}
            alt="Kama Properties"
            width={120}
            height={40}
            className="mx-auto mb-6 h-10 w-auto"
          />
          <p className="mb-6 text-zinc-600">Sign in to apply to become a host.</p>
          <Link
            href="/login?callbackUrl=/host/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Log in or sign up
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.hostStatus === "verified") {
    router.push(
      needsHostWelcome(session.user) ? "/onboarding" : "/properties/add",
    );
    return null;
  }

  if (session.user.hostStatus === "onboarding") {
    router.push("/host/pending");
    return null;
  }

  if (loadingExisting || (isResubmission && initialData === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-zinc-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center sm:text-left">
          <Image
            src={KamaLogo}
            alt="Kama Properties"
            width={130}
            height={44}
            className="mx-auto mb-6 h-11 w-auto sm:mx-0"
          />

          {isResubmission ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left">
              <p className="text-sm font-semibold text-red-800">
                Your previous application needs updates
              </p>
              <p className="mt-1 text-sm text-red-700">
                Review your details below — especially your address — and
                resubmit for another review.
              </p>
            </div>
          ) : null}

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
            Host application
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {isResubmission ? "Update your application" : "Become a host"}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600">
            List on Kama Properties and welcome travelers across Africa — with
            Mobile Money–friendly payouts and a growing continental guest
            network.
          </p>
        </div>

        <HostApplicationForm
          key={isResubmission ? "resubmit" : "new"}
          initialData={initialData || {}}
          isResubmission={isResubmission}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      </div>
    </div>
  );
}
