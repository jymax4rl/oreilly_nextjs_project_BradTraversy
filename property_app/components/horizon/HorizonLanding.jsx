import Image from "next/image";
import { Syne, Figtree } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
import { horizonListingJsonLd } from "@/app/horizon/content";
import {
  HorizonLeadProvider,
  HorizonLeadButton,
} from "./HorizonLead";
import "./horizon.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-hz-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-hz-sans",
  display: "swap",
});

export default function HorizonLanding({ seo, page }) {
  const gallery = page.gallery.images;
  const listingLd = horizonListingJsonLd();

  return (
    <div className={`horizon ${syne.variable} ${figtree.variable}`}>
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
        <header className="horizon-hero" id="horizon-hero">
          <div className="horizon-hero__media">
            <Image
              src={page.hero.image.src}
              alt={page.hero.image.alt}
              fill
              priority
              unoptimized
              sizes="(max-width: 1027px) 100vw, 1027px"
            />
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
        </header>

        <main>
          <section
            className="horizon-section horizon-section--foam"
            id={page.offer.id}
            aria-labelledby="horizon-offer-heading"
          >
            <div className="horizon-wrap">
              <h2 id="horizon-offer-heading">{page.offer.h2}</h2>
              <p className="horizon-lead">{page.offer.intro}</p>
              <div className="horizon-stats" role="list">
                {page.offer.stats.map((stat) => (
                  <div className="horizon-stat" role="listitem" key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
              <p className="horizon-note">{page.offer.note}</p>
            </div>
          </section>

          <section
            className="horizon-section horizon-section--ink"
            id={page.revolution.id}
            aria-labelledby="horizon-phone-heading"
          >
            <div className="horizon-wrap">
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
            className="horizon-section"
            id={page.gallery.id}
            aria-labelledby="horizon-gallery-heading"
          >
            <div className="horizon-wrap">
              <h2 id="horizon-gallery-heading">{page.gallery.h2}</h2>
              <div className="horizon-shots" role="list">
                {gallery.map((image) => (
                  <figure
                    className={`horizon-shot horizon-shot--${image.frame}`}
                    role="listitem"
                    key={image.src}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      sizes={
                        image.frame === "lead" || image.frame === "wide"
                          ? `(max-width: ${image.width}px) 100vw, ${image.width}px`
                          : `(max-width: 800px) 100vw, ${Math.min(image.width, 560)}px`
                      }
                      quality={90}
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <section
            className="horizon-section horizon-section--foam"
            id={page.location.id}
            aria-labelledby="horizon-location-heading"
          >
            <div className="horizon-wrap horizon-split">
              <div>
                <h2 id="horizon-location-heading">{page.location.h2}</h2>
                <p className="horizon-lead" style={{ marginBottom: 0 }}>
                  {page.location.body}
                </p>
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
            aria-labelledby="horizon-faq-heading"
          >
            <div className="horizon-wrap">
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
            aria-labelledby="horizon-close-heading"
          >
            <div className="horizon-wrap horizon-close">
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
      </HorizonLeadProvider>
    </div>
  );
}
