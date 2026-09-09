import { notFound } from "next/navigation";
import Link from "next/link";
import DocumentationArticleView from "@/components/documentation/DocumentationArticleView";
import connectToDatabase from "@/config/database";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";
import {
  getDocumentationBySlug,
  listDocumentation,
} from "@/utils/documentation/service";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  const article = await getDocumentationBySlug(slug, { includeDrafts: true });
  if (!article) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: article.title,
    description: article.summary,
    robots: { index: false, follow: false },
  };
}

export default async function DocumentationArticlePage({ params }) {
  const { slug } = await params;
  await connectToDatabase();
  await ensureDocumentationSeeded();
  const article = await getDocumentationBySlug(slug, { includeDrafts: true });
  if (!article) notFound();

  let related = [];
  if (article.relatedSlugs?.length) {
    const all = await listDocumentation({ status: "active", limit: 200 });
    related = all.filter((a) => article.relatedSlugs.includes(a.slug));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link href="/documentation" className="docs-btn">
          ← Documentation
        </Link>
        <Link
          href={`/documentation/manage/${article.id}`}
          className="docs-btn"
        >
          Edit
        </Link>
      </div>
      <DocumentationArticleView article={article} related={related} />
    </div>
  );
}
