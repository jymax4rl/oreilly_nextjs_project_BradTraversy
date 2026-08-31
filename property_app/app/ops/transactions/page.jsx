import { redirect } from "next/navigation";

export const metadata = {
  title: "Transactions",
};

/** Phase 1: reuse legacy admin transactions tool until ops-native UI lands. */
export default function OpsTransactionsPage() {
  redirect("/admin/transactions");
}
