import { redirect } from "next/navigation";

export const metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

export default function HostReservationsTimelinePage() {
  redirect("/host/calendar");
}
