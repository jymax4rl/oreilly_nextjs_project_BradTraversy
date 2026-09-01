"use client";

import { usePathname } from "next/navigation";
import HostShell from "@/components/host/HostShell";
import { isHostWorkspacePath } from "@/utils/hostConsole";

/** Applicant pages keep marketplace chrome; verified host tools use HostShell. */
export default function HostWorkspaceGate({ children }) {
  const pathname = usePathname() || "";
  if (!isHostWorkspacePath(pathname)) {
    return children;
  }
  return <HostShell>{children}</HostShell>;
}
