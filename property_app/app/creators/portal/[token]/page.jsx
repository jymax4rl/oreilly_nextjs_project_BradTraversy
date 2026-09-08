import { buildCreatorPortal } from "@/utils/creators/creatorPortal";
import { enrichPortalWithAvailability } from "@/utils/creators/creatorConsole";
import connectToDatabase from "@/config/database";
import CreatorPortalView from "@/components/creators/CreatorPortalView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator portal | Isisel",
  robots: { index: false, follow: false },
};

export default async function CreatorPortalPage({ params }) {
  const { token } = await params;
  await connectToDatabase();
  const base = await buildCreatorPortal(token);

  if (!base) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-[var(--kama-ink)]">
          Portal link not found
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          Ask your host partner for a fresh earnings link.
        </p>
      </main>
    );
  }

  const portal = await enrichPortalWithAvailability({
    ...base,
    joinPath: `/creators/join/${token}`,
  });

  return <CreatorPortalView data={portal} token={token} />;
}
