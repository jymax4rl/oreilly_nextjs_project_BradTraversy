import { redirect } from "next/navigation";

/** Legacy footer link → privacy section. */
export default function PrivacyRedirectPage() {
  redirect("/policies/privacy");
}
