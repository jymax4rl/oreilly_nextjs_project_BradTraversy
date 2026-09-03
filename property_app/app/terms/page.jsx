import { redirect } from "next/navigation";

/** Legacy footer link → policies hub (terms section). */
export default function TermsRedirectPage() {
  redirect("/policies/terms");
}
