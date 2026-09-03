import { BRAND_EMAIL } from "@/utils/brand";
import { siteUrl } from "@/utils/audience/paths";

export const INVESTOR_PATH = "/investors";

export const investorSeo = {
  title: "Investor Proposals | Isisel",
  description:
    "Isisel is an African vacation-rental marketplace. Send a proposal to discuss investment, partnership, or strategic capital.",
  canonical: INVESTOR_PATH,
  ogTitle: "Propose an investment conversation with Isisel",
  ogDescription:
    "Tell us who you are and what you want to discuss. We read every proposal and reply from contact@isisel.com.",
};

export const investorPage = {
  kicker: "For investors",
  formula: ["Capital", "African travel", "Isisel", "A conversation"],
  h1: "Send a proposal. We'll read it.",
  lede:
    "Isisel is building a marketplace for African vacation rentals — hosts, travellers, and the console that runs the stay. If you want to discuss investment or a strategic partnership, send a written proposal. We reply by email.",
  primaryCta: "Send a proposal",
  secondaryCta: "What we are building",
  heroStory: ["Investor", "Proposal", "Email", "Conversation"],
  heroImage: {
    src: "/home/hero-villa-4k.png",
    alt: "A villa stay on the African coast — the kind of inventory Isisel lists",
  },

  opportunity: {
    id: "opportunity",
    h2: "What you would be looking at",
    intro:
      "This is not a public fundraising round page. It is a door for serious people who already have a thesis on travel, Africa, marketplaces, or hospitality infrastructure.",
    points: [
      {
        title: "The product",
        body: "A live marketplace: listings, host applications, reservation requests, calendar, and guest messaging — with founding hosts listing without traditional platform commission on the night.",
      },
      {
        title: "The market",
        body: "African stays for travellers who want a home, not only a hotel. Distribution today is still fragmented across chat, OTAs, and word of mouth.",
      },
      {
        title: "The ask from you",
        body: "A written proposal: who you are, what you want to discuss, and on what terms you imagine a conversation. We do not publish a deck or a raise amount here.",
      },
      {
        title: "How we reply",
        body: "Every proposal is emailed to the Isisel inbox. Reply-to is your address. If it is a fit to talk, we write back.",
      },
    ],
    close:
      "Unsolicited spam will be ignored. A short, specific proposal is enough.",
  },

  benefits: {
    id: "why-write",
    h2: "What to put in a proposal",
    note: "There is no template. These are the questions we actually use when we open the email.",
    items: [
      {
        title: "Who you are",
        body: "Name, firm or family office, and the role you play. A website or LinkedIn helps.",
      },
      {
        title: "Why Isisel",
        body: "What in African travel, hospitality, or marketplaces makes this interesting to you — not a generic 'we invest in startups' line.",
      },
      {
        title: "What you propose",
        body: "Equity, debt, a commercial partnership, an introduction, or something else. Be explicit. We cannot guess the structure.",
      },
      {
        title: "What you need next",
        body: "A call, a memo, or a decline. Say which. We will not send materials we have not prepared for a public page.",
      },
    ],
  },

  types: {
    id: "who",
    h2: "Who this page is for",
    note: "If you are looking for a guest stay, this is not it — browse properties instead.",
    items: [
      {
        slug: "angels",
        label: "Angels & operators",
        body: "People who have built or hosted in travel and want to back the next marketplace in this region.",
      },
      {
        slug: "funds",
        label: "Funds",
        body: "Early-stage vehicles with a thesis on Africa, marketplaces, or hospitality tech.",
      },
      {
        slug: "family",
        label: "Family offices",
        body: "Long-horizon capital looking at real travel demand, not a tourism slogan.",
      },
      {
        slug: "strategic",
        label: "Strategic partners",
        body: "Distribution, payments, or hospitality groups who want a commercial conversation that is not a listing application.",
      },
    ],
  },

  models: {
    id: "work-together",
    h2: "What we can discuss",
    intro:
      "Nothing below is an offer of securities. It is a map of conversations we will actually open if the proposal is concrete.",
    items: [
      {
        title: "Investment",
        body: "If you want to talk about capital, say so in the proposal: instrument, range you have in mind, and timeline. We will not negotiate terms in the form.",
        badge: "Capital",
      },
      {
        title: "Partnership",
        body: "Distribution, payments, or co-branded inventory. Describe the asset you bring and what you want in return.",
        badge: "Commercial",
      },
      {
        title: "Introductions",
        body: "If you are connecting us to someone else, say who and why. Warm context beats a cold CC.",
      },
      {
        title: "Not a fit",
        body: "If you need a public data room, a guaranteed return, or a listing on the marketplace, this form is the wrong door.",
      },
    ],
  },

  bigIdea: {
    id: "voice",
    h2: "We would rather read a proposal than take a cold call.",
    body: "A written note lets us see whether there is a real conversation. If there is, you will hear from us at the email you give.",
  },

  why: {
    id: "isisel",
    h2: "Why Isisel?",
    intro:
      "Isisel is live. Travellers browse African stays. Hosts apply, list, and run reservations from a console. Creators can propose partnerships. This page is the equivalent door for capital and strategic proposals.",
    chain: [
      { label: "Hosts", href: "/business" },
      { label: "Properties", href: "/properties" },
      { label: "Isisel", href: "/" },
      { label: "Travellers", href: "/properties" },
    ],
    creatorsLabel: "Investors",
    creatorsNote:
      "You sit next to the business — capital and partnerships that should match a marketplace already taking bookings.",
    more: [
      { href: "/properties", label: "Browse stays" },
      { href: "/business", label: "For hospitality businesses" },
      { href: "/influencers", label: "For creators" },
      { href: `mailto:${BRAND_EMAIL}?subject=${encodeURIComponent("Investor proposal")}`, label: "Email us directly" },
    ],
  },

  journey: {
    id: "journey",
    h2: "How a proposal is handled",
    note: "No application maze. One form, one inbox.",
    steps: [
      {
        n: "01",
        title: "Write the proposal",
        body: "Name, email, and what you want to discuss. Firm and website help. Twenty words is too thin; a novel is too much.",
      },
      {
        n: "02",
        title: "We receive the email",
        body: "The form sends to the Isisel contact inbox with your address as reply-to. You also appear in the internal investor pipeline.",
      },
      {
        n: "03",
        title: "We reply or we don't",
        body: "If it is a conversation we can have, we write back. If it is a mass blast, we won't.",
      },
    ],
  },

  proof: {
    id: "now",
    h2: "The product is already running.",
    body: "This page exists because people asked how to reach us about capital. Use it. Do not treat it as a priced round or a solicitation in any jurisdiction.",
  },

  faq: {
    id: "faq",
    h2: "Questions investors ask",
    items: [
      {
        q: "Is this a fundraising round?",
        a: "No public round is announced here. This is a channel to send a proposal so we can decide whether to talk.",
      },
      {
        q: "Where does my email go?",
        a: `To ${BRAND_EMAIL}. The form uses that inbox so you are not writing into a void. Reply-to is the address you enter.`,
      },
      {
        q: "Can I just email you?",
        a: `Yes. Write ${BRAND_EMAIL} with a clear subject. The form is faster for us to file. Both reach the same people.`,
      },
      {
        q: "Do you send a pitch deck automatically?",
        a: "No. If a conversation makes sense, we will share what is appropriate. Do not expect a download after submit.",
      },
      {
        q: "I want to list a property. Is this the page?",
        a: "No. Use Become a host. This page is for investment and strategic proposals only.",
      },
    ],
  },

  final: {
    h2: "If you have a proposal, send it.",
    body: "Name, email, and the idea. We'll take it from the inbox.",
    cta: "Send a proposal",
  },

  form: {
    title: "Send an investment proposal",
    lede: "Name, email, and your proposal. Firm details help us reply to the right person.",
    name: "Full name",
    email: "Email",
    organization: "Firm or organization",
    role: "Your role",
    firmUrl: "Website or LinkedIn",
    proposal: "Proposal",
    proposalHint:
      "What you want to discuss, why Isisel, and any structure or range you already have in mind.",
    submit: "Send proposal",
    sending: "Sending…",
    close: "Close",
    successTitle: (name) => `Received, ${name}.`,
    successBody:
      "Your proposal is in the Isisel inbox. We'll reply from that address if we should talk.",
    error: `Something didn't go through. Try again, or email ${BRAND_EMAIL} directly.`,
    required: "Please add your name, a valid email, and a proposal (at least a short paragraph).",
  },

  pageUrl: () => siteUrl(INVESTOR_PATH),
};
