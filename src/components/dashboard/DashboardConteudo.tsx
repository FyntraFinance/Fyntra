import {
  GraficoAnual,
  GraficoCategorias,
  GraficoResumo,
} from "@/components/dashboard/Graficos";
import type { MetaCalculada, ResumoPessoa, Totais } from "@/lib/calculos";
import { corAvatar, formatarMesAno, formatarMoeda, inicialNome } from "@/lib/format";

type Movimentacao = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
};

export function DashboardConteudo({
  totais,
  resumoPessoas,
  metasCalculadas,
  porCategoria,
  evolucaoAnual,
  dadosResumo,
  movimentacoes,
}: {
  totais: Totais;
  resumoPessoas: ResumoPessoa[];
  metasCalculadas: MetaCalculada[];
  porCategoria: { nome: string; valor: number }[];
  evolucaoAnual: {
    mes: string;
    salarios: number;
    gastos: number;
    sobra: number;
  }[];
  dadosResumo: { nome: string; valor: number; cor: string }[];
  movimentacoes: Movimentacao[];
}) {
  return (
    <>
      <div className="metrics-grid">
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

      {metasCalculadas.length > 0 ? (
        <div className="mt-16">
          <div className="card-header">
            <div className="card-title">🎯 Metas Financeiras</div>
          </div>

          <div className="metas-grid">
            {metasCalculadas.map((meta) => (
              <div className="card meta-dash-card" key={meta.id}>
                <div className="meta-dash-top">
                  <div
                    className="meta-dash-emoji"
                    style={{ background: `${meta.cor}22`, color: meta.cor }}
                  >
                    {meta.emoji}
                  </div>

                  <div className="meta-dash-info">
                    <div className="meta-dash-nome">{meta.nome}</div>

                    <div className="meta-dash-valores">
                      <span style={{ color: meta.cor, fontWeight: 700 }}>
                        {formatarMoeda(meta.valorAtual)}
                      </span>

                      <span className="text-muted">
                        {" "}
                        / {formatarMoeda(meta.valorAlvo)}
                      </span>
                    </div>
                  </div>

                  <div className="meta-dash-pct" style={{ color: meta.cor }}>
                    {meta.percentual}%
                  </div>
                </div>

                <div className="meta-dash-track">
                  <div
                    className="meta-dash-bar"
                    style={{
                      width: `${meta.percentual}%`,
                      background: meta.cor,
                    }}
                  />
                </div>

                <div className="meta-dash-stats">
                  <div className="meta-stat-item">
                    <span className="meta-stat-label">Guardar/mês</span>

                    <span className="meta-stat-val">
                      {formatarMoeda(meta.contribuicao)}
                      {meta.automatica ? (
                        <span className="meta-auto-badge">auto</span>
                      ) : null}
                    </span>
                  </div>

                  <div className="meta-stat-item">
                    <span className="meta-stat-label">Conclusão</span>

                    <span className="meta-stat-val">
                      {meta.concluida ? (
                        <span style={{ color: "#10b981" }}>✅ Concluída!</span>
                      ) : meta.mesConclusao ? (
                        formatarMesAno(meta.mesConclusao)
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
            resumoPessoas.map((pessoa, indice) => (
              <div className="card" key={pessoa.id}>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="person-avatar"
                    style={{ background: corAvatar(indice) }}
                  >
                    {inicialNome(pessoa.nome)}
                  </div>

                  <div>
                    <div className="font-bold">{pessoa.nome}</div>

                    <div className="text-sm text-slate-400">
                      {formatarMoeda(pessoa.salario)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
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

                  <div className="flex-between">
                    <span>Livre por dia</span>

                    <strong>{formatarMoeda(pessoa.livrePorDia)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-16">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Últimas Movimentações</div>
          </div>

          {movimentacoes.length === 0 ? (
            <div className="text-slate-400">Nenhuma conta encontrada.</div>
          ) : (
            movimentacoes.map((conta) => (
              <div
                className="flex-between border-b pb-3"
                key={`${conta.id}-${conta.nome}`}
              >
                <div>
                  <div className="font-semibold">{conta.nome}</div>

                  <div className="text-xs text-slate-400">
                    {conta.categoria || "Outros"}
                  </div>
                </div>

                <strong className="text-red-400">
                  {formatarMoeda(conta.valor)}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
