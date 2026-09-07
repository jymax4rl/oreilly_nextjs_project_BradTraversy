import { siteUrl } from "@/utils/audience/paths";

export const HORIZON_PATH = "/horizon";

export const horizonSeo = {
  title:
    "Horizon Bijilo Sea-View Apartments for Sale | $130,000 | Isisel Gambia",
  description:
    "Buy a 2-bedroom sea-view apartment at Horizon by Swami India in Bijilo, The Gambia. 30 units left from $130,000. Own the home and manage stays commission-free on Isisel — Africa’s phone-first PMS.",
  canonical: HORIZON_PATH,
  keywords: [
    "Horizon Bijilo",
    "Gambia real estate investment",
    "sea view apartments Bijilo",
    "buy apartment The Gambia",
    "Swami India Horizon",
    "Isisel property management",
    "commission-free vacation rental Africa",
    "Bijilo beach apartments for sale",
  ],
  ogTitle: "Horizon Bijilo — Sea-view apartments from $130,000 | Isisel",
  ogDescription:
    "30 two-bedroom units left at Horizon in Bijilo, The Gambia. Own a seaside home and run stays commission-free from your phone on Isisel.",
  ogImage: "/horizon/exterior-palms.jpg",
  ogImageWidth: 1027,
  ogImageHeight: 912,
  pageUrl: () => siteUrl(HORIZON_PATH),
  absoluteOgImage: () => siteUrl("/horizon/exterior-palms.jpg"),
};

export const horizonPage = {
  brand: "Isisel",
  partner: "Swami India",
  project: "Horizon",
  place: "Bijilo, The Gambia",
  editorial: {
    seal: "Horizon Bijilo · Isisel ·",
    line1: "The sea view",
    script: "yours",
    line2: "this year",
    reasons: "Three reasons to own Horizon",
    placeLine: "A place to own — then host year after year",
    magnetic: "Request a call",
    scroll: "Scroll",
    coast: [
      { label: "Bijilo Beach", time: "4 min" },
      { label: "National Park", time: "6 min" },
      { label: "Senegambia", time: "8 min" },
      { label: "Banjul Airport", time: "25 min" },
    ],
  },
  hero: {
    image: {
      src: "/horizon/exterior-palms.jpg",
      alt: "Horizon by Swami India — sea-view towers behind palms on Bijilo beach",
      width: 1027,
      height: 912,
    },
    kicker: "Isisel × Swami India",
    h1: "Horizon Bijilo.\nOwn the sea view.",
    lede: "Thirty 2-bedroom apartments left from $130,000. Host guests yourself on Isisel — Africa’s commission-free phone PMS.",
    primaryCta: "Request a call",
    secondaryCta: "Contact us",
  },
  offer: {
    id: "offer",
    h2: "Thirty sea-view homes still open.",
    intro:
      "A finished tower on Bijilo’s Atlantic corridor — park air, beach light, and a clear sea-view plate you can own and operate.",
    stats: [
      { value: "30", label: "units left" },
      { value: "2", label: "bedrooms" },
      { value: "$130,000", label: "sea-view entry" },
    ],
    note: "Sea-side investment · Horizon by Swami India · Bijilo Beach, The Gambia",
  },
  revolution: {
    id: "phone",
    h2: "A whole property business in your pocket.",
    lede: "Africa’s next owners will not sit behind a desk. They will buy once, then run calendars, guests, and payouts from the phone — without giving a cut to a middleman.",
    points: [
      {
        title: "Own the asset",
        body: "Title on a finished two-bedroom home overlooking the Atlantic — not a timeshare, not a paper promise.",
      },
      {
        title: "Operate commission-free",
        body: "List, accept stays, message guests, and track nights on Isisel. Your home. Your rules. Your revenue.",
      },
      {
        title: "One console, anywhere",
        body: "The same host console on a laptop in Dakar or a handset in London. Reservations, calendar, and inbox travel with you.",
      },
    ],
  },
  story: {
    id: "walk",
    kicker: "A walk through the building",
    h2: "From the street to the Atlantic rim.",
    lede: "Slide the reel. Then scroll the rooms — lobby, water, roof, and the finished two-bedroom.",
    reelHint: "Swipe",
    chapters: [
      {
        index: "01",
        title: "Arrive at twilight.",
        body: "Glass, bronze, and warm light at the kerb. Horizon meets you at street level — then lifts you toward the sea.",
        image: {
          src: "/horizon/street-twilight.jpg",
          alt: "Horizon lobby entrance at twilight",
          width: 852,
          height: 507,
        },
      },
      {
        index: "02",
        title: "A lobby built to linger.",
        body: "Marble, chandelier, a desk that knows your name. The first room of ownership is not a corridor — it is a welcome.",
        image: {
          src: "/horizon/lobby.jpg",
          alt: "Horizon lobby with marble floors and chandelier",
          width: 952,
          height: 667,
        },
      },
      {
        index: "03",
        title: "Water on the podium.",
        body: "An infinity edge above the palms. Guests will remember the glow; you will remember the asset that holds it.",
        image: {
          src: "/horizon/pool-terrace.jpg",
          alt: "Horizon podium infinity pool at dusk",
          width: 962,
          height: 465,
        },
      },
      {
        index: "04",
        title: "Dinner above the canopy.",
        body: "The roof looks over Bijilo’s green and the Atlantic beyond. This is the view you host — and the view you keep.",
        image: {
          src: "/horizon/rooftop-terrace.jpg",
          alt: "Horizon rooftop terrace toward the Atlantic",
          width: 840,
          height: 445,
        },
      },
      {
        index: "05",
        title: "The two-bedroom, finished.",
        body: "Living, dining, kitchen in one calm plate. Title on a home you can live in, list, and run from your phone.",
        image: {
          src: "/horizon/interior.jpg",
          alt: "Horizon two-bedroom living, dining, and kitchen",
          width: 647,
          height: 372,
        },
      },
    ],
  },
  gallery: {
    id: "building",
    h2: "Horizon, as built for the Atlantic rim.",
    images: [
      {
        src: "/horizon/exterior-palms.jpg",
        alt: "Horizon twin towers behind palms and Bijilo beach at golden hour",
        width: 1027,
        height: 912,
        frame: "lead",
      },
      {
        src: "/horizon/street-twilight.jpg",
        alt: "Horizon lobby entrance at twilight with warm interior light",
        width: 852,
        height: 507,
        frame: "std",
      },
      {
        src: "/horizon/lobby.jpg",
        alt: "Horizon lobby with marble floors, chandelier, and reception",
        width: 952,
        height: 667,
        frame: "std",
      },
      {
        src: "/horizon/pool-terrace.jpg",
        alt: "Horizon podium infinity pool and terrace at dusk",
        width: 962,
        height: 465,
        frame: "wide",
      },
      {
        src: "/horizon/rooftop-terrace.jpg",
        alt: "Horizon rooftop terrace looking over palms toward the Atlantic",
        width: 840,
        height: 445,
        frame: "wide",
      },
      {
        src: "/horizon/interior.jpg",
        alt: "Horizon two-bedroom interior — living, dining, and kitchen",
        width: 647,
        height: 372,
        frame: "card",
      },
      {
        src: "/horizon/facade-ocean.jpg",
        alt: "Horizon facade with balconies facing palms and the ocean",
        width: 637,
        height: 370,
        frame: "card",
      },
    ],
  },
  location: {
    id: "bijilo",
    h2: "Bijilo — beach, park, and open sea.",
    body: "Horizon sits in Bijilo with the Atlantic ahead and Bijilo National Park beside it. Own where guests already want to stay — then host them yourself on Isisel.",
    caption: "Aerial survey — plot, sea-view cone, Bijilo Beach & National Park",
    image: {
      src: "/horizon/brochure-hero.jpg",
      alt: "Aerial survey of Horizon plot in Bijilo showing sea-view corridor to Bijilo Beach and Bijilo National Park",
      width: 2048,
      height: 1359,
    },
  },
  faq: {
    id: "faq",
    h2: "Buying Horizon — answers first.",
    items: [
      {
        q: "Where is Horizon located?",
        a: "Horizon is in Bijilo, The Gambia — between the Atlantic coast and Bijilo National Park, near the Bijilo Beach corridor and established resorts.",
      },
      {
        q: "How many apartments are still available?",
        a: "Thirty units remain for purchase. The featured offer is a two-bedroom sea-view apartment from $130,000.",
      },
      {
        q: "What do I get when I buy?",
        a: "You own a finished residential apartment at Horizon by Swami India. You can live in it, host guests, or both — title is yours.",
      },
      {
        q: "How does Isisel help after purchase?",
        a: "Isisel is a phone-first property management platform. List the home, manage calendars and guests, and keep revenue commission-free — from anywhere.",
      },
      {
        q: "How do I request details or a call?",
        a: "Use Request a call or Contact us on this page. Your note goes to jimmeh@isisel.com and the Isisel team follows up about remaining units.",
      },
    ],
  },
  close: {
    h2: "Ready to own Horizon?",
    lede: "Tell us how to reach you. Jimmeh will follow up about the remaining units and how Isisel runs the home on your phone.",
    primaryCta: "Request a call",
    secondaryCta: "Contact us",
  },
  form: {
    titleCall: "Request a call",
    titleContact: "Contact us",
    introCall:
      "Share your details. We’ll call about Horizon’s remaining two-bedrooms and phone-first ownership on Isisel.",
    introContact:
      "Write to the Isisel team. Your note goes straight to jimmeh@isisel.com.",
    name: "Full name",
    email: "Email",
    phone: "Phone (with country code)",
    intentCall: "I’d like a call",
    intentMessage: "I’d like an email reply",
    message: "What should we know?",
    messagePlaceholder:
      "Budget, timeline, whether you’ll live in the home or host it…",
    submit: "Send",
    sending: "Sending…",
    success: "Received — we’ll be in touch shortly.",
    error: "Something went wrong. Try again or email jimmeh@isisel.com.",
    required: "Please fill in the required fields.",
    close: "Close",
  },
};

/** Extra JSON-LD beyond WebPage / FAQ (RealEstateListing + Offer). */
export function horizonListingJsonLd() {
  const pageUrl = siteUrl(HORIZON_PATH);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${pageUrl}#listing`,
    name: "Horizon Bijilo — 2-bedroom sea-view apartments",
    description: horizonSeo.description,
    url: pageUrl,
    image: [
      siteUrl("/horizon/exterior-palms.jpg"),
      siteUrl("/horizon/brochure-hero.jpg"),
    ],
    datePosted: "2026-03-01",
    offers: {
      "@type": "Offer",
      price: "130000",
      priceCurrency: "USD",
      availability: "https://schema.org/LimitedAvailability",
      url: pageUrl,
      seller: {
        "@type": "Organization",
        name: "Isisel",
        url: siteUrl("/"),
      },
    },
    about: {
      "@type": "Apartment",
      name: "Horizon 2-bedroom sea-view apartment",
      numberOfRooms: 2,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bijilo",
        addressCountry: "GM",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 13.4194,
        longitude: -16.7237,
      },
    },
  };
}
