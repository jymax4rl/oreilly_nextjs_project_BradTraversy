"use client";

import GlowBarChart from "@/components/ops/charts/GlowBarChart";

export default function AcquisitionInsights({ summary }) {
  const sources = summary?.sources || [];
  const insights = summary?.insights || {};
  const kpis = summary?.kpis || {};

  return (
    <section className="space-y-4" aria-labelledby="acq-insights-heading">
      <div>
        <h2 id="acq-insights-heading" className="text-sm font-semibold tracking-tight">
          Acquisition insights
        </h2>
        <p className="mt-1 text-[13px] text-[#6b6b6b]">
          Where should prospecting time go? These numbers are live from this CRM.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ["Added this week", insights.addedThisWeek],
          ["Contacted this week", insights.contactedThisWeek],
          ["Replies this week", insights.repliesThisWeek],
          ["Converted this week", insights.convertedThisWeek],
        ].map(([label, value]) => (
          <div key={label} className="ops-card">
            <p className="ops-card-label">{label}</p>
            <p className="ops-card-value">{Number(value || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <GlowBarChart
        label="Hosts by source"
        subtitle="Converted prospects"
        bars={sources
          .filter((s) => s.prospects > 0)
          .map((s) => ({
          label: s.label.replace(".com", ""),
          value: s.converted,
          tone: "teal",
        }))}
        emptyHint="Convert a host to see which channel is working."
      />

      <div className="acq-table-wrap">
        <table className="acq-table" style={{ minWidth: "40rem" }}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Prospects</th>
              <th>Contacted</th>
              <th>Interested</th>
              <th>Converted</th>
              <th>Conversion</th>
              <th>Properties</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>{s.label}</td>
                <td>{s.prospects}</td>
                <td>{s.contacted}</td>
                <td>{s.interested}</td>
                <td>{s.converted}</td>
                <td>{s.conversionRate}%</td>
                <td>{s.properties}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#6b6b6b]">
        Overall conversion {kpis.conversion_rate || 0}% · {kpis.converted || 0} hosts from{" "}
        {kpis.total || 0} prospects.
      </p>
    </section>
  );
}
