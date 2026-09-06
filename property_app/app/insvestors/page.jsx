import { redirect } from "next/navigation";

/** Common misspelling of /investors (middleware also 307s this path). */
export default function InvestorsTypoRedirect() {
  redirect("/investors");
}
