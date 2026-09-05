import { BRAND_EMAIL } from "@/utils/brand";
import { siteUrl } from "@/utils/audience/paths";

export const ABOUT_PATH = "/about";

export const aboutSeo = {
  title: "About Isisel | African vacation rentals",
  description:
    "Isisel is an African vacation-rental marketplace. Travellers find homes. Hosts list and run stays from their phone — including from abroad.",
  canonical: ABOUT_PATH,
  ogTitle: "About Isisel",
  ogDescription:
    "A marketplace for African homes — built for travellers, hosts, and the people who look after a house from another country.",
};

export const aboutPage = {
  kicker: "About us",
  formula: ["African homes", "Hosts", "Travellers", "Isisel"],
  h1: "A marketplace that knows the place.",
  lede:
    "Isisel is where travellers find African vacation stays, and where hosts — including owners living abroad — list a home and manage bookings from a phone.",
  primaryCta: "Browse stays",
  primaryHref: "/properties",
  secondaryCta: "Become a host",
  secondaryHref: "/host/onboarding",
  heroStory: ["Home", "Host", "Guest", "Stay"],
  heroImage: {
    src: "/home/hero-villa-4k.png",
    alt: "A sunlit villa terrace — the kind of African stay listed on Isisel",
  },

  story: {
    id: "story",
    h2: "Who we are",
    body:
      "Isisel is the public name of Kama Properties: a live marketplace for vacation homes across Africa. We are not a hotel chain. We put real houses in front of people who want to stay in them — and we give the people who own those houses a console to run the stay.",
  },

  work: {
    id: "what-we-do",
    h2: "What we build",
    intro:
      "One catalog for guests. One host console for the operation. That is the product.",
    points: [
      {
        title: "Stays you can actually book",
        body: "Listings with photos, location, rates, and dates. Travellers request a stay on isisel.com.",
      },
      {
        title: "A host office in your pocket",
        body: "Reservations, calendar, messages, and listings — the same console on a laptop or a phone, including from another country.",
      },
      {
        title: "Another door, not a takeover",
        body: "Hosts can keep Airbnb or Booking.com. Isisel is another place travellers looking for African homes can find the door.",
      },
    ],
  },

  people: {
    id: "who",
    h2: "Who Isisel is for",
    items: [
      {
        title: "Travellers",
        body: "People who want a house in Africa — not only a hotel room.",
        href: "/properties",
        label: "Browse stays",
      },
      {
        title: "Hosts & diaspora owners",
        body: "Families and operators who need the house looked after and booked while they are away.",
        href: "/host/onboarding",
        label: "List a stay",
      },
      {
        title: "Hospitality businesses",
        body: "Hotels, villas, and managers who want another booking channel.",
        href: "/business",
        label: "For businesses",
      },
      {
        title: "Founding Hosts",
        body: "The first hosts building Isisel with us — commission-free for a founding term.",
        href: "/founding-hosts",
        label: "Founding 100",
      },
      {
        title: "Creators",
        body: "Travel and culture voices who want to talk about partnership.",
        href: "/influencers",
        label: "For creators",
      },
      {
        title: "Investors",
        body: "People with a serious proposal — not a public fundraising page.",
        href: "/investors",
        label: "For investors",
      },
    ],
  },

  contact: {
    id: "contact",
    h2: "Talk to us",
    body: `Write through the contact form — messages arrive at ${BRAND_EMAIL}. We read mail about stays, hosting, press, and partnerships.`,
    email: "Write to us",
    emailHref: "/contact",
  },

  faq: {
    id: "faq",
    h2: "Questions we hear",
    items: [
      {
        q: "Is Isisel a hotel company?",
        a: "No. Hosts and property owners list their own homes. Isisel is the marketplace and the host console.",
      },
      {
        q: "Where do you operate?",
        a: "African vacation rentals — homes travellers search for from Dakar to Nairobi and beyond. The catalog grows with the hosts who join.",
      },
      {
        q: "Can I run a listing from abroad?",
        a: "Yes. That is a core use: diaspora owners list the family home and manage requests from a phone.",
      },
    ],
  },

  final: {
    h2: "See a stay. Or list one.",
    body: "The catalog is live. The host console is the same place you will use after you are approved.",
    primary: { href: "/properties", label: "Browse stays" },
    secondary: { href: "/host/onboarding", label: "Become a host" },
  },
};

export const aboutJsonLd = {
  path: ABOUT_PATH,
  title: aboutSeo.title,
  description: aboutSeo.description,
  url: siteUrl(ABOUT_PATH),
};
