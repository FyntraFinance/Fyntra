import { formatarMoeda } from "@/lib/format";

/**
 * Recados do dia. O tom muda com a situação do mês: no vermelho o app segura
 * a mão de quem lê; no azul, sugere um gasto do tamanho do que sobra por dia.
 */

export type SituacaoDoDia = {
  sobra: number;
  /** Quanto ainda dá para gastar por dia até o fim do mês. */
  livrePorDia: number;
  /** Contas que vencem hoje ou nos próximos dias. */
  vencendo: { nome: string; valor: number; dias: number }[];
};

export type Recado = { titulo: string; corpo: string };

function sortear(opcoes: string[]) {
  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

/** Sugestão de gasto proporcional ao que sobra por dia. */
function sugestao(livrePorDia: number) {
  if (livrePorDia >= 120) {
    return sortear([
      "dá até para um jantar fora hoje 🍽️",
      "um rodízio bem que cabe 🍣",
      "aquele programa que você adiou cabe no orçamento 🎟️",
    ]);
  }

  if (livrePorDia >= 60) {
    return sortear([
      "que tal uma pizza hoje? 🍕",
      "um hambúrguer entra fácil 🍔",
      "dá para pedir aquele delivery 🥡",
    ]);
  }

  if (livrePorDia >= 25) {
    return sortear([
      "um lanche da tarde tá liberado 🥪",
      "cabe um cinema no meio da semana 🎬",
      "que tal um açaí? 🍧",
    ]);
  }

  return sortear([
    "um docinho cabe no orçamento 🍬",
    "dá para o cafezinho de sempre ☕",
    "um sorvete de casquinha e tá ótimo 🍦",
  ]);
}

/**
 * Monta o recado do dia. A ordem importa: conta vencendo é urgente e vem
 * antes de qualquer conselho sobre gastar.
 */
export function montarRecado(situacao: SituacaoDoDia): Recado | null {
  const { sobra, livrePorDia, vencendo } = situacao;

  const hoje = vencendo.filter((conta) => conta.dias === 0);
  const atrasadas = vencendo.filter((conta) => conta.dias < 0);
  const proximas = vencendo.filter((conta) => conta.dias > 0);

  if (atrasadas.length > 0) {
    const conta = atrasadas[0];
    const resto = atrasadas.length - 1;

    return {
      titulo: "⚠️ Conta atrasada",
      corpo: `${conta.nome} (${formatarMoeda(conta.valor)}) venceu há ${Math.abs(
        conta.dias,
      )} dia(s)${resto > 0 ? ` e mais ${resto} conta(s) atrasada(s)` : ""}.`,
    };
  }

  if (hoje.length > 0) {
    const conta = hoje[0];
    const resto = hoje.length - 1;

    return {
      titulo: "🔔 Vence hoje",
      corpo: `${conta.nome} — ${formatarMoeda(conta.valor)}${
        resto > 0 ? `, e mais ${resto} conta(s) vencem hoje` : ""
      }.`,
    };
  }

  if (proximas.length > 0) {
    const conta = proximas[0];

    return {
      titulo: "⏰ Conta chegando",
      corpo: `${conta.nome} (${formatarMoeda(conta.valor)}) vence em ${
        conta.dias
      } dia(s). Dá tempo de se organizar.`,
    };
  }

  // Sem conta batendo à porta, o recado é sobre o fôlego do mês.
  if (sobra < 0) {
    return {
      titulo: "🚨 Mês no vermelho",
      corpo: sortear([
        `O mês está ${formatarMoeda(Math.abs(sobra))} negativo. Hoje é dia de segurar as pontas — nada de gasto novo.`,
        `Faltam ${formatarMoeda(Math.abs(sobra))} para fechar o mês. Melhor deixar as compras para depois.`,
        `As contas passaram o que entrou em ${formatarMoeda(Math.abs(sobra))}. Hoje o combinado é não gastar.`,
      ]),
    };
  }

  if (livrePorDia <= 0) {
    return {
      titulo: "😬 Orçamento no limite",
      corpo: "O que sobrou já está todo comprometido. Hoje é dia de segurar.",
    };
  }

  return {
    titulo: "🐷 Você está indo bem",
    corpo: `Sobra ${formatarMoeda(livrePorDia)} para hoje — ${sugestao(
      livrePorDia,
    )}`,
  };
}
