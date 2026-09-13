import { BRAND_EMAIL } from "@/utils/brand";
import { siteUrl } from "@/utils/audience/paths";

export const CREATOR_PATH = "/influencers";

export const creatorSeo = {
  title: "Travel Creator & Influencer Partnerships | Isisel",
  description:
    "Partner with Isisel hosts: share property promo codes, guests get a discount, you earn commission after the stay. Or tell us who you are — name and email is enough. No follower minimum.",
  canonical: CREATOR_PATH,
  ogTitle: "Turn your influence into new opportunities | Isisel",
  ogDescription:
    "Host-invited promo codes, guest discounts, and a creator console — plus broader partnerships for travel stories across Africa.",
};

export const creatorJsonLd = {
  path: CREATOR_PATH,
  title: creatorSeo.title,
  description: creatorSeo.description,
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Creator partnerships", href: CREATOR_PATH },
  ],
};

export const creatorPage = {
  kicker: "For creators",
  formula: [
    "Your audience",
    "Your content",
    "Isisel",
    "Partnership opportunities",
  ],
  h1: "Turn your influence into new opportunities.",
  lede:
    "Are you a creator talking about travel, lifestyle, Africa, hospitality, or experiences? Hosts can invite you with property promo codes — or start a broader conversation with Isisel.",
  primaryCta: "Let's Discuss",
  secondaryCta: "See how host codes work",
  heroStory: ["Creator", "Audience", "Travel", "Isisel", "Opportunity"],
  heroImage: {
    src: "/home/hero-villa-4k.png",
    alt: "Travellers arriving at a sunlit villa — the kind of stay creators love to film",
  },

  opportunity: {
    id: "opportunity",
    h2: "Your influence can open doors.",
    intro:
      "You have something a marketplace cannot simply manufacture: trust, attention, community, local knowledge, cultural perspective, travel inspiration, and storytelling.",
    points: [
      {
        title: "Trust",
        body: "People believe you because you sound like yourself — not like a brochure.",
      },
      {
        title: "Attention",
        body: "You already hold space in someone's day. That's rare.",
      },
      {
        title: "Community",
        body: "Your audience isn't a media buy. It's a group of people who chose you.",
      },
      {
        title: "Place & culture",
        body: "You notice what makes a destination feel alive. That's the story travellers actually want.",
      },
    ],
    close:
      "We're not just looking for people to post an ad. We're interested in building relationships with creators.",
  },

  benefits: {
    id: "why-partner",
    h2: "Why partner with Isisel?",
    note: "Partnerships can be tailored. Nothing below is a guarantee — it's a map of what we can discuss.",
    items: [
      {
        title: "Host promo codes",
        body: "When a host invites you, you get codes for specific stays. Guests book with your code, receive a discount, and you earn commission after checkout.",
      },
      {
        title: "Creator console",
        body: "Track assigned codes, check property availability for your stories, and follow earnings — once you've claimed a host invite.",
      },
      {
        title: "Exclusive campaigns",
        body: "Eligible creators may also be invited into Isisel campaigns and launches, depending on timing and fit.",
      },
      {
        title: "Access to hospitality",
        body: "Work with a platform connecting travellers and accommodation — villas, apartments, and stays across Africa.",
      },
      {
        title: "Creative freedom",
        body: "Create in your own voice. We'd rather you sound like you than read generic advertising copy.",
      },
      {
        title: "Long-term partnerships",
        body: "We're more interested in relationships than a one-off promotional post. Host codes are one path — broader collaborations are another.",
      },
    ],
  },

  types: {
    id: "who",
    h2: "Who are we looking to work with?",
    note: "No minimum follower count. Fit, voice, and audience matter more than a number.",
    items: [
      {
        label: "Travel creators",
        body: "Creators inspiring people to discover new destinations.",
        slug: "travel",
      },
      {
        label: "Lifestyle creators",
        body: "Creators whose audiences care about experiences, lifestyle, and travel.",
        slug: "lifestyle",
      },
      {
        label: "Africa-focused creators",
        body: "Creators showcasing the beauty, culture, and experiences of Africa.",
        slug: "africa",
      },
      {
        label: "YouTube creators",
        body: "Long-form storytellers creating travel guides, destination content, and experiences.",
        slug: "youtube",
      },
      {
        label: "TikTok creators",
        body: "Creators turning destinations and experiences into highly engaging short-form content.",
        slug: "tiktok",
      },
      {
        label: "Instagram creators",
        body: "Creators combining visual storytelling with travel and lifestyle.",
        slug: "instagram",
      },
    ],
  },

  models: {
    id: "work-together",
    h2: "What could a partnership look like?",
    intro:
      "There isn't a single template. Hosts can invite you into a live promo-code program; other collaborations stay conversation-led.",
    items: [
      {
        title: "Host promo codes",
        badge: "Live with hosts",
        body: "A host assigns you a code for a property — guest discount and your commission rate are set by that host. Share the stay, guests book with your code, you earn after the stay.",
      },
      {
        title: "Content partnerships",
        body: "You produce travel or property content featuring Isisel, in a way that still feels like you.",
      },
      {
        title: "Campaigns",
        body: "You take part in an Isisel marketing campaign around a launch, destination, or season.",
      },
      {
        title: "Destination content",
        body: "You showcase destinations and properties available through Isisel — with calendars in your console when a host has invited you.",
      },
      {
        title: "Audience partnerships",
        body: "You introduce your community to Isisel when it genuinely fits what they already care about.",
      },
    ],
  },

  program: {
    id: "host-codes",
    kicker: "Live now",
    h2: "Partner codes with hosts.",
    body: "Hosts on Isisel can invite creators to promote a stay. Guests who book with your code get a discount. You earn a commission after checkout — tracked in your creator console, separate from Isisel's platform fee.",
    steps: [
      {
        n: "01",
        title: "Get invited",
        body: "A host sends you a private invite link for their property.",
      },
      {
        n: "02",
        title: "Claim your console",
        body: "Sign in with Google, see your codes, and open availability calendars.",
      },
      {
        n: "03",
        title: "Share the stay",
        body: "Promote when nights are open. Guests apply your code at booking and see the discount.",
      },
      {
        n: "04",
        title: "Earn after the stay",
        body: "Commission follows the booking — pending through checkout, then toward payout once approved.",
      },
    ],
    ctaDiscuss: "Not invited yet? Let's Discuss",
    ctaConsole: "Open creator console",
    consoleHref: "/creators/console",
  },

  bigIdea: {
    id: "voice",
    h2: "We don't want you to become an advertisement.",
    body: "We want you to remain a creator. Your voice is what makes your audience trust you. If we work together, the partnership should feel natural to your audience and valuable to you.",
  },

  why: {
    id: "isisel",
    h2: "Why Isisel?",
    intro:
      "Isisel is building an accommodation marketplace focused on African stays. Travellers discover properties. Hosts list and manage them. Creators can potentially help introduce Isisel to people who already care about travel, accommodation, and experiences.",
    chain: [
      { label: "Hosts", href: "/business" },
      { label: "Properties", href: "/properties" },
      { label: "Isisel", href: "/" },
      { label: "Travellers", href: "/properties" },
    ],
    creatorsLabel: "Creators",
    creatorsNote:
      "You sit in the discovery layer — the stories that help the right people find the right stay.",
    more: [
      {
        href: "/properties",
        label: "Browse stays",
      },
      {
        href: "/business",
        label: "For hospitality businesses",
      },
      {
        href: "/investors",
        label: "For investors",
      },
      {
        href: "/host/onboarding",
        label: "Become a host",
      },
      {
        href: `mailto:${BRAND_EMAIL}`,
        label: "Email us",
      },
    ],
  },

  journey: {
    id: "journey",
    h2: "How it starts",
    note: "Two doors: a host invite, or a short conversation with us. Neither is a maze.",
    steps: [
      {
        n: "01",
        title: "Tell us about yourself — or open an invite",
        body: "Name and email to begin a conversation. Or use the link a host already sent you.",
      },
      {
        n: "02",
        title: "Discuss — or claim your console",
        body: "We talk about your audience and content. Invited creators sign in with Google and land in the console.",
      },
      {
        n: "03",
        title: "Shape the partnership",
        body: "Host codes for specific stays, a campaign, or another model that still sounds like you.",
      },
      {
        n: "04",
        title: "Create — and track what lands",
        body: "Share stays with confidence. When guests book with your code, earnings show up in your console.",
      },
    ],
  },

  proof: {
    id: "now",
    h2: "Looking for the right creators to grow with.",
    body: "Hosts are already inviting partners. We're also opening conversations with creators who believe in what we're building. If that's you, we'd like to hear from you.",
  },

  faq: {
    id: "faq",
    h2: "Questions creators actually ask",
    items: [
      {
        q: "Who can partner with Isisel?",
        a: "Creators talking about travel, lifestyle, Africa, hospitality, or experiences. YouTube, TikTok, Instagram, and other platforms are all in the conversation. We're interested in voice and audience fit — not a rigid profile.",
      },
      {
        q: "Do I need a minimum number of followers?",
        a: "No. We have not set a follower minimum. A smaller creator with the right audience can be a better fit than a large account that doesn't talk about travel or place.",
      },
      {
        q: "Which platforms do you work with?",
        a: "YouTube, TikTok, and Instagram are the ones we hear from most. If you create elsewhere — or across several platforms — say so. We can discuss it.",
      },
      {
        q: "Is this an affiliate program?",
        a: "Hosts can invite you into a live promo-code partnership: guests get a discount on that stay, and you earn a commission set by the host. There is no single public rate for every creator — rates are per host invite. Broader campaigns and content deals are still conversation-led.",
      },
      {
        q: "How do creator partnerships work?",
        a: "Two paths. A host sends you an invite → you claim your console → you share codes and check calendars. Or you tell us who you are, we get in touch, and we shape content, campaigns, or another collaboration together.",
      },
      {
        q: "How much can I earn?",
        a: "On host promo codes, your commission rate is set by that host for that property — not a platform-wide published figure. Other commercial terms, if any, depend on the collaboration. Let's discuss when you're not coming through a host invite.",
      },
      {
        q: "Do you pay creators?",
        a: "For host-attributed bookings, commission is tracked in your console and moves toward payout after the stay is finalized and approved. Other partnerships may include commercial terms we discuss individually — there is no public fee schedule for campaigns.",
      },
      {
        q: "I already have a host invite — what do I do?",
        a: "Open the invite link they sent, sign in with Google to claim your console, then you'll see your codes, property availability, and earnings. You can also go straight to the creator console if you've already claimed.",
      },
      {
        q: "Can I work with Isisel if I'm a small creator?",
        a: "Yes. We're not running a follower-count filter. If your audience cares about travel, stays, Africa, or experiences, it's worth a conversation.",
      },
      {
        q: "Can YouTubers partner with Isisel?",
        a: "Yes. Long-form travel, destination, and experience content is a natural fit to discuss.",
      },
      {
        q: "Can TikTok creators partner with Isisel?",
        a: "Yes. Short-form destination and experience content is absolutely part of who we're hoping to speak with.",
      },
      {
        q: "Can Instagram creators partner with Isisel?",
        a: "Yes. Visual storytelling around travel and lifestyle is a conversation we'd like to have.",
      },
      {
        q: "Can I propose my own partnership idea?",
        a: "Please do. Use the message field — or just send name and email and we'll follow up. The interesting collaborations are often the ones creators invent.",
      },
    ],
  },

  final: {
    h2: "Let's talk about what we could build together.",
    body: "Tell us who you are, where you create, and what you're thinking — or open your console if a host already invited you.",
    cta: "Let's Discuss",
    ctaConsole: "Open creator console",
    consoleHref: "/creators/console",
  },

  form: {
    title: "Let's discuss a partnership.",
    lede: "Name and email are enough. Everything else is optional.",
    name: "Full name",
    email: "Email",
    platform: "Which platform do you create on?",
    platforms: [
      { id: "youtube", label: "YouTube" },
      { id: "tiktok", label: "TikTok" },
      { id: "instagram", label: "Instagram" },
      { id: "multiple", label: "Multiple" },
      { id: "other", label: "Other" },
    ],
    profile: "Your profile / social link",
    message: "Message",
    messageHint: "An idea, a link, or nothing at all.",
    submit: "Let's Talk",
    sending: "Sending…",
    close: "Close",
    successTitle: (name) => `Thanks, ${name}.`,
    successBody:
      "We've received your details. We'll be in touch to discuss how we might work together.",
    error:
      "Something didn't go through. Try again, or email us at " + BRAND_EMAIL + ".",
    required: "Please add your name and a valid email.",
  },

  pageUrl: () => siteUrl(CREATOR_PATH),
};
