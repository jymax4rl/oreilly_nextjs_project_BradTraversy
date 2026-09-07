import HostCleaningJobDetail from "@/components/host/cleaning/HostCleaningJobDetail";

export default async function HostCleaningJobPage({ params }) {
  const { id } = await params;
  return <HostCleaningJobDetail jobId={id} />;
}
