import Link from "next/link";
import {
  extractMarkdownOutline,
  renderDocumentationMarkdown,
} from "@/utils/documentation/markdown";

function RefList({ title, items, asCode }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            {asCode ? <code>{item}</code> : item}
            {String(item).startsWith("/") && !String(item).startsWith("//") ? (
              <>
                {" "}
                <Link href={item} className="docs-link">
                  Open
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DocumentationArticleView({ article, related = [] }) {
  const html = renderDocumentationMarkdown(article.content || "");
  const outline = extractMarkdownOutline(article.content || "");

  return (
    <div className="docs-layout docs-layout--article">
      <div className="min-w-0">
        <header className="docs-article-header">
          <p className="docs-card__cat">
            {article.category}
            {article.subcategory ? ` · ${article.subcategory}` : ""}
          </p>
          <h1>{article.title}</h1>
          <p className="text-sm leading-relaxed text-[var(--kama-ink-muted)]">
            {article.summary}
          </p>
          <div className="docs-meta">
            <span className={`docs-badge docs-badge--${article.status}`}>
              {article.status}
            </span>
            <span className={`docs-badge docs-badge--${article.featureStatus}`}>
              feature: {article.featureStatus}
            </span>
            {article.updatedAt ? (
              <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
            ) : null}
            {article.lastReviewedAt ? (
              <span>
                Reviewed {new Date(article.lastReviewedAt).toLocaleDateString()}
              </span>
            ) : null}
            {article.version ? <span>v{article.version}</span> : null}
          </div>
          {article.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="docs-badge">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <article
          className="docs-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <section className="docs-refs" aria-label="Technical references">
          <h2>Technical references</h2>
          <RefList title="Related routes" items={article.relatedRoutes} />
          <RefList title="Related files" items={article.relatedFiles} asCode />
          <RefList title="Related models" items={article.relatedModels} asCode />
          <RefList
            title="Related API endpoints"
            items={article.relatedApiEndpoints}
            asCode
          />
          <RefList title="Related features" items={article.relatedFeatures} />
          {related.length ? (
            <div>
              <h3>Related documentation</h3>
              <ul>
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/documentation/${r.slug}`} className="docs-link">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="docs-aside hidden lg:block" aria-label="On this page">
        <h2>On this page</h2>
        {outline.length ? (
          <nav>
            {outline.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{ paddingLeft: `${(item.level - 2) * 0.65}rem` }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        ) : (
          <p className="text-xs text-[var(--kama-ink-muted)]">No headings</p>
        )}
      </aside>
    </div>
  );
}
