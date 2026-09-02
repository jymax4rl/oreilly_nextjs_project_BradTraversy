"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isOpsStaff } from "@/utils/opsAuth";

/**
 * Transactions browse UI (shared by /ops/transactions).
 */
export default function AdminTransactionsPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const query = debouncedSearch
          ? `?query=${encodeURIComponent(debouncedSearch)}`
          : "";
        const res = await fetch(`/api/admin/transactions${query}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [debouncedSearch, session, status]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated" || !isOpsStaff(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-12 text-center">
        <p className="mb-4 text-gray-700">Please sign in as admin.</p>
        <Link
          href="/ops/login"
          className="rounded bg-gray-900 px-6 py-2 text-white transition hover:bg-gray-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Transactions
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Review booking payments and settlement records.
        </p>
      </header>

      <div className="mb-6 flex items-center rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
        <svg
          className="mr-3 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by Transaction ID, Ref, Name, or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-gray-700 outline-none"
        />
        {loading && (
          <div className="ml-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm text-gray-500">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-4">Transaction ID / Ref</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Host / Property</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchQuery
                      ? "No transactions match your search."
                      : "No transactions found."}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tx.transaction_id}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {tx.tx_ref}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tx.customer_name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.customer_email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-600">
                        {tx.host_name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.property_name || "Unknown Property"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {tx.currency} {Number(tx.amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          tx.status === "successful"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(
                        tx.flutterwave_created_at || tx.createdAt,
                      ).toLocaleDateString()}
                      <div className="mt-0.5 text-xs text-gray-400">
                        {new Date(
                          tx.flutterwave_created_at || tx.createdAt,
                        ).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
