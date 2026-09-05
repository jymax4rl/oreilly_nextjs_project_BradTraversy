import Link from "next/link";
import {
  Megaphone,
  Target,
  Headset,
  Users,
  Building2,
  LayoutList,
  CreditCard,
  Clapperboard,
  Landmark,
  Award,
  BarChart3,
} from "lucide-react";
import OpsShell from "@/components/ops/OpsShell";
import OpsOverviewPanel from "@/components/ops/OpsOverviewPanel";
import OpsTrafficPanel from "@/components/ops/OpsTrafficPanel";
import OpsFoundingHostsHomeCard from "@/components/ops/OpsFoundingHostsHomeCard";

export const metadata = {
  title: "Home",
};

const TOOLS = [
  {
    href: "/ops/analytics",
    title: "Analytics",
    description: "Growth, reservations, booking value, and investor-ready reports.",
    Icon: BarChart3,
  },
  {
    href: "/ops/marketing/creators",
    title: "Creator Leads",
    description: "Influencer partnership requests from /influencers — separate from host CRM.",
    Icon: Clapperboard,
  },
  {
    href: "/ops/marketing/investors",
    title: "Investor Proposals",
    description: "Inbound investment proposals from /investors — emailed to contact@isisel.com.",
    Icon: Landmark,
  },
  {
    href: "/ops/marketing/acquisition",
    title: "Host Acquisition",
    description: "Prospect pipeline, follow-ups, and conversion to Isisel hosts.",
    Icon: Target,
  },
  {
    href: "/ops/marketing/acquisition/copilot",
    title: "Sales Copilot",
    description: "Live call guide — what to say, tap what they say, save to the CRM.",
    Icon: Headset,
  },
  {
    href: "/ops/marketing",
    title: "Marketing",
    description: "1:1 host letters opened in Gmail, with a searchable log.",
    Icon: Megaphone,
  },
  {
    href: "/ops/users",
    title: "Users",
    description: "Every account on the marketplace.",
    Icon: Users,
  },
  {
    href: "/ops/hosts",
    title: "Hosts",
    description: "Applications and verification.",
    Icon: Building2,
  },
  {
    href: "/ops/founding-hosts",
    title: "Founding Hosts",
    description: "Founding 100 allocation, commission-free controls, and program settings.",
    Icon: Award,
  },
  {
    href: "/ops/listings",
    title: "Listings",
    description: "Approve, reject, or inspect stays.",
    Icon: LayoutList,
  },
  {
    href: "/ops/transactions",
    title: "Payments",
    description: "Booking charges and settlements.",
    Icon: CreditCard,
  },
];

export default function OpsHomePage() {
  return (
    <OpsShell
      title="Operations"
      subtitle="Moderation, traffic, and outreach in one console."
    >
      <section aria-labelledby="ops-tools-heading">
        <h2
          id="ops-tools-heading"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--kama-ink-muted)]"
        >
          Tools
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.Icon;
            return (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="ops-card flex items-center gap-3 py-3 transition hover:bg-[#fafafa]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#ececec] text-[#0a0a0a]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium tracking-tight text-[#0a0a0a]">
                      {tool.title}
                    </span>
                    <p className="mt-0.5 text-[12px] leading-snug text-[#6b6b6b]">
                      {tool.description}
                    </p>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <OpsFoundingHostsHomeCard />
      <OpsTrafficPanel />
      <OpsOverviewPanel />
    </OpsShell>
  );
}
