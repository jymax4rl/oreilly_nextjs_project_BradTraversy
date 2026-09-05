import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import { onboardingHref } from "@/utils/audience/paths";
import "./founding-hosts.css";

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

export default function FoundingHostsLanding({ stats }) {
  const limit = stats?.foundingHostLimit || 0;
  const claimed = stats?.claimedCount || 0;
  const remaining = stats?.spotsRemaining || 0;
  const isFull = Boolean(stats?.isFull);
  const years = stats?.foundingHostDurationYears || 0;
  const ratePct = Math.round((Number(stats?.foundingHostCommissionRate) || 0) * 100);
  const ctaHref = onboardingHref("founding-hosts", "hero");

  return (
    <div className={`fh-page ${fraunces.variable} ${outfit.variable}`}>
      <section className="fh-hero">
        <div className="fh-wrap">
          <p className="fh-kicker">Founding hosts</p>
          <h1>Become One of Isisel’s Founding {limit || ""} Hosts</h1>
          <p className="fh-lede">
            We’re building the future of property stays in Africa — and we want
            our first hosts to build it with us.
          </p>

          <div className="fh-counter" aria-live="polite">
            {isFull ? (
              <p>
                The Founding {limit} program is now full.
              </p>
            ) : (
              <>
                <p className="fh-counter__big">
                  <strong>{claimed}</strong> of {limit} Founding Host spots claimed
                </p>
                <p className="fh-counter__remain">
                  {remaining} spot{remaining === 1 ? "" : "s"} remaining
                </p>
              </>
            )}
          </div>

          {isFull ? (
            <p className="fh-cta-note">
              Applications remain open. New hosts join the marketplace on
              standard terms.
            </p>
          ) : (
            <Link href={ctaHref} className="fh-cta">
              Apply to host
            </Link>
          )}
        </div>
      </section>

      <section className="fh-wrap fh-benefits">
        <h2>What Founding Hosts receive</h2>
        <ul>
          <li>{ratePct}% Isisel commission for {years} years</li>
          <li>Founding Host recognition</li>
          <li>Early access to new host tools</li>
          <li>Help shape the future of Isisel</li>
          <li>Increased visibility as an early partner</li>
        </ul>
        <p className="fh-fine">
          Commission of {ratePct}% applies for {years} years from the day your
          first listing is approved — if a Founding Host spot is still
          available. Creating an account or becoming a verified host is not
          enough; the benefit is awarded when your first listing is approved.
        </p>
        <Link href="/business" className="fh-text-link">
          For hospitality businesses
        </Link>
      </section>
    </div>
  );
}
