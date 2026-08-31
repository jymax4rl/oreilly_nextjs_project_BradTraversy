import Link from "next/link";
import {
  CalendarCheck,
  Heart,
  LayoutList,
  PlusCircle,
  Shield,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

const HOST_STATUS_UI = {
  none: {
    label: "Not a host yet",
    hint: "List a stay and earn when travelers book.",
    Icon: Building2,
    badge: "bg-[var(--kama-field)] text-[var(--kama-ink-muted)]",
  },
  onboarding: {
    label: "Host pending review",
    hint: "We’re reviewing your application. You’ll get access once approved.",
    Icon: Clock,
    badge: "bg-amber-50 text-amber-800",
  },
  verified: {
    label: "Approved host",
    hint: "Manage listings, calendar, and guest reservations.",
    Icon: CheckCircle2,
    badge: "bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]",
  },
  rejected: {
    label: "Application not approved",
    hint: "Update your details and resubmit when ready.",
    Icon: XCircle,
    badge: "bg-red-50 text-red-800",
  },
};

function formatCount(n) {
  if (n === null || n === undefined) return "—";
  return String(n);
}

function SectionCard({ title, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5 sm:p-6 ${className}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--kama-ink-muted)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QuickLink({ href, icon: Icon, label, description }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-[var(--kama-border)] hover:bg-[var(--kama-field)]"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--kama-accent-soft)] text-[var(--kama-accent)]">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium text-[var(--kama-ink)] group-hover:text-[var(--kama-accent)]">
          {label}
          <ArrowRight
            size={14}
            className="opacity-0 transition group-hover:opacity-100"
            aria-hidden
          />
        </span>
        {description && (
          <span className="mt-0.5 block text-sm text-[var(--kama-ink-muted)]">
            {description}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * Role-adaptive profile body (server component).
 * Host/admin blocks are gated by server-provided profile flags only.
 */
export default function ProfileSections({ profile }) {
  const { roles, hostStatus, counts } = profile;
  const hostUi = HOST_STATUS_UI[hostStatus] || HOST_STATUS_UI.none;
  const HostIcon = hostUi.Icon;
  const isVerifiedHost = hostStatus === "verified";
  const isPendingHost = hostStatus === "onboarding";
  const isRejectedHost = hostStatus === "rejected";

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      {/* Guest / traveler */}
      <SectionCard title="Your trips">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[var(--kama-field)] px-3 py-3 text-center">
            <p className="text-xl font-bold text-[var(--kama-ink)]">
              {formatCount(counts.bookingsUpcoming)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Upcoming
            </p>
          </div>
          <div className="rounded-xl bg-[var(--kama-field)] px-3 py-3 text-center">
            <p className="text-xl font-bold text-[var(--kama-ink)]">
              {formatCount(counts.bookingsPast)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Past
            </p>
          </div>
          <div className="rounded-xl bg-[var(--kama-field)] px-3 py-3 text-center">
            <p className="text-xl font-bold text-[var(--kama-ink)]">
              {formatCount(counts.saved)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
              Saved
            </p>
          </div>
        </div>
        <div className="space-y-0.5">
          <QuickLink
            href="/my-bookings"
            icon={CalendarCheck}
            label="My Bookings"
            description="View, change, or cancel stays when policy allows"
          />
          <QuickLink
            href="/saved-properties"
            icon={Heart}
            label="Saved properties"
            description={`${formatCount(counts.saved)} place${counts.saved === 1 ? "" : "s"} saved`}
          />
        </div>
      </SectionCard>

      {/* Host */}
      <SectionCard title="Hosting">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${hostUi.badge}`}
        >
          <HostIcon size={14} aria-hidden />
          {hostUi.label}
        </div>
        <p className="mb-4 text-sm text-[var(--kama-ink-muted)]">{hostUi.hint}</p>

        {isVerifiedHost && (
          <>
            <div className="mb-4 rounded-xl bg-[var(--kama-field)] px-4 py-3">
              <p className="text-sm text-[var(--kama-ink-muted)]">Listings</p>
              <p className="text-2xl font-bold text-[var(--kama-ink)]">
                {formatCount(counts.listings)}
              </p>
            </div>
            <div className="space-y-0.5">
              <QuickLink
                href="/properties/my-listings"
                icon={LayoutList}
                label="My listings"
                description="Edit rates, photos, and availability"
              />
              <QuickLink
                href="/host/reservations"
                icon={CalendarCheck}
                label="Manage reservations"
                description="Guest stays across your properties"
              />
              <QuickLink
                href="/host/listings"
                icon={Building2}
                label="Listing dashboard"
                description="Status and approval overview"
              />
              <QuickLink
                href="/properties/add"
                icon={PlusCircle}
                label="List a property"
                description="Add another stay"
              />
              {!profile.hasCompletedHostOnboarding && (
                <QuickLink
                  href="/onboarding"
                  icon={CheckCircle2}
                  label="Finish host welcome"
                  description="Short intro before listing tools"
                />
              )}
            </div>
          </>
        )}

        {isPendingHost && (
          <div className="space-y-0.5">
            <QuickLink
              href="/host/pending"
              icon={Clock}
              label="Application status"
              description="Check review progress"
            />
          </div>
        )}

        {isRejectedHost && (
          <div className="space-y-0.5">
            <QuickLink
              href="/host/onboarding"
              icon={PlusCircle}
              label="Update & resubmit"
              description="Revise your host application"
            />
            <QuickLink
              href="/host/pending"
              icon={XCircle}
              label="View decision"
              description="See rejection details if available"
            />
          </div>
        )}

        {hostStatus === "none" && (
          <div className="space-y-0.5">
            <QuickLink
              href="/host/onboarding"
              icon={PlusCircle}
              label="Become a host"
              description="Apply to list properties on Kama"
            />
          </div>
        )}
      </SectionCard>

      {/* Ops — server-gated */}
      {roles.admin && (
        <SectionCard title="Operations" className="lg:col-span-2">
          <QuickLink
            href="/ops"
            icon={Shield}
            label="Ops console"
            description="Hosts, listings, and platform activity"
          />
          <QuickLink
            href="/ops/transactions"
            icon={CalendarCheck}
            label="Transactions"
            description="Payment and booking activity"
          />
        </SectionCard>
      )}
    </div>
  );
}
