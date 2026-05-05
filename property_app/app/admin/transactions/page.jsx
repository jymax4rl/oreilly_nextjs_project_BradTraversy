"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/utils/currencyUtils";

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const query = debouncedSearch ? `?query=${encodeURIComponent(debouncedSearch)}` : "";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-700">Please sign in as admin.</p>
          <Link href="/" className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 py-12">
      <div className="container m-auto max-w-6xl px-4">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
            <p className="text-gray-600 mt-1">Review all payments received via Flutterwave</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/listings"
              className="bg-white border text-gray-700 hover:bg-gray-100 px-4 py-2 rounded transition font-medium"
            >
              Property listings
            </Link>
            <Link
              href="/admin/hosts"
              className="bg-white border text-gray-700 hover:bg-gray-100 px-4 py-2 rounded transition font-medium"
            >
              Host applications
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-center">
          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by Transaction ID, Ref, Name, or Email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-700"
          />
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 ml-2"></div>}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b text-gray-700 uppercase text-xs">
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
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? "No transactions match your search." : "No transactions found."}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{tx.transaction_id}</div>
                        <div className="text-xs text-gray-500 mt-1">{tx.tx_ref}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{tx.customer_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{tx.customer_email || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-blue-600">{tx.host_name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{tx.property_name || "Unknown Property"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {tx.currency} {Number(tx.amount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tx.status === "successful" ? "bg-green-100 text-green-800" : 
                          tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(tx.flutterwave_created_at || tx.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.flutterwave_created_at || tx.createdAt).toLocaleTimeString()}
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
    </section>
  );
}
