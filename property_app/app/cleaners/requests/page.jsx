import CleanerJobList from "@/components/cleaners/CleanerJobList";

export default function CleanerRequestsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Requests</h1>
      <CleanerJobList scope="requests" />
    </div>
  );
}
