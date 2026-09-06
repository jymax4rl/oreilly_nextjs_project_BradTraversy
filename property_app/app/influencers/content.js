import { BRAND_EMAIL } from "@/utils/brand";
import { siteUrl } from "@/utils/audience/paths";

export const CREATOR_PATH = "/influencers";

export const creatorSeo = {
  title: "Travel Creator & Influencer Partnerships | Isisel",
  description:
    "Isisel is looking for travel, lifestyle, and Africa-focused creators to explore partnership opportunities. Tell us who you are — name and email is enough. No follower minimum, no application maze.",
  canonical: CREATOR_PATH,
  ogTitle: "Turn your influence into new opportunities | Isisel",
  ogDescription:
    "You already have an audience. Let's talk about what we could create together — travel, stays, and stories across Africa.",
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
    "Are you a creator talking about travel, lifestyle, Africa, hospitality, or experiences? We're looking for creators who want to explore partnership opportunities with Isisel.",
  primaryCta: "Let's Discuss",
  secondaryCta: "See how we can work together",
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
        title: "New revenue opportunities",
        body: "Explore potential commercial partnerships with Isisel. Terms depend on the collaboration — we don't publish a one-size rate.",
      },
      {
        title: "Exclusive campaigns",
        body: "Eligible creators may be invited into Isisel campaigns and launches, depending on timing and fit.",
      },
      {
        title: "Access to hospitality",
        body: "Work with a platform connecting travellers and accommodation — villas, apartments, and stays across Africa.",
      },
      {
        title: "Build something early",
        body: "Creators who collaborate with Isisel early can potentially take part in the growth of the platform from an early stage.",
      },
      {
        title: "Creative freedom",
        body: "Create in your own voice. We'd rather you sound like you than read generic advertising copy.",
      },
      {
        title: "Long-term partnerships",
        body: "We're more interested in relationships than a one-off promotional post. Let's discuss what that could look like.",
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
      "There isn't a single template. Here are models we can discuss — none of them are a published, guaranteed program.",
    items: [
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
        body: "You showcase destinations and properties available through Isisel.",
      },
      {
        title: "Audience partnerships",
        body: "You introduce your community to Isisel when it genuinely fits what they already care about.",
      },
      {
        title: "Affiliate / performance",
        badge: "Potential partnership model",
        body: "A performance-based collaboration is something we can discuss. We do not advertise a commission percentage — there isn't a published affiliate rate yet.",
      },
    ],
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
    note: "This is not a complicated application.",
    steps: [
      {
        n: "01",
        title: "Tell us about yourself",
        body: "Name and email. That's enough to begin.",
      },
      {
        n: "02",
        title: "Let's discuss your audience & content",
        body: "We'll talk about where you create and who you speak to.",
      },
      {
        n: "03",
        title: "We explore a partnership",
        body: "If there's a fit, we shape something together — not a generic brief.",
      },
      {
        n: "04",
        title: "Create something together",
        body: "Content, campaigns, or another model that still sounds like you.",
      },
    ],
  },

  proof: {
    id: "now",
    h2: "Looking for the right creators to grow with.",
    body: "We're opening conversations with creators who believe in what we're building. If that's you, we'd like to hear from you.",
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
        a: "Not a published one. Performance-based partnerships are a potential model we can discuss. There is no advertised commission rate, because we have not established a public affiliate program.",
      },
      {
        q: "How do creator partnerships work?",
        a: "You tell us who you are. We get in touch. We talk about your content, your audience, and whether there's a natural collaboration. If there is, we shape the partnership together. Terms are discussed individually.",
      },
      {
        q: "How much can I earn?",
        a: "There is no published earning figure — and we won't invent one. Commercial terms, if any, depend on the partnership. Some collaborations may be commercial; some may be about access, content, or campaigns. Let's discuss.",
      },
      {
        q: "Do you pay creators?",
        a: "We may. Payment is not automatic, and we don't have a public fee schedule. If a partnership includes commercial terms, we'll talk through them with you.",
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
    body: "Tell us who you are, where you create, and what you're thinking. We'll take it from there.",
    cta: "Let's Discuss",
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
