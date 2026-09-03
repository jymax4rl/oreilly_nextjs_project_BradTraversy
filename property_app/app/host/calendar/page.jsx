import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { MapPin } from "lucide-react";

export const metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

export default async function HostCalendarHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(getLoginUrl("/host/calendar"));
  }
  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  await connectToDatabase();
  const properties = await Property.find({ owner: session.user.id })
    .select("name location")
    .sort({ name: 1 })
    .lean();

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          Calendar
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          Open a listing to block dates and review stays on that property.
        </p>
      </header>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-6 py-14 text-center">
          <p className="text-[var(--kama-ink-muted)]">
            List a stay to manage availability.
          </p>
          <Link
            href="/properties/add"
            className="kama-cta mt-4 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
          >
            List a stay
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={String(p._id)}>
              <Link
                href={`/properties/${p._id}/calendar`}
                className="block rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-5 py-5 transition hover:border-[var(--kama-border-strong)] hover:shadow-sm"
              >
                <p className="font-semibold text-[var(--kama-ink)]">{p.name}</p>
                {(p.location?.city || p.location?.country) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-[var(--kama-ink-muted)]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {[p.location.city, p.location.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <p className="mt-3 text-xs font-semibold text-[var(--kama-accent)]">
                  Open calendar
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
