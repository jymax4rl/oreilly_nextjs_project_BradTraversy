import { redirect } from "next/navigation";

/** Prefer the ops console entry point for staff. */
export default function AdminIndexPage() {
  redirect("/ops");
}
