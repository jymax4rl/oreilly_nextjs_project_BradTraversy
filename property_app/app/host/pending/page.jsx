"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HostPendingPage() {
  const { data: session } = useSession();

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
          reviewing your details. You'll be notified once your host account is
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
