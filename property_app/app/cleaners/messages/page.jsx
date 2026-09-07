"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CleanerMessagesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/cleaners/notifications")
      .then((res) => res.json())
      .then((json) => setItems(json.notifications || []));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Messages</h1>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--kama-ink-muted)]">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item._id} className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-[var(--kama-ink-muted)]">{item.body}</p>
              {item.jobId ? (
                <Link href={`/cleaners/jobs/${item.jobId}`} className="mt-2 inline-flex text-sm text-[var(--kama-accent)]">
                  Open cleaning
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
