import { ListaContasVariaveis } from "@/components/contas/ListaContasVariaveis";
import {
  contasVariaveisDoMes,
  listarContasVariaveis,
  listarPessoas,
} from "@/lib/dados";
import { obterMesSelecionado } from "@/lib/mes";
import { obterContexto } from "@/lib/workspace";

export const metadata = {
  title: "Contas Variáveis — Fyntra",
};

export default async function ContasVariaveisPage() {
  const [contexto, mesAtual] = await Promise.all([
    obterContexto(),
    obterMesSelecionado(),
  ]);

  const [contas, pessoas] = await Promise.all([
    listarContasVariaveis(contexto.workspaceId),
    listarPessoas(contexto.workspaceId),
  ]);

  return (
    <ListaContasVariaveis
      contas={contasVariaveisDoMes(contas, mesAtual)}
      pessoas={pessoas}
    />
  );
}
