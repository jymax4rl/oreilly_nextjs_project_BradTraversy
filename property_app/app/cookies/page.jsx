import { redirect } from "next/navigation";

/** Legacy footer link → cookies section. */
export default function CookiesRedirectPage() {
  redirect("/policies/cookies");
}
