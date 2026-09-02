"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ACQUISITION_STAGES,
  ACQUISITION_PRIORITIES,
  ACTIVITY_TYPES,
  stageLabel,
  sourceLabel,
  priorityLabel,
  activityLabel,
} from "@/utils/acquisition/constants";
import { formatWhen, locationLine, toDateInput, toTimeInput, followUpState } from "./format";
import AcquisitionQuickActions from "./AcquisitionQuickActions";

export default function AcquisitionDrawer({
  prospectId,
  intent,
  onClose,
  onChanged,
}) {
  const [prospect, setProspect] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logType, setLogType] = useState(intent === "followup" ? "follow_up" : "call");
  const [logText, setLogText] = useState("");
  const [nextStage, setNextStage] = useState("");
  const [nextPriority, setNextPriority] = useState("");
  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("09:00");
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [saving, setSaving] = useState(false);
  const [convertEmail, setConvertEmail] = useState("");
  const [convertMsg, setConvertMsg] = useState("");
  const [host, setHost] = useState(null);

  useEffect(() => {
    if (!prospectId) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [pRes, aRes] = await Promise.all([
          fetch(`/api/ops/acquisition/prospects/${prospectId}`, {
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(`/api/ops/acquisition/prospects/${prospectId}/activities`, {
            credentials: "include",
            signal: controller.signal,
          }),
        ]);
        const pData = await pRes.json();
        const aData = await aRes.json();
        if (!pRes.ok) throw new Error(pData.error || "Failed to load");
        setProspect(pData.prospect);
        setActivities(aData.activities || []);
        setNextStage(pData.prospect.stage);
        setNextPriority(pData.prospect.priority);
        setFollowDate(toDateInput(pData.prospect.nextFollowUpAt));
        setFollowTime(toTimeInput(pData.prospect.nextFollowUpAt) || "09:00");
        setAwaitingReply(Boolean(pData.prospect.awaitingReply));
        setConvertEmail(pData.prospect.email || "");
        if (intent === "note") setLogType("note");
        if (intent === "followup") setLogType("follow_up");
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [prospectId, intent]);

  async function patchStage(stage) {
    const res = await fetch(`/api/ops/acquisition/prospects/${prospectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stage }),
    });
    const data = await res.json();
    if (res.ok) {
      setProspect(data.prospect);
      onChanged?.(data.prospect);
    }
  }

  async function logActivity(event) {
    event.preventDefault();
    if (!logText.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/ops/acquisition/prospects/${prospectId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: logType,
          description: logText,
          stage: nextStage,
          priority: nextPriority,
          followUpDate: followDate || undefined,
          followUpTime: followTime,
          awaitingReply,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not log");
      setProspect(data.prospect);
      setLogText("");
      setActivities((prev) => [data.activity, ...prev]);
      onChanged?.(data.prospect);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function convert() {
    setConvertMsg("");
    const res = await fetch(`/api/ops/acquisition/prospects/${prospectId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: convertEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setConvertMsg(data.error || "Conversion failed");
      return;
    }
    setProspect(data.prospect);
    setHost(data.host);
    onChanged?.(data.prospect);
    setConvertMsg("Converted and linked to the Isisel host account.");
  }

  if (!prospectId) return null;

  const state = followUpState(prospect?.nextFollowUpAt);

  return (
    <>
      <button type="button" className="acq-drawer-scrim" aria-label="Close" onClick={onClose} />
      <aside className="acq-drawer" role="dialog" aria-label="Prospect">
        {loading ? (
          <div className="p-8 text-sm text-[#6b6b6b]">Loading prospect…</div>
        ) : !prospect ? (
          <div className="p-8 text-sm text-red-700">{error || "Not found"}</div>
        ) : (
          <div className="p-5 pb-16">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                  {sourceLabel(prospect.source)} · {stageLabel(prospect.stage)}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">{prospect.businessName}</h2>
                <p className="mt-1 text-sm text-[#6b6b6b]">
                  {prospect.contactName || "Owner unknown"} · {locationLine(prospect)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/ops/marketing/acquisition/copilot?id=${prospect.id}`}
                  className="text-sm font-medium text-[#111]"
                >
                  Copilot
                </Link>
                <button type="button" className="text-sm text-[#6b6b6b]" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className={`acq-chip acq-chip--${prospect.priority}`}>
                {priorityLabel(prospect.priority)} priority
              </span>
              {state ? (
                <span className={`acq-chip acq-chip--${state}`}>
                  {state === "overdue"
                    ? "Overdue follow-up"
                    : state === "today"
                      ? "Follow-up due today"
                      : "Upcoming follow-up"}
                </span>
              ) : null}
              {prospect.stage === "converted" ? (
                <span className="acq-chip acq-chip--upcoming">Converted</span>
              ) : null}
            </div>

            <AcquisitionQuickActions
              prospect={prospect}
              onFollowUp={() => setLogType("follow_up")}
              onNote={() => setLogType("note")}
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="acq-field">
                <span>Stage</span>
                <select value={prospect.stage} onChange={(e) => patchStage(e.target.value)}>
                  {ACQUISITION_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="acq-field">
                <span>Priority</span>
                <select
                  value={prospect.priority}
                  onChange={(e) =>
                    fetch(`/api/ops/acquisition/prospects/${prospectId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ priority: e.target.value }),
                    })
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.prospect) {
                          setProspect(d.prospect);
                          onChanged?.(d.prospect);
                        }
                      })
                  }
                >
                  {ACQUISITION_PRIORITIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <form className="ops-card mt-5" onSubmit={logActivity}>
              <h3 className="text-sm font-semibold">Log activity</h3>
              <p className="mt-1 text-[12px] text-[#6b6b6b]">
                What happened on this call or message? Then set the next move.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <label className="acq-field">
                  <span>Type</span>
                  <select value={logType} onChange={(e) => setLogType(e.target.value)}>
                    {ACTIVITY_TYPES.filter((t) => !["stage_change", "priority_change"].includes(t.id)).map(
                      (t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="acq-field">
                  <span>What happened?</span>
                  <textarea
                    required
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    placeholder="Spoke with owner. 4 apartments in Dakar. Uses Airbnb. Call again Friday."
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="acq-field">
                    <span>Move stage</span>
                    <select value={nextStage} onChange={(e) => setNextStage(e.target.value)}>
                      {ACQUISITION_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="acq-field">
                    <span>Priority</span>
                    <select
                      value={nextPriority}
                      onChange={(e) => setNextPriority(e.target.value)}
                    >
                      {ACQUISITION_PRIORITIES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="acq-field">
                    <span>Next follow-up</span>
                    <input
                      type="date"
                      value={followDate}
                      onChange={(e) => setFollowDate(e.target.value)}
                    />
                  </label>
                  <label className="acq-field">
                    <span>Time</span>
                    <input
                      type="time"
                      value={followTime}
                      onChange={(e) => setFollowTime(e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={awaitingReply}
                    onChange={(e) => setAwaitingReply(e.target.checked)}
                  />
                  Waiting for a response
                </label>
              </div>
              {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
              <button
                type="submit"
                disabled={saving}
                className="mt-3 rounded-lg bg-[#111] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save activity"}
              </button>
            </form>

            <section className="mt-6">
              <h3 className="text-sm font-semibold">Contact</h3>
              <dl className="mt-2 space-y-1 text-[13px]">
                <div>Phone {prospect.phone || "—"}</div>
                <div>WhatsApp {prospect.whatsapp || "—"}</div>
                <div>Email {prospect.email || "—"}</div>
                <div>Website {prospect.website || "—"}</div>
                <div>Preferred {prospect.preferredContactMethod}</div>
                <div>Best time {prospect.bestTimeToContact || "—"}</div>
              </dl>
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-semibold">Property</h3>
              <p className="mt-2 text-[13px] text-[#3f3f3f]">
                {prospect.propertyCount} properties
                {prospect.propertyTypes?.length ? ` · ${prospect.propertyTypes.join(", ")}` : ""}
              </p>
              {prospect.existingPlatforms?.length ? (
                <p className="mt-1 text-[13px] text-[#6b6b6b]">
                  On {prospect.existingPlatforms.join(", ")}
                </p>
              ) : null}
              {prospect.propertyNotes ? (
                <p className="mt-2 whitespace-pre-wrap text-[13px]">{prospect.propertyNotes}</p>
              ) : null}
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-semibold">Acquisition</h3>
              <p className="mt-2 text-[13px]">
                {sourceLabel(prospect.source)}
                {prospect.sourceUrl ? (
                  <>
                    {" · "}
                    <a className="underline" href={prospect.sourceUrl} target="_blank" rel="noreferrer">
                      Source link
                    </a>
                  </>
                ) : null}
              </p>
              {prospect.discoveryMethod ? (
                <p className="mt-1 text-[13px] text-[#6b6b6b]">{prospect.discoveryMethod}</p>
              ) : null}
              {prospect.notes ? (
                <p className="mt-2 whitespace-pre-wrap text-[13px]">{prospect.notes}</p>
              ) : null}
            </section>

            <section className="ops-card mt-5">
              <h3 className="text-sm font-semibold">Convert to host</h3>
              <p className="mt-1 text-[12px] text-[#6b6b6b]">
                Links this prospect to an existing Isisel account. Does not create a duplicate user.
              </p>
              {prospect.convertedUser ? (
                <p className="mt-3 text-[13px]">
                  Converted {formatWhen(prospect.convertedAt)} · {prospect.convertedPropertyCount ?? 0} listings
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <label className="acq-field">
                    <span>Host account email</span>
                    <input
                      value={convertEmail}
                      onChange={(e) => setConvertEmail(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={convert}
                    className="rounded-lg border border-[#111] px-3 py-2 text-sm font-medium"
                  >
                    Convert to host
                  </button>
                </div>
              )}
              {host ? (
                <p className="mt-2 text-[13px]">
                  {host.username} · {host.email} · {host.hostStatus} · {host.propertyCount} listings
                </p>
              ) : null}
              {convertMsg ? <p className="mt-2 text-[13px] text-[#14532d]">{convertMsg}</p> : null}
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-semibold">Activity timeline</h3>
              {activities.length === 0 ? (
                <p className="mt-2 text-[13px] text-[#6b6b6b]">No interactions yet.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {activities.map((item) => (
                    <li key={item.id} className="border-l border-[#ececec] pl-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
                        {activityLabel(item.type)} · {formatWhen(item.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px]">{item.description}</p>
                      <p className="mt-0.5 text-[11px] text-[#6b6b6b]">
                        {item.actor?.name || item.actor?.email || "Ops"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </aside>
    </>
  );
}
