/**
 * One-to-one outreach templates for the ops Marketing console.
 * {{name}} is replaced at send time. Keep copy honest to founding-host terms.
 */

export const HOST_APPLY_URL = "https://www.isisel.com/host/onboarding";
export const SITE_URL = "https://www.isisel.com";

export const MARKETING_PDFS = {
  host: {
    filename: "kama-mvp-host-pitch.pdf",
    attachAs: "Isisel-host-note.pdf",
    label: "Host note (PDF)",
  },
  influencer: {
    filename: "kama-mvp-influencer-stay.pdf",
    attachAs: "Isisel-stay-note.pdf",
    label: "Stay note (PDF)",
  },
};

export const MARKETING_TEMPLATES = [
  {
    id: "host_africa",
    label: "African hosts — founding invitation",
    audience: "Hosts in Africa",
    badge: "Founding host",
    subject: "{{name}} — a note from Camara at Isisel",
    previewText:
      "I wanted to write you about listing a stay on isisel.com.",
    heroTitle: "Your door, on the map",
    heroSubtitle:
      "Travelers looking for a house — not a hotel — are searching from Dakar to Nairobi. isisel.com is how they find you.",
    ctaLabel: "Become a founding host",
    ctaUrl: HOST_APPLY_URL,
    pdfKey: "host",
    bullets: [
      "Founding hosts list with zero commission — you set the rate.",
      "Guests request dates in the app. You answer when you are ready.",
      "Calendar, requests, and messages live in one host console.",
      "Early visibility on a marketplace built for African travel.",
    ],
    body: [
      "Hi {{name}},",
      "I am writing because you host (or could host) a stay that travelers actually want: a real home in Africa, not another generic hotel night.",
      "Isisel is live at www.isisel.com. We are inviting a limited group of founding hosts — apartments, villas, guesthouses, lodges — to list while the catalog is still taking shape. Early properties get the attention later listings will compete for.",
      "Founding hosts keep the night. We take no commission on those listings. You set the rate. Guests request dates in the app instead of a missed WhatsApp. Calendar, requests, and messages sit in one quiet console.",
      "I attached a short presentation. If the stay is a fit, start here: www.isisel.com/host/onboarding. I am happy to walk you through it.",
    ],
    closing: "Warmly,\nCamara Djehuty\nIsisel\nwww.isisel.com",
  },
  {
    id: "influencer_lifestyle",
    label: "Lifestyle & travel influencers — 2-night stay",
    audience: "Lifestyle & travel influencers",
    badge: "Partnership",
    subject: "{{name}} — a note about a stay in West Africa",
    previewText:
      "I wanted to write you about a two-night stay if you introduce a host.",
    heroTitle: "Bring a host. Take the stay.",
    heroSubtitle:
      "Introduce a property owner in West Africa. When they become a host on isisel.com, we host you for two nights.",
    ctaLabel: "Reply to partner",
    ctaUrl: SITE_URL,
    pdfKey: "influencer",
    bullets: [
      "Two complimentary nights in a West African destination on isisel.com.",
      "Unlocked when the owner you introduce completes host onboarding and is approved.",
      "Dates follow the host’s calendar — we coordinate with you.",
      "Your audience meets a marketplace built for African homes, not hotel chains.",
    ],
    body: [
      "Hi {{name}},",
      "Isisel (www.isisel.com) is an African vacation-rental marketplace. We would like you to help us open doors — literally.",
      "Here is the partnership: introduce a property owner or host in West Africa. If they apply and are accepted as a host on isisel.com, we offer you two complimentary nights in a West African country on our platform, subject to that host’s calendar.",
      "This is not a paid post and not a cash deal. It is a stay, in return for a real listing. I attached a one-page brief with how it works, what we need from you, and the terms.",
      "If you have a villa, guesthouse, or family home in mind — or want to stay somewhere specific — reply to this email and we will take it from there.",
    ],
    closing: "With thanks,\nCamara Djehuty\nIsisel\nwww.isisel.com",
  },
  {
    id: "property_manager",
    label: "Property managers & boutique stays",
    audience: "Managers, guesthouses, small hotels",
    badge: "Inventory",
    subject: "{{name}} — a note about isisel.com",
    previewText:
      "I wanted to write you about listing the homes you already operate.",
    heroTitle: "One catalog for the homes you already run",
    heroSubtitle:
      "Guests who want Africa specifically. A host console for the inventory you already manage.",
    ctaLabel: "List with Isisel",
    ctaUrl: HOST_APPLY_URL,
    pdfKey: "host",
    bullets: [
      "Built for African destinations — not a global dump of leftover inventory.",
      "Founding-host terms: no commission while we grow the catalog.",
      "Requests land in one place instead of scattered inboxes.",
      "Your properties can be among the first in each city we open.",
    ],
    body: [
      "Hi {{name}},",
      "If you already manage apartments, villas, or a small hotel in Africa, you do not need another channel that treats the continent as an afterthought.",
      "isisel.com is a vacation-rental marketplace focused on African stays. We are onboarding founding inventory now: the places travelers actually search for in Dakar, Accra, Lagos, Abidjan, Bamako, and beyond.",
      "Founding hosts list with zero commission. Guests request dates in the app. You keep the relationship with the stay. I attached our host presentation.",
      "If you want a walkthrough for a portfolio rather than a single listing, reply and we will set a time.",
    ],
    closing: "Best,\nCamara Djehuty\nIsisel\nwww.isisel.com",
  },
  {
    id: "diaspora",
    label: "Diaspora owners — family homes",
    audience: "African diaspora with a home back home",
    badge: "Family home",
    subject: "{{name}} — a note about the family home",
    previewText:
      "I wanted to write you about listing a family house on isisel.com.",
    heroTitle: "The house is already there",
    heroSubtitle:
      "When you are not in it, travelers are looking for exactly that kind of stay.",
    ctaLabel: "Start a listing",
    ctaUrl: HOST_APPLY_URL,
    pdfKey: "host",
    bullets: [
      "List a family house, apartment, or compound you already own.",
      "You approve requests — nothing books itself behind your back.",
      "Founding hosts: no commission on the nights you accept.",
      "A marketplace travelers use when they want Africa, not a global chain.",
    ],
    body: [
      "Hi {{name}},",
      "Many of the best stays in Africa are family homes that sit empty for months. Travelers want those houses. Owners want them looked after, not listed on a platform that does not understand the place.",
      "Isisel is that platform: www.isisel.com. Founding hosts list with no commission. Guests send a request. You decide. Calendar and messages stay in one console.",
      "I attached a short presentation for hosts. If you have a home in mind, apply at www.isisel.com/host/onboarding or reply and I will help you set it up.",
    ],
    closing: "Kind regards,\nCamara Djehuty\nIsisel\nwww.isisel.com",
  },
  {
    id: "follow_up",
    label: "Polite follow-up",
    audience: "Anyone you already wrote",
    badge: "Follow-up",
    subject: "{{name}} — circling back",
    previewText: "A short follow-up — no pressure if now is not the right moment.",
    heroTitle: "Just circling back",
    heroSubtitle: "If now is not the right moment, you can ignore this. The invitation stays open.",
    ctaLabel: "Visit isisel.com",
    ctaUrl: SITE_URL,
    pdfKey: null,
    bullets: [],
    body: [
      "Hi {{name}},",
      "I wanted to follow up once, briefly. Isisel is live at www.isisel.com — African vacation rentals, founding hosts, and a small team that actually answers.",
      "If you would like to list, partner, or take the influencer stay (two nights in West Africa when the host you introduce joins), reply to this email. If not, I will leave you in peace.",
    ],
    closing: "Thank you for reading,\nCamara Djehuty\nIsisel\nwww.isisel.com",
  },
];

export function getMarketingTemplate(id) {
  return MARKETING_TEMPLATES.find((t) => t.id === id) || null;
}

export function interpolate(text, name) {
  const safe = String(name || "").trim() || "there";
  return String(text || "").replaceAll("{{name}}", safe);
}

export function listMarketingTemplatesPublic() {
  return MARKETING_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    audience: t.audience,
    badge: t.badge,
    subject: t.subject,
    previewText: t.previewText,
    heroTitle: t.heroTitle,
    heroSubtitle: t.heroSubtitle,
    ctaLabel: t.ctaLabel,
    ctaUrl: t.ctaUrl,
    pdfKey: t.pdfKey,
    pdf: t.pdfKey ? MARKETING_PDFS[t.pdfKey] : null,
    bullets: t.bullets,
    body: t.body,
    closing: t.closing,
  }));
}
