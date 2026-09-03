import {
  Home,
  Coins,
  CalendarCheck,
  LayoutDashboard,
  MapPinned,
} from "lucide-react";

/**
 * Founding-host pitch shown as a modal on /host/onboarding.
 * Visuals are Lucide icons (same set as nav / host form), not 3D art.
 */
export const HOST_PITCH_SLIDES = [
  {
    id: "wanted",
    Icon: Home,
    iconLabel: "A stay",
    eyebrow: "Early host",
    title: "Someone is already looking for a home like yours",
    body: "Travelers who want a house — not a hotel — are searching from Dakar to Nairobi. isisel.com is how they find your door.",
  },
  {
    id: "keep",
    Icon: Coins,
    iconLabel: "No commission",
    eyebrow: "Zero commission",
    title: "Keep every night. We take none.",
    body: "Founding hosts list with no cut. You set the rate. You and the guest agree how to pay. The stay stays yours.",
  },
  {
    id: "wait",
    Icon: CalendarCheck,
    iconLabel: "Reservation request",
    eyebrow: "Requests, not missed calls",
    title: "They ask. You answer when you're ready.",
    body: "Guests request dates in the app — while you cook, drive, or sleep. You stop losing stays because you didn't pick up.",
  },
  {
    id: "console",
    Icon: LayoutDashboard,
    iconLabel: "Host console",
    eyebrow: "One quiet console",
    title: "Run hosting without the scramble",
    body: "Calendar, requests, and messages live together. WhatsApp stays for hospitality — not for hunting who asked what, when.",
  },
  {
    id: "light",
    Icon: MapPinned,
    iconLabel: "African marketplace",
    eyebrow: "Built for here",
    title: "From this page to a listing this week",
    body: "A short application. Real people when you need them. Early-host standing on a marketplace made for African travel.",
  },
];
