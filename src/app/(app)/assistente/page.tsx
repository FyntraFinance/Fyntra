import { redirect } from "next/navigation";

/** Assistente IA virou uma aba do Dashboard — mantém o link antigo funcionando. */
export default function AssistentePage() {
  redirect("/dashboard");
}
