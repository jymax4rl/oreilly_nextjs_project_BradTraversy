/**
 * Shared ops console navigation.
 * Desktop rail shows every item.
 * Mobile dock shows `mobile: "tab"` + a More sheet for the rest.
 */
import {
  Home,
  Users,
  Building2,
  LayoutList,
  CalendarCheck,
  CreditCard,
  Megaphone,
  Award,
  BarChart3,
  MessageSquare,
  BookOpen,
} from "lucide-react";

export const OPS_NAV = [
  {
    href: "/ops",
    label: "Home",
    shortLabel: "Home",
    exact: true,
    Icon: Home,
    mobile: "tab",
  },
  {
    href: "/ops/analytics",
    label: "Analytics",
    shortLabel: "Stats",
    Icon: BarChart3,
    mobile: "tab",
  },
  {
    href: "/ops/listings",
    label: "Listings",
    shortLabel: "Listings",
    Icon: LayoutList,
    mobile: "tab",
  },
  {
    href: "/ops/reservations",
    label: "Reservations",
    shortLabel: "Stays",
    Icon: CalendarCheck,
    mobile: "tab",
  },
  {
    href: "/documentation",
    label: "Docs",
    shortLabel: "Docs",
    Icon: BookOpen,
    mobile: "more",
  },
  {
    href: "/ops/users",
    label: "Users",
    shortLabel: "Users",
    Icon: Users,
    mobile: "more",
  },
  {
    href: "/ops/messages",
    label: "Messages",
    shortLabel: "Messages",
    Icon: MessageSquare,
    mobile: "more",
  },
  {
    href: "/ops/hosts",
    label: "Hosts",
    shortLabel: "Hosts",
    Icon: Building2,
    mobile: "more",
  },
  {
    href: "/ops/founding-hosts",
    label: "Founding",
    shortLabel: "Founding",
    Icon: Award,
    mobile: "more",
  },
  {
    href: "/ops/transactions",
    label: "Payments",
    shortLabel: "Payments",
    Icon: CreditCard,
    mobile: "more",
  },
  {
    href: "/ops/marketing",
    label: "Marketing",
    shortLabel: "Marketing",
    Icon: Megaphone,
    mobile: "more",
  },
];

export const OPS_MOBILE_TABS = OPS_NAV.filter((item) => item.mobile === "tab");
export const OPS_MOBILE_MORE = OPS_NAV.filter((item) => item.mobile !== "tab");

export function opsNavActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
