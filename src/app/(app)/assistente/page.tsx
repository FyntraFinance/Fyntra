import { ChatIA } from "@/components/assistente/ChatIA";
import { obterConfiguracao } from "@/lib/dados";
import { obterMesSelecionado } from "@/lib/mes";
import { obterContexto } from "@/lib/workspace";

export const metadata = {
  title: "Assistente IA — Fyntra",
};

export default async function AssistentePage() {
  const [contexto, mes] = await Promise.all([
    obterContexto(),
    obterMesSelecionado(),
  ]);

  const configuracao = await obterConfiguracao(contexto.workspaceId);

  return <ChatIA temToken={configuracao.temTokenIa} mes={mes} />;
}
