import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import Message from "@/models/Message";
import { isAwaitingListingModeration } from "@/utils/listingApproval";
import { getLoginUrl } from "@/lib/legal/loginUrl";

export const metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function HostConsoleHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host"));
  }

  if (session.user.hostStatus !== "verified") {
    if (session.user.hostStatus === "onboarding") {
      redirect("/host/pending");
    }
    redirect("/host/onboarding");
  }

  await connectToDatabase();

  const ownerId = session.user.id;
  const properties = await Property.find({ owner: ownerId })
    .select("name status images location listingModerationRequestedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const propertyIds = properties.map((p) => p._id);
  const today = todayIso();

  const [pendingBookings, pendingCount, upcomingStays, unread] =
    await Promise.all([
      propertyIds.length
        ? Booking.find({
            propertyId: { $in: propertyIds },
            status: "pending",
          })
            .sort({ checkIn: 1 })
            .limit(6)
            .lean()
        : [],
      propertyIds.length
        ? Booking.countDocuments({
            propertyId: { $in: propertyIds },
            status: "pending",
          })
        : 0,
      propertyIds.length
        ? Booking.find({
            propertyId: { $in: propertyIds },
            status: { $in: ["pending", "confirmed"] },
            checkIn: { $gte: today },
          })
            .sort({ checkIn: 1 })
            .limit(6)
            .lean()
        : [],
      Message.countDocuments({
        recipient: ownerId,
        read: false,
      }),
    ]);

  const listingsPending = properties.filter((p) =>
    isAwaitingListingModeration(p),
  ).length;

  const stats = [
    {
      label: "Listings",
      value: properties.length,
      href: "/host/listings",
    },
    {
      label: "Awaiting listing review",
      value: listingsPending,
      href: "/host/listings",
    },
    {
      label: "Reservation requests",
      value: pendingCount,
      href: "/host/reservations",
    },
    {
      label: "Unread messages",
      value: unread,
      href: "/host/messages",
    },
  ];

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-[1.75rem]">
          Host console
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
          Run stays from one place — reservations, calendar, listings, and
          guest messages. Marketplace browsing stays on the public site.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="block rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-4 transition hover:border-[var(--kama-border-strong)] hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink-muted)]">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--kama-ink)]">
                {stat.value}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
              Requests
            </h2>
            <Link
              href="/host/reservations"
              className="text-xs font-semibold text-[var(--kama-accent)] hover:underline"
            >
              All reservations
            </Link>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              No open requests. New guest reservations will show up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingBookings.map((b) => (
                <li
                  key={String(b._id)}
                  className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--kama-ink)]">
                    {b.propertyName || "Stay"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                    {b.guestName || "Guest"} · {b.checkIn} → {b.checkOut}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]">
              Upcoming arrivals
            </h2>
            <Link
              href="/host/calendar"
              className="text-xs font-semibold text-[var(--kama-accent)] hover:underline"
            >
              Calendar
            </Link>
          </div>
          {upcomingStays.length === 0 ? (
            <p className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-8 text-sm text-[var(--kama-ink-muted)]">
              No upcoming check-ins on the books yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingStays.map((b) => (
                <li
                  key={String(b._id)}
                  className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--kama-ink)]">
                    {b.propertyName || "Stay"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--kama-ink-muted)]">
                    {b.checkIn} · {b.status}
                    {b.guestName ? ` · ${b.guestName}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
