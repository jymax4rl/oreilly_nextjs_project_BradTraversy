"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useSession, signIn } from "next-auth/react";

export default function MessageOwnerButton({
  propertyId,
  ownerId,
  ownerName = "host",
  className = "",
  variant = "default",
}) {
  const { data: session, status } = useSession();
  const label = `Message ${ownerName}`;
  const messageHref = `/properties/${propertyId}/message`;

  if (status === "loading") return null;
  if (session?.user?.id === ownerId) return null;
  if (!ownerId) return null;

  const base =
    variant === "compact"
      ? "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      : "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] sm:w-auto sm:min-w-[12rem]";

  const content = (
    <>
      <MessageCircle
        size={18}
        strokeWidth={2}
        className="shrink-0 text-blue-600"
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </>
  );

  if (!session) {
    return (
      <button
        type="button"
        onClick={() =>
          signIn("google", { callbackUrl: messageHref })
        }
        className={`${base} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={messageHref} className={`${base} ${className}`}>
      {content}
    </Link>
  );
}
