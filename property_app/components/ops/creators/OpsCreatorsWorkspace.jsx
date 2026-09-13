"use client";

import { useState } from "react";
import OpsShell from "@/components/ops/OpsShell";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";
import CreatorLeadsPanel from "@/components/ops/creators/CreatorLeadsPanel";
import CreatorCommissionsPanel from "@/components/ops/creators/CreatorCommissionsPanel";

export default function OpsCreatorsWorkspace() {
  const [tab, setTab] = useState("leads");

  return (
    <OpsShell
      wide
      title="Creator partnerships"
      subtitle="Leads from /influencers plus the commission ledger — platform fees stay separate."
    >
      <OpsMarketingSubnav />
      <div className="mb-4 flex gap-2">
        {[
          { id: "leads", label: "Leads" },
          { id: "commissions", label: "Commissions" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === item.id
                ? "bg-[var(--kama-accent)] text-white"
                : "bg-[var(--kama-field)] text-[var(--kama-ink-muted)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "leads" ? <CreatorLeadsPanel /> : <CreatorCommissionsPanel />}
    </OpsShell>
  );
}
