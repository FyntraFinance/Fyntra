import { ConviteInstalar } from "@/components/app/ConviteInstalar";
import { Shell } from "@/components/app/Shell";
import { ToastProvider } from "@/components/ui/Toast";
import {
  calcularEvolucaoAnual,
  calcularMetas,
  calcularPorCategoria,
  calcularResumoPessoas,
  calcularTotais,
} from "@/lib/calculos";
import {
  contasFixasDoMes,
  contasVariaveisDoMes,
  listarContasFixas,
  listarContasVariaveis,
  listarMetas,
  listarPessoas,
  obterConfiguracao,
} from "@/lib/dados";
import { obterMesSelecionado } from "@/lib/mes";
import { ehAdminSistema, obterContexto, podeAdministrar } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contexto, mes] = await Promise.all([
    obterContexto(),
    obterMesSelecionado(),
  ]);

  const [pessoas, todasFixas, todasVariaveis, metas, configuracao] =
    await Promise.all([
      listarPessoas(contexto.workspaceId),
      listarContasFixas(contexto.workspaceId),
      listarContasVariaveis(contexto.workspaceId),
      listarMetas(contexto.workspaceId),
      obterConfiguracao(contexto.workspaceId),
    ]);

  const fixasMes = contasFixasDoMes(todasFixas, mes);
  const variaveisMes = contasVariaveisDoMes(todasVariaveis, mes);

  const totais = calcularTotais(pessoas, fixasMes, variaveisMes);
  const resumoPessoas = calcularResumoPessoas(pessoas, fixasMes, variaveisMes);
  const metasCalculadas = calcularMetas(metas, totais.sobra, mes);
  const porCategoria = calcularPorCategoria(fixasMes, variaveisMes);

  const evolucaoAnual = calcularEvolucaoAnual(
    mes.split("-")[0],
    totais.totalSalarios,
    todasFixas,
    todasVariaveis,
  );

  const dadosResumo = [
    { nome: "Salários", valor: totais.totalSalarios, cor: "#10b981" },
    { nome: "Fixas", valor: totais.totalFixas, cor: "#3b82f6" },
    { nome: "Variáveis", valor: totais.totalVariaveis, cor: "#8b5cf6" },
    { nome: "Sobra", valor: Math.max(0, totais.sobra), cor: "#06b6d4" },
  ];

  const movimentacoes = [
    ...fixasMes.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      categoria: conta.categoria,
      valor: conta.valor,
    })),
    ...variaveisMes.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      categoria: conta.categoria,
      valor: conta.valorParcela,
    })),
  ]
    .slice(-6)
    .reverse();

  return (
    <ToastProvider>
      <Shell
        usuario={{ nome: contexto.userNome, email: contexto.userEmail }}
        mes={mes}
        souAdmin={ehAdminSistema(contexto)}
        abas={{
          dashboard: {
            totais,
            resumoPessoas,
            metasCalculadas,
            porCategoria,
            evolucaoAnual,
            dadosResumo,
            movimentacoes,
          },
          pessoas: { pessoas, podeConvidar: podeAdministrar(contexto.role) },
          contasFixas: { contas: fixasMes, pessoas, mes },
          contasVariaveis: { contas: variaveisMes, pessoas },
          assistente: { temToken: configuracao.temTokenIa, mes },
        }}
      >
        {children}
      </Shell>

      <ConviteInstalar />
    </ToastProvider>
  );
}
