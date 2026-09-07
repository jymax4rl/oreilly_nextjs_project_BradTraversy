import { BRAND_EMAIL, BRAND_NAME, WHATSAPP_DISPLAY } from "@/utils/brand";
import {
  contactMailto,
  onboardingHref,
  AUDIENCE_CATALOG,
  AUDIENCE_POLICIES,
} from "@/utils/audience/paths";

const SOURCE = "business";

export const businessSeo = {
  title: "Hotel & Property Booking Platform for Businesses | Isisel",
  description:
    "Isisel helps hotels, villas, resorts, and property managers add another booking channel, run stays from one dashboard, and keep more of each night—without traditional platform commission.",
  canonical: "/business",
  ogTitle: "Grow your hospitality business with Isisel",
  ogDescription:
    "Another channel for hotels, resorts, villas, and property managers. Manage listings and reservation requests from your phone. Founding hosts list without the traditional booking-platform commission.",
};

export const businessPage = {
  id: "business",
  breadcrumb: [
    { href: "/", label: "Home" },
    { href: "/business", label: "Business" },
  ],
  hero: {
    eyebrow: "For hospitality businesses",
    h1: "Grow Your Hospitality Business With Isisel",
    lede:
      "You already own or manage accommodation. Isisel is another place travellers can find those properties—and one dashboard to manage listings and reservation requests, including from your phone.",
    primary: {
      href: onboardingHref(SOURCE, "hero"),
      label: "Grow With Isisel",
    },
    secondary: { href: "#how-it-works", label: "Explore How It Works" },
    image: {
      src: "/home/hero-villa-4k.png",
      alt: "Open-air villa terrace and pool overlooking the ocean, the kind of stay hospitality businesses list on Isisel",
    },
    flow: ["Property", "Visibility", "Bookings", "Revenue"],
  },
  problem: {
    id: "booking-strategy",
    h2: "Your properties are an investment. Your booking strategy should be too.",
    lede:
      "Most hospitality businesses already work hard to fill the calendar. The strain is rarely the building—it is how bookings arrive, what they cost, and how scattered the tools feel.",
    points: [
      {
        title: "Too few channels",
        body: "Depending heavily on one or two booking platforms concentrates risk if fees, ranking, or demand shift.",
      },
      {
        title: "Commission on the night",
        body: "Traditional booking platforms often take a percentage of the stay. That is money your property already earned.",
      },
      {
        title: "Many properties, many inboxes",
        body: "Hotels, villa portfolios, and managers juggle calendars, messages, and requests across places that were never designed to work together.",
      },
      {
        title: "Guests who never find you",
        body: "Travellers searching for African stays may never see your hotel, resort, or villa if you are only visible in one catalogue.",
      },
    ],
  },
  opportunity: {
    id: "another-channel",
    h2: "Add another channel to your business",
    lede:
      "Isisel is an African vacation-rental and accommodation marketplace. It sits beside the platforms you already use. Guests discover a listing, request dates on the site, and you respond from the host console.",
    steps: [
      "Your business",
      "Your properties",
      "Isisel",
      "Travellers",
      "Bookings",
      "Revenue",
    ],
    note: "Isisel is an additional channel—not a requirement to leave Airbnb, Booking.com, or your own website.",
  },
  commission: {
    id: "keep-more",
    h2: "Keep more of what you earn",
    lede:
      "Founding hosts list without the traditional booking-platform commission on the night. You set the rate. Guests request the stay on Isisel. You keep the value of that night while the catalogue is still being built.",
    caveat:
      "This is the current founding-host commercial line—not a claim that running a hospitality business has no costs, and not a guaranteed payout on every future stay. Founding Host spots are awarded when a host’s first listing is approved, while the program still has room.",
    exampleLabel: "Illustrative example, not a forecast",
    amount: "€500",
    traditional: {
      title: "Traditional booking platform",
      steps: ["Stay priced at €500", "Percentage commission", "Less revenue retained"],
    },
    isisel: {
      title: "Isisel (founding hosts)",
      steps: [
        "Stay priced at €500",
        "No traditional booking-platform commission on the night",
        "More of that night retained",
      ],
    },
  },
  dashboard: {
    id: "dashboard",
    h2: "Your business, wherever you are",
    lede:
      "The Isisel host console is where verified hosts run the operation: listings, reservation requests, calendar, and guest messages. It is the same console you open on a laptop or a phone.",
    items: [
      { title: "Properties", body: "See every listing you have added and its review status." },
      { title: "Reservations", body: "Open guest date requests and respond when you are ready." },
      { title: "Calendar", body: "Look ahead at stays without hunting through chat threads." },
      { title: "Messages", body: "Keep guest conversation next to the booking, not lost in WhatsApp." },
    ],
    cta: {
      href: onboardingHref(SOURCE, "dashboard"),
      label: "Start Managing Your Properties",
    },
  },
  mobile: {
    id: "mobile",
    h2: "Run your property business from your phone",
    lede:
      "You do not need to sit behind a desk to stay on top of listings and requests. The host console is a mobile-ready web app—open it at the airport, at another property, at home, or on the road.",
    scenes: [
      "At the airport",
      "At another property",
      "At home",
      "On the road",
      "Travelling internationally",
    ],
  },
  scale: {
    id: "portfolio",
    h2: "One business. Multiple properties. One place to manage them.",
    lede:
      "Whether you operate a single villa or a wider hospitality portfolio, you add properties under the same host account and manage them from one console. Isisel is built for professional hosts and operators—not only first-time listers.",
    bands: [
      { n: "1", label: "A flagship stay" },
      { n: "5", label: "A small collection" },
      { n: "20", label: "A working portfolio" },
      { n: "50+", label: "A larger operation" },
    ],
    note: "These bands describe how operators think about scale. They are not a technical capacity claim.",
  },
  audiences: {
    id: "who",
    h2: "Built for hotels, resorts, villas, and property managers",
    lede:
      "If you already have rooms, villas, or a portfolio to fill, this page is for your business—not a generic “list a spare room” pitch.",
    cards: [
      {
        id: "hotels",
        h3: "Hotels",
        body: "Put rooms in front of travellers looking for African stays, and handle Isisel requests beside the rest of your distribution—not instead of it.",
      },
      {
        id: "resorts",
        h3: "Resorts",
        body: "Add another booking channel to an existing distribution strategy without asking guests to abandon how they already find you.",
      },
      {
        id: "villas",
        h3: "Villas",
        body: "Showcase the villa to travellers while keeping listing, requests, and messages in one host console.",
      },
      {
        id: "guest-houses",
        h3: "Guest houses",
        body: "Give a guesthouse a public listing page and a quieter way to receive date requests than a personal chat thread.",
      },
      {
        id: "aparthotels",
        h3: "Aparthotels",
        body: "List apartment-style stays where travellers already browse African vacation rentals, then manage requests from your phone.",
      },
      {
        id: "managers",
        h3: "Property managers",
        body: "Bring the properties you operate onto one marketplace account and work reservation requests from a single console.",
      },
      {
        id: "owners",
        h3: "Multi-property owners",
        body: "Add each stay under the same host account and keep listings, calendars, and guest messages together as the portfolio grows.",
      },
    ],
  },
  pillars: {
    id: "growth",
    h2: "More visibility. More opportunities. More control.",
    items: [
      {
        n: "01",
        h3: "Reach",
        body: "Put your properties in front of travellers looking for accommodation—another door, not a guarantee of occupancy.",
      },
      {
        n: "02",
        h3: "Revenue",
        body: "Avoid traditional booking-platform commission on Isisel nights and retain more of the value those stays generate.",
      },
      {
        n: "03",
        h3: "Control",
        body: "Manage listings and reservation requests in the host dashboard, including from your phone.",
      },
    ],
  },
  steps: {
    id: "how-it-works",
    h2: "How it works",
    lede:
      "Getting on Isisel is a host application, then listings, then the same console you will use on a call with a guest.",
    items: [
      {
        n: "01",
        title: "Create your host account",
        body: "Apply on the host onboarding page. When the application is approved, you get the host console.",
      },
      {
        n: "02",
        title: "Add your properties",
        body: "Create each listing with photos, location, and rates. Listings are reviewed before they go live in the catalogue.",
      },
      {
        n: "03",
        title: "Publish your listings",
        body: "Approved stays appear on Isisel so travellers can find them alongside other African homes.",
      },
      {
        n: "04",
        title: "Manage bookings and grow",
        body: "Guests request dates on the site. You accept or decline from the console and keep the operation in one place.",
      },
    ],
  },
  trust: {
    id: "trust",
    h2: "Built for property owners and hospitality businesses",
    points: [
      "Your properties remain at the centre of the business. Isisel is a channel and a console—not a takeover of the brand you already run.",
      "You do not have to abandon Airbnb, Booking.com, or direct bookings. Isisel is another place travellers can request a stay.",
      "Founding hosts list without the traditional percentage commission on the night while the catalogue is early.",
    ],
    join: "Join the businesses building their presence on Isisel.",
    links: [
      {
        href: onboardingHref(SOURCE, "trust"),
        label: "Create your Isisel host account",
      },
      { href: AUDIENCE_CATALOG, label: "Browse stays already on Isisel" },
      { href: AUDIENCE_POLICIES, label: "Read Isisel policies" },
    ],
  },
  faq: {
    id: "faq",
    h2: "Questions hospitality businesses ask",
    items: [
      {
        q: "What is Isisel?",
        a: "Isisel is an African vacation-rental marketplace. Travellers browse villas, apartments, and other stays; hospitality businesses list properties and manage reservation requests from a host console.",
      },
      {
        q: "Is Isisel another booking platform?",
        a: "Yes. It is an additional accommodation booking channel focused on African stays. Guests request dates on the site rather than only in a private chat.",
      },
      {
        q: "Do I have to stop using Airbnb or Booking.com?",
        a: "No. Isisel is designed as another channel. Keep the platforms that already work for you.",
      },
      {
        q: "Does Isisel charge booking commissions?",
        a: "Founding hosts list without the traditional booking-platform commission on the night. That is the current offer while the catalogue is early—not a promise that every cost of running a hotel or villa disappears.",
      },
      {
        q: "How can I get more bookings for my villa or hotel?",
        a: "You cannot be promised occupancy. What Isisel offers is another public listing, travellers who are already looking for African accommodation, and a console to handle the requests that come in.",
      },
      {
        q: "How do I add my properties?",
        a: "Create a host account, complete the application, and after approval use Add property in the host tools to submit each listing for review.",
      },
      {
        q: "Can I manage multiple properties?",
        a: "Yes. Verified hosts can add more than one listing under the same account and see them together in the host console.",
      },
      {
        q: "Can I manage my properties from my phone?",
        a: "Yes. The host console is a mobile-ready website. Open listings, reservation requests, calendar, and messages in the browser on your phone.",
      },
      {
        q: "How do I receive bookings?",
        a: "Guests request dates on the listing. You see the request in the host console (and can message from there), then accept or decline. Payment between you and the guest follows the terms you agree—Isisel does not invent a guaranteed payout.",
      },
      {
        q: "Can an existing hotel or resort use Isisel?",
        a: "Yes. Hotels, resorts, guest houses, aparthotels, villa owners, and property managers can apply as hosts and list the stays they operate.",
      },
      {
        q: "Is Isisel available for businesses in Africa?",
        a: "Isisel is built for African hospitality. The public catalogue is African vacation rentals; host applications are for people and businesses listing those stays.",
      },
      {
        q: "How do I become a host?",
        a: `Apply at the host onboarding page. If you would rather talk first, email ${BRAND_EMAIL} or message WhatsApp ${WHATSAPP_DISPLAY}.`,
      },
    ],
  },
  finalCta: {
    h2: "Your properties are already working for you. Now give them another opportunity to work harder.",
    lede: "Join Isisel and create another channel for your accommodation business.",
    primary: { href: onboardingHref(SOURCE, "final"), label: "Get Started" },
    secondary: {
      href: contactMailto("Isisel for my hospitality business"),
      label: "Talk to Us",
    },
  },
  sticky: {
    href: onboardingHref(SOURCE, "sticky"),
    label: "Grow With Isisel",
  },
  midCta: {
    href: onboardingHref(SOURCE, "value"),
    label: "Add Your Properties",
  },
};
