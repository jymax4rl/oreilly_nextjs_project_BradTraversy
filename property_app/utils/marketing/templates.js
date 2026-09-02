import { WHATSAPP_DISPLAY } from "@/utils/brand";

/**
 * Professional 1:1 outreach. The PDF is the brochure; the letter sells the stay.
 * No emojis. WhatsApp lives in the signature.
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

const SIGN = {
  en: `With kind regards,\nJimmeh\nIsisel\nwww.isisel.com\nWhatsApp ${WHATSAPP_DISPLAY}`,
  fr: `Bien à vous,\nJimmeh\nIsisel\nwww.isisel.com\nWhatsApp ${WHATSAPP_DISPLAY}`,
};

const SIGN_SHORT = {
  en: `With kind regards,\nJimmeh\nWhatsApp ${WHATSAPP_DISPLAY}`,
  fr: `Bien à vous,\nJimmeh\nWhatsApp ${WHATSAPP_DISPLAY}`,
};

function blank(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^(undefined|null|n\/a|na)$/i.test(text)) return "";
  return text;
}

function normalizeSocialUrl(raw) {
  let text = blank(raw);
  if (!text) return "";
  if (/^(javascript|data|vbscript):/i.test(text)) return "";
  if (!/^https?:\/\//i.test(text)) {
    text = text.replace(/^\/\//, "");
    text = `https://${text}`;
  }
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.href.replace(/\/$/, "").slice(0, 300);
  } catch {
    return "";
  }
}

function socialDisplay(url) {
  return String(url || "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
}

export function resolveMarketingVars(raw = {}) {
  const firstName = blank(raw.firstName) || blank(raw.name);
  const propertyName = blank(raw.propertyName);
  const businessName = blank(raw.businessName) || propertyName;
  const city = blank(raw.city);
  const country = blank(raw.country);
  const location =
    blank(raw.location) || [city, country].filter(Boolean).join(", ");
  const originalSubject = blank(raw.originalSubject);
  const socialUrl = normalizeSocialUrl(raw.socialUrl || raw.social);
  return {
    firstName,
    name: firstName,
    propertyName,
    businessName,
    city,
    country,
    location,
    originalSubject,
    socialUrl,
    socialDisplay: socialDisplay(socialUrl),
  };
}

function socialCameAcross(vars, locale) {
  const host = String(vars.socialDisplay || "").toLowerCase();
  const fr = locale === "fr";
  if (host.includes("youtube") || host.includes("youtu.be")) {
    return fr
      ? "votre magnifique chaîne YouTube"
      : "your magnificent YouTube channel";
  }
  if (host.includes("instagram")) {
    return fr ? "votre magnifique Instagram" : "your magnificent Instagram";
  }
  if (host.includes("tiktok")) {
    return fr ? "votre magnifique TikTok" : "your magnificent TikTok";
  }
  if (vars.socialDisplay) return vars.socialDisplay;
  return fr ? "votre travail" : "your work";
}

function greeting(vars, locale) {
  const name = vars.firstName;
  if (locale === "fr") return name ? `Bonjour ${name},` : "Bonjour,";
  return name ? `Hi ${name},` : "Hi,";
}

function cameAcross(vars, { named, unnamed, withPlace, unnamedPlace, locale }) {
  const label = vars.propertyName || vars.businessName;
  const place = vars.location || vars.country || vars.city;
  if (label && place) return withPlace(label, place);
  if (label) return named(label);
  if (place) return unnamedPlace(place);
  return unnamed();
}

export function interpolate(text, varsOrName, locale = "en") {
  const vars =
    varsOrName && typeof varsOrName === "object"
      ? resolveMarketingVars(varsOrName)
      : resolveMarketingVars({ firstName: varsOrName });
  let out = String(text || "")
    .replaceAll("{{firstName}}", vars.firstName)
    .replaceAll("{{name}}", vars.firstName)
    .replaceAll("{{propertyName}}", vars.propertyName)
    .replaceAll("{{businessName}}", vars.businessName)
    .replaceAll("{{hotelName}}", vars.businessName || vars.propertyName)
    .replaceAll("{{city}}", vars.city)
    .replaceAll("{{country}}", vars.country)
    .replaceAll("{{location}}", vars.location)
    .replaceAll("{{socialUrl}}", vars.socialUrl)
    .replaceAll("{{socialDisplay}}", vars.socialDisplay)
    .replaceAll("{{originalSubject}}", vars.originalSubject)
    .replace(/\{\{[^}]+\}\}/g, "");

  out = out
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +,/g, ",")
    .replace(/ ,/g, ",")
    .replace(/in\s+and /gi, "and ")
    .replace(/\s+\./g, ".")
    .replace(/Hi\s*,/g, "Hi,")
    .replace(/Bonjour\s*,/g, "Bonjour,");

  if (locale === "fr" && !vars.firstName) {
    out = out.replace(/^Bonjour\s*,/m, "Bonjour,");
  }
  return out.trim();
}

function subjectFromOptions(options, vars, locale) {
  for (const option of options || []) {
    const filled = interpolate(option, vars, locale);
    if (
      filled.length >= 3 &&
      !/\b(undefined|null)\b/i.test(filled) &&
      !/about\s*$/i.test(filled) &&
      !/came across\s*$/i.test(filled) &&
      !/\sin$/i.test(filled) &&
      !/\sau$/i.test(filled) &&
      !/\sà$/i.test(filled) &&
      !/\sfor$/i.test(filled) &&
      !/\spour$/i.test(filled) &&
      !/—\s*$/i.test(filled) &&
      filled !== "About" &&
      filled !== "Re:"
    ) {
      return filled.slice(0, 200);
    }
  }
  return locale === "fr"
    ? "Opportunité de partenariat"
    : "Partnership opportunity";
}

function letter(paragraphs, closing) {
  return [...paragraphs.filter(Boolean), closing].join("\n\n");
}

function generalCopy(vars, locale) {
  const entity = vars.businessName || vars.propertyName;
  if (locale === "fr") {
    const open = cameAcross(vars, {
      named: (name) => `Je vous écris au sujet de ${name}.`,
      withPlace: (name, place) =>
        `Je vous écris au sujet de ${name}, à ${place}.`,
      unnamedPlace: (place) => `Je vous écris au sujet d'une adresse à ${place}.`,
      unnamed: () => "Je vous écris au sujet d'Isisel.",
    });
    return letter(
      [
        greeting(vars, "fr"),
        open,
        "Isisel est le lieu où les voyageurs trouvent l'Afrique par les maisons qui la rendent unique. Vous inscrivez le séjour, vous fixez le tarif, vous gardez 100 % de la nuit. Les dates se demandent sur www.isisel.com — pas au fond d'un WhatsApp.",
        "J'ai joint une note courte, avec des photos. Si cela vous parle, répondez ici ou écrivez-moi sur WhatsApp — je vous montre comment lister.",
      ],
      SIGN.fr,
    );
  }
  const open = entity
    ? `I wanted to write you about ${entity}.`
    : vars.location
      ? `I wanted to write you about a stay in ${vars.location}.`
      : "I wanted to write you about Isisel.";
  return letter(
    [
      greeting(vars, "en"),
      open,
      "Isisel is where travelers find Africa through the homes that make it special. You list the stay, you set the rate, you keep 100% of the night. Guests request dates on www.isisel.com — not in a missed WhatsApp.",
      "I attached a short note, with photographs. If it feels like a fit, reply here or WhatsApp me and I will show you how to list.",
    ],
    SIGN.en,
  );
}

function ownersCopy(vars, locale) {
  if (locale === "fr") {
    const open = cameAcross(vars, {
      named: (name) => `Je vous contacte au sujet de ${name}.`,
      withPlace: (name, place) =>
        `Je vous contacte au sujet de ${name}, à ${place}.`,
      unnamedPlace: (place) =>
        `Je vous contacte au sujet de votre bien à ${place}.`,
      unnamed: () => "Je vous contacte au sujet de votre bien en Afrique.",
    });
    return letter(
      [
        greeting(vars, "fr"),
        open,
        "Les voyageurs cherchent déjà une vraie maison — pas une chambre d'hôtel interchangeable. Sur Isisel, ils demandent vos dates directement. Vous décidez. Vous gardez 100 % du tarif de la nuit, sans commission pour les hôtes fondateurs.",
        "La note jointe montre comment cela fonctionne, en images. Répondez à cet email ou WhatsApp, et on met le logement en ligne.",
      ],
      SIGN.fr,
    );
  }
  const open = cameAcross(vars, {
    named: (name) => `I wanted to write you about ${name}.`,
    withPlace: (name, place) =>
      `I wanted to write you about ${name} in ${place}.`,
    unnamedPlace: (place) =>
      `I wanted to write you about your property in ${place}.`,
    unnamed: () => "I wanted to write you about your property in Africa.",
  });
  return letter(
    [
      greeting(vars, "en"),
      open,
      "Travelers are already looking for a real house — not another interchangeable hotel room. On Isisel they request your dates directly. You decide. Founding hosts keep 100% of the nightly rate, with no commission.",
      "The attached note shows how it works, in photographs. Reply to this email or WhatsApp me, and we will get the stay live.",
    ],
    SIGN.en,
  );
}

function hotelsCopy(vars, locale) {
  const hotel = vars.businessName || vars.propertyName;
  if (locale === "fr") {
    const open = hotel
      ? `Je vous écris au sujet de ${hotel}.`
      : vars.location
        ? `Je vous écris au sujet de votre établissement à ${vars.location}.`
        : "Je vous écris au sujet de votre hôtel.";
    return letter(
      [
        greeting(vars, "fr"),
        open,
        "Les voyageurs qui veulent la baignade tardive et une terrasse à l'heure dorée devraient vous trouver — pas une annonce noyée sous des milliers de copies. Sur Isisel vous fixez votre tarif et vous gardez 100 % de la nuit. Les demandes arrivent sur la plateforme.",
        "J'ai joint une note d'une page, avec des photos. Si vous êtes ouvert à un échange, répondez ici ou sur WhatsApp.",
      ],
      SIGN.fr,
    );
  }
  const open = hotel
    ? `I wanted to write you about ${hotel}.`
    : vars.location
      ? `I wanted to write you about your hotel in ${vars.location}.`
      : "I wanted to write you about your hotel.";
  return letter(
    [
      greeting(vars, "en"),
      open,
      "Guests looking for the late swim and a terrace at golden hour should find you — not another listing buried under a thousand lookalikes. On Isisel you set your rate and keep 100% of the night. Date requests come through the site.",
      "I attached a one-page note, with photographs. If you are open to a conversation, reply here or WhatsApp me.",
    ],
    SIGN.en,
  );
}

function managersCopy(vars, locale) {
  const name = vars.propertyName || vars.businessName;
  if (locale === "fr") {
    let open = "Je vous écris au sujet des logements que vous gérez.";
    if (name && vars.location) {
      open = `J'ai vu ${name} parmi les séjours à ${vars.location}.`;
    } else if (name) {
      open = `J'ai vu ${name} et je voulais vous écrire.`;
    } else if (vars.location) {
      open = `Je vous écris au sujet de vos séjours à ${vars.location}.`;
    }
    return letter(
      [
        greeting(vars, "fr"),
        open,
        "Isisel est fait pour les adresses africaines que vous opérez déjà — pas pour un catalogue mondial où le continent est une arrière-pensée. Vous fixez le tarif. Vous gardez 100 % de la nuit. Les demandes arrivent au même endroit.",
        "La note jointe est la version portefeuille, avec des photos. Je peux vous faire une visite — répondez ici ou sur WhatsApp.",
      ],
      SIGN.fr,
    );
  }
  let open = "I wanted to write you about the stays you already run.";
  if (name && vars.location) {
    open = `I saw ${name} while looking at stays in ${vars.location}.`;
  } else if (name) {
    open = `I saw ${name} and wanted to write you.`;
  } else if (vars.location) {
    open = `I wanted to write you about your stays in ${vars.location}.`;
  }
  return letter(
    [
      greeting(vars, "en"),
      open,
      "Isisel is built for the African places you already operate — not a global catalog that treats the continent as an afterthought. You set the rate. You keep 100% of the night. Requests land in one place.",
      "The attached note is the portfolio version, with photographs. Happy to walk through it — reply here or WhatsApp me.",
    ],
    SIGN.en,
  );
}

function creatorsCopy(vars, locale) {
  const seen = socialCameAcross(vars, locale);
  if (locale === "fr") {
    return letter(
      [
        greeting(vars, "fr"),
        `Je vous écris après être tombé sur ${seen}.`,
        "En tant que plateforme ouest-africaine, je trouve une grande inspiration dans votre engagement à inspirer les autres en montrant la beauté de l'Afrique.",
        "En tant que développeur, j'ai construit une plateforme de réservation qui répond aux réalités africaines et s'y attaque.\nAinsi elle lève les barrières à une vraie intégration économique pour les Africains.",
        "J'ai joint une note courte. S'il y a une villa, une maison d'hôtes ou une maison de famille déjà dans votre tête pour votre prochain voyage en Afrique de l'Ouest, répondez ici ou WhatsApp.",
      ],
      SIGN.fr,
    );
  }
  return letter(
    [
      greeting(vars, "en"),
      `I wanted to write you after coming across ${seen}.`,
      "As a West African platform, I find great inspiration in your commitment towards inspiring others by showing the beauty of Africa.",
      "As a software developer I have built a booking platform that addresses African realities and tackles them.\nThus lifting the barriers away from real economic integration for Africans.",
      "I attached a short note. If a villa, guesthouse, or family home is already in your head for your next trip in West Africa, reply here or WhatsApp me.",
    ],
    SIGN.en,
  );
}

function diasporaCopy(vars, locale) {
  if (locale === "fr") {
    const open = vars.country
      ? `Je vous contacte au sujet de votre maison en ${vars.country}.`
      : vars.location
        ? `Je vous contacte au sujet de votre maison à ${vars.location}.`
        : "Je vous contacte au sujet de la maison de famille.";
    return letter(
      [
        greeting(vars, "fr"),
        open,
        "Certaines des plus belles adresses d'Afrique restent silencieuses des mois. Les voyageurs les cherchent. Vous voulez qu'elles soient regardées — pas listées sur une plateforme qui ne connaît pas le lieu. Sur Isisel vous fixez le tarif, vous gardez 100 % de la nuit, et vous approuvez chaque demande.",
        "La note jointe, avec des photos, montre comment cela se passe. Répondez ici ou WhatsApp si vous êtes ouvert à un échange.",
      ],
      SIGN.fr,
    );
  }
  const open = vars.country
    ? `I wanted to write you about the family home in ${vars.country}.`
    : vars.location
      ? `I wanted to write you about the family home in ${vars.location}.`
      : "I wanted to write you about the family home.";
  return letter(
    [
      greeting(vars, "en"),
      open,
      "Some of the most beautiful stays in Africa sit quiet for months. Travelers want those houses. You want them looked after — not listed on a site that does not know the place. On Isisel you set the rate, you keep 100% of the night, and you approve every request.",
      "The attached note, with photographs, shows how it works. Reply here or WhatsApp me if you are open to it.",
    ],
    SIGN.en,
  );
}

function followNoResponseCopy(vars, locale) {
  const thing = vars.propertyName || vars.businessName;
  if (locale === "fr") {
    const mid = thing
      ? `Je reviens vers vous au sujet de ${thing} — et d'Isisel.`
      : "Je reviens vers vous au sujet d'Isisel.";
    return letter(
      [
        greeting(vars, "fr"),
        mid,
        "Toujours la même chose, simplement: un lieu réel en Afrique, votre tarif, la nuit pour vous, les dates sur la plateforme. La note est jointe à nouveau.",
        "Aucun souci si ce n'est pas le moment. Sinon, un mot ici ou sur WhatsApp suffit.",
      ],
      SIGN_SHORT.fr,
    );
  }
  const mid = thing
    ? `Coming back to you about ${thing} — and Isisel.`
    : "Coming back to you about Isisel.";
  return letter(
    [
      greeting(vars, "en"),
      mid,
      "Same simple pitch: a real place in Africa, your rate, you keep the night, dates on the site. The note is attached again.",
      "No worries if now is not the moment. Otherwise a reply here or on WhatsApp is enough.",
    ],
    SIGN_SHORT.en,
  );
}

function followFinalCopy(vars, locale) {
  if (locale === "fr") {
    return letter(
      [
        greeting(vars, "fr"),
        "Un dernier mot, sans pression.",
        "Si vous voulez voir votre lieu sur isisel.com, je suis là — email ou WhatsApp. La note jointe est tout le dossier.",
      ],
      SIGN_SHORT.fr,
    );
  }
  return letter(
    [
      greeting(vars, "en"),
      "One last note, no pressure.",
      "If you want the place on isisel.com, I am here — email or WhatsApp. The attached note is the whole brief.",
    ],
    SIGN_SHORT.en,
  );
}

export const MARKETING_TEMPLATES = [
  {
    id: "general_intro",
    label: "General — introduction",
    labelFr: "Général — introduction",
    audience: "Anyone you are introducing yourself to",
    audienceFr: "Première prise de contact",
    category: "general",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: false,
    subjectOptions: {
      en: [
        "Partnership opportunity",
        "A hosting partnership",
        "Collaboration with Isisel",
        "Partnership for {{businessName}}",
        "An opportunity for {{businessName}}",
      ],
      fr: [
        "Opportunité de partenariat",
        "Un partenariat d'hébergement",
        "Collaboration avec Isisel",
        "Partenariat — {{businessName}}",
        "Une opportunité pour {{businessName}}",
      ],
    },
    composeBody: generalCopy,
  },
  {
    id: "property_owners",
    label: "Property owners — quick question",
    labelFr: "Propriétaires — question rapide",
    audience: "Individual property owners",
    audienceFr: "Propriétaires individuels",
    category: "property_owner",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: false,
    subjectOptions: {
      en: [
        "Partnership opportunity",
        "Hosting partnership",
        "An opportunity for your property",
        "Partnership for {{propertyName}}",
        "Listing partnership in {{country}}",
      ],
      fr: [
        "Opportunité de partenariat",
        "Partenariat d'hébergement",
        "Une opportunité pour votre bien",
        "Partenariat — {{propertyName}}",
        "Partenariat de mise en ligne {{country}}",
      ],
    },
    composeBody: ownersCopy,
  },
  {
    id: "hotels_resorts",
    label: "Hotels & resorts — introduction",
    labelFr: "Hôtels et resorts — introduction",
    audience: "Hotel and resort operators",
    audienceFr: "Hôteliers et resorts",
    category: "hotel",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: false,
    subjectOptions: {
      en: [
        "Partnership opportunity",
        "Hotel partnership",
        "Distribution partnership",
        "A partnership for {{businessName}}",
        "Collaboration in {{location}}",
      ],
      fr: [
        "Opportunité de partenariat",
        "Partenariat hôtel",
        "Partenariat de distribution",
        "Un partenariat pour {{businessName}}",
        "Collaboration à {{location}}",
      ],
    },
    composeBody: hotelsCopy,
  },
  {
    id: "property_managers",
    label: "Property managers — quick question",
    labelFr: "Gestionnaires — question rapide",
    audience: "Managers of multiple stays",
    audienceFr: "Gestionnaires de plusieurs logements",
    category: "property_manager",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: false,
    subjectOptions: {
      en: [
        "Partnership opportunity",
        "Portfolio partnership",
        "A partnership for your properties",
        "Partnership for {{propertyName}}",
        "Collaboration opportunity",
      ],
      fr: [
        "Opportunité de partenariat",
        "Partenariat portefeuille",
        "Un partenariat pour vos logements",
        "Partenariat — {{propertyName}}",
        "Opportunité de collaboration",
      ],
    },
    composeBody: managersCopy,
  },
  {
    id: "travel_creators",
    label: "Travel creators — introduction",
    labelFr: "Créateurs voyage — introduction",
    audience: "Travel and lifestyle creators",
    audienceFr: "Créateurs voyage et lifestyle",
    category: "creator",
    intent: "conversation",
    promotional: false,
    pdfKey: "influencer",
    followUp: false,
    subjectOptions: {
      en: [
        "Collaboration opportunity",
        "Partnership",
        "A stay collaboration",
        "Partnership in {{location}}",
        "Brand partnership",
      ],
      fr: [
        "Opportunité de collaboration",
        "Partenariat",
        "Une collaboration séjour",
        "Partenariat à {{location}}",
        "Partenariat de marque",
      ],
    },
    composeBody: creatorsCopy,
  },
  {
    id: "diaspora_owners",
    label: "Diaspora property owners — quick question",
    labelFr: "Propriétaires de la diaspora — question rapide",
    audience: "Owners managing a home from abroad",
    audienceFr: "Propriétaires gérant un bien depuis l'étranger",
    category: "diaspora",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: false,
    subjectOptions: {
      en: [
        "Partnership opportunity",
        "Hosting partnership",
        "An opportunity for your home",
        "Partnership for your property in {{country}}",
        "Remote hosting partnership",
      ],
      fr: [
        "Opportunité de partenariat",
        "Partenariat d'hébergement",
        "Une opportunité pour votre maison",
        "Partenariat pour votre bien {{country}}",
        "Partenariat à distance",
      ],
    },
    composeBody: diasporaCopy,
  },
  {
    id: "follow_up_no_response",
    label: "Follow-up — no response",
    labelFr: "Relance — sans réponse",
    audience: "Someone who did not reply",
    audienceFr: "Quelqu'un qui n'a pas répondu",
    category: "follow_up",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: true,
    subjectOptions: {
      en: [
        "Re: {{originalSubject}}",
        "Re: partnership opportunity",
        "Following up on the partnership",
      ],
      fr: [
        "Re: {{originalSubject}}",
        "Re: opportunité de partenariat",
        "Suite au partenariat",
      ],
    },
    composeBody: followNoResponseCopy,
  },
  {
    id: "follow_up_final",
    label: "Follow-up — final",
    labelFr: "Relance — dernier message",
    audience: "Last polite nudge — not a hard close",
    audienceFr: "Dernier message, sans urgence artificielle",
    category: "follow_up",
    intent: "conversation",
    promotional: false,
    pdfKey: "host",
    followUp: true,
    subjectOptions: {
      en: [
        "Re: {{originalSubject}}",
        "Re: partnership opportunity",
        "Last note on the partnership",
      ],
      fr: [
        "Re: {{originalSubject}}",
        "Re: opportunité de partenariat",
        "Dernier mot sur le partenariat",
      ],
    },
    composeBody: followFinalCopy,
  },
];

export function normalizeMarketingLocale(locale) {
  return String(locale || "")
    .toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";
}

export function getMarketingTemplate(id) {
  return MARKETING_TEMPLATES.find((t) => t.id === id) || null;
}

export function listSubjectOptions(template, vars, locale = "en") {
  const lang = normalizeMarketingLocale(locale);
  const resolved = resolveMarketingVars(vars);
  const options = template?.subjectOptions?.[lang] || template?.subjectOptions?.en || [];
  const seen = new Set();
  const list = [];
  for (const option of options) {
    const text = subjectFromOptions([option], resolved, lang);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    list.push(text);
  }
  return list;
}

export function composeMarketingLetter(
  templateOrId,
  { locale = "en", subjectOption = 0, ...rawVars } = {},
) {
  const lang = normalizeMarketingLocale(locale);
  const vars = resolveMarketingVars(rawVars);
  const template =
    typeof templateOrId === "string"
      ? getMarketingTemplate(templateOrId)
      : getMarketingTemplate(templateOrId?.id) || templateOrId;
  if (!template?.composeBody) {
    return { subject: "", body: "", previewText: "", subjectOptions: [] };
  }
  const subjectOptions = listSubjectOptions(template, vars, lang);
  const subject =
    subjectOptions[subjectOption] ||
    subjectOptions[0] ||
    (lang === "fr"
      ? "Opportunité de partenariat"
      : "Partnership opportunity");
  const body = template.composeBody(vars, lang);
  const previewText = body.split("\n\n")[1] || "";
  return {
    subject,
    body,
    previewText,
    subjectOptions,
  };
}

export function listMarketingTemplatesPublic() {
  return MARKETING_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    labelFr: t.labelFr,
    audience: t.audience,
    audienceFr: t.audienceFr,
    category: t.category,
    intent: t.intent,
    promotional: t.promotional,
    followUp: Boolean(t.followUp),
    pdfKey: t.pdfKey,
    pdf: t.pdfKey ? MARKETING_PDFS[t.pdfKey] : null,
    subjectOptions: t.subjectOptions,
  }));
}
