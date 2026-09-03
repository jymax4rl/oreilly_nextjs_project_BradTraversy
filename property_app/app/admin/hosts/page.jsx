import { redirect } from "next/navigation";

/** Legacy admin path — ops console owns the staff UI. */
export default function AdminHostsPage() {
  redirect("/ops/hosts");
}
