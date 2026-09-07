import OpsShell from "@/components/ops/OpsShell";
import OpsCleanerRowActions from "@/components/ops/OpsCleanerRowActions";
import connectToDatabase from "@/config/database";
import User from "@/models/User";
import CleaningJob from "@/models/CleaningJob";
import CleaningReview from "@/models/CleaningReview";

export const metadata = {
  title: "Cleaners",
};

export default async function OpsCleanersPage() {
  await connectToDatabase();
  const [
    totalCleaners,
    activeCleaners,
    suspendedCleaners,
    jobs,
    completed,
    issues,
    reviews,
  ] = await Promise.all([
    User.countDocuments({
      $or: [{ role: "cleaner" }, { cleanerStatus: { $in: ["active", "suspended"] } }],
    }),
    User.countDocuments({ cleanerStatus: "active" }),
    User.countDocuments({ cleanerStatus: "suspended" }),
    CleaningJob.countDocuments({}),
    CleaningJob.countDocuments({ status: "completed" }),
    CleaningJob.countDocuments({
      $or: [{ status: "issue_reported" }, { "issueReports.0": { $exists: true } }],
    }),
    CleaningReview.countDocuments({}),
  ]);

  const recent = await User.find({
    $or: [{ role: "cleaner" }, { cleanerStatus: { $ne: "none" } }],
  })
    .select("username email cleanerStatus role")
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();

  const stats = [
    ["Total cleaners", totalCleaners],
    ["Active", activeCleaners],
    ["Suspended", suspendedCleaners],
    ["Cleaning jobs", jobs],
    ["Completed", completed],
    ["Issues", issues],
    ["Reviews", reviews],
  ];

  return (
    <OpsShell title="Cleaners" subtitle="Visibility for the Isisel Cleaners network.">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <li
            key={label}
            className="rounded-xl border border-[#ececec] bg-white px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-[#6b6b6b]">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-sm font-semibold">Recent cleaners</h2>
      <ul className="mt-2 divide-y divide-[#ececec] rounded-xl border border-[#ececec] bg-white">
        {recent.map((user) => (
          <li key={String(user._id)} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-medium">{user.username}</span>
              <span className="ml-2 text-[#6b6b6b]">{user.email}</span>
            </span>
            <OpsCleanerRowActions
              userId={String(user._id)}
              status={user.cleanerStatus || "none"}
            />
          </li>
        ))}
      </ul>
    </OpsShell>
  );
}
