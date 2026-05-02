"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HostOnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: "",
    idType: "passport",
    idNumber: "",
    address: "",
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/host/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      await update({ hostStatus: "onboarding" });
      router.push("/host/pending");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <p className="mb-4 text-gray-700">Please sign in to become a host.</p>
          <Link
            href="/api/auth/signin"
            className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
        </div>
      </section>
    );
  }

  if (session.user.hostStatus === "verified") {
    router.push("/properties/add");
    return null;
  }

  if (session.user.hostStatus === "onboarding") {
    router.push("/host/pending");
    return null;
  }

  return (
    <section className="bg-blue-50 min-h-screen py-12">
      <div className="container m-auto max-w-2xl py-12 px-4">
        <div className="bg-white px-6 py-8 shadow-md rounded-md border">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Become a Host
          </h1>
          <p className="text-gray-600 mb-8">
            List your property on Kama Properties and reach thousands of
            potential guests across Africa.
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="+221 77 123 4567"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  ID Type
                </label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  required
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Street, City, Country"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                About You
              </label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Tell us why you'd be a great host..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded w-full disabled:opacity-50 transition"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
