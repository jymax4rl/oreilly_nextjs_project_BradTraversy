import Link from "next/link";
import connectToDatabase from "@/config/database";
import { getFoundingHostDashboardStats } from "@/utils/foundingHost/stats";

export default async function OpsFoundingHostsHomeCard() {
  let stats = null;
  try {
    const ok = await connectToDatabase();
    if (ok) stats = await getFoundingHostDashboardStats();
  } catch (error) {
    console.error("Ops founding hosts home card:", error);
  }

  if (!stats) return null;

  return (
    <Link href="/ops/founding-hosts" className="ops-card block transition hover:bg-[#fafafa]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
        Founding Hosts
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[#0a0a0a]">
        {stats.spotsClaimed} / {stats.totalSpots} claimed
      </p>
      <p className="mt-1 text-[12px] text-[#6b6b6b]">
        {stats.spotsRemaining} spots remaining · {stats.activeFoundingHosts} active
      </p>
    </Link>
  );
}
