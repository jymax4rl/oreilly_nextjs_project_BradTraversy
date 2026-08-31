import { redirect } from "next/navigation";

export const metadata = {
  title: "Listings",
};

/** Phase 1: reuse legacy admin listings tool until ops-native UI lands. */
export default function OpsListingsPage() {
  redirect("/admin/listings");
}
