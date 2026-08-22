import { BotaoStatus } from "@/components/contas/BotaoStatus";
import {
  GraficoAnual,
  GraficoCategorias,
  GraficoResumo,
} from "@/components/dashboard/Graficos";
import { GuardarNaMeta } from "@/components/dashboard/GuardarNaMeta";
import type { MetaCalculada, ResumoPessoa, Totais } from "@/lib/calculos";
import { corAvatar, formatarMesAno, formatarMoeda, inicialNome } from "@/lib/format";
import type { AporteMetaDTO, PessoaDTO } from "@/lib/tipos";

/** Abas que os cartões do dashboard conseguem abrir. */
export type AbaAtalho =
  | "pessoas"
  | "ganhos"
  | "contas-fixas"
  | "contas-variaveis"
  | "eventos";

type Movimentacao = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  tipo: "FIXA" | "VARIAVEL";
  pago: boolean;
};

export function DashboardConteudo({
  totais,
  resumoPessoas,
  metasCalculadas,
  porCategoria,
  evolucaoAnual,
  dadosResumo,
  movimentacoes,
  mes,
  aportesMes,
  pessoas,
  irParaAba,
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
  mes: string;
  aportesMes: AporteMetaDTO[];
  pessoas: PessoaDTO[];
  /** Leva para a aba correspondente ao cartão clicado. */
  irParaAba?: (aba: AbaAtalho) => void;
}) {
  /**
   * Cartão de métrica. Com destino informado ele vira botão e leva para a
   * tela daquele número; sem destino, continua um cartão comum.
   */
  function Metrica({
    cor,
    icone,
    rotulo,
    valor,
    destino,
  }: {
    cor: string;
    icone: string;
    rotulo: string;
    valor: number;
    destino?: AbaAtalho;
  }) {
    const conteudo = (
      <>
        <div className={`metric-icon ${cor}`}>{icone}</div>
        <div className="metric-label">{rotulo}</div>
        <div className="metric-value">{formatarMoeda(valor)}</div>
      </>
    );

    if (!destino || !irParaAba) {
      return <div className={`card metric-card c-${cor}`}>{conteudo}</div>;
    }

    return (
      <button
        type="button"
        className={`card metric-card c-${cor} metric-card-link`}
        title={`Ver ${rotulo}`}
        onClick={() => irParaAba(destino)}
      >
        {conteudo}
        <span className="metric-seta" aria-hidden="true">
          →
        </span>
      </button>
    );
  }

  // No vermelho não existe sobra: o que há é uma conta a descoberto.
  const noVermelho = totais.sobra < 0;

  return (
    <>
      <div className="metrics-grid">
        <Metrica
          cor="green"
          icone="💰"
          rotulo="Total Salários"
          valor={totais.totalSalarios}
          destino="pessoas"
        />

        <Metrica
          cor="green"
          icone="💵"
          rotulo="Ganhos Extras"
          valor={totais.totalGanhosExtras}
          destino="ganhos"
        />

        <Metrica
          cor="blue"
          icone="🏠"
          rotulo="Contas Fixas"
          valor={totais.totalFixas}
          destino="contas-fixas"
        />

        <Metrica
          cor="purple"
          icone="💳"
          rotulo="Contas Variáveis"
          valor={totais.totalVariaveis}
          destino="contas-variaveis"
        />

        {totais.totalAportes > 0 ? (
          <Metrica
            cor="amber"
            icone="🎯"
            rotulo="Guardado em Metas"
            valor={totais.totalAportes}
          />
        ) : null}

        <Metrica
          cor="red"
          icone="📉"
          rotulo="Total Gastos"
          valor={totais.totalGastos}
          destino="contas-variaveis"
        />

        <div className={`card metric-card c-${noVermelho ? "red" : "green"}`}>
          <div className={`metric-icon ${noVermelho ? "red" : "green"}`}>
            {noVermelho ? "⚠️" : "🐷"}
          </div>

          <div className="metric-label">
            {noVermelho ? "Déficit do Mês" : "Sobra Familiar"}
          </div>

          <div
            className={`metric-value${noVermelho ? " valor-negativo" : ""}`}
          >
            {formatarMoeda(totais.sobra)}
          </div>
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
                    style={{ background: `${meta.cor}22` }}
                  >
                    {meta.emoji}
                  </div>

                  <div className="meta-dash-info">
                    <div className="meta-dash-nome">{meta.nome}</div>

                    <div className="meta-dash-valores">
                      {/* A cor da meta identifica a meta na barra e no ícone;
                          no texto ela varia demais para garantir leitura. */}
                      <span style={{ fontWeight: 700 }}>
                        {formatarMoeda(meta.valorAtual)}
                      </span>

                      <span className="text-muted">
                        {" "}
                        / {formatarMoeda(meta.valorAlvo)}
                      </span>
                    </div>
                  </div>

                  <div className="meta-dash-pct">{meta.percentual}%</div>
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
                    <span className="meta-stat-label">Guardado no mês</span>

                    <span className="meta-stat-val">
                      {meta.aportadoNoMes > 0 ? (
                        <span className="valor-positivo">
                          {formatarMoeda(meta.aportadoNoMes)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </span>
                  </div>

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
                        <span className="valor-positivo">✅ Concluída!</span>
                      ) : meta.mesConclusao ? (
                        formatarMesAno(meta.mesConclusao)
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </span>
                  </div>
                </div>

                <GuardarNaMeta
                  metaId={meta.id}
                  nomeMeta={meta.nome}
                  emojiMeta={meta.emoji}
                  mes={mes}
                  sobra={totais.sobra}
                  aportes={aportesMes.filter(
                    (aporte) => aporte.metaId === meta.id,
                  )}
                  pessoas={pessoas}
                />
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
            <div className="texto-suave">Nenhuma pessoa cadastrada.</div>
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

                    <div className="text-sm texto-suave">
                      {formatarMoeda(pessoa.salario)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {pessoa.ganhosExtras > 0 ? (
                    <div className="flex-between">
                      <span>Ganhos extras</span>

                      <strong className="valor-positivo">
                        + {formatarMoeda(pessoa.ganhosExtras)}
                      </strong>
                    </div>
                  ) : null}

                  <div className="flex-between">
                    <span>Gastos</span>

                    <strong className="valor-negativo">
                      {formatarMoeda(pessoa.gastos)}
                    </strong>
                  </div>

                  <div className="flex-between">
                    <span>{pessoa.sobra < 0 ? "Faltante" : "Sobra"}</span>

                    <strong
                      className={
                        pessoa.sobra < 0 ? "valor-negativo" : "valor-positivo"
                      }
                    >
                      {formatarMoeda(pessoa.sobra)}
                    </strong>
                  </div>

                  {/* Sem sobra não existe "livre por dia": o rótulo some. */}
                  {pessoa.livrePorDia > 0 ? (
                    <div className="flex-between">
                      <span>Livre por dia</span>

                      <strong>{formatarMoeda(pessoa.livrePorDia)}</strong>
                    </div>
                  ) : null}
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
            <div className="texto-suave">Nenhuma conta encontrada.</div>
          ) : (
            movimentacoes.map((conta) => (
              <div
                className="flex-between border-b pb-3"
                key={`${conta.id}-${conta.nome}`}
              >
                <div>
                  <div className="font-semibold">{conta.nome}</div>

                  <div className="text-xs texto-suave">
                    {conta.categoria || "Outros"}
                  </div>

                  <div className="mt-8">
                    <BotaoStatus
                      tipo={conta.tipo}
                      contaId={conta.id}
                      mes={mes}
                      pago={conta.pago}
                    />
                  </div>
                </div>

                {/* .text-right ganha flex-shrink:0 dentro de .flex-between —
                    sem isso, um nome de conta comprido espremia o valor
                    abaixo da própria largura mínima e ele saía cortado. */}
                <div className="text-right">
                  <strong className="valor-negativo">
                    {formatarMoeda(conta.valor)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
