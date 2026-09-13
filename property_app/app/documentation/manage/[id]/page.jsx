import { notFound } from "next/navigation";
import DocumentationEditor from "@/components/documentation/DocumentationEditor";
import connectToDatabase from "@/config/database";
import { getDocumentationById } from "@/utils/documentation/service";

export const metadata = {
  title: "Edit documentation",
  robots: { index: false, follow: false },
};

export default async function DocumentationEditPage({ params }) {
  const { id } = await params;
  await connectToDatabase();
  const article = await getDocumentationById(id);
  if (!article) notFound();

  return (
    <div className="space-y-4">
      <h2 className="docs-section-title mt-0">Edit: {article.title}</h2>
      <DocumentationEditor mode="edit" initial={article} />
    </div>
  );
}
