"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DeletePropertyControl from "@/components/properties/DeletePropertyControl";
import AdminMessageHostModal from "./AdminMessageHostModal";

/**
 * Ops listing card actions: View, Message host, Hide (superadmin), Delete.
 */
export default function AdminListingCardActions({
  propertyId,
  propertyName,
  listingHref,
  ownerId,
  hostLabel,
  moderationButtons = null,
  listed = true,
  canHide = false,
  onToggleListed,
  onDeleted,
}) {
  const { data: session } = useSession();
  const [messageOpen, setMessageOpen] = useState(false);

  const recipientId = ownerId ? String(ownerId) : "";
  const canMessage =
    Boolean(recipientId) &&
    Boolean(session?.user?.id) &&
    session.user.id !== recipientId;

  const senderName =
    session?.user?.name || session?.user?.email || "Isisel Ops";
  const senderEmail = session?.user?.email || "";

  return (
    <>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link
          href={listingHref || `/properties/${propertyId}`}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          View
        </Link>

        {canMessage && (
          <button
            type="button"
            onClick={() => setMessageOpen(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#1B5C57] hover:bg-[#1B5C57]/5"
          >
            Message host
          </button>
        )}

        {canHide && typeof onToggleListed === "function" ? (
          <button
            type="button"
            onClick={() => onToggleListed(!listed)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            {listed ? "Hide" : "Show on web"}
          </button>
        ) : null}

        <DeletePropertyControl
          propertyId={propertyId}
          propertyName={propertyName}
          onDeleted={onDeleted}
        />

        {moderationButtons}
      </div>

      <AdminMessageHostModal
        open={messageOpen}
        propertyId={propertyId}
        recipientId={recipientId}
        propertyName={propertyName}
        hostLabel={hostLabel}
        senderName={senderName}
        senderEmail={senderEmail}
        onClose={() => setMessageOpen(false)}
      />
    </>
  );
}
