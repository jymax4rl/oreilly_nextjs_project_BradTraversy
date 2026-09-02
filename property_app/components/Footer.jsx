"use client";

import Link from "next/link";
import { FaInstagram, FaTwitter, FaLinkedin, FaFacebook } from "react-icons/fa";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const Footer = ({ className = "" }) => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  return (
    <footer
      className={`bg-zinc-950 text-zinc-400 relative pt-24 pb-12 overflow-hidden font-sans ${className}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Section: CTA & Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Left: Call to Action */}
          <div className="space-y-6">
            <p className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
              {t("footer.ready")} <br />
              <span className="text-[var(--kama-accent,#1b5c57)]">
                {t("footer.dreamStay")}
              </span>
            </p>
            <p className="max-w-md text-lg text-zinc-500">
              {t("footer.blurb")}
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                href="/properties"
                className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
              >
                {t("footer.getStarted")}
              </Link>
            </div>
          </div>

          {/* Right: Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Column 1 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">{t("footer.company")}</h4>
              <FooterLink href="/about">{t("footer.about")}</FooterLink>
              <FooterLink href="/careers">{t("footer.careers")}</FooterLink>
              <FooterLink href="/press">{t("footer.press")}</FooterLink>
              <a
                href="mailto:contact@isisel.com"
                className="hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
              >
                {t("footer.contact")}
              </a>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">{t("footer.resources")}</h4>
              <FooterLink href="/blog">{t("footer.blog")}</FooterLink>
              <FooterLink href="/guides">{t("footer.guides")}</FooterLink>
              <FooterLink href="/help">{t("footer.help")}</FooterLink>
              <FooterLink href="/partners">{t("footer.partners")}</FooterLink>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">{t("footer.legal")}</h4>
              <FooterLink href="/policies">{t("footer.policies")}</FooterLink>
              <FooterLink href="/policies/terms">{t("footer.terms")}</FooterLink>
              <FooterLink href="/policies/privacy">{t("footer.privacy")}</FooterLink>
              <FooterLink href="/policies/cookies">{t("footer.cookies")}</FooterLink>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-zinc-800 mb-12"></div>

        {/* Bottom Section: Socials & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
          <div className="flex gap-6 text-2xl">
            <a href="#" className="hover:text-white transition-colors">
              <FaInstagram />
            </a>
            <a
              href="https://x.com/ConnaisAfrique/status/1996164384666562916"
              className="hover:text-white transition-colors"
            >
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <FaLinkedin />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <FaFacebook />
            </a>
          </div>
          <p className="text-sm hover:text-white transition-colors">
            © {currentYear} Isisel
            {" · "}
            <a
              href="mailto:contact@isisel.com"
              className="underline underline-offset-2 hover:text-white"
            >
              contact@isisel.com
            </a>
          </p>
        </div>

        {/* Giant Footer Title (Modern Trend) */}
        <div className="mt-20 border-t border-zinc-900 pt-8 text-center">
          <p className="text-[12vw] cursor-pointer leading-none font-bold text-zinc-900 select-none tracking-tighter hover:text-zinc-800 transition-colors duration-500">
            ISISEL
          </p>
        </div>
      </div>
    </footer>
  );
};

// Helper Component for consistent link styling
const FooterLink = ({ href, children }) => {
  return (
    <Link
      href={href}
      className="hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
    >
      {children}
    </Link>
  );
};

export default Footer;
