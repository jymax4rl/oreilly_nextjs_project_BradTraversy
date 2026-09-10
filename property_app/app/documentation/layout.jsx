import OpsShell from "@/components/ops/OpsShell";
import DocumentationSidebar from "@/components/documentation/DocumentationSidebar";
import "@/components/documentation/documentation.css";
import { requireOpsDocumentationPage } from "@/utils/documentation/requireOpsDocumentationPage";
import connectToDatabase from "@/config/database";
import { ensureDocumentationSeeded } from "@/utils/documentation/seed";
import { getDocumentationNav } from "@/utils/documentation/service";
import { CATEGORY_ORDER } from "@/utils/documentation/seedArticles";

export const metadata = {
  title: {
    default: "Documentation",
    template: "%s · Isisel Docs",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DocumentationLayout({ children }) {
  await requireOpsDocumentationPage("/documentation");
  await connectToDatabase();
  await ensureDocumentationSeeded();
  const nav = await getDocumentationNav();
  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  nav.sort(
    (a, b) => (order.get(a.category) ?? 999) - (order.get(b.category) ?? 999),
  );

  return (
    <OpsShell
      title="Documentation"
      subtitle="Internal Isisel Operations knowledge base"
      wide
    >
      <div className="docs-layout">
        <DocumentationSidebar initialNav={nav} />
        <div className="min-w-0">{children}</div>
      </div>
    </OpsShell>
  );
}
