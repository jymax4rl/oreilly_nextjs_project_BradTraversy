"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { isOpsStaff } from "@/utils/opsAuth";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";
import {
  COPILOT_STEPS,
  CALL_RESULTS,
  telHref,
  sourceLabel,
  stageLabel,
  priorityLabel,
} from "@/utils/acquisition/constants";
import {
  hydrateMemory,
  fillScript,
  discoverPrompt,
  painPrompt,
  pitchFor,
  objectionById,
  rankedObjections,
  closeOptions,
  applyAnswer,
  stepAfter,
  memoryChips,
  recommendedResult,
  recommendedNextAction,
  openFollowUp,
  emptyMemory,
} from "@/utils/acquisition/copilot";
import { locationLine, formatWhen, toDateInput } from "../format";
import "./copilot.css";

const STEP_IDS = COPILOT_STEPS.map((s) => s.id);

function idxOf(id) {
  const i = STEP_IDS.indexOf(id);
  return i < 0 ? 0 : i;
}

async function persistMemory(prospectId, memory) {
  await fetch(`/api/ops/acquisition/prospects/${prospectId}/copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ memory, saveCall: false }),
  });
}

function tomorrowInput() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInput(d) || d.toISOString().slice(0, 10);
}

function Say({ text, ctx }) {
  const filled = fillScript(text, ctx);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="copilot-say">
      <span className="copilot-say__label">What to say</span>
      <p>{filled}</p>
      <button type="button" className="copilot-copy" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Choices({ options, value, onPick, two }) {
  return (
    <div className={`copilot-btns ${two ? "copilot-btns--2" : ""}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`copilot-choice ${value === opt.id ? "is-on" : ""}`}
          onClick={() => onPick(opt)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SalesCopilot() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const prospectId = params.get("id") || "";

  useEffect(() => {
    if (status === "authenticated" && !isOpsStaff(session?.user?.role)) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <p className="p-8 text-sm text-[#6b6b6b]">Loading…</p>;
  }
  if (!isOpsStaff(session?.user?.role)) return null;

  return (
    <div className="copilot-shell">
      {prospectId ? (
        <CopilotDeck
          prospectId={prospectId}
          sellerName={session?.user?.name || ""}
        />
      ) : (
        <CopilotPicker />
      )}
    </div>
  );
}

function CopilotPicker() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        view: "board",
        limit: "80",
        sort: "updatedAt",
        dir: "desc",
      });
      if (q.trim()) params.set("q", q.trim());
      try {
        const res = await fetch(`/api/ops/acquisition/prospects?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not load prospects");
        }
        const list = Array.isArray(data.prospects) ? data.prospects : [];
        const rank = (stage) => {
          const order = [
            "ready",
            "new",
            "researching",
            "follow_up",
            "contacted",
            "interested",
            "negotiating",
            "onboarding",
            "converted",
            "lost",
          ];
          const i = order.indexOf(stage);
          return i < 0 ? 50 : i;
        };
        list.sort((a, b) => rank(a.stage) - rank(b.stage));
        setRows(list);
      } catch (err) {
        setError(err.message || "Could not load prospects");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <OpsMarketingSubnav />
      <h2 className="text-lg font-semibold tracking-tight">Who are you calling?</h2>
      <p className="mt-1 mb-4 text-[13px] text-[#6b6b6b]">
        Open a prospect. Keep this screen beside you and tap what they say.
      </p>
      <input
        className="mb-3 h-11 w-full rounded-lg border border-[#ececec] px-3 text-sm"
        placeholder="Search name, city, phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <p className="text-sm text-[#6b6b6b]">Loading prospects…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : (
        <div className="copilot-pick">
          {rows.length === 0 ? (
            <p className="text-sm text-[#6b6b6b]">
              {q.trim()
                ? "No matching prospects."
                : "No prospects yet."}{" "}
              <Link className="underline" href="/ops/marketing/acquisition">
                Add one in Host Acquisition
              </Link>
            </p>
          ) : (
            rows.map((p) => (
              <Link key={p.id} href={`/ops/marketing/acquisition/copilot?id=${p.id}`}>
                <strong>{p.businessName}</strong>
                <span>
                  {p.contactName || "Owner unknown"} · {locationLine(p)} · {stageLabel(p.stage)}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CopilotDeck({ prospectId, sellerName }) {
  const [prospect, setProspect] = useState(null);
  const [memory, setMemory] = useState(emptyMemory());
  const [step, setStep] = useState("open");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState("follow_up");
  const [nextAction, setNextAction] = useState("whatsapp");
  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const touchX = useRef(null);

  const ctx = useMemo(
    () => ({
      contactName: prospect?.contactName,
      businessName: prospect?.businessName,
      sellerName,
    }),
    [prospect, sellerName],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/ops/acquisition/prospects/${prospectId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!alive) return;
      if (!res.ok) {
        setError(data.error || "Could not load prospect");
        return;
      }
      setProspect(data.prospect);
      const mem = hydrateMemory(data.prospect);
      setMemory(mem);
      const rec = recommendedResult(mem);
      setResult(rec);
      setNextAction(recommendedNextAction(mem, rec));
      setFollowDate(toDateInput(data.prospect.nextFollowUpAt) || tomorrowInput());
    })();
    return () => {
      alive = false;
    };
  }, [prospectId]);

  const commit = useCallback(
    async (nextMem, nextStep, key) => {
      setMemory(nextMem);
      const dest = nextStep || stepAfter(step, nextMem, key);
      setStep(dest);
      const rec = recommendedResult(nextMem);
      setResult(rec);
      setNextAction(recommendedNextAction(nextMem, rec));
      persistMemory(prospectId, nextMem).catch(() => {});
    },
    [prospectId, step],
  );

  const pick = (key, opt) => {
    const nextMem = applyAnswer(memory, key, opt.id, { pain: opt.pain });
    commit(nextMem, null, key === "continue" ? "continue" : key);
  };

  const stepMeta = COPILOT_STEPS[idxOf(step)];
  const chips = memoryChips(memory, prospect);
  const phone = prospect?.phone || prospect?.whatsapp;
  const callHref = telHref(phone);

  const go = (dir) => {
    const i = idxOf(step);
    const n = i + dir;
    if (n < 0 || n >= STEP_IDS.length) return;
    setStep(STEP_IDS[n]);
  };

  async function saveCall() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/ops/acquisition/prospects/${prospectId}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          memory,
          saveCall: true,
          result,
          nextAction,
          followUpDate: followDate,
          followUpTime: followTime,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProspect(data.prospect);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!prospect && !error) {
    return <p className="text-sm text-[#6b6b6b]">Opening prospect…</p>;
  }
  if (!prospect) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  const discover = discoverPrompt(memory);
  const pain = painPrompt(memory);
  const pitch = pitchFor(memory, prospect);
  const objection = objectionById(memory.objection);
  const openExtra = openFollowUp(memory);
  const objections = rankedObjections(memory);
  const types = (prospect.propertyTypes || []).join(", ");

  return (
    <>
      <header className="copilot-top">
        <div className="copilot-who">
          <strong>{prospect.contactName || prospect.businessName}</strong>
          <span>
            {prospect.businessName}
            {prospect.city ? ` · ${prospect.city}` : ""}
            {` · ${stageLabel(prospect.stage)}`}
          </span>
        </div>
          <div className="flex items-start gap-2">
          {callHref ? (
            <a className="copilot-call" href={callHref}>
              Call
            </a>
          ) : null}
          <Link className="copilot-pipe" href="/ops/marketing/acquisition">
            Pipeline
          </Link>
          <div className="copilot-step">
            <em>
              Step {stepMeta.n} of {COPILOT_STEPS.length}
            </em>
            <b>{stepMeta.label}</b>
          </div>
        </div>
      </header>

      <div className="copilot-dots" aria-label="Conversation steps">
        {COPILOT_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={idxOf(step) >= idxOf(s.id) ? "is-on" : ""}
            aria-label={`Step ${s.n}: ${s.label}`}
            aria-current={step === s.id ? "step" : undefined}
            onClick={() => setStep(s.id)}
          />
        ))}
      </div>
      {chips.length > 0 ? (
        <div className="copilot-chiprow mb-3 lg:hidden">
          {chips.map((c) => (
            <span key={c} className="copilot-chip">
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div className="copilot-desk">
        <aside className="copilot-side">
          <div className="copilot-side__card">
            <h3>Prospect</h3>
            <p className="text-[15px] font-semibold tracking-tight">{prospect.businessName}</p>
            <p className="mt-1 text-[12px] text-[#6b6b6b]">
              {prospect.contactName || "Owner unknown"}
              <br />
              {locationLine(prospect)}
              <br />
              {types ? `${types} · ` : ""}
              {prospect.propertyCount} {prospect.propertyCount === 1 ? "property" : "properties"}
              <br />
              {sourceLabel(prospect.source)}
              <br />
              {priorityLabel(prospect.priority)} priority · {stageLabel(prospect.stage)}
            </p>
            {phone ? (
              <p className="mt-2 text-[12px] text-[#3f3f3f]">{phone}</p>
            ) : null}
            {prospect.email ? (
              <p className="text-[12px] text-[#3f3f3f]">{prospect.email}</p>
            ) : null}
            {prospect.bestTimeToContact ? (
              <p className="mt-2 text-[12px] text-[#6b6b6b]">Best time: {prospect.bestTimeToContact}</p>
            ) : null}
          </div>
          {prospect.notes ? (
            <div className="copilot-side__card">
              <h3>CRM notes</h3>
              <p className="copilot-side__notes">{prospect.notes}</p>
            </div>
          ) : null}
        </aside>

        <article
          className="copilot-card"
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -56) go(1);
            if (dx > 56) go(-1);
          }}
        >
          {step === "open" ? (
            memory.openResult === "who" && !memory.whoExplained ? (
              <>
                <p className="copilot-obj">Objective · 15 seconds</p>
                <Say
                  ctx={ctx}
                  text={`Isisel is an African vacation-rental marketplace. Hosts list homes, guests request on the site, and you manage bookings from your phone.\n\nI'm not asking you to leave what you already use — I wanted to see if a second channel makes sense for [PROPERTY NAME].`}
                />
                <Choices
                  value=""
                  onPick={() => commit({ ...memory, whoExplained: "yes", openResult: "yes" })}
                  options={[{ id: "ok", label: "Got it — continue" }]}
                />
              </>
            ) : openExtra && !memory.openResolved ? (
              <>
                <p className="copilot-obj">Objective · {openExtra.objective}</p>
                <Say ctx={ctx} text={openExtra.say} />
                <p className="copilot-meta">
                  <b>Why it works</b>
                  {openExtra.why}
                </p>
                <p className="copilot-meta">
                  <b>Follow-up question</b>
                  {openExtra.followUp}
                </p>
                <p className="copilot-meta">
                  <b>What not to say</b>
                  {openExtra.avoid}
                </p>
                <Choices
                  two
                  value=""
                  onPick={() =>
                    commit({ ...memory, openResolved: "yes" }, "next")
                  }
                  options={openExtra.buttons}
                />
              </>
            ) : (
              <>
                <p className="copilot-obj">Objective · Get permission to continue</p>
                <Say
                  ctx={ctx}
                  text={`Hi, am I speaking with [NAME]?\n\nMy name is [MY NAME], I'm calling from Isisel.\n\nI came across [PROPERTY NAME] and wanted to speak with whoever handles the bookings. Is that you?`}
                />
                <Choices
                  two
                  value={memory.openResult}
                  onPick={(opt) => pick("openResult", opt)}
                  options={[
                    { id: "yes", label: "Yes, it's me" },
                    { id: "wrong_person", label: "Not the right person" },
                    { id: "busy", label: "Busy" },
                    { id: "who", label: "Who is Isisel?" },
                  ]}
                />
              </>
            )
          ) : null}

          {step === "discover" ? (
            <>
              <p className="copilot-obj">
                Objective · {discover.objective} · Q{discover.n} of 3
              </p>
              <Say ctx={ctx} text={discover.say} />
              <p className="copilot-meta">
                <b>Why</b>
                {discover.why}
              </p>
              <Choices
                two
                value={memory[discover.key] || ""}
                onPick={(opt) => {
                  if (!discover.key) {
                    commit(memory, "pain", "continue");
                    return;
                  }
                  pick(discover.key, opt);
                }}
                options={discover.buttons}
              />
            </>
          ) : null}

          {step === "pain" ? (
            <>
              <p className="copilot-obj">Objective · Name the pain before you pitch</p>
              <Say ctx={ctx} text={pain.say} />
              <p className="copilot-meta">
                <b>Why</b>
                {pain.why}
              </p>
              {pain.followUp ? (
                <p className="copilot-meta">
                  <b>If they stall</b>
                  {pain.followUp}
                </p>
              ) : null}
              <Choices
                two
                value={memory.commissionFeel || memory.pain}
                onPick={(opt) => pick(pain.key, opt)}
                options={pain.buttons}
              />
            </>
          ) : null}

          {step === "pitch" ? (
            <>
              <p className="copilot-obj">Recommended pitch · {pitch.headline}</p>
              <Say ctx={ctx} text={pitch.say} />
              <p className="copilot-meta">
                <b>Why it works</b>
                {pitch.why}
              </p>
              <p className="copilot-meta">
                <b>Follow-up question</b>
                {pitch.followUp}
              </p>
              <Choices
                two
                value={memory.interest}
                onPick={(opt) => pick("interest", opt)}
                options={[
                  { id: "interested", label: "They're interested" },
                  { id: "questions", label: "They have questions" },
                  { id: "not_convinced", label: "They're not convinced" },
                  { id: "objection", label: "Objection" },
                ]}
              />
            </>
          ) : null}

          {step === "response" ? (
            <>
              <p className="copilot-obj">What did they just say?</p>
              {!objection ? (
                <>
                  {objections.likely.length > 0 ? (
                    <>
                      <p className="copilot-meta">
                        <b>Likely on this call</b>
                      </p>
                      <Choices
                        value={memory.objection}
                        onPick={(opt) => {
                          const nextMem = { ...memory, objection: opt.id, interest: "objection" };
                          commit(nextMem, "response");
                        }}
                        options={objections.likely.map((o) => ({ id: o.id, label: o.label }))}
                      />
                    </>
                  ) : null}
                  {objections.other.length > 0 ? (
                    <>
                      <p className="copilot-meta mt-3">
                        <b>Other responses</b>
                      </p>
                      <Choices
                        value={memory.objection}
                        onPick={(opt) => {
                          const nextMem = { ...memory, objection: opt.id, interest: "objection" };
                          commit(nextMem, "response");
                        }}
                        options={objections.other.map((o) => ({ id: o.id, label: o.label }))}
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <Say ctx={ctx} text={objection.say} />
                  <p className="copilot-meta">
                    <b>Why it works</b>
                    {objection.why}
                  </p>
                  <p className="copilot-meta">
                    <b>Follow-up question</b>
                    {objection.followUp}
                  </p>
                  <p className="copilot-meta">
                    <b>What not to say</b>
                    {objection.avoid}
                  </p>
                  <Choices
                    two
                    value=""
                    onPick={(opt) => {
                      if (opt.id === "other") {
                        commit({ ...memory, objection: "" }, "response");
                        return;
                      }
                      commit(
                        { ...memory, interest: opt.id === "dead" ? "objection" : "interested" },
                        opt.id === "dead" ? "next" : "close",
                      );
                    }}
                    options={[
                      { id: "moved", label: "They're moving" },
                      { id: "dead", label: "Still a no" },
                      { id: "other", label: "Different objection" },
                    ]}
                  />
                </>
              )}
            </>
          ) : null}

          {step === "close" ? (
            <>
              <p className="copilot-obj">Close · pick the lightest yes</p>
              {closeOptions(memory).map((c) => (
                <div key={c.id} className="mb-3">
                  <p className="copilot-meta" style={{ marginBottom: 6 }}>
                    <b>{c.title}</b>
                  </p>
                  <Say ctx={ctx} text={c.say} />
                </div>
              ))}
              <Choices
                two
                value={memory.closeChoice}
                onPick={(opt) => pick("closeChoice", opt)}
                options={[
                  { id: "onboarding", label: "Start onboarding" },
                  { id: "link", label: "Send link" },
                  { id: "followup", label: "Schedule follow-up" },
                  { id: "not_ready", label: "Not ready" },
                ]}
              />
              {memory.closeChoice === "link" ? (
                <p className="copilot-meta mt-2">
                  Host link: www.isisel.com/host/onboarding
                </p>
              ) : null}
            </>
          ) : null}

          {step === "next" ? (
            <>
              <p className="copilot-obj">Record the call while it’s still in your head</p>
              <label className="copilot-field mb-2">
                <span>Call result</span>
                <select value={result} onChange={(e) => setResult(e.target.value)}>
                  {CALL_RESULTS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <label className="copilot-field">
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={followDate}
                    onChange={(e) => setFollowDate(e.target.value)}
                  />
                </label>
                <label className="copilot-field">
                  <span>Time</span>
                  <input
                    type="time"
                    value={followTime}
                    onChange={(e) => setFollowTime(e.target.value)}
                  />
                </label>
              </div>
              <label className="copilot-field mb-2">
                <span>Next action</span>
                <select value={nextAction} onChange={(e) => setNextAction(e.target.value)}>
                  <option value="call">Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="copilot-field">
                <span>Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What they said, who decides, what to send…"
                />
              </label>
              {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
              {saved ? (
                <p className="mt-3 text-sm text-[#14532d]">
                  Saved to the CRM.{" "}
                  <Link className="underline" href="/ops/marketing/acquisition">
                    Back to pipeline
                  </Link>
                </p>
              ) : (
                <button
                  type="button"
                  className="copilot-choice is-on mt-3"
                  disabled={saving}
                  onClick={saveCall}
                >
                  {saving ? "Saving…" : "Save call"}
                </button>
              )}
            </>
          ) : null}
        </article>

        <aside className="copilot-side">
          <div className="copilot-side__card">
            <h3>Conversation memory</h3>
            {chips.length === 0 ? (
              <p className="text-[12px] text-[#6b6b6b]">Tap what they say. It will show up here.</p>
            ) : (
              <div className="copilot-chiprow">
                {chips.map((c) => (
                  <span key={c} className="copilot-chip">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="copilot-side__card">
            <h3>This call</h3>
            <p className="text-[12px] text-[#6b6b6b]">
              Last contact: {formatWhen(prospect.lastContactAt)}
              <br />
              Follow-up: {formatWhen(prospect.nextFollowUpAt)}
            </p>
            <label className="copilot-field mt-3">
              <span>Live notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What they said, who decides, what to send…"
              />
            </label>
          </div>
        </aside>
      </div>

      <nav className="copilot-bar">
        <button type="button" className="is-ghost" disabled={idxOf(step) === 0} onClick={() => go(-1)}>
          ← Back
        </button>
        <button
          type="button"
          className="is-next"
          disabled={idxOf(step) === STEP_IDS.length - 1}
          onClick={() => go(1)}
        >
          Next →
        </button>
      </nav>
    </>
  );
}
