import { z } from "zod";

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const emailOpcional = z
  .string()
  .trim()
  .email("E-mail inválido")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const registroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const aceitarConviteSchema = z.object({
  token: z.string().min(10, "Convite inválido"),
  nome: z.string().trim().min(2, "Informe seu nome"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
});

export const redefinirSenhaSchema = z.object({
  token: z.string().min(10, "Link inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual"),
  novaSenha: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
});

export const pessoaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome"),
  email: emailOpcional,
  salario: z.coerce.number().min(0, "Salário inválido").default(0),
});

export const contaFixaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome"),
  valor: z.coerce.number().min(0, "Valor inválido"),
  categoria: z.string().trim().min(1).default("Outros"),
  tipo: z.enum(["COMPARTILHADA", "INDIVIDUAL"]),
  pessoaId: z.string().optional().nullable(),
  dataInicio: z.string().regex(MES, "Mês inicial inválido"),
  observacao: z.string().trim().max(500).optional(),
});

export const contaVariavelSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome"),
  valorTotal: z.coerce.number().min(0, "Valor inválido"),
  categoria: z.string().trim().min(1).default("Outros"),
  pessoaId: z.string().min(1, "Selecione uma pessoa"),
  data: z.string().regex(DATA, "Data inválida"),
  parcelas: z.coerce.number().int().min(1, "Mínimo 1 parcela").max(360),
  observacao: z.string().trim().max(500).optional(),
});

export const metaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome da meta"),
  emoji: z.string().trim().max(4).default("🎯"),
  valorAlvo: z.coerce.number().positive("Informe um valor alvo válido"),
  valorAtual: z.coerce.number().min(0).default(0),
  contribuicaoMensal: z.coerce
    .number()
    .min(0)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  cor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#10b981"),
});

export const eventoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome do evento"),
  emoji: z.string().trim().max(4).default("🧳"),
  descricao: z.string().trim().max(500).optional(),
  dataInicio: z.string().regex(DATA, "Data inicial inválida"),
  dataFim: z
    .string()
    .regex(DATA, "Data final inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const participanteEventoSchema = z.object({
  eventoId: z.string().min(1, "Evento inválido"),
  nome: z.string().trim().min(1, "Informe o nome do participante"),
  /** Vazio = convidado de fora, que só divide a conta. */
  pessoaId: z
    .string()
    .optional()
    .nullable()
    .transform((valor) => valor || null),
});

export const gastoEventoSchema = z.object({
  id: z.string().optional(),
  eventoId: z.string().min(1, "Evento inválido"),
  nome: z.string().trim().min(1, "Informe o nome do gasto"),
  valor: z.coerce.number().min(0, "Valor inválido"),
  categoria: z.string().trim().min(1).default("Outros"),
  data: z.string().regex(DATA, "Data inválida"),
  observacao: z.string().trim().max(500).optional(),
});

export const ganhoExtraSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe a descrição do ganho"),
  valor: z.coerce.number().min(0, "Valor inválido"),
  categoria: z.string().trim().min(1).default("Outros"),
  pessoaId: z.string().min(1, "Selecione a pessoa que recebeu"),
  data: z.string().regex(DATA, "Data inválida"),
  recorrente: z.coerce.boolean().default(false),
  observacao: z.string().trim().max(500).optional(),
});

export const statusContaSchema = z.object({
  tipo: z.enum(["FIXA", "VARIAVEL"]),
  contaId: z.string().min(1, "Conta inválida"),
  mes: z.string().regex(MES, "Mês inválido"),
  pago: z.boolean(),
});

export const conviteSchema = z.object({
  pessoaId: z.string().min(1, "Pessoa inválida"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const tokenIaSchema = z.object({
  token: z.string().trim().min(8, "Token inválido"),
});

export function primeiroErro(erro: z.ZodError) {
  return erro.issues[0]?.message ?? "Dados inválidos";
}
