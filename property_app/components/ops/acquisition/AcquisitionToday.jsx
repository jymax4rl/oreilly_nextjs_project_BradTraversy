"use client";

import { followUpState, formatWhen, locationLine } from "./format";

function Col({ title, items, empty, onOpen, tone }) {
  return (
    <div className="ops-card acq-today-col">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12px] text-[#6b6b6b]">{empty}</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((p) => {
            const state = followUpState(p.nextFollowUpAt);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="acq-today-item"
                  onClick={() => onOpen(p.id)}
                >
                  <span className="block text-[13px] font-medium text-[#0a0a0a]">
                    {p.businessName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#6b6b6b]">
                    {locationLine(p)}
                    {p.nextFollowUpAt ? ` · ${formatWhen(p.nextFollowUpAt)}` : ""}
                  </span>
                  {tone && state ? (
                    <span className={`acq-chip acq-chip--${state} mt-1`}>
                      {state === "overdue"
                        ? "Overdue"
                        : state === "today"
                          ? "Due today"
                          : "Upcoming"}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AcquisitionToday({ today = {}, onOpen }) {
  return (
    <section aria-labelledby="acq-today-heading" className="mt-6">
      <h2
        id="acq-today-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]"
      >
        Today’s actions
      </h2>
      <div className="acq-today">
        <Col
          title="Follow-ups due today"
          items={today.followUpsDue || []}
          empty="Nothing due today."
          onOpen={onOpen}
          tone
        />
        <Col
          title="Overdue follow-ups"
          items={today.overdue || []}
          empty="No overdue follow-ups."
          onOpen={onOpen}
          tone
        />
        <Col
          title="Calls to make"
          items={today.calls || []}
          empty="Nobody to call."
          onOpen={onOpen}
        />
        <Col
          title="Waiting for a response"
          items={today.awaitingReply || []}
          empty="Nobody waiting."
          onOpen={onOpen}
        />
        <Col
          title="High-priority"
          items={today.highPriority || []}
          empty="No high-priority leads."
          onOpen={onOpen}
        />
      </div>
    </section>
  );
}
