import { hospitalitySystems } from "@/utils/hospitalitySystems";

function AccorMark() {
  return (
    <svg viewBox="0 0 140 28" aria-hidden="true" focusable="false">
      <text
        x="70"
        y="21"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="22"
        fontWeight="700"
        letterSpacing="-0.06em"
      >
        Accor
      </text>
    </svg>
  );
}

function IhgMark() {
  return (
    <svg viewBox="0 0 160 36" aria-hidden="true" focusable="false">
      <text
        x="80"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="16"
        fontWeight="780"
        letterSpacing="0.18em"
      >
        IHG
      </text>
      <text
        x="80"
        y="31"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="7.2"
        fontWeight="600"
        letterSpacing="0.22em"
        opacity="0.78"
      >
        HOTELS &amp; RESORTS
      </text>
    </svg>
  );
}

function MewsMark() {
  return (
    <svg viewBox="0 0 140 28" aria-hidden="true" focusable="false">
      <text
        x="70"
        y="21"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="22"
        fontWeight="650"
        letterSpacing="-0.04em"
      >
        mews
      </text>
    </svg>
  );
}

function OperaMark() {
  return (
    <svg viewBox="0 0 170 36" aria-hidden="true" focusable="false">
      <text
        x="85"
        y="13"
        textAnchor="middle"
        fill="#C74634"
        fontFamily="inherit"
        fontSize="8"
        fontWeight="750"
        letterSpacing="0.28em"
      >
        ORACLE
      </text>
      <text
        x="85"
        y="31"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.16em"
      >
        OPERA
      </text>
    </svg>
  );
}

const MARKS = {
  accor: AccorMark,
  ihg: IhgMark,
  mews: MewsMark,
  opera: OperaMark,
};

export default function HospitalitySystemsStrip({ copy = hospitalitySystems }) {
  return (
    <section className="creator-section creator-systems" id={copy.id}>
      <div className="creator-wrap">
        <p className="creator-kicker">{copy.kicker}</p>
        <h2>{copy.h2}</h2>
        <p className="creator-lead">{copy.lede}</p>
        <ul className="creator-systems__rail">
          {copy.items.map((item) => {
            const Mark = MARKS[item.id];
            return (
              <li className="creator-systems__brand" key={item.id}>
                {Mark ? <Mark /> : null}
                <span className="sr-only">{item.name}</span>
                <span className="creator-systems__caption">{item.caption}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
