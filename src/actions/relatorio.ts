"use server";

import {
  calcularPorCategoria,
  calcularResumoPessoas,
  calcularTotais,
} from "@/lib/calculos";
import {
  aportesDoMes,
  contasFixasDoMes,
  contasVariaveisDoMes,
  ganhosExtrasDoMes,
  listarAportes,
  listarContasFixas,
  listarContasVariaveis,
  listarGanhosExtras,
  listarPessoas,
  listarStatusGastos,
} from "@/lib/dados";
import { formatarData, formatarMesAno, normalizarMes } from "@/lib/format";
import type { Aba, Celula } from "@/lib/xlsx";
import { gerarXlsx } from "@/lib/xlsx";
import { obterContexto } from "@/lib/workspace";

const ROTULO_FORMA: Record<string, string> = {
  CARTAO: "Cartão",
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  BOLETO: "Boleto",
};

export type RelatorioGerado = {
  ok: boolean;
  mensagem: string;
  /** Conteúdo do .xlsx em base64, para o navegador salvar. */
  arquivo?: string;
  nomeArquivo?: string;
};

/**
 * Monta o relatório do mês em uma planilha: resumo com gráfico, uma aba por
 * tipo de gasto, os ganhos e o que foi guardado em metas.
 *
 * O arquivo volta em base64 porque uma Server Action não devolve binário
 * direto — o cliente remonta e salva.
 */
export async function gerarRelatorioMensal(
  mesInformado: string,
): Promise<RelatorioGerado> {
  const { workspaceId, workspaceNome } = await obterContexto();

  const mes = normalizarMes(mesInformado);

  const [
    pessoas,
    todasFixas,
    todasVariaveis,
    todosGanhos,
    todosAportes,
    status,
  ] = await Promise.all([
    listarPessoas(workspaceId),
    listarContasFixas(workspaceId),
    listarContasVariaveis(workspaceId),
    listarGanhosExtras(workspaceId),
    listarAportes(workspaceId),
    listarStatusGastos(workspaceId, mes),
  ]);

  const fixasMes = contasFixasDoMes(todasFixas, mes);
  const variaveisMes = contasVariaveisDoMes(todasVariaveis, mes);
  const ganhosMes = ganhosExtrasDoMes(todosGanhos, mes);
  const aportesMes = aportesDoMes(todosAportes, mes);

  const totais = calcularTotais(
    pessoas,
    fixasMes,
    variaveisMes,
    ganhosMes,
    aportesMes,
  );

  const resumoPessoas = calcularResumoPessoas(
    pessoas,
    fixasMes,
    variaveisMes,
    ganhosMes,
    aportesMes,
  );

  const porCategoria = calcularPorCategoria(
    fixasMes,
    variaveisMes,
    aportesMes,
  ).sort((a, b) => b.valor - a.valor);

  const nomePorPessoa = new Map(pessoas.map((p) => [p.id, p.nome]));

  // ------------------------------------------------------------------ Resumo

  const linhasResumo: Celula[][] = [
    ["Resumo do mês", ""],
    ["Família", workspaceNome],
    ["Mês", formatarMesAno(mes)],
    ["", ""],
    ["Entradas", ""],
    ["Salários", totais.totalSalarios],
    ["Ganhos extras", totais.totalGanhosExtras],
    ["Total de entradas", totais.totalReceitas],
    ["", ""],
    ["Saídas", ""],
    ["Contas fixas", totais.totalFixas],
    ["Contas variáveis", totais.totalVariaveis],
    ["Guardado em metas", totais.totalAportes],
    ["Total de saídas", totais.totalGastos],
    ["", ""],
    ["Sobra do mês", totais.sobra],
    ["", ""],
    ["Gastos por categoria", "Valor"],
  ];

  // O gráfico aponta para estas linhas de categoria.
  const primeiraCategoria = linhasResumo.length + 1;

  for (const categoria of porCategoria) {
    linhasResumo.push([categoria.nome, categoria.valor]);
  }

  const ultimaCategoria = linhasResumo.length;

  linhasResumo.push(["", ""], ["Resumo por pessoa", ""]);
  linhasResumo.push(["Pessoa", "Salário", "Ganhos extras", "Gastos", "Sobra"]);

  for (const pessoa of resumoPessoas) {
    linhasResumo.push([
      pessoa.nome,
      pessoa.salario,
      pessoa.ganhosExtras,
      pessoa.gastos,
      pessoa.sobra,
    ]);
  }

  const abaResumo: Aba = {
    nome: "Resumo",
    larguras: [28, 16, 16, 16, 16],
    linhas: linhasResumo,
    colunasMoeda: [1, 2, 3, 4],
    // Sem categoria não há o que desenhar.
    grafico:
      porCategoria.length > 0
        ? {
            titulo: `Gastos por categoria — ${formatarMesAno(mes)}`,
            linhaInicial: primeiraCategoria,
            linhaFinal: ultimaCategoria,
            colunaRotulos: 1,
            colunaValores: 2,
          }
        : undefined,
  };

  // -------------------------------------------------------------- Contas fixas

  const abaFixas: Aba = {
    nome: "Contas Fixas",
    larguras: [30, 16, 16, 18, 22, 14],
    colunasMoeda: [1],
    linhas: [
      ["Conta", "Valor", "Categoria", "Tipo", "Pessoa", "Situação"],
      ...fixasMes.map((conta): Celula[] => [
        conta.nome,
        conta.valor,
        conta.categoria,
        conta.tipo === "INDIVIDUAL" ? "Individual" : "Compartilhada",
        conta.pessoaId ? (nomePorPessoa.get(conta.pessoaId) ?? "—") : "Todos",
        status.fixasPagas.includes(conta.id) ? "Pago" : "Em andamento",
      ]),
    ],
  };

  // ----------------------------------------------------------- Contas variáveis

  const abaVariaveis: Aba = {
    nome: "Contas Variáveis",
    larguras: [30, 16, 16, 16, 22, 16, 12, 14],
    colunasMoeda: [1, 2],
    linhas: [
      [
        "Conta",
        "Parcela do mês",
        "Valor total",
        "Categoria",
        "Pessoa",
        "Forma de pagamento",
        "Parcelas",
        "Situação",
      ],
      ...variaveisMes.map((conta): Celula[] => [
        conta.nome,
        conta.valorParcela,
        conta.valorTotal,
        conta.categoria,
        nomePorPessoa.get(conta.pessoaId) ?? "—",
        ROTULO_FORMA[conta.formaPagamento] ?? conta.formaPagamento,
        conta.parcelas > 1 ? `${conta.parcelas}x` : "à vista",
        status.variaveisPagas.includes(conta.id) ? "Pago" : "Em andamento",
      ]),
    ],
  };

  // ----------------------------------------------------------------- Ganhos

  const abaGanhos: Aba = {
    nome: "Ganhos Extras",
    larguras: [30, 16, 18, 22, 14, 14],
    colunasMoeda: [1],
    linhas: [
      ["Ganho", "Valor", "Categoria", "Pessoa", "Data", "Repete"],
      ...ganhosMes.map((ganho): Celula[] => [
        ganho.nome,
        ganho.valor,
        ganho.categoria,
        nomePorPessoa.get(ganho.pessoaId) ?? "—",
        formatarData(ganho.data),
        ganho.recorrente ? "Todo mês" : "Não",
      ]),
    ],
  };

  // ------------------------------------------------------------------ Metas

  const abaMetas: Aba = {
    nome: "Guardado em Metas",
    larguras: [30, 16, 14],
    colunasMoeda: [1],
    linhas: [
      ["Meta", "Valor guardado", "Data"],
      ...aportesMes.map((aporte): Celula[] => [
        `${aporte.emojiMeta} ${aporte.nomeMeta}`,
        aporte.valor,
        formatarData(aporte.data),
      ]),
    ],
  };

  const arquivo = gerarXlsx([
    abaResumo,
    abaFixas,
    abaVariaveis,
    abaGanhos,
    abaMetas,
  ]);

  return {
    ok: true,
    mensagem: `Relatório de ${formatarMesAno(mes)} pronto.`,
    arquivo: arquivo.toString("base64"),
    nomeArquivo: `fyntra-${mes}.xlsx`,
  };
}
