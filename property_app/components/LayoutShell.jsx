"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MainShell from "@/components/MainShell";
import MobileBottomNavGate from "@/components/MobileBottomNavGate";
import MobileTopChromeGate from "@/components/MobileTopChromeGate";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isComingSoon = pathname === "/coming-soon";

  if (isComingSoon) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <MobileTopChromeGate />
      <MainShell>{children}</MainShell>
      <MobileBottomNavGate />
      <Footer className="hidden lg:block" />
    </>
  );
}
