import Image from "next/image";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import AudienceJsonLd from "./AudienceJsonLd";
import AudienceStickyCta from "./AudienceStickyCta";
import "./audience.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-kama-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-kama-sans",
  display: "swap",
});

function Btn({ href, label, variant = "accent", ...rest }) {
  const cls = `audience-btn audience-btn--${variant}`;
  const external = href.startsWith("mailto:") || href.startsWith("http");
  if (external) {
    return (
      <a className={cls} href={href} {...rest}>
        {label}
      </a>
    );
  }
  return (
    <Link className={cls} href={href} {...rest}>
      {label}
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="audience-dash" aria-hidden="true">
      <div className="audience-dash__bar">
        <span className="is-on">Home</span>
        <span>Reservations</span>
        <span>Calendar</span>
        <span>Listings</span>
        <span>Messages</span>
      </div>
      <div className="audience-dash__body">
        <p className="mb-3 text-sm font-medium tracking-tight">Host console</p>
        <div className="audience-dash__kpis">
          <p>
            <b>Listings</b>
            <strong>—</strong>
          </p>
          <p>
            <b>Awaiting review</b>
            <strong>—</strong>
          </p>
          <p>
            <b>Reservation requests</b>
            <strong>—</strong>
          </p>
          <p>
            <b>Unread messages</b>
            <strong>—</strong>
          </p>
        </div>
        <p className="audience-dash__hint">
          Layout matches the live Isisel host console: listings, reservation
          requests, calendar, and guest messages. Counts appear after you have
          properties on the account.
        </p>
      </div>
    </div>
  );
}

export default function AudienceLanding({ seo, page }) {
  const p = page;
  return (
    <div className={`audience ${fraunces.variable} ${outfit.variable}`}>
      <AudienceJsonLd
        path={p.breadcrumb[p.breadcrumb.length - 1]?.href || "/"}
        title={seo.title}
        description={seo.description}
        breadcrumb={p.breadcrumb}
        faq={p.faq?.items || []}
      />

      <header className="audience-hero">
        <div className="audience-hero__media">
          <Image
            src={p.hero.image.src}
            alt={p.hero.image.alt}
            fill
            priority
            sizes="100vw"
            quality={80}
            className="audience-hero__img"
          />
          <div className="audience-hero__scrim" />
        </div>
        <div className="audience-wrap audience-hero__inner">
          <nav className="audience-crumb" aria-label="Breadcrumb">
            {p.breadcrumb.map((item, i) => (
              <span key={item.href}>
                {i > 0 ? <span aria-hidden="true"> → </span> : null}
                {i === p.breadcrumb.length - 1 ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <p className="audience-eyebrow">{p.hero.eyebrow}</p>
          <h1>{p.hero.h1}</h1>
          <p className="audience-hero__lede">{p.hero.lede}</p>
          <div className="audience-actions">
            <Btn href={p.hero.primary.href} label={p.hero.primary.label} variant="solid" />
            <Btn
              href={p.hero.secondary.href}
              label={p.hero.secondary.label}
              variant="ghost"
            />
          </div>
          <p className="audience-chain" aria-label="From property to revenue">
            {p.hero.flow.map((step, i) => (
              <span key={step}>
                {step}
                {i < p.hero.flow.length - 1 ? <i> → </i> : null}
              </span>
            ))}
          </p>
        </div>
      </header>

      <div>
        <section className="audience-section" aria-labelledby="problem-heading">
          <div className="audience-wrap">
            <h2 id="problem-heading">{p.problem.h2}</h2>
            <p className="audience-lede">{p.problem.lede}</p>
            <div className="audience-grid audience-grid--2">
              {p.problem.points.map((item) => (
                <article className="audience-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section audience-section--ink"
          id={p.opportunity.id}
          aria-labelledby="channel-heading"
        >
          <div className="audience-wrap">
            <h2 id="channel-heading">{p.opportunity.h2}</h2>
            <p className="audience-lede">{p.opportunity.lede}</p>
            <ol className="audience-flow">
              {p.opportunity.steps.map((step, i) => (
                <li key={step}>
                  <b>0{i + 1}</b>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="audience-note">{p.opportunity.note}</p>
            <div className="audience-actions">
              <Btn href={p.midCta.href} label={p.midCta.label} variant="solid" />
            </div>
          </div>
        </section>

        <section
          className="audience-section"
          id={p.commission.id}
          aria-labelledby="commission-heading"
        >
          <div className="audience-wrap">
            <h2 id="commission-heading">{p.commission.h2}</h2>
            <p className="audience-lede">{p.commission.lede}</p>
            <p className="audience-note">{p.commission.caveat}</p>
            <p className="audience-kicker mt-6">{p.commission.exampleLabel}</p>
            <div className="audience-compare">
              <article>
                <h3>{p.commission.traditional.title}</h3>
                <p className="amt">{p.commission.amount}</p>
                <ol>
                  {p.commission.traditional.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </article>
              <article className="is-on">
                <h3>{p.commission.isisel.title}</h3>
                <p className="amt">{p.commission.amount}</p>
                <ol>
                  {p.commission.isisel.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </article>
            </div>
          </div>
        </section>

        <section
          className="audience-section audience-section--soft"
          id={p.dashboard.id}
          aria-labelledby="dash-heading"
        >
          <div className="audience-wrap">
            <h2 id="dash-heading">{p.dashboard.h2}</h2>
            <p className="audience-lede">{p.dashboard.lede}</p>
            <DashboardPreview />
            <div className="audience-grid audience-grid--2">
              {p.dashboard.items.map((item) => (
                <article className="audience-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="audience-actions">
              <Btn
                href={p.dashboard.cta.href}
                label={p.dashboard.cta.label}
                variant="accent"
              />
            </div>
          </div>
        </section>

        <section
          className="audience-section"
          id={p.mobile.id}
          aria-labelledby="mobile-heading"
        >
          <div className="audience-wrap">
            <h2 id="mobile-heading">{p.mobile.h2}</h2>
            <p className="audience-lede">{p.mobile.lede}</p>
            <ul className="audience-scenes">
              {p.mobile.scenes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="audience-section audience-section--soft"
          id={p.scale.id}
          aria-labelledby="scale-heading"
        >
          <div className="audience-wrap">
            <h2 id="scale-heading">{p.scale.h2}</h2>
            <p className="audience-lede">{p.scale.lede}</p>
            <div className="audience-grid audience-grid--4">
              {p.scale.bands.map((b) => (
                <article className="audience-card audience-band" key={b.n}>
                  <b>{b.n}</b>
                  <p>{b.label}</p>
                </article>
              ))}
            </div>
            <p className="audience-note">{p.scale.note}</p>
          </div>
        </section>

        <section
          className="audience-section"
          id={p.audiences.id}
          aria-labelledby="who-heading"
        >
          <div className="audience-wrap">
            <h2 id="who-heading">{p.audiences.h2}</h2>
            <p className="audience-lede">{p.audiences.lede}</p>
            <div className="audience-grid audience-grid--2">
              {p.audiences.cards.map((card) => (
                <article className="audience-card" key={card.id} id={card.id}>
                  <h3>{card.h3}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section audience-section--ink"
          id={p.pillars.id}
          aria-labelledby="pillars-heading"
        >
          <div className="audience-wrap">
            <h2 id="pillars-heading">{p.pillars.h2}</h2>
            <div className="audience-pillars">
              {p.pillars.items.map((item) => (
                <article key={item.h3}>
                  <em>{item.n}</em>
                  <h3>{item.h3}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section"
          id={p.steps.id}
          aria-labelledby="steps-heading"
        >
          <div className="audience-wrap">
            <h2 id="steps-heading">{p.steps.h2}</h2>
            <p className="audience-lede">{p.steps.lede}</p>
            <div className="audience-steps">
              {p.steps.items.map((item) => (
                <article className="audience-card" key={item.n}>
                  <p className="n">{item.n}</p>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section audience-section--soft"
          id={p.trust.id}
          aria-labelledby="trust-heading"
        >
          <div className="audience-wrap">
            <h2 id="trust-heading">{p.trust.h2}</h2>
            <ul className="audience-prose-list">
              {p.trust.points.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="audience-lede">{p.trust.join}</p>
            <div className="audience-links">
              {p.trust.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section"
          id={p.faq.id}
          aria-labelledby="faq-heading"
        >
          <div className="audience-wrap">
            <h2 id="faq-heading">{p.faq.h2}</h2>
            <div className="audience-faq">
              {p.faq.items.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="audience-section audience-section--ink audience-final"
          aria-labelledby="final-heading"
        >
          <div className="audience-wrap">
            <h2 id="final-heading">{p.finalCta.h2}</h2>
            <p className="audience-lede">{p.finalCta.lede}</p>
            <div className="audience-actions">
              <Btn
                href={p.finalCta.primary.href}
                label={p.finalCta.primary.label}
                variant="solid"
              />
              <Btn
                href={p.finalCta.secondary.href}
                label={p.finalCta.secondary.label}
                variant="ghost"
              />
            </div>
          </div>
        </section>
      </div>

      {p.sticky ? (
        <AudienceStickyCta href={p.sticky.href} label={p.sticky.label} />
      ) : null}
    </div>
  );
}
