import { redirect } from "next/navigation";

export const metadata = {
  title: "Hosts",
};

/** Phase 1: reuse legacy admin hosts tool until ops-native UI lands. */
export default function OpsHostsPage() {
  redirect("/admin/hosts");
}
