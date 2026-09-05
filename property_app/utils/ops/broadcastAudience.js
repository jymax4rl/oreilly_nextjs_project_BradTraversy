import { OPS_ROLES } from "@/utils/opsAuth";

export const BROADCAST_AUDIENCES = [
  {
    id: "guests",
    label: "Guests (not hosts yet)",
    hint: "Signed-up travellers with no host application.",
  },
  {
    id: "applicants",
    label: "Host applicants",
    hint: "Application in review.",
  },
  {
    id: "rejected",
    label: "Rejected applicants",
    hint: "Can be invited to update and resubmit.",
  },
  {
    id: "hosts",
    label: "Verified hosts",
    hint: "Already listing or approved to list.",
  },
  {
    id: "all",
    label: "All marketplace accounts",
    hint: "Everyone except staff and banned accounts.",
  },
];

export function broadcastAudienceQuery(audience) {
  const base = {
    role: { $nin: [...OPS_ROLES] },
    banned: { $ne: true },
    isTrainingGuest: { $ne: true },
    email: { $exists: true, $nin: [null, ""] },
  };

  switch (audience) {
    case "guests":
      return { ...base, hostStatus: "none" };
    case "applicants":
      return { ...base, hostStatus: "onboarding" };
    case "rejected":
      return { ...base, hostStatus: "rejected" };
    case "hosts":
      return {
        ...base,
        $or: [{ hostStatus: "verified" }, { role: "host" }],
      };
    case "all":
      return base;
    default:
      return null;
  }
}
