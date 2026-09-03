import Image from "next/image";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
import "@/components/creators/creator.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-kama-display",
  display: "swap",
  style: ["normal", "italic"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-kama-sans",
  display: "swap",
});

export default function AboutLanding({ seo, page }) {
  return (
    <div className={`creator ${fraunces.variable} ${outfit.variable}`}>
      <AudienceJsonLd
        path={seo.canonical}
        title={seo.title}
        description={seo.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: seo.canonical },
        ]}
        faq={page.faq.items}
      />

      <header className="creator-hero" id="about-hero">
        <div className="creator-hero__media">
          <Image
            src={page.heroImage.src}
            alt={page.heroImage.alt}
            fill
            priority
            sizes="100vw"
            quality={75}
          />
        </div>
        <div className="creator-hero__scrim" />
        <div className="creator-hero__grain" aria-hidden="true" />
        <div className="creator-wrap" style={{ position: "relative", zIndex: 1 }}>
          <p className="creator-kicker">{page.kicker}</p>
          <div className="creator-eq" aria-hidden="true">
            <span>{page.formula[0]}</span>
            <i>+</i>
            <span>{page.formula[1]}</span>
            <i>+</i>
            <span>{page.formula[2]}</span>
            <i>=</i>
            <span className="is-result">{page.formula[3]}</span>
          </div>
          <h1>{page.h1}</h1>
          <p className="creator-hero__lede">{page.lede}</p>
          <div className="creator-hero__actions">
            <Link className="creator-btn creator-btn--light" href={page.primaryHref}>
              {page.primaryCta}
            </Link>
            <Link className="creator-btn creator-btn--ghost" href={page.secondaryHref}>
              {page.secondaryCta}
            </Link>
          </div>
          <p className="creator-story">
            {page.heroStory.map((item, i) => (
              <span key={item}>
                {i > 0 ? <i> → </i> : null}
                <b>{item}</b>
              </span>
            ))}
          </p>
        </div>
      </header>

      <section className="creator-quote" id={page.story.id}>
        <div className="creator-wrap">
          <h2>{page.story.h2}</h2>
          <p>{page.story.body}</p>
        </div>
      </section>

      <section className="creator-section" id={page.work.id}>
        <div className="creator-wrap">
          <h2>{page.work.h2}</h2>
          <p className="creator-lead">{page.work.intro}</p>
          <div className="creator-grid creator-grid--3">
            {page.work.points.map((item) => (
              <article className="creator-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="creator-section" id={page.people.id}>
        <div className="creator-wrap">
          <h2>{page.people.h2}</h2>
          <div className="creator-grid creator-grid--2">
            {page.people.items.map((item) => (
              <article className="creator-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <p style={{ marginTop: "0.85rem", marginBottom: 0 }}>
                  <Link href={item.href}>{item.label} →</Link>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="creator-section" id={page.contact.id}>
        <div className="creator-wrap">
          <h2>{page.contact.h2}</h2>
          <p className="creator-lead">{page.contact.body}</p>
          <Link className="creator-btn creator-btn--light" href={page.contact.emailHref}>
            {page.contact.email}
          </Link>
        </div>
      </section>

      <section className="creator-section creator-faq" id={page.faq.id}>
        <div className="creator-wrap">
          <h2>{page.faq.h2}</h2>
          {page.faq.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="creator-final">
        <div className="creator-wrap">
          <h2>{page.final.h2}</h2>
          <p className="creator-lead">{page.final.body}</p>
          <div className="creator-hero__actions">
            <Link
              className="creator-btn creator-btn--light"
              href={page.final.primary.href}
            >
              {page.final.primary.label}
            </Link>
            <Link
              className="creator-btn creator-btn--ghost"
              href={page.final.secondary.href}
            >
              {page.final.secondary.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
