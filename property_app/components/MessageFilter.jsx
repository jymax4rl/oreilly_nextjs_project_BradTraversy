"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "All Messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Sent", value: "sent" },
];

export default function MessageFilter({ currentFilter }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map(({ label, value }) => {
        const active = currentFilter === value;
        return (
          <Link
            key={value}
            href={`/messages?filter=${value}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-gray-900 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
