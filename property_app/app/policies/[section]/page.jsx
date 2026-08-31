import { Suspense } from "react";
import { notFound } from "next/navigation";
import PoliciesShell from "@/components/legal/PoliciesShell";
import { SECTION_IDS, getSectionById } from "@/lib/legal/content";

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }));
}

export async function generateMetadata({ params }) {
  const { section } = await params;
  const hit = getSectionById(section);
  if (!hit) {
    return { title: "Policies | Kama Properties" };
  }
  return {
    title: `${hit.title.en} | Kama Properties`,
    description: hit.paragraphs.en[0]?.slice(0, 155) || "Kama Properties policies",
  };
}

function PoliciesFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[var(--kama-canvas)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
    </div>
  );
}

export default async function PolicySectionPage({ params }) {
  const { section } = await params;
  if (!getSectionById(section)) {
    notFound();
  }

  return (
    <Suspense fallback={<PoliciesFallback />}>
      <PoliciesShell initialSection={section} />
    </Suspense>
  );
}
