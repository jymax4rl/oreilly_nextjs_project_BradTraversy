import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import { getMessages } from "@/utils/actions/messageActions";
import MessageCard from "@/components/MessageCard";
import MessageFilter from "@/components/MessageFilter";
import { getLoginUrl } from "@/lib/legal/loginUrl";

export const metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
};

export default async function HostMessagesPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/messages"));
  }
  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  const params = await searchParams;
  const filter = params?.filter || "all";
  const messages = await getMessages();
  const userId = session.user.id;

  const filtered = (messages || []).filter((msg) => {
    if (filter === "unread") {
      return msg.recipient._id.toString() === userId && !msg.read;
    }
    if (filter === "sent") {
      return msg.sender._id.toString() === userId;
    }
    return true;
  });

  const unreadCount = (messages || []).filter(
    (msg) => msg.recipient._id.toString() === userId && !msg.read,
  ).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          Inbox
        </h1>
        {unreadCount > 0 ? (
          <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
            {unreadCount} unread
          </p>
        ) : null}
      </header>

      <Suspense fallback={null}>
        <MessageFilter currentFilter={filter} basePath="/host/messages" />
      </Suspense>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
            <p className="font-medium text-[var(--kama-ink)]">
              {filter === "unread"
                ? "No unread messages"
                : filter === "sent"
                  ? "No sent messages"
                  : "No messages yet"}
            </p>
            <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
              Guest threads about your listings appear here.
            </p>
          </div>
        ) : (
          filtered.map((message) => (
            <MessageCard
              key={message._id}
              message={message}
              currentUserId={userId}
            />
          ))
        )}
      </div>
    </div>
  );
}
