"use client";

import Image from "next/image";
import Link from "next/link";
import { Fraunces, Outfit } from "next/font/google";
import { BECOME_A_HOST_HREF } from "@/utils/hostPwaInstall";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-kama-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-kama-sans",
  display: "swap",
});

export default function ComingSoonStays({ variant = "home" }) {
  const { t } = useLanguage();
  const page = variant === "page";

  return (
    <section
      className={`home-portal stays-coming-soon stays-coming-soon--photo${page ? " stays-coming-soon--page" : ""} ${fraunces.variable} ${outfit.variable}`}
      aria-labelledby="stays-coming-soon-title"
    >
      <div className="stays-coming-soon__photo" aria-hidden>
        <Image
          src="/home/coming-soon-arrival.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="stays-coming-soon__img"
        />
        <div className="stays-coming-soon__scrim" />
      </div>
      <div className="stays-coming-soon__inner">
        <p className="stays-coming-soon__eyebrow">{t("home.staysEyebrow")}</p>
        <p className="stays-coming-soon__soon">{t("home.comingSoon.kicker")}</p>
        <h2 id="stays-coming-soon-title" className="stays-coming-soon__title">
          {t("home.comingSoon.title")}
        </h2>
        <p className="stays-coming-soon__body">{t("home.comingSoon.body")}</p>
        <div className="stays-coming-soon__actions">
          <Link href={BECOME_A_HOST_HREF} className="stays-coming-soon__primary">
            {t("home.comingSoon.hostCta")}
          </Link>
          <Link href="/founding-hosts" className="stays-coming-soon__ghost">
            {t("home.comingSoon.foundingCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
