import MissingPage from "@/components/MissingPage";

export const metadata = {
  title: { absolute: "Stay unavailable | Isisel" },
  robots: { index: false, follow: false },
};

export default function PropertyNotFound() {
  return <MissingPage variant="listing" />;
}
