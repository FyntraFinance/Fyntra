import { redirect } from "next/navigation";

/** Contas Fixas virou uma aba do Dashboard — mantém o link antigo funcionando. */
export default function ContasFixasPage() {
  redirect("/dashboard");
}
