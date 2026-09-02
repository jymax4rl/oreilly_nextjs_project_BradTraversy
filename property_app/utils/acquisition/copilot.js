/**
 * Live sales conversation tree for the Host Acquisition copilot.
 * Pure functions — no I/O. The UI drives; this recommends the next move.
 */

export const MEMORY_KEYS = [
  "openResult",
  "whoExplained",
  "openResolved",
  "platforms",
  "propertyBand",
  "looking",
  "pain",
  "commissionFeel",
  "interest",
  "objection",
  "closeChoice",
];

export function emptyMemory() {
  return Object.fromEntries(MEMORY_KEYS.map((k) => [k, ""]));
}

export function sanitizeMemory(raw) {
  const base = emptyMemory();
  if (!raw || typeof raw !== "object") return base;
  for (const key of MEMORY_KEYS) {
    if (raw[key] != null && raw[key] !== "") {
      base[key] = String(raw[key]).trim().slice(0, 80);
    }
  }
  return base;
}

export function fillScript(text, ctx = {}) {
  const name = ctx.contactName || "the owner";
  const mine = ctx.sellerName || "the Isisel team";
  const property = ctx.businessName || "your property";
  return String(text || "")
    .replaceAll("[NAME]", name)
    .replaceAll("[MY NAME]", mine)
    .replaceAll("[PROPERTY NAME]", property);
}

function bandFromCount(n) {
  const c = Number(n) || 0;
  if (c <= 1) return "1";
  if (c <= 5) return "2-5";
  if (c <= 20) return "6-20";
  return "20+";
}

function platformsFromProspect(prospect) {
  const source = prospect?.source;
  const existing = (prospect?.existingPlatforms || []).join(" ").toLowerCase();
  if (existing.includes("airbnb") && existing.includes("booking")) return "both";
  if (source === "airbnb" || existing.includes("airbnb")) return "airbnb";
  if (source === "booking" || existing.includes("booking")) return "booking";
  if (existing.includes("direct") || source === "website") return "direct";
  return "";
}

export function hydrateMemory(prospect) {
  const stored = sanitizeMemory(prospect?.copilotMemory);
  if (!stored.platforms) stored.platforms = platformsFromProspect(prospect);
  if (!stored.propertyBand && prospect?.propertyCount) {
    stored.propertyBand = bandFromCount(prospect.propertyCount);
  }
  if (!stored.pain && prospect?.painPoint) stored.pain = prospect.painPoint;
  if (!stored.looking && prospect?.lookingForBookings) {
    stored.looking = prospect.lookingForBookings;
  }
  return stored;
}

export function memoryChips(memory, prospect) {
  const chips = [];
  if (memory.platforms === "airbnb") chips.push("Uses Airbnb");
  if (memory.platforms === "booking") chips.push("Uses Booking.com");
  if (memory.platforms === "both") chips.push("Airbnb + Booking.com");
  if (memory.platforms === "direct") chips.push("Direct bookings");
  if (memory.platforms === "other") chips.push("Other booking source");
  if (memory.propertyBand === "1") chips.push("1 property");
  if (memory.propertyBand === "2-5") chips.push("2–5 properties");
  if (memory.propertyBand === "6-20") chips.push("6–20 properties");
  if (memory.propertyBand === "20+") chips.push("20+ properties");
  if (memory.looking === "yes") chips.push("Wants more bookings");
  if (memory.looking === "maybe") chips.push("Open to more bookings");
  if (memory.looking === "no") chips.push("Not looking right now");
  if (memory.pain === "commission") chips.push("Commission concern");
  if (memory.pain === "bookings") chips.push("Needs more bookings");
  if (memory.pain === "dependence") chips.push("Platform dependence");
  if (memory.pain === "management") chips.push("Management friction");
  if (memory.pain === "mobile") chips.push("Wants mobile control");
  if (memory.pain === "direct") chips.push("Wants direct bookings");
  if (memory.pain === "visibility") chips.push("Wants visibility");
  if (memory.pain === "none") chips.push("No current pain");
  if (memory.interest === "interested") chips.push("Interest: high");
  if (memory.interest === "questions") chips.push("Has questions");
  if (memory.interest === "not_convinced") chips.push("Not yet convinced");
  if (memory.interest === "objection") chips.push("Objection raised");
  if (prospect?.priority === "high") chips.push("High priority");
  return chips;
}

/** CRM patch derived from live answers — never invents fake metrics. */
export function crmPatchFromMemory(memory) {
  const patch = {};
  const platforms = {
    airbnb: ["Airbnb"],
    booking: ["Booking.com"],
    both: ["Airbnb", "Booking.com"],
    direct: ["Direct / website"],
  };
  if (memory.platforms && platforms[memory.platforms]) {
    patch.existingPlatforms = platforms[memory.platforms];
    if (memory.platforms === "airbnb") patch.source = "airbnb";
    if (memory.platforms === "booking") patch.source = "booking";
  }
  const counts = { 1: 1, "2-5": 4, "6-20": 10, "20+": 20 };
  if (memory.propertyBand && counts[memory.propertyBand] != null) {
    patch.propertyCount = counts[memory.propertyBand];
  }
  if (memory.looking) patch.lookingForBookings = memory.looking;
  if (memory.pain) patch.painPoint = memory.pain;
  if (memory.pain === "commission" || memory.looking === "yes") {
    patch.priority = "high";
  }
  return patch;
}

export function nextDiscoverKey(memory) {
  if (!memory.platforms) return "platforms";
  if (!memory.propertyBand) return "propertyBand";
  if (!memory.looking) return "looking";
  return null;
}

/** Skip cards the conversation has already answered. */
export function skipToLive(memory) {
  if (nextDiscoverKey(memory)) return "discover";
  if (!memory.pain && !memory.commissionFeel) return "pain";
  return "pitch";
}

export function openFollowUp(memory) {
  if (memory.openResult === "busy") {
    return {
      objective: "Protect the relationship. Get a time.",
      say: "No problem — I caught you at a bad moment.\n\nWhen is a better time to call back about [PROPERTY NAME]?",
      why: "Busy is not a no. A time on the calendar is the win.",
      followUp: "Confirm the day out loud and write it down before you hang up.",
      avoid: "Don't pitch while they're rushing out the door.",
      buttons: [
        { id: "got_time", label: "Got a time" },
        { id: "call_later", label: "Call later" },
      ],
    };
  }
  if (memory.openResult === "wrong_person") {
    return {
      objective: "Leave with a name, not only an apology.",
      say: "Sorry about that — I must have the wrong person.\n\nWho handles the bookings for [PROPERTY NAME]? Could I get their name and a number?",
      why: "The file is still useful if you leave with a referral.",
      followUp: "If they won't share a number, ask them to pass a WhatsApp.",
      avoid: "Don't pitch the product to someone who doesn't own the calendar.",
      buttons: [
        { id: "got_name", label: "Got a name" },
        { id: "will_pass", label: "They'll pass a message" },
        { id: "dead", label: "Dead end" },
      ],
    };
  }
  return null;
}

export function discoverPrompt(memory) {
  const key = nextDiscoverKey(memory);
  if (key === "platforms") {
    return {
      key,
      n: 1,
      objective: "Understand how they currently get bookings.",
      say: "How do you currently get most of your bookings?",
      why: "The pitch changes if they live on Airbnb, Booking.com, or already take direct stays.",
      buttons: [
        { id: "airbnb", label: "Airbnb" },
        { id: "booking", label: "Booking.com" },
        { id: "both", label: "Both" },
        { id: "direct", label: "Direct bookings" },
        { id: "other", label: "Other" },
      ],
    };
  }
  if (key === "propertyBand") {
    return {
      key,
      n: 2,
      objective: "Size the account.",
      say: "Do you manage just this property, or do you have several?",
      why: "A manager with several homes is a different close than a single-villa owner.",
      buttons: [
        { id: "1", label: "1 property" },
        { id: "2-5", label: "2–5" },
        { id: "6-20", label: "6–20" },
        { id: "20+", label: "20+" },
      ],
    };
  }
  if (key === "looking") {
    return {
      key,
      n: 3,
      objective: "See if they even want another channel.",
      say: "Are you currently looking for additional sources of bookings?",
      why: "If they say no, we still listen — we just close lighter.",
      buttons: [
        { id: "yes", label: "Yes" },
        { id: "maybe", label: "Maybe" },
        { id: "no", label: "No" },
      ],
    };
  }
  return {
    key: null,
    n: 3,
    objective: "Discovery complete.",
    say: "I have what I need on how you currently get bookings.",
    why: "Move to the pain that matters for this host.",
    buttons: [{ id: "continue", label: "Continue" }],
  };
}

export function painPrompt(memory) {
  const p = memory.platforms;
  if (p === "airbnb" || p === "both" || p === "booking") {
    return {
      key: "commissionFeel",
      say: "How do you feel about the commission you're currently paying on your bookings?",
      why: "Commission is the sharpest contrast with Isisel for founding hosts.",
      followUp: "If they hesitate, stay quiet for a beat. Let them name the number.",
      buttons: [
        { id: "expensive", label: "Expensive", pain: "commission" },
        { id: "acceptable", label: "Acceptable", pain: p === "both" ? "dependence" : "visibility" },
        { id: "unknown", label: "Don't know", pain: "visibility" },
        { id: "not_concern", label: "Not a concern", pain: memory.looking === "yes" ? "bookings" : "none" },
      ],
    };
  }
  if (p === "direct") {
    return {
      key: "pain",
      say: "What's the hardest part of filling the calendar when you're not on a big platform?",
      why: "Direct hosts usually want occupancy or visibility, not a commission lecture.",
      buttons: [
        { id: "bookings", label: "Not enough guests" },
        { id: "visibility", label: "Hard to be found" },
        { id: "management", label: "Managing it is messy" },
        { id: "none", label: "It's fine" },
      ],
    };
  }
  if (memory.looking === "no") {
    return {
      key: "pain",
      say: "If nothing's urgent, what's the one thing you'd still improve about how you get bookings?",
      why: "Gives them a reason to stay in the conversation without pressure.",
      buttons: [
        { id: "visibility", label: "More visibility" },
        { id: "direct", label: "More direct stays" },
        { id: "management", label: "Easier management" },
        { id: "none", label: "Nothing" },
      ],
    };
  }
  return {
    key: "pain",
    say: "What's the most frustrating part of getting bookings right now?",
    why: "Let them name the pain before we pitch.",
    buttons: [
      { id: "bookings", label: "Not enough bookings" },
      { id: "commission", label: "Fees / commission" },
      { id: "management", label: "Hard to manage" },
      { id: "mobile", label: "Bad on the phone" },
      { id: "none", label: "Nothing really" },
    ],
  };
}

export function pitchFor(memory, prospect = {}) {
  const type = (prospect.propertyTypes && prospect.propertyTypes[0]) || "property";
  const multi = ["2-5", "6-20", "20+"].includes(memory.propertyBand);
  const pain = memory.pain;

  if (pain === "commission" || memory.commissionFeel === "expensive") {
    return {
      headline: "Commission-free channel",
      say: `That's actually one of the reasons I wanted to speak with you.\n\nIsisel gives hosts another booking channel where they can list their ${type.toLowerCase()} without the traditional booking-platform commission.\n\nYou also get a dashboard to manage ${multi ? "your properties" : "the property"} and bookings, including from your phone.\n\nSo we're not asking you to stop using ${memory.platforms === "booking" ? "Booking.com" : "Airbnb"}. We're giving you another channel.`,
      why: "You keep their current channel intact and put the fee contrast on the table.",
      followUp: "Would another channel with no traditional commission be useful alongside what you already use?",
    };
  }
  if (pain === "dependence") {
    return {
      headline: "A second channel",
      say: `Relying on one platform is risky the moment they change the rules.\n\nIsisel is a second door for guests looking for African vacation stays — and a host dashboard you can run from your phone.\n\nYou keep ${memory.platforms === "booking" ? "Booking.com" : "Airbnb"}. You add a channel that you control.`,
      why: "Dependence is fear of being stuck. Offer an exit, not a replacement.",
      followUp: "If one platform slowed down tomorrow, would you want a backup already live?",
    };
  }
  if (pain === "bookings" || memory.looking === "yes") {
    return {
      headline: "More demand, same home",
      say: `Isisel is built for African vacation rentals — so the guests coming in are looking for stays like ${prospect.businessName || "yours"}.\n\nYou list once, manage bookings from your phone, and keep the nights you earn. Founding hosts keep 100% of the night while the catalog is early.\n\nWe're not promising magic occupancy. We're putting you in front of a new guest stream.`,
      why: "Honest about scale. Strong on founding-host economics.",
      followUp: "If we could add even a few extra stays a month, would that be worth listing?",
    };
  }
  if (pain === "management" || pain === "mobile") {
    return {
      headline: "Host console on your phone",
      say: `A lot of owners are juggling WhatsApp, Airbnb inbox, and a notebook.\n\nIsisel gives you one host console — calendar, requests, listings — that works on your phone.\n\nGuests request on the site, not in your personal chat. You stay in control.`,
      why: "They feel operational pain. Sell the console, not the marketplace slogan.",
      followUp: "Would it help if requests lived in one place you can open from your phone?",
    };
  }
  if (pain === "direct" || pain === "visibility") {
    return {
      headline: "Be findable",
      say: `Guests can't book you if they can't find you.\n\nIsisel is a public catalog of African stays. Your ${type.toLowerCase()} gets a listing page, and you keep a dashboard for the bookings that come through.\n\nFounding hosts are listed first, while the catalog is still being built.`,
      why: "Visibility now is cheaper than visibility later.",
      followUp: "Would you want the property live on Isisel while we're still filling the catalog?",
    };
  }
  return {
    headline: "Another channel, on your terms",
    say: `I'll keep this simple.\n\nIsisel is an African vacation-rental marketplace. You list ${multi ? "your homes" : prospect.businessName || "the property"}, guests request on the site, and you manage it from a host dashboard on your phone.\n\nWe're not asking you to leave ${memory.platforms === "booking" ? "Booking.com" : memory.platforms === "airbnb" || memory.platforms === "both" ? "Airbnb" : "what you already use"}. We're another door.`,
    why: "No loud pain was named. Stay short and optional.",
    followUp: "Would you be open to seeing how a listing would look?",
  };
}

export const OBJECTIONS = [
  {
    id: "users",
    label: "How many users do you have?",
    say: "We're early — that's the point for you. Founding hosts get listed while the catalog is still being built, and they keep 100% of the night. I'd rather be honest than invent a user number.",
    why: "Credibility. Fake scale kills the rest of the call.",
    followUp: "Does being early — with better terms — interest you more than waiting until it's crowded?",
    avoid: "Don't invent traffic, rankings, or 'thousands of guests'.",
  },
  {
    id: "bookings_proof",
    label: "How do I know I'll get bookings?",
    say: "You don't, on day one — and I won't pretend otherwise. What you do get is a live listing, a host console, and founding-host terms while we grow demand. Airbnb didn't fill calendars on week one either. This is a second channel, not a guarantee.",
    why: "Adults respect a clean risk statement.",
    followUp: "If it only added a handful of extra nights this season, would the listing still be worth it?",
    avoid: "Don't promise occupancy, 'lots of tourists', or a date when demand explodes.",
  },
  {
    id: "already_airbnb",
    label: "I already use Airbnb",
    say: "Keep Airbnb. Isisel isn't a replacement. It's another door for guests looking for African stays, without the usual platform commission on those nights.",
    why: "Removes the either/or trap.",
    followUp: "Would you try it alongside Airbnb, not instead of it?",
    avoid: "Don't attack Airbnb. Don't ask them to take the listing down.",
  },
  {
    id: "already_booking",
    label: "I already use Booking.com",
    say: "Perfect — stay there. Isisel sits beside Booking.com. Different guests, different terms, same property. You manage Isisel bookings from your phone without giving up what already works.",
    why: "Same dual-channel logic, named for Booking.com.",
    followUp: "Can we add Isisel as a second channel and leave Booking.com as-is?",
    avoid: "Don't compare star ratings or undercut Booking.com with gossip.",
  },
  {
    id: "why_another",
    label: "Why another platform?",
    say: "Because one platform owns the relationship. A second channel means you're not stuck if rules, fees, or ranking change. Isisel is built for African vacation homes, not as a generic global extra.",
    why: "Strategy, not features.",
    followUp: "If fees went up next year, would you want another live channel already?",
    avoid: "Don't dump a feature list. Don't bad-mouth competitors.",
  },
  {
    id: "free",
    label: "Is this free?",
    say: "For founding hosts, you keep 100% of the night — no commission on those stays while the catalog is early. Creating the host account and listing the property doesn't require a setup fee.",
    why: "Clear commercial terms without overselling forever.",
    followUp: "If listing costs you nothing to start, shall we get the account open?",
    avoid: "Don't say 'always free forever' unless that's a signed policy.",
  },
  {
    id: "send_info",
    label: "Send me information",
    say: "I can. I'll send a short note and the host link. Before I do — so I send the right thing — is the main hesitation the product, the time, or talking it over with someone?",
    why: "Info-request is often a polite stall. Diagnose it.",
    followUp: "When should I check in after you've looked at it?",
    avoid: "Don't dump a PDF novel and vanish. Book the follow-up now.",
  },
  {
    id: "think",
    label: "I need to think about it",
    say: "Of course. What would you want to think through — the listing itself, how guests book, or the timing?",
    why: "Turns fog into one object you can handle.",
    followUp: "Can I call you [day] once you've had a look?",
    avoid: "Don't say 'sure' and hang up with no date.",
  },
  {
    id: "partner",
    label: "I need to talk to my partner",
    say: "That makes sense. Would it help if I sent a short summary you can forward — or should the three of us hop on a quick call?",
    why: "Respects the household decision. Keeps you in the loop.",
    followUp: "When will you have spoken with them?",
    avoid: "Don't pressure them to decide alone on this call.",
  },
  {
    id: "not_interested",
    label: "I'm not interested",
    say: "Understood. I'll leave it there. If it ever makes sense to have a second channel, the host page is isisel.com/host/onboarding. May I check back next season, or would you rather I don't call again?",
    why: "Graceful exit. Protects the brand.",
    followUp: "Do you prefer I close the file, or a reminder in a few months?",
    avoid: "Don't argue. Don't ask 'why not' three times.",
  },
];

export function objectionById(id) {
  return OBJECTIONS.find((o) => o.id === id) || null;
}

export function rankedObjections(memory) {
  const suggested = [];
  if (memory.platforms === "airbnb" || memory.platforms === "both") {
    suggested.push("already_airbnb");
  }
  if (memory.platforms === "booking" || memory.platforms === "both") {
    suggested.push("already_booking");
  }
  if (memory.pain === "bookings" || memory.looking === "yes") {
    suggested.push("bookings_proof");
  }
  suggested.push("users", "why_another", "free", "send_info", "think", "partner", "not_interested");
  const seen = new Set();
  const order = [];
  for (const id of suggested) {
    if (seen.has(id)) continue;
    seen.add(id);
    const row = objectionById(id);
    if (row) order.push(row);
  }
  for (const row of OBJECTIONS) {
    if (!seen.has(row.id)) order.push(row);
  }
  const likelyIds = new Set(suggested.slice(0, 4));
  return {
    likely: order.filter((o) => likelyIds.has(o.id)).slice(0, 4),
    other: order.filter((o) => !likelyIds.has(o.id)),
  };
}

export function closeOptions(memory) {
  const low = {
    id: "low",
    title: "Low-friction close",
    say: "Would you be open to getting your property listed on Isisel?",
  };
  const demo = {
    id: "demo",
    title: "Demo close",
    say: "Would you like me to quickly show you how the host dashboard works?",
  };
  const onboard = {
    id: "onboard",
    title: "Onboarding close",
    say: "If you'd like, we can get your host account started and add your first property.",
  };
  if (memory.interest === "interested") return [onboard, demo, low];
  if (memory.looking === "no" || memory.pain === "none") return [low, demo];
  if (memory.interest === "not_convinced") return [demo, low];
  return [low, demo, onboard];
}

export function recommendedResult(memory) {
  if (memory.closeChoice === "onboarding") return "converted";
  if (memory.closeChoice === "link") return "asked_info";
  if (memory.interest === "interested") return "interested";
  if (memory.openResult === "wrong_person") return "wrong_person";
  if (memory.openResult === "busy") return "follow_up";
  if (memory.objection === "send_info") return "asked_info";
  if (memory.interest === "objection" && memory.objection === "not_interested") {
    return "not_interested";
  }
  if (memory.closeChoice === "not_ready" || memory.closeChoice === "followup") {
    return "follow_up";
  }
  return "follow_up";
}

export function recommendedNextAction(memory, result) {
  if (result === "asked_info") return "email";
  if (result === "converted" || result === "interested") return "whatsapp";
  if (result === "not_interested") return "other";
  if (memory.closeChoice === "followup" || result === "follow_up") return "call";
  return "call";
}

export function applyAnswer(memory, key, value, extra = {}) {
  const next = { ...memory, [key]: value };
  if (key === "commissionFeel" && extra.pain) next.pain = extra.pain;
  if (key === "pain") next.pain = value;
  return next;
}

/** After an answer, which step should we land on? */
export function stepAfter(stepId, memory, key) {
  if (stepId === "open") {
    if (memory.openResult === "who" && !memory.whoExplained) return "open";
    if (
      (memory.openResult === "busy" || memory.openResult === "wrong_person") &&
      !memory.openResolved
    ) {
      return "open";
    }
    if (memory.openResult === "busy" || memory.openResult === "wrong_person") {
      return "next";
    }
    return skipToLive(memory);
  }
  if (stepId === "discover") {
    if (key === "continue" || !nextDiscoverKey(memory)) {
      if (!memory.pain && !memory.commissionFeel) return "pain";
      return "pitch";
    }
    return "discover";
  }
  if (stepId === "pain") return "pitch";
  if (stepId === "pitch") {
    if (memory.interest === "interested") return "close";
    return "response";
  }
  if (stepId === "response") {
    if (memory.objection === "not_interested") return "next";
    if (memory.objection === "send_info") return "next";
    return "close";
  }
  if (stepId === "close") return "next";
  return stepId;
}

export function shouldSkipResponse(memory) {
  return memory.interest === "interested";
}
