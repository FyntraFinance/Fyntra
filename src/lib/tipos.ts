import type { Role, StatusConvite, TipoContaFixa } from "@prisma/client";

export type { Role, StatusConvite, TipoContaFixa };

/**
 * DTOs serializáveis: o Prisma devolve `Decimal` nos campos monetários, que não
 * atravessa a fronteira server → client component. Tudo é convertido em `number`
 * na camada de leitura (`src/lib/dados.ts`).
 */

export type PessoaDTO = {
  id: string;
  nome: string;
  email: string | null;
  salario: number;
  userId: string | null;
  convite: {
    id: string;
    status: StatusConvite;
    expiraEm: string;
  } | null;
};

export type ContaFixaDTO = {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  tipo: TipoContaFixa;
  pessoaId: string | null;
  dataInicio: string;
  dataFim: string | null;
  observacao: string | null;
};

export type ContaVariavelDTO = {
  id: string;
  nome: string;
  valorTotal: number;
  valorParcela: number;
  categoria: string;
  pessoaId: string;
  data: string;
  mesInicio: string;
  mesFim: string;
  parcelas: number;
  observacao: string | null;
};

export type MetaDTO = {
  id: string;
  nome: string;
  emoji: string;
  valorAlvo: number;
  valorAtual: number;
  contribuicaoMensal: number | null;
  cor: string;
};

export type MembroDTO = {
  id: string;
  nome: string | null;
  email: string;
  role: Role;
  ehVoce: boolean;
};

export type ResultadoAcao = {
  ok: boolean;
  mensagem: string;
  /** Link do convite, devolvido para copiar caso o envio por e-mail falhe. */
  link?: string;
};

export const CATEGORIAS_FIXAS = [
  "Moradia",
  "Internet",
  "Energia",
  "Água",
  "Streaming",
  "Saúde",
  "Outros",
];

export const CATEGORIAS_VARIAVEIS = [
  "Alimentação",
  "Transporte",
  "Mercado",
  "Lazer",
  "Cartão",
  "Saúde",
  "Outros",
];
