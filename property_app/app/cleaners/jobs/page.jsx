import CleanerJobList from "@/components/cleaners/CleanerJobList";

export default function CleanerJobsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">My cleanings</h1>
      <CleanerJobList />
    </div>
  );
}
