import MissingPage from "@/components/MissingPage";

export const metadata = {
  title: { absolute: "Page unavailable | Isisel" },
  robots: { index: false, follow: true },
};

export default function HostNotFound() {
  return <MissingPage />;
}
