"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import HostReservationsCalendar from "@/components/host/calendar/HostReservationsCalendar";
import { propertyImageUrl } from "@/utils/propertyImageUrl";
import "@/components/host/calendar/reservations-calendar.css";

export default function HostCalendarHubView({ properties }) {
  const { t } = useLanguage();
  const calendarProperties = properties.map(({ futureCount, ...rest }) => rest);

  return (
    <div>
      <HostReservationsCalendar initialProperties={calendarProperties} />

      {properties.length > 0 ? (
        <details className="rc-listings-fold">
          <summary>
            <span>
              {t("hostConsole.listingsFold")}
              <span className="rc-listings-fold__n">
                {t("hostConsole.listingsFoldCount", { n: properties.length })}
              </span>
            </span>
            <ChevronDown className="rc-listings-fold__chev" aria-hidden />
          </summary>
          <p className="rc-listings-fold__hint">{t("hostConsole.listingsFoldHint")}</p>
          <ul className="rc-listings-fold__list">
            {properties.map((p) => {
              const loc = [p.city, p.country].filter(Boolean).join(", ");
              return (
                <li key={p.id}>
                  <Link href={`/properties/${p.id}/calendar`}>
                    <img
                      className="rc-listings-fold__thumb"
                      src={propertyImageUrl(p.image)}
                      alt=""
                    />
                    <span>
                      <span className="rc-listings-fold__name">{p.name}</span>
                      <span className="rc-listings-fold__meta">
                        {loc ? `${loc} · ` : ""}
                        {t("hostConsole.futureReservations", {
                          n: p.futureCount || 0,
                        })}
                      </span>
                    </span>
                    <span className="rc-listings-fold__go">
                      {t("hostConsole.calendarOpen")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
