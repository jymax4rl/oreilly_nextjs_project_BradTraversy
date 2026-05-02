"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HostPendingPage() {
  const { data: session } = useSession();
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  const hostStatus = session?.user?.hostStatus;

  useEffect(() => {
    if (!session) return;
    fetch("/api/host/onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.application) setApplication(data.application); })
      .catch(() => {})
      .finally(() => setLoadingApp(false));
  }, [session]);

  if (!session || loadingApp) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </section>
    );
  }

  // ─── REJECTED ─────────────────────────────────────────────────────────────
  if (hostStatus === "rejected") {
    return (
      <section className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Application Rejected
          </h1>

          {application?.rejectionReason ? (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
              <p className="text-sm text-red-600 font-semibold mb-1">Reason:</p>
              <p className="text-sm text-red-700">{application.rejectionReason}</p>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">
              Unfortunately your host application was not approved at this time.
            </p>
          )}

          <p className="text-gray-500 text-sm mb-6">
            You can update your details and resubmit for another review.
          </p>

          <Link
            href="/host/onboarding"
            className="inline-block bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition font-medium"
          >
            Edit &amp; Resubmit
          </Link>

          <div className="mt-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ─── PENDING / ONBOARDING ─────────────────────────────────────────────────
  return (
    <section className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Application Under Review
        </h1>
        <p className="text-gray-600 mb-6">
          Thanks for applying
          {session?.user?.name ? `, ${session.user.name}` : ""}! Our team is
          reviewing your details. You&apos;ll be notified once your host account is
          verified.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
