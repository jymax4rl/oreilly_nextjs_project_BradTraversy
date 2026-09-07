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

function cropClass(crop) {
  if (crop === "top") return " hz-media--top";
  if (crop === "bottom") return " hz-media--bottom";
  return "";
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
          <header className="hz-hero" id="horizon-hero" data-hz-section>
            <div className="hz-hero__media">
              <Image
                src={page.hero.image.src}
                alt={page.hero.image.alt}
                fill
                priority
                unoptimized
                sizes="(max-width: 1027px) 100vw, 1027px"
              />
            </div>
            <div className="hz-hero__veil" aria-hidden="true" />
            <div className="hz-hero__copy">
              <p className="hz-kicker hz-kicker--light">{page.hero.kicker}</p>
              <h1>{page.hero.h1}</h1>
              <p className="hz-hero__lede">{page.hero.lede}</p>
              <HorizonLeadButton
                mode="call"
                className="hz-disc"
                data-hz-magnet=""
              >
                {ed.magnetic}
              </HorizonLeadButton>
            </div>
          </header>

          <section className="hz-sheet" id={page.offer.id} data-hz-section>
            <div className="hz-wrap" data-hz-reveal>
              <p className="hz-kicker">{ed.reasons}</p>
              <p className="hz-display">
                {ed.line1}
                <em>{ed.script}</em>
                {ed.line2}
              </p>
              <p className="hz-lede">{page.offer.intro}</p>
              <p className="hz-fine">{ed.placeLine}</p>
              <div className="hz-figures" role="list">
                {page.offer.stats.map((stat) => (
                  <div className="hz-figure" role="listitem" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong {...countAttrs(stat)}>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className="hz-walk"
            id={page.story.id}
            data-hz-section
            aria-labelledby="hz-walk-h"
          >
            <div className="hz-wrap hz-walk__head" data-hz-reveal>
              <p className="hz-kicker">{page.story.kicker}</p>
              <h2 id="hz-walk-h">{page.story.h2}</h2>
            </div>
            <div className="hz-walk__mobile">
              <HorizonReel
                images={page.gallery.images}
                hint={page.story.reelHint}
              />
            </div>
            <div className="hz-walk__pin">
              <div className="hz-walk__track" data-hz-htrack>
                {page.story.chapters.map((chapter) => (
                  <article className="hz-walk__panel" key={chapter.index}>
                    <div
                      className={`hz-walk__media${cropClass(chapter.crop)}`}
                    >
                      <Image
                        src={chapter.image.src}
                        alt={chapter.image.alt}
                        fill
                        sizes="70vw"
                        quality={90}
                        unoptimized={chapter.image.width < 1100}
                      />
                    </div>
                    <div className="hz-walk__copy">
                      <p className="hz-kicker">{chapter.index}</p>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            className="hz-night"
            id={page.revolution.id}
            data-hz-section
            aria-labelledby="hz-night-h"
          >
            <div className="hz-wrap" data-hz-reveal>
              <p className="hz-kicker hz-kicker--light">
                {page.revolution.kicker}
              </p>
              <h2 id="hz-night-h">{page.revolution.h2}</h2>
              <p className="hz-lede hz-lede--light">{page.revolution.lede}</p>
              <div className="hz-reasons">
                {page.revolution.points.map((point, i) => (
                  <article key={point.title}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <h3>{point.title}</h3>
                    <p>{point.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            className="hz-sheet"
            id={page.location.id}
            data-hz-section
            aria-labelledby="hz-place-h"
          >
            <div className="hz-wrap hz-place" data-hz-reveal>
              <div>
                <p className="hz-kicker">{page.location.kicker}</p>
                <h2 id="hz-place-h">{page.location.h2}</h2>
                <p className="hz-lede">{page.location.body}</p>
                <ol className="hz-coast">
                  {ed.coast.map((stop) => (
                    <li key={stop.label}>
                      <span>{stop.label}</span>
                      <strong>{stop.time}</strong>
                    </li>
                  ))}
                </ol>
              </div>
              <figure className="hz-map">
                <Image
                  src={page.location.image.src}
                  alt={page.location.image.alt}
                  width={page.location.image.width}
                  height={page.location.image.height}
                  sizes="(max-width: 900px) 100vw, 48vw"
                  quality={90}
                />
                <figcaption>{page.location.caption}</figcaption>
              </figure>
            </div>
          </section>

          <section
            className="hz-sheet hz-sheet--tight"
            id={page.faq.id}
            data-hz-section
            aria-labelledby="hz-faq-h"
          >
            <div className="hz-wrap" data-hz-reveal>
              <p className="hz-kicker">{page.faq.kicker}</p>
              <h2 id="hz-faq-h">{page.faq.h2}</h2>
              <div className="hz-faq">
                {page.faq.items.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section
            className="hz-end"
            id="horizon-close"
            data-hz-section
            aria-labelledby="hz-end-h"
          >
            <div className="hz-wrap" data-hz-reveal>
              <h2 id="hz-end-h">{page.close.h2}</h2>
              <p className="hz-lede hz-lede--light">{page.close.lede}</p>
              <div className="hz-end__actions">
                <HorizonLeadButton mode="call" className="hz-textcta">
                  {page.close.primaryCta}
                </HorizonLeadButton>
                <HorizonLeadButton mode="contact" className="hz-textcta">
                  {page.close.secondaryCta}
                </HorizonLeadButton>
              </div>
            </div>
          </section>
        </HorizonExperience>
      </HorizonLeadProvider>
    </div>
  );
}
