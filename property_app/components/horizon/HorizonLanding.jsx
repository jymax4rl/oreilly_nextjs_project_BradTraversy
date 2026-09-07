import Image from "next/image";
import { Bodoni_Moda, Great_Vibes, Montserrat } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
import { horizonListingJsonLd } from "@/app/horizon/content";
import {
  HorizonLeadProvider,
  HorizonLeadButton,
} from "./HorizonLead";
import HorizonExperience from "./HorizonExperience";
import HorizonReel from "./HorizonReel";
import "./horizon.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-hz-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const script = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-hz-script",
  display: "swap",
  weight: "400",
});

const sans = Montserrat({
  subsets: ["latin"],
  variable: "--font-hz-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

function countAttrs(stat) {
  if (stat.value.startsWith("$")) {
    return {
      "data-count": stat.value.replace(/[^0-9]/g, ""),
      "data-prefix": "$",
      "data-format": "usd",
    };
  }
  return { "data-count": stat.value.replace(/[^0-9]/g, "") };
}

export default function HorizonLanding({ seo, page }) {
  const listingLd = horizonListingJsonLd();
  const ed = page.editorial;

  return (
    <div
      className={`horizon ${display.variable} ${script.variable} ${sans.variable}`}
    >
      <AudienceJsonLd
        path={seo.canonical}
        title={seo.title}
        description={seo.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Horizon Bijilo", href: seo.canonical },
        ]}
        faq={page.faq.items}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingLd) }}
      />

      <HorizonLeadProvider>
        <HorizonExperience>
          <header
            className="horizon-hero"
            id="horizon-hero"
            data-hz-section
          >
            <div className="horizon-hero__media">
              <div className="horizon-hero__parallax" data-hz-parallax>
                <Image
                  src={page.hero.image.src}
                  alt={page.hero.image.alt}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1027px) 100vw, 1027px"
                />
              </div>
            </div>
            <div className="horizon-hero__scrim" aria-hidden="true" />
            <div className="horizon-hero__inner">
              <p className="horizon-brand">
                <span>{page.hero.kicker}</span>
                {page.brand}
              </p>
              <h1>{page.hero.h1}</h1>
              <p className="horizon-hero__lede">{page.hero.lede}</p>
              <div className="horizon-actions">
                <HorizonLeadButton
                  mode="call"
                  className="horizon-btn horizon-btn--solid"
                >
                  {page.hero.primaryCta}
                </HorizonLeadButton>
                <HorizonLeadButton
                  mode="contact"
                  className="horizon-btn horizon-btn--ghost"
                >
                  {page.hero.secondaryCta}
                </HorizonLeadButton>
              </div>
            </div>
            <HorizonLeadButton
              mode="call"
              className="hz-magnet"
              data-hz-magnet=""
            >
              {ed.magnetic}
            </HorizonLeadButton>
          </header>

          <section className="hz-editorial" data-hz-section aria-label="Editorial">
            <div className="horizon-wrap hz-editorial__inner" data-hz-reveal>
              <p className="hz-kicker">{ed.reasons}</p>
              <p className="hz-display">
                {ed.line1}
                <em>{ed.script}</em>
                {ed.line2}
              </p>
              <p className="hz-place">{ed.placeLine}</p>
            </div>
          </section>

          <main>
            <section
              className="horizon-section horizon-section--foam"
              id={page.offer.id}
              data-hz-section
              aria-labelledby="horizon-offer-heading"
            >
              <div className="horizon-wrap hz-offer" data-hz-reveal>
                <div>
                  <h2 id="horizon-offer-heading">{page.offer.h2}</h2>
                  <p className="horizon-lead">{page.offer.intro}</p>
                  <p className="horizon-note">{page.offer.note}</p>
                </div>
                <div className="horizon-stats" role="list">
                  {page.offer.stats.map((stat) => (
                    <div className="horizon-stat" role="listitem" key={stat.label}>
                      <strong {...countAttrs(stat)}>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="horizon-section horizon-section--ink"
              id={page.revolution.id}
              data-hz-section
              aria-labelledby="horizon-phone-heading"
            >
              <div className="horizon-wrap" data-hz-reveal>
                <h2 id="horizon-phone-heading">{page.revolution.h2}</h2>
                <p className="horizon-lead">{page.revolution.lede}</p>
                <div className="horizon-points">
                  {page.revolution.points.map((point) => (
                    <article className="horizon-point" key={point.title}>
                      <h3>{point.title}</h3>
                      <p>{point.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="hz-hscroll"
              id={page.story.id}
              data-hz-section
              data-hz-hscroll
              aria-labelledby="horizon-story-heading"
            >
              <div className="hz-hscroll__intro horizon-wrap" data-hz-reveal>
                <p className="hz-kicker">{page.story.kicker}</p>
                <h2 id="horizon-story-heading">{page.story.h2}</h2>
                <p className="horizon-lead">{page.story.lede}</p>
              </div>
              <div className="hz-hscroll__mobile">
                <HorizonReel
                  images={page.gallery.images}
                  hint={page.story.reelHint}
                />
              </div>
              <div className="hz-hscroll__pin">
                <div className="hz-hscroll__track" data-hz-htrack>
                  {page.story.chapters.map((chapter) => (
                    <article className="hz-hscroll__panel" key={chapter.index}>
                      <div className="hz-hscroll__media">
                        <Image
                          src={chapter.image.src}
                          alt={chapter.image.alt}
                          fill
                          sizes="70vw"
                          quality={90}
                          unoptimized={chapter.image.width < 1100}
                        />
                      </div>
                      <div className="hz-hscroll__copy">
                        <p className="hz-kicker">{chapter.index}</p>
                        <h2>{chapter.title}</h2>
                        <p>{chapter.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="horizon-section horizon-section--foam"
              id={page.location.id}
              data-hz-section
              aria-labelledby="horizon-location-heading"
            >
              <div className="horizon-wrap horizon-split" data-hz-reveal>
                <div>
                  <h2 id="horizon-location-heading">{page.location.h2}</h2>
                  <p className="horizon-lead">{page.location.body}</p>
                  <ol className="hz-coast">
                    {ed.coast.map((stop) => (
                      <li key={stop.label}>
                        <span>{stop.label}</span>
                        <strong>{stop.time}</strong>
                      </li>
                    ))}
                  </ol>
                </div>
                <figure className="horizon-map">
                  <div className="horizon-map__frame">
                    <Image
                      src={page.location.image.src}
                      alt={page.location.image.alt}
                      width={page.location.image.width}
                      height={page.location.image.height}
                      sizes="(max-width: 900px) 100vw, 50vw"
                      quality={90}
                      className="horizon-map__img"
                    />
                  </div>
                  <figcaption className="horizon-map__cap">
                    {page.location.caption}
                  </figcaption>
                </figure>
              </div>
            </section>

            <section
              className="horizon-section horizon-section--faq"
              id={page.faq.id}
              data-hz-section
              aria-labelledby="horizon-faq-heading"
            >
              <div className="horizon-wrap" data-hz-reveal>
                <h2 id="horizon-faq-heading">{page.faq.h2}</h2>
                <div className="horizon-faq">
                  {page.faq.items.map((item) => (
                    <details className="horizon-faq__item" key={item.q}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="horizon-section horizon-section--close"
              id="horizon-close"
              data-hz-section
              aria-labelledby="horizon-close-heading"
            >
              <div className="horizon-wrap horizon-close" data-hz-reveal>
                <h2 id="horizon-close-heading">{page.close.h2}</h2>
                <p className="horizon-lead">{page.close.lede}</p>
                <div className="horizon-actions">
                  <HorizonLeadButton
                    mode="call"
                    className="horizon-btn horizon-btn--sea"
                  >
                    {page.close.primaryCta}
                  </HorizonLeadButton>
                  <HorizonLeadButton
                    mode="contact"
                    className="horizon-btn horizon-btn--ghost horizon-btn--ghost-ink"
                  >
                    {page.close.secondaryCta}
                  </HorizonLeadButton>
                </div>
              </div>
            </section>
          </main>
        </HorizonExperience>
      </HorizonLeadProvider>
    </div>
  );
}
