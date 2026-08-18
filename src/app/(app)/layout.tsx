import { CentralAjuda } from "@/components/ajuda/CentralAjuda";
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
  ganhosExtrasDoMes,
  listarContasFixas,
  listarContasVariaveis,
  listarEventos,
  listarGanhosExtras,
  listarMetas,
  listarPessoas,
  listarStatusGastos,
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

  const [
    pessoas,
    todasFixas,
    todasVariaveis,
    todosGanhos,
    metas,
    eventos,
    statusGastos,
    configuracao,
  ] = await Promise.all([
    listarPessoas(contexto.workspaceId),
    listarContasFixas(contexto.workspaceId),
    listarContasVariaveis(contexto.workspaceId),
    listarGanhosExtras(contexto.workspaceId),
    listarMetas(contexto.workspaceId),
    listarEventos(contexto.workspaceId),
    listarStatusGastos(contexto.workspaceId, mes),
    obterConfiguracao(contexto.workspaceId),
  ]);

  const fixasMes = contasFixasDoMes(todasFixas, mes);
  const variaveisMes = contasVariaveisDoMes(todasVariaveis, mes);
  const ganhosMes = ganhosExtrasDoMes(todosGanhos, mes);

  const totais = calcularTotais(pessoas, fixasMes, variaveisMes, ganhosMes);

  const resumoPessoas = calcularResumoPessoas(
    pessoas,
    fixasMes,
    variaveisMes,
    ganhosMes,
  );

  const metasCalculadas = calcularMetas(metas, totais.sobra, mes);
  const porCategoria = calcularPorCategoria(fixasMes, variaveisMes);

  const evolucaoAnual = calcularEvolucaoAnual(
    mes.split("-")[0],
    totais.totalSalarios,
    todasFixas,
    todasVariaveis,
    todosGanhos,
  );

  const dadosResumo = [
    { nome: "Salários", valor: totais.totalSalarios, cor: "#10b981" },
    { nome: "Extras", valor: totais.totalGanhosExtras, cor: "#22c55e" },
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
      tipo: "FIXA" as const,
      pago: statusGastos.fixasPagas.includes(conta.id),
    })),
    ...variaveisMes.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      categoria: conta.categoria,
      valor: conta.valorParcela,
      tipo: "VARIAVEL" as const,
      pago: statusGastos.variaveisPagas.includes(conta.id),
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
            mes,
          },
          pessoas: { pessoas, podeConvidar: podeAdministrar(contexto.role) },
          contasFixas: {
            contas: fixasMes,
            pessoas,
            mes,
            pagas: statusGastos.fixasPagas,
          },
          contasVariaveis: {
            contas: variaveisMes,
            pessoas,
            mes,
            pagas: statusGastos.variaveisPagas,
          },
          ganhos: { ganhos: ganhosMes, pessoas, mes },
          eventos: { eventos, pessoas },
          assistente: { temToken: configuracao.temTokenIa, mes },
        }}
      >
        {children}
      </Shell>

      <CentralAjuda />

      <ConviteInstalar />
    </ToastProvider>
  );
}
