import HostNav from "@/components/host/HostNav";

export default function HostShell({ children }) {
  return (
    <div className="min-h-dvh bg-[var(--kama-canvas-soft)] text-[var(--kama-ink)]">
      <HostNav />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
