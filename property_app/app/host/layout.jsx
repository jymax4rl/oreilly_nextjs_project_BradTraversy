import HostWorkspaceGate from "@/components/host/HostWorkspaceGate";

export const metadata = {
  title: {
    default: "Host",
    template: "%s · Host",
  },
  robots: { index: false, follow: false },
};

export default function HostRootLayout({ children }) {
  return <HostWorkspaceGate>{children}</HostWorkspaceGate>;
}
