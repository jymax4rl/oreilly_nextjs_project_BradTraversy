import { redirect } from "next/navigation";

/** Host pitch now lives as a modal on the application page. */
export default function OnboardingRedirectPage() {
  redirect("/host/onboarding");
}
