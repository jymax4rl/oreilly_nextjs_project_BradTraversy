import DocumentationEditor from "@/components/documentation/DocumentationEditor";

export const metadata = {
  title: "New documentation",
  robots: { index: false, follow: false },
};

export default function DocumentationNewPage() {
  return (
    <div className="space-y-4">
      <h2 className="docs-section-title mt-0">Create article</h2>
      <DocumentationEditor mode="create" />
    </div>
  );
}
