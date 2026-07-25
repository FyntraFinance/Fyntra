import { ListaPessoas } from "@/components/pessoas/ListaPessoas";
import { listarPessoas } from "@/lib/dados";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

export const metadata = {
  title: "Pessoas — Fyntra",
};

export default async function PessoasPage() {
  const contexto = await obterContexto();
  const pessoas = await listarPessoas(contexto.workspaceId);

  return (
    <ListaPessoas
      pessoas={pessoas}
      podeConvidar={podeAdministrar(contexto.role)}
    />
  );
}
