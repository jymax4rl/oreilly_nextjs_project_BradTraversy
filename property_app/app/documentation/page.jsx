import DocumentationHome from "@/components/documentation/DocumentationHome";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";
import Link from "next/link";
import connectToDatabase from "@/config/database";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";
import {
  getDocumentationHome,
  listDocumentation,
} from "@/utils/documentation/service";

export const metadata = {
  title: "Documentation",
  robots: { index: false, follow: false },
};

export default async function DocumentationIndexPage({ searchParams }) {
  const params = await searchParams;
  const category = String(params?.category || "").trim();
  await connectToDatabase();
  await ensureDocumentationSeeded();

  if (category) {
    const articles = await listDocumentation({
      category,
      status: "active",
      limit: 100,
    });
    return (
      <div className="space-y-6">
        <DocumentationSearch />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="docs-section-title mt-0">{category}</h2>
          <Link href="/documentation" className="docs-btn">
            All documentation
          </Link>
        </div>
        <div className="docs-card-grid">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/documentation/${article.slug}`}
              className="docs-card"
            >
              <span className="docs-card__cat">{article.category}</span>
              <h3 className="docs-card__title">{article.title}</h3>
              <p className="docs-card__summary">{article.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const home = await getDocumentationHome();
  return <DocumentationHome home={home} />;
}
