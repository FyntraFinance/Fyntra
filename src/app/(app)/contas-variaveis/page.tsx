import { redirect } from "next/navigation";

/** Contas Variáveis virou uma aba do Dashboard — mantém o link antigo funcionando. */
export default function ContasVariaveisPage() {
  redirect("/dashboard");
}
