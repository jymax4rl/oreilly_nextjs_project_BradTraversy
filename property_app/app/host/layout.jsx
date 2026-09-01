import HostWorkspaceGate from "@/components/host/HostWorkspaceGate";

export const metadata = {
  title: {
    default: "Host",
    template: "%s · Host",
  },
};

export default function HostRootLayout({ children }) {
  return <HostWorkspaceGate>{children}</HostWorkspaceGate>;
}
