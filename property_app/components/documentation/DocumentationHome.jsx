import Link from "next/link";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";

function Card({ article }) {
  return (
    <Link href={`/documentation/${article.slug}`} className="docs-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="docs-card__cat">{article.category}</span>
        <span className={`docs-badge docs-badge--${article.featureStatus || "active"}`}>
          {article.featureStatus || "active"}
        </span>
      </div>
      <h3 className="docs-card__title">{article.title}</h3>
      <p className="docs-card__summary">{article.summary}</p>
    </Link>
  );
}

export default function DocumentationHome({ home }) {
  return (
    <div className="space-y-8">
      <DocumentationSearch large />

      <section>
        <h2 className="docs-section-title">Categories</h2>
        <div className="docs-card-grid">
          {(home.categories || []).map((c) => (
            <Link
              key={c.category}
              href={`/documentation?category=${encodeURIComponent(c.category)}`}
              className="docs-card"
            >
              <h3 className="docs-card__title">{c.category}</h3>
              <p className="docs-card__summary">
                {c.count} article{c.count === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Important guides</h2>
        <div className="docs-card-grid">
          {(home.important || []).map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Platform overview</h2>
        <div className="docs-card-grid">
          {(home.overview || []).map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Troubleshooting</h2>
        <div className="docs-card-grid">
          {(home.troubleshooting || []).map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Recently updated</h2>
        <div className="docs-card-grid">
          {(home.recentlyUpdated || []).map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Recently added</h2>
        <div className="docs-card-grid">
          {(home.recentlyAdded || []).map((a) => (
            <Card key={a.slug} article={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="docs-section-title">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["/ops", "Ops home"],
            ["/ops/users", "Users"],
            ["/ops/reservations", "Reservations"],
            ["/ops/listings", "Listings"],
            ["/documentation/manage", "Manage docs"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="docs-btn">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
