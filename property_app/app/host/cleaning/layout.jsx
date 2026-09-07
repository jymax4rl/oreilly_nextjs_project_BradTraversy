import HostCleaningSubnav from "@/components/host/cleaning/HostCleaningSubnav";

export const metadata = {
  title: "Cleaning",
  robots: { index: false, follow: false },
};

export default function HostCleaningLayout({ children }) {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
            Cleaning
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
            Isisel Cleaners
          </h1>
        </div>
      </div>
      <HostCleaningSubnav />
      {children}
    </div>
  );
}
