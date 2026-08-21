/**
 * Ícone e cor por categoria, usados no quadrado colorido que identifica cada
 * conta de relance na tabela. Cores emprestadas da paleta de marca (dourado
 * fica reservado ao símbolo do Fyntra, por isso não aparece aqui).
 */

export type EstiloCategoria = { icone: string; cor: string };

const PADRAO: EstiloCategoria = { icone: "📦", cor: "#64748b" };

export const CATEGORIA_FIXA_ESTILO: Record<string, EstiloCategoria> = {
  Moradia: { icone: "🏠", cor: "#f97316" },
  Internet: { icone: "📶", cor: "#3b82f6" },
  Energia: { icone: "⚡", cor: "#eab308" },
  Água: { icone: "💧", cor: "#06b6d4" },
  Streaming: { icone: "📺", cor: "#8b5cf6" },
  Saúde: { icone: "🩺", cor: "#ec4899" },
  Outros: PADRAO,
};

export const CATEGORIA_VARIAVEL_ESTILO: Record<string, EstiloCategoria> = {
  Alimentação: { icone: "🍔", cor: "#f97316" },
  Transporte: { icone: "🚗", cor: "#3b82f6" },
  Mercado: { icone: "🛒", cor: "#10b981" },
  Lazer: { icone: "🎉", cor: "#ec4899" },
  Cartão: { icone: "💳", cor: "#8b5cf6" },
  Saúde: { icone: "🩺", cor: "#ec4899" },
  Outros: PADRAO,
};

export function estiloCategoriaFixa(categoria: string): EstiloCategoria {
  return CATEGORIA_FIXA_ESTILO[categoria] ?? PADRAO;
}

export function estiloCategoriaVariavel(categoria: string): EstiloCategoria {
  return CATEGORIA_VARIAVEL_ESTILO[categoria] ?? PADRAO;
}
