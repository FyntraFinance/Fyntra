import { redirect } from "next/navigation";

/** Pessoas virou uma aba do Dashboard — mantém o link antigo funcionando. */
export default function PessoasPage() {
  redirect("/dashboard");
}
