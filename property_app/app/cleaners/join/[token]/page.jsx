import CleanerJoinView from "@/components/cleaners/CleanerJoinView";

export default async function CleanerJoinPage({ params }) {
  const { token } = await params;
  return <CleanerJoinView token={token} />;
}
