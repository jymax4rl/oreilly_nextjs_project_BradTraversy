import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import { getMessages } from "@/utils/actions/messageActions";
import MessageCard from "@/components/MessageCard";
import MessageFilter from "@/components/MessageFilter";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import HostMessagesHeader from "@/components/host/HostMessagesHeader";
import HostInboxEmpty from "@/components/host/HostInboxEmpty";

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
      <HostMessagesHeader unreadCount={unreadCount} />

      <Suspense fallback={null}>
        <MessageFilter currentFilter={filter} basePath="/host/messages" />
      </Suspense>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <HostInboxEmpty filter={filter} />
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
