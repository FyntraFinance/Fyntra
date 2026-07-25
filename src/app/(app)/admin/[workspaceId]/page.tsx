import Link from "next/link";
import { notFound } from "next/navigation";

import {
  GraficoAnual,
  GraficoCategorias,
  GraficoResumo,
} from "@/components/dashboard/Graficos";
import { obterFamilia } from "@/lib/admin-dados";
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
} from "@/lib/dados";
import {
  formatarData,
  formatarMesAno,
  formatarMoeda,
  normalizarMes,
  adicionarMeses,
} from "@/lib/format";
import { exigirAdminSistema } from "@/lib/workspace";

export const metadata = {
  title: "Relatório da Família — Fyntra",
};

const ROTULO_ROLE: Record<string, string> = {
  OWNER: "Dono",
  ADMIN: "Administrador",
  MEMBER: "Membro",
};

export default async function RelatorioFamiliaPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  await exigirAdminSistema();

  const { workspaceId } = await params;
  const { mes: mesQuery } = await searchParams;
  const mes = normalizarMes(mesQuery);

  const familia = await obterFamilia(workspaceId);

  if (!familia) {
    notFound();
  }

  const [pessoas, todasFixas, todasVariaveis, metas] = await Promise.all([
    listarPessoas(workspaceId),
    listarContasFixas(workspaceId),
    listarContasVariaveis(workspaceId),
    listarMetas(workspaceId),
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

  const linkMes = (novoMes: string) => `/admin/${workspaceId}?mes=${novoMes}`;

  const nomePorPessoa = new Map(pessoas.map((pessoa) => [pessoa.id, pessoa.nome]));

  const todasFixasOrdenadas = [...todasFixas].sort((a, b) =>
    b.dataInicio.localeCompare(a.dataInicio),
  );

  const todasVariaveisOrdenadas = [...todasVariaveis].sort((a, b) =>
    b.data.localeCompare(a.data),
  );

  return (
    <>
      <div className="page-header">
        <Link href="/admin" className="auth-link">
          ← Voltar para as famílias
        </Link>

        <h1 className="page-title mt-4">{familia.workspace.nome}</h1>

        <p className="text-muted" style={{ marginTop: 4 }}>
          Família criada em {formatarData(familia.workspace.criadaEm.slice(0, 10))}
        </p>
      </div>

      <div className="month-selector mt-16" style={{ display: "inline-flex" }}>
        <Link href={linkMes(adicionarMeses(mes, -1))}>←</Link>

        <span className="month-label">{formatarMesAno(mes)}</span>

        <Link href={linkMes(adicionarMeses(mes, 1))}>→</Link>
      </div>

      <div className="metrics-grid mt-16">
        <div className="card metric-card c-green">
          <div className="metric-icon green">💰</div>
          <div className="metric-label">Total Salários</div>
          <div className="metric-value">
            {formatarMoeda(totais.totalSalarios)}
          </div>
        </div>

        <div className="card metric-card c-blue">
          <div className="metric-icon blue">🏠</div>
          <div className="metric-label">Contas Fixas</div>
          <div className="metric-value">{formatarMoeda(totais.totalFixas)}</div>
        </div>

        <div className="card metric-card c-purple">
          <div className="metric-icon purple">💳</div>
          <div className="metric-label">Contas Variáveis</div>
          <div className="metric-value">
            {formatarMoeda(totais.totalVariaveis)}
          </div>
        </div>

        <div className="card metric-card c-red">
          <div className="metric-icon red">📉</div>
          <div className="metric-label">Total Gastos</div>
          <div className="metric-value">{formatarMoeda(totais.totalGastos)}</div>
        </div>

        <div className="card metric-card c-green">
          <div className="metric-icon green">🐷</div>
          <div className="metric-label">Sobra Familiar</div>
          <div className="metric-value">{formatarMoeda(totais.sobra)}</div>
        </div>
      </div>

      <div className="dash-grid mt-16">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Gastos por Categoria</div>
          </div>

          <div className="chart-container">
            <GraficoCategorias dados={porCategoria} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Resumo Financeiro</div>
          </div>

          <div className="chart-container">
            <GraficoResumo dados={dadosResumo} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Evolução Anual</div>
          </div>

          <div className="chart-container chart-container-anual">
            <GraficoAnual dados={evolucaoAnual} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="card-header">
          <div className="card-title">Resumo por Pessoa</div>
        </div>

        <div className="person-cards">
          {resumoPessoas.length === 0 ? (
            <div className="text-slate-400">Nenhuma pessoa cadastrada.</div>
          ) : (
            resumoPessoas.map((pessoa) => (
              <div className="card" key={pessoa.id}>
                <div className="font-bold mb-4">{pessoa.nome}</div>

                <div className="space-y-2 text-sm">
                  <div className="flex-between">
                    <span>Salário</span>
                    <strong>{formatarMoeda(pessoa.salario)}</strong>
                  </div>

                  <div className="flex-between">
                    <span>Gastos</span>
                    <strong className="text-red-400">
                      {formatarMoeda(pessoa.gastos)}
                    </strong>
                  </div>

                  <div className="flex-between">
                    <span>Sobra</span>
                    <strong className="text-emerald-400">
                      {formatarMoeda(pessoa.sobra)}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {metasCalculadas.length > 0 ? (
        <div className="mt-16">
          <div className="card-header">
            <div className="card-title">🎯 Metas</div>
          </div>

          <div className="card">
            <div className="membros-lista">
              {metasCalculadas.map((meta) => (
                <div className="membro-item" key={meta.id}>
                  <div>
                    <div className="list-title">
                      {meta.emoji} {meta.nome}
                    </div>

                    <div className="list-sub">
                      <span>
                        {formatarMoeda(meta.valorAtual)} /{" "}
                        {formatarMoeda(meta.valorAlvo)}
                      </span>
                    </div>
                  </div>

                  <span className="membro-role">{meta.percentual}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-16">
        <div className="card-header">
          <div className="card-title">
            🏠 Todas as Contas Fixas ({todasFixasOrdenadas.length})
          </div>
        </div>

        <div className="card">
          <div className="membros-lista">
            {todasFixasOrdenadas.length === 0 ? (
              <div className="text-slate-400">
                Nenhuma conta fixa cadastrada nesta família.
              </div>
            ) : (
              todasFixasOrdenadas.map((conta) => (
                <div className="membro-item" key={conta.id}>
                  <div>
                    <div className="list-title">{conta.nome}</div>
                    <div className="list-sub">
                      <span>{conta.categoria}</span>
                      <span>
                        {conta.tipo === "INDIVIDUAL"
                          ? `Individual — ${
                              (conta.pessoaId && nomePorPessoa.get(conta.pessoaId)) ??
                              "pessoa removida"
                            }`
                          : "Compartilhada"}
                      </span>
                      <span>
                        Desde {formatarMesAno(conta.dataInicio)}
                        {conta.dataFim ? ` até ${formatarMesAno(conta.dataFim)}` : ""}
                      </span>
                    </div>
                  </div>

                  <span className="membro-role">{formatarMoeda(conta.valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="card-header">
          <div className="card-title">
            💳 Todas as Contas Variáveis ({todasVariaveisOrdenadas.length})
          </div>
        </div>

        <div className="card">
          <div className="membros-lista">
            {todasVariaveisOrdenadas.length === 0 ? (
              <div className="text-slate-400">
                Nenhuma conta variável cadastrada nesta família.
              </div>
            ) : (
              todasVariaveisOrdenadas.map((conta) => (
                <div className="membro-item" key={conta.id}>
                  <div>
                    <div className="list-title">{conta.nome}</div>
                    <div className="list-sub">
                      <span>{conta.categoria}</span>
                      <span>{nomePorPessoa.get(conta.pessoaId) ?? "pessoa removida"}</span>
                      <span>
                        {conta.parcelas > 1
                          ? `${conta.parcelas}x de ${formatarMoeda(conta.valorParcela)} (${formatarMesAno(conta.mesInicio)} a ${formatarMesAno(conta.mesFim)})`
                          : `à vista em ${formatarData(conta.data)}`}
                      </span>
                    </div>
                  </div>

                  <span className="membro-role">
                    {formatarMoeda(conta.valorTotal)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="card-header">
          <div className="card-title">🔑 Quem tem acesso</div>
        </div>

        <div className="card">
          <div className="membros-lista">
            {familia.membros.map((membro) => (
              <div className="membro-item" key={membro.id}>
                <div>
                  <div className="list-title">{membro.nome ?? membro.email}</div>
                  <div className="list-sub">{membro.email}</div>
                </div>

                <span className="membro-role">{ROTULO_ROLE[membro.role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
