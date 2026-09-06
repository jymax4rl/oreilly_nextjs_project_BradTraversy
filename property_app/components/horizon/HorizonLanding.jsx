import Image from "next/image";
import { Syne, Figtree } from "next/font/google";
import AudienceJsonLd from "@/components/audience/AudienceJsonLd";
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
  const gallery = page.gallery.images.slice(0, 5);

  return (
    <div className={`horizon ${syne.variable} ${figtree.variable}`}>
      <AudienceJsonLd
        path={seo.canonical}
        title={seo.title}
        description={seo.description}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Horizon", href: seo.canonical },
        ]}
      />

      <HorizonLeadProvider>
        <header className="horizon-hero" id="horizon-hero">
          <div className="horizon-hero__media">
            <Image
              src={page.hero.image.src}
              alt={page.hero.image.alt}
              fill
              priority
              sizes="100vw"
              quality={90}
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

        <section className="horizon-section horizon-section--foam" id={page.offer.id}>
          <div className="horizon-wrap">
            <h2>{page.offer.h2}</h2>
            <p className="horizon-lead">{page.offer.intro}</p>
            <div className="horizon-stats">
              {page.offer.stats.map((stat) => (
                <div className="horizon-stat" key={stat.label}>
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
        >
          <div className="horizon-wrap">
            <h2>{page.revolution.h2}</h2>
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

        <section className="horizon-section" id={page.gallery.id}>
          <div className="horizon-wrap">
            <h2>{page.gallery.h2}</h2>
            <div className="horizon-gallery">
              {gallery.map((image, index) => (
                <div className="horizon-gallery__cell" key={`${image.src}-${index}`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={
                      index === 0
                        ? "(max-width: 720px) 100vw, 55vw"
                        : "(max-width: 720px) 100vw, 40vw"
                    }
                    quality={90}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="horizon-section horizon-section--foam"
          id={page.location.id}
        >
          <div className="horizon-wrap horizon-split">
            <div>
              <h2>{page.location.h2}</h2>
              <p className="horizon-lead" style={{ marginBottom: 0 }}>
                {page.location.body}
              </p>
            </div>
            <div className="horizon-map">
              <Image
                src={page.location.image.src}
                alt={page.location.image.alt}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={90}
              />
            </div>
          </div>
        </section>

        <section className="horizon-section">
          <div className="horizon-wrap horizon-close">
            <h2>{page.close.h2}</h2>
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
      </HorizonLeadProvider>
    </div>
  );
}
