import Image from "next/image";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
import {
  CreatorDiscussProvider,
  DiscussButton,
} from "./CreatorDiscuss";
import "./creator.css";

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

function ExternalOrLink({ href, children, className }) {
  const external = href.startsWith("mailto:") || href.startsWith("http");
  if (external) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function CreatorHero({ page }) {
  return (
    <header className="creator-hero" id="creator-hero">
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
          <DiscussButton source="hero">{page.primaryCta}</DiscussButton>
          <a className="creator-btn creator-btn--ghost" href="#work-together">
            {page.secondaryCta}
          </a>
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
  );
}

export function CreatorOpportunity({ page }) {
  const s = page.opportunity;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.intro}</p>
        <div className="creator-grid creator-grid--2">
          {s.points.map((item) => (
            <article className="creator-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <p className="creator-lead" style={{ marginTop: "1.75rem", marginBottom: 0 }}>
          {s.close}
        </p>
      </div>
    </section>
  );
}

export function CreatorBenefits({ page }) {
  const s = page.benefits;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.note}</p>
        <div className="creator-grid creator-grid--3">
          {s.items.map((item) => (
            <article className="creator-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CreatorTypes({ page }) {
  const s = page.types;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.note}</p>
        <div className="creator-types">
          {s.items.map((item) => (
            <article className="creator-type" key={item.slug} data-creator-type={item.slug}>
              <h3>{item.label}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CreatorPartnerships({ page }) {
  const s = page.models;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.intro}</p>
        <div className="creator-grid creator-grid--2">
          {s.items.map((item) => (
            <article className="creator-card creator-card--tilt" key={item.title}>
              {item.badge ? <span className="creator-badge">{item.badge}</span> : null}
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CreatorBigIdea({ page }) {
  const s = page.bigIdea;
  return (
    <section className="creator-quote" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p>{s.body}</p>
      </div>
    </section>
  );
}

export function CreatorWhy({ page }) {
  const s = page.why;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.intro}</p>
        <div className="creator-chain">
          {s.chain.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
              <span className="creator-chain__arrow">↓</span>
            </Link>
          ))}
          <div className="creator-chain__creators">
            <strong>{s.creatorsLabel} ↑</strong>
            <p>{s.creatorsNote}</p>
          </div>
        </div>
        <nav className="creator-links" aria-label="Isisel">
          {s.more.map((item) => (
            <ExternalOrLink key={item.href} href={item.href}>
              {item.label}
            </ExternalOrLink>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function CreatorJourney({ page }) {
  const s = page.journey;
  return (
    <section className="creator-section" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.note}</p>
        <ol className="creator-steps">
          {s.steps.map((step) => (
            <li className="creator-step" key={step.n}>
              <span className="creator-step__n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CreatorProof({ page }) {
  const s = page.proof;
  return (
    <section className="creator-section creator-section--tight creator-proof" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead" style={{ marginBottom: 0 }}>
          {s.body}
        </p>
      </div>
    </section>
  );
}

export function CreatorFaq({ page }) {
  const s = page.faq;
  return (
    <section className="creator-section creator-faq" id={s.id}>
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        {s.items.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CreatorFinal({ page }) {
  const s = page.final;
  return (
    <section className="creator-final" id="discuss-end">
      <div className="creator-wrap">
        <h2>{s.h2}</h2>
        <p className="creator-lead">{s.body}</p>
        <DiscussButton source="final">{s.cta}</DiscussButton>
      </div>
    </section>
  );
}

export default function CreatorLanding({ seo, page }) {
  return (
    <div className={`creator ${fraunces.variable} ${outfit.variable}`}>
      <AudienceJsonLd
        path={seo.canonical}
        title={seo.title}
        description={seo.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Creator partnerships", href: seo.canonical },
        ]}
        faq={page.faq.items}
      />
      <CreatorDiscussProvider>
        <CreatorHero page={page} />
        <CreatorOpportunity page={page} />
        <CreatorBenefits page={page} />
        <CreatorTypes page={page} />
        <CreatorPartnerships page={page} />
        <CreatorBigIdea page={page} />
        <CreatorWhy page={page} />
        <CreatorJourney page={page} />
        <CreatorProof page={page} />
        <CreatorFaq page={page} />
        <CreatorFinal page={page} />
      </CreatorDiscussProvider>
    </div>
  );
}
