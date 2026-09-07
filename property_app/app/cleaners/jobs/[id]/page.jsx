import CleanerJobDetail from "@/components/cleaners/CleanerJobDetail";

export default async function CleanerJobPage({ params }) {
  const { id } = await params;
  return <CleanerJobDetail jobId={id} />;
}
