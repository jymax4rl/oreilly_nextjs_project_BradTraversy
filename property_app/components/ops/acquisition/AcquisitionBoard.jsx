"use client";

import { ACQUISITION_STAGES, sourceLabel, priorityLabel } from "@/utils/acquisition/constants";
import { followUpState, formatWhen, locationLine } from "./format";
import AcquisitionQuickActions from "./AcquisitionQuickActions";

function Card({ prospect, onOpen, onDragStart }) {
  const state = followUpState(prospect.nextFollowUpAt);
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", prospect.id);
        event.dataTransfer.setData("text/prospect-id", prospect.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(prospect.id);
      }}
      className="acq-card"
    >
      <button type="button" className="w-full text-left" onClick={() => onOpen(prospect.id)}>
        <p className="acq-card__name">{prospect.businessName}</p>
        <p className="acq-card__meta">
          {prospect.contactName || "No owner name"} · {locationLine(prospect)}
        </p>
        <p className="acq-card__meta mt-1">
          {sourceLabel(prospect.source)} · {prospect.propertyCount || 1}{" "}
          {prospect.propertyCount === 1 ? "property" : "properties"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={`acq-chip acq-chip--${prospect.priority}`}>
            {priorityLabel(prospect.priority)}
          </span>
          {state ? (
            <span className={`acq-chip acq-chip--${state}`}>
              {state === "overdue"
                ? "Overdue follow-up"
                : state === "today"
                  ? "Due today"
                  : `Next ${formatWhen(prospect.nextFollowUpAt)}`}
            </span>
          ) : null}
        </div>
        <p className="acq-card__meta mt-1.5">
          Last contact {formatWhen(prospect.lastContactAt)}
        </p>
      </button>
      <div className="mt-2">
        <AcquisitionQuickActions
          prospect={prospect}
          compact
          onFollowUp={() => onOpen(prospect.id, "followup")}
          onNote={() => onOpen(prospect.id, "note")}
        />
      </div>
    </article>
  );
}

export default function AcquisitionBoard({ prospects = [], onOpen, onMoveStage }) {
  const grouped = Object.fromEntries(ACQUISITION_STAGES.map((s) => [s.id, []]));
  prospects.forEach((p) => {
    if (grouped[p.stage]) grouped[p.stage].push(p);
    else grouped.new.push(p);
  });

  return (
    <div className="acq-board" role="list">
      {ACQUISITION_STAGES.map((stage) => (
        <section
          key={stage.id}
          className="acq-col"
          onDragOver={(event) => {
            event.preventDefault();
            event.currentTarget.classList.add("acq-col--over");
          }}
          onDragLeave={(event) => {
            event.currentTarget.classList.remove("acq-col--over");
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.currentTarget.classList.remove("acq-col--over");
            const id =
              event.dataTransfer.getData("text/prospect-id") ||
              event.dataTransfer.getData("text/plain");
            if (id) onMoveStage?.(id, stage.id);
          }}
        >
          <header className="acq-col__head">
            <h3 className="acq-col__title">{stage.short}</h3>
            <span className="acq-col__count">{grouped[stage.id].length}</span>
          </header>
          <div className="acq-col__body">
            {grouped[stage.id].length === 0 ? (
              <p className="acq-empty px-1 py-6">Drop here</p>
            ) : (
              grouped[stage.id].map((prospect) => (
                <Card key={prospect.id} prospect={prospect} onOpen={onOpen} />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
