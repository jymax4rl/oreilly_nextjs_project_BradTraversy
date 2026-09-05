"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isOpsStaff } from "@/utils/opsAuth";

const FILTERS = [
  { id: "sent", label: "Sent" },
  { id: "mine", label: "Mine" },
  { id: "inbox", label: "Inbox" },
];

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function personLabel(person) {
  if (!person) return "Unknown";
  return person.name || person.email || "Unknown";
}

export default function OpsMessagesPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("sent");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput), 280);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !isOpsStaff(session?.user?.role)) return;

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("filter", filter);
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        const res = await fetch(`/api/ops/messages?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error((await res.text()) || `Failed (${res.status})`);
        }
        const data = await res.json();
        setMessages(data.messages || []);
        setCounts(data.counts || {});
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err.message || "Failed to load messages");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [filter, searchQuery, session, status]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isOpsStaff(session?.user?.role)) {
    return null;
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Messages
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          In-app notes ops sent to hosts and guests, plus replies. Compose from
          Users. Recipients also get an email.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = counts[item.id];
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                active
                  ? "bg-gray-900 text-white"
                  : "border bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
              {typeof count === "number" ? (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white text-gray-900" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label htmlFor="ops-messages-search" className="sr-only">
          Search messages
        </label>
        <input
          id="ops-messages-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, or message text…"
          className="h-11 w-full max-w-xl rounded-lg border border-[var(--kama-border-strong)] bg-white px-3 text-sm text-[var(--kama-ink)] outline-none transition placeholder:text-gray-400 focus:border-[#1B5C57] focus:ring-2 focus:ring-[#1B5C57]/20"
        />
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-lg text-gray-500">No messages in this view yet.</p>
          <p className="mt-2 text-sm text-gray-400">
            Send from{" "}
            <Link href="/ops/users" className="font-semibold text-[#1B5C57] hover:underline">
              Users
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3 pb-28">
          {messages.map((msg) => {
            const open = openId === msg.id;
            const counterpart =
              filter === "inbox" ? msg.sender : msg.recipient;
            return (
              <li
                key={msg.id}
                className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : msg.id)}
                  className="flex w-full flex-col gap-1 text-left"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {filter === "inbox" ? "From " : "To "}
                      {personLabel(counterpart)}
                    </p>
                    <p className="text-xs text-gray-500">{formatWhen(msg.createdAt)}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {filter === "inbox"
                      ? counterpart?.email
                      : `From ${personLabel(msg.sender)}${
                          msg.sender?.email ? ` · ${msg.sender.email}` : ""
                        }`}
                    {msg.property?.name ? ` · ${msg.property.name}` : " · Account"}
                  </p>
                  {!open ? (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700">
                      {msg.body}
                    </p>
                  ) : null}
                </button>
                {open ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {msg.body}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
