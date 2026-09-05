import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Heart,
  LayoutList,
  MessageSquare,
  Shield,
  Smartphone,
  UserRound,
  Wallet,
} from "lucide-react";
import NotificationToggles from "@/components/settings/NotificationToggles";
import CurrencyPreference from "@/components/settings/CurrencyPreference";
import SignOutButton from "@/components/settings/SignOutButton";
import HostPushPrompt from "@/components/host/HostPushPrompt";
import { BECOME_A_HOST_HREF } from "@/utils/hostPwaInstall";

function Section({ title, description, children }) {
  return (
    <section className="border-b border-[var(--kama-border)] py-8 last:border-b-0">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--kama-ink-muted)]">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm text-[var(--kama-ink-muted)]">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DeepLink({ href, icon: Icon, label, description }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl py-2.5 transition hover:bg-[var(--kama-field)]"
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
 * Role-adaptive Settings body. Only notification keys relevant to the user are shown.
 */
export default function SettingsSections({ settings }) {
  const { roles, hostStatus, preferences, auth, email } = settings;
  const isVerifiedHost = hostStatus === "verified" || roles.host;
  const isPendingHost = hostStatus === "onboarding";
  const isRejectedHost = hostStatus === "rejected";
  const isAdmin = roles.admin;
  const showBecomeHost = hostStatus === "none" && !isVerifiedHost && !isAdmin;

  const guestNotifKeys = ["bookingUpdates"];
  const hostNotifKeys = isVerifiedHost
    ? ["hostNewBookings", "hostBookingChanges"]
    : [];
  const notificationKeys = [...guestNotifKeys, ...hostNotifKeys];

  return (
    <div className="mt-2">
      <Section
        title="Account & security"
        description="Sign-in is Google OAuth only — no password is stored on Isisel. Edit your public name and photo on Profile."
      >
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-[var(--kama-ink-muted)]">Email</dt>
            <dd className="mt-0.5 font-medium text-[var(--kama-ink)]">{email}</dd>
            <dd className="mt-1 text-xs text-[var(--kama-ink-muted)]">
              Managed by {auth?.label || "Google"}. Change it in your Google
              account.
            </dd>
          </div>
          <div>
            <dt className="text-[var(--kama-ink-muted)]">Sign-in method</dt>
            <dd className="mt-0.5 font-medium text-[var(--kama-ink)]">
              {auth?.label || "Google"} OAuth
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <DeepLink
            href="/profile"
            icon={UserRound}
            label="Open Profile"
            description="Display name, photo, and role overview"
          />
        </div>
      </Section>

      <Section title="Display" description="How prices appear while you browse.">
        <CurrencyPreference />
      </Section>

      <Section
        title="Email notifications"
        description={
          isVerifiedHost
            ? "Trip emails for your stays, plus reservation alerts for your listings. Manual resend from host tools still sends."
            : "Emails about your bookings. Messages stay in-app."
        }
      >
        <NotificationToggles
          initialNotifications={preferences.notifications}
          visibleKeys={notificationKeys}
        />
        {isVerifiedHost ? (
          <div className="mt-4">
            <HostPushPrompt compact />
          </div>
        ) : null}
        <div className="mt-2">
          <DeepLink
            href="/messages"
            icon={MessageSquare}
            label="Messages"
            description="In-app conversations (no email toggle yet)"
          />
        </div>
      </Section>

      {/* Travelers (guests and hosts who also book) */}
      <Section
        title="Trips & saved"
        description="Your stays and bookmarks as a traveler."
      >
        <div className="space-y-0.5">
          <DeepLink
            href="/my-bookings"
            icon={CalendarCheck}
            label="My Bookings"
            description="Upcoming and past stays"
          />
          <DeepLink
            href="/saved-properties"
            icon={Heart}
            label="Saved properties"
            description="Places you bookmarked"
          />
        </div>
      </Section>

      {/* Hosting — gated by hostStatus */}
      {(isVerifiedHost ||
        isPendingHost ||
        isRejectedHost ||
        showBecomeHost) && (
        <Section
          title="Hosting"
          description={
            isVerifiedHost
              ? "Listing tools and how guest payments work today."
              : "Host application and listing access."
          }
        >
          {isVerifiedHost && (
            <>
              <div className="mb-4 rounded-xl bg-[var(--kama-field)] px-4 py-3 text-sm text-[var(--kama-ink-muted)]">
                <p className="flex items-start gap-2 font-medium text-[var(--kama-ink)]">
                  <Wallet
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--kama-accent)]"
                    aria-hidden
                  />
                  Guest payments
                </p>
                <p className="mt-1.5 leading-relaxed">
                  Guests pay at checkout via Flutterwave (cards and mobile
                  money where supported). Host payout setup is not self-serve in
                  Settings yet — contact support if you need settlement help.
                </p>
              </div>
              <div className="space-y-0.5">
                <DeepLink
                  href="/host"
                  icon={Building2}
                  label="Host console"
                  description="Reservations, calendar, listings, inbox"
                />
                <DeepLink
                  href="/host/install?next=/settings"
                  icon={Smartphone}
                  label="Install Isisel app"
                  description="Add to home screen for faster hosting"
                />
              </div>
            </>
          )}

          {isPendingHost && (
            <>
              <DeepLink
                href="/host/pending"
                icon={Building2}
                label="Application status"
                description="Your host application is under review"
              />
              <DeepLink
                href="/host/install?next=/host/pending"
                icon={Smartphone}
                label="Install Isisel app"
                description="Add to home screen while you wait"
              />
            </>
          )}

          {isRejectedHost && (
            <DeepLink
              href="/host/onboarding"
              icon={Building2}
              label="Update & resubmit"
              description="Revise your host application"
            />
          )}

          {showBecomeHost && (
            <DeepLink
              href={BECOME_A_HOST_HREF}
              icon={Building2}
              label="Become a host"
              description="Apply to list properties on Isisel"
            />
          )}
        </Section>
      )}

      {isAdmin && (
        <Section
          title="Operations"
          description="Staff tools live in the ops console — no extra alert prefs yet."
        >
          <div className="space-y-0.5">
            <DeepLink
              href="/ops"
              icon={Shield}
              label="Ops console"
              description="Hosts, listings, and transactions"
            />
            <DeepLink
              href="/ops/hosts"
              icon={Shield}
              label="Host applications"
              description="Review and approve hosts"
            />
            <DeepLink
              href="/ops/transactions"
              icon={CalendarCheck}
              label="Transactions"
              description="Payment and booking activity"
            />
          </div>
        </Section>
      )}

      <Section title="Session">
        <SignOutButton />
      </Section>
    </div>
  );
}
