import ContactPage from "@/components/contact/ContactPage";

export const metadata = {
  title: { absolute: "Contact Isisel" },
  description:
    "Write to Isisel about a stay, hosting, press, or partnership. Messages go to contact@isisel.com.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/contact",
    siteName: "Isisel",
    title: "Contact Isisel",
    description:
      "A short form for stays, hosting, press, and partnerships — delivered to contact@isisel.com.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Isisel",
    description:
      "Write to the Isisel team. We read every message at contact@isisel.com.",
  },
};

export default function ContactRoute() {
  return <ContactPage />;
}
