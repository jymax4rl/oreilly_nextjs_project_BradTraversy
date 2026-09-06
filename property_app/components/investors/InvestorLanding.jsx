import Image from "next/image";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
import HospitalitySystemsStrip from "@/components/audience/HospitalitySystemsStrip";
import {
  InvestorDiscussProvider,
  InvestorDiscussButton,
} from "./InvestorDiscuss";
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

export default function InvestorLanding({ seo, page }) {
  return (
    <div className={`creator ${fraunces.variable} ${outfit.variable}`}>
      <AudienceJsonLd
        path={seo.canonical}
        title={seo.title}
        description={seo.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Investors", href: seo.canonical },
        ]}
        faq={page.faq.items}
      />
      <InvestorDiscussProvider>
        <header className="creator-hero" id="investor-hero">
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
              <InvestorDiscussButton>{page.primaryCta}</InvestorDiscussButton>
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

        <HospitalitySystemsStrip />

        <section className="creator-section" id={page.opportunity.id}>
          <div className="creator-wrap">
            <h2>{page.opportunity.h2}</h2>
            <p className="creator-lead">{page.opportunity.intro}</p>
            <div className="creator-grid creator-grid--2">
              {page.opportunity.points.map((item) => (
                <article className="creator-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <p className="creator-lead" style={{ marginTop: "1.75rem", marginBottom: 0 }}>
              {page.opportunity.close}
            </p>
          </div>
        </section>

        <section className="creator-section" id={page.benefits.id}>
          <div className="creator-wrap">
            <h2>{page.benefits.h2}</h2>
            <p className="creator-lead">{page.benefits.note}</p>
            <div className="creator-grid creator-grid--3">
              {page.benefits.items.map((item) => (
                <article className="creator-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="creator-section" id={page.types.id}>
          <div className="creator-wrap">
            <h2>{page.types.h2}</h2>
            <p className="creator-lead">{page.types.note}</p>
            <div className="creator-types">
              {page.types.items.map((item) => (
                <article className="creator-type" key={item.slug}>
                  <h3>{item.label}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="creator-section" id={page.models.id}>
          <div className="creator-wrap">
            <h2>{page.models.h2}</h2>
            <p className="creator-lead">{page.models.intro}</p>
            <div className="creator-grid creator-grid--2">
              {page.models.items.map((item) => (
                <article className="creator-card creator-card--tilt" key={item.title}>
                  {item.badge ? (
                    <span className="creator-badge">{item.badge}</span>
                  ) : null}
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="creator-quote" id={page.bigIdea.id}>
          <div className="creator-wrap">
            <h2>{page.bigIdea.h2}</h2>
            <p>{page.bigIdea.body}</p>
          </div>
        </section>

        <section className="creator-section" id={page.why.id}>
          <div className="creator-wrap">
            <h2>{page.why.h2}</h2>
            <p className="creator-lead">{page.why.intro}</p>
            <div className="creator-chain">
              {page.why.chain.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                  <span className="creator-chain__arrow">↓</span>
                </Link>
              ))}
              <div className="creator-chain__creators">
                <strong>{page.why.creatorsLabel} ↑</strong>
                <p>{page.why.creatorsNote}</p>
              </div>
            </div>
            <nav className="creator-links" aria-label="Isisel">
              {page.why.more.map((item) => (
                <ExternalOrLink key={item.href} href={item.href}>
                  {item.label}
                </ExternalOrLink>
              ))}
            </nav>
          </div>
        </section>

        <section className="creator-section" id={page.journey.id}>
          <div className="creator-wrap">
            <h2>{page.journey.h2}</h2>
            <p className="creator-lead">{page.journey.note}</p>
            <ol className="creator-steps">
              {page.journey.steps.map((step) => (
                <li className="creator-step" key={step.n}>
                  <span className="creator-step__n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="creator-section creator-section--tight creator-proof"
          id={page.proof.id}
        >
          <div className="creator-wrap">
            <h2>{page.proof.h2}</h2>
            <p className="creator-lead" style={{ marginBottom: 0 }}>
              {page.proof.body}
            </p>
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

        <section className="creator-final" id="discuss-end">
          <div className="creator-wrap">
            <h2>{page.final.h2}</h2>
            <p className="creator-lead">{page.final.body}</p>
            <InvestorDiscussButton>{page.final.cta}</InvestorDiscussButton>
          </div>
        </section>
      </InvestorDiscussProvider>
    </div>
  );
}
