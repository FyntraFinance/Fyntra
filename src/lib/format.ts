export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const CORES_AVATAR = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#eab308",
];

export const CORES_META = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#f97316",
];

export function formatarMoeda(valor: number | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "-";

  const partes = data.split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarMesAno(mesAno: string | null | undefined) {
  if (!mesAno) return "-";

  const [ano, mes] = mesAno.split("-");

  return `${NOMES_MESES[Number(mes) - 1]} ${ano}`;
}

export function inicialNome(nome: string | null | undefined) {
  if (!nome) return "?";

  return nome.charAt(0).toUpperCase();
}

export function corAvatar(index: number) {
  return CORES_AVATAR[index % CORES_AVATAR.length];
}

export function obterMesAtual() {
  const hoje = new Date();

  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function adicionarMeses(mesAno: string, n: number) {
  const [ano, mes] = mesAno.split("-").map(Number);

  const data = new Date(ano, mes - 1);

  data.setMonth(data.getMonth() + n);

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Data de vencimento de uma conta dentro de um mês. Um dia 31 em fevereiro
 * cai no último dia do mês, que é como as cobranças costumam funcionar.
 */
export function vencimentoNoMes(mes: string, dia: number) {
  const [ano, numeroMes] = mes.split("-").map(Number);

  const ultimoDia = new Date(ano, numeroMes, 0).getDate();

  const diaFinal = Math.min(Math.max(1, dia), ultimoDia);

  return `${mes}-${String(diaFinal).padStart(2, "0")}`;
}

/** Dias entre hoje e a data informada; negativo quando já passou. */
export function diasAte(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);

  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);

  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

/** Valida `YYYY-MM`, caindo para o mês corrente quando o valor é inválido. */
export function normalizarMes(mes: string | null | undefined) {
  if (!mes || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return obterMesAtual();
  }

  return mes;
}
