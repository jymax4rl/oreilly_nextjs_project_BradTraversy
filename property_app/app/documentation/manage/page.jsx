import DocumentationManagePanel from "@/components/documentation/DocumentationManagePanel";

export const metadata = {
  title: "Manage documentation",
  robots: { index: false, follow: false },
};

export default function DocumentationManagePage() {
  return <DocumentationManagePanel />;
}
