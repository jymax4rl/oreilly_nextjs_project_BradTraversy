import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { redirect } from "next/navigation";
import { getMessages } from "@/utils/actions/messageActions";
import MessageCard from "@/components/MessageCard";
import MessageFilter from "@/components/MessageFilter";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
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
    (msg) => msg.recipient._id.toString() === userId && !msg.read
  ).length;

  return (
    <section className="min-h-screen bg-gray-50 pt-[7.75rem] pb-24 lg:pt-[10vh] lg:pb-12">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Suspense fallback={null}>
          <MessageFilter currentFilter={filter} />
        </Suspense>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
              <p className="text-lg font-medium text-gray-900">
                {filter === "unread"
                  ? "No unread messages"
                  : filter === "sent"
                  ? "No sent messages"
                  : "No messages yet"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {filter === "all"
                  ? "Messages from guests and hosts will appear here."
                  : "Check back later."}
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
    </section>
  );
}
