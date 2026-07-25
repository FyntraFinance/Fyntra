import { ListaContasFixas } from "@/components/contas/ListaContasFixas";
import { contasFixasDoMes, listarContasFixas, listarPessoas } from "@/lib/dados";
import { obterMesSelecionado } from "@/lib/mes";
import { obterContexto } from "@/lib/workspace";

export const metadata = {
  title: "Contas Fixas — Fyntra",
};

export default async function ContasFixasPage() {
  const [contexto, mesAtual] = await Promise.all([
    obterContexto(),
    obterMesSelecionado(),
  ]);

  const [contas, pessoas] = await Promise.all([
    listarContasFixas(contexto.workspaceId),
    listarPessoas(contexto.workspaceId),
  ]);

  return (
    <ListaContasFixas
      contas={contasFixasDoMes(contas, mesAtual)}
      pessoas={pessoas}
      mes={mesAtual}
    />
  );
}
