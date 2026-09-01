import Link from "next/link";
import OpsShell from "@/components/ops/OpsShell";
import OpsOverviewPanel from "@/components/ops/OpsOverviewPanel";
import OpsTrafficPanel from "@/components/ops/OpsTrafficPanel";

export const metadata = {
  title: "Home",
};

const TOOLS = [
  {
    href: "/ops/users",
    title: "Users",
    description: "See every account created on the platform.",
  },
  {
    href: "/ops/hosts",
    title: "Hosts",
    description: "Review host applications and verification status.",
  },
  {
    href: "/ops/listings",
    title: "Listings",
    description: "Approve, reject, or inspect property submissions.",
  },
  {
    href: "/ops/transactions",
    title: "Transactions",
    description: "Browse booking payments and settlement records.",
  },
];

export default function OpsHomePage() {
  return (
    <OpsShell
      title="Operations"
      subtitle="Staff tools for marketplace moderation. Live traffic shows how close browsing load is to the 3,000-visitor planning target."
    >
      <section aria-labelledby="ops-tools-heading">
        <h2
          id="ops-tools-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
        >
          Tools
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="ops-card block h-full transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-base font-semibold text-[var(--kama-ink)]">
                  {tool.title}
                </span>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--kama-ink-muted)]">
                  {tool.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <OpsTrafficPanel />
      <OpsOverviewPanel />
    </OpsShell>
  );
}
