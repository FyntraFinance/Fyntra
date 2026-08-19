import {
  contasFixasDoMes,
  contasVariaveisDoMes,
  ganhosExtrasDoMes,
} from "@/lib/dados";
import { adicionarMeses } from "@/lib/format";
import type {
  AporteMetaDTO,
  ContaFixaDTO,
  ContaVariavelDTO,
  GanhoExtraDTO,
  MetaDTO,
  PessoaDTO,
} from "@/lib/tipos";

export function somarFixas(contas: ContaFixaDTO[]) {
  return contas.reduce((total, conta) => total + conta.valor, 0);
}

export function somarVariaveis(contas: ContaVariavelDTO[]) {
  return contas.reduce((total, conta) => total + conta.valorParcela, 0);
}

export function somarGanhos(ganhos: GanhoExtraDTO[]) {
  return ganhos.reduce((total, ganho) => total + ganho.valor, 0);
}

export function somarAportes(aportes: AporteMetaDTO[]) {
  return aportes.reduce((total, aporte) => total + aporte.valor, 0);
}

export type Totais = {
  totalSalarios: number;
  totalGanhosExtras: number;
  /** Salários + ganhos extras do mês. */
  totalReceitas: number;
  totalFixas: number;
  totalVariaveis: number;
  /** Dinheiro separado para as metas neste mês. */
  totalAportes: number;
  totalGastos: number;
  sobra: number;
};

/**
 * Guardar dinheiro para uma meta é uma saída como qualquer outra: entra em
 * `totalGastos` e some da sobra do mês, senão o valor apareceria como
 * disponível e guardado ao mesmo tempo.
 */
export function calcularTotais(
  pessoas: PessoaDTO[],
  fixasMes: ContaFixaDTO[],
  variaveisMes: ContaVariavelDTO[],
  ganhosMes: GanhoExtraDTO[] = [],
  aportesMes: AporteMetaDTO[] = [],
): Totais {
  const totalSalarios = pessoas.reduce(
    (total, pessoa) => total + pessoa.salario,
    0,
  );

  const totalGanhosExtras = somarGanhos(ganhosMes);
  const totalReceitas = totalSalarios + totalGanhosExtras;

  const totalFixas = somarFixas(fixasMes);
  const totalVariaveis = somarVariaveis(variaveisMes);
  const totalAportes = somarAportes(aportesMes);
  const totalGastos = totalFixas + totalVariaveis + totalAportes;

  return {
    totalSalarios,
    totalGanhosExtras,
    totalReceitas,
    totalFixas,
    totalVariaveis,
    totalAportes,
    totalGastos,
    sobra: totalReceitas - totalGastos,
  };
}

export type ResumoPessoa = {
  id: string;
  nome: string;
  salario: number;
  ganhosExtras: number;
  /** Salário + ganhos extras do mês. */
  renda: number;
  gastos: number;
  sobra: number;
  livrePorDia: number;
};

/**
 * Conta individual pesa só na pessoa dona; conta compartilhada é dividida
 * igualmente entre todas as pessoas cadastradas.
 */
export function calcularResumoPessoas(
  pessoas: PessoaDTO[],
  fixasMes: ContaFixaDTO[],
  variaveisMes: ContaVariavelDTO[],
  ganhosMes: GanhoExtraDTO[] = [],
  aportesMes: AporteMetaDTO[] = [],
): ResumoPessoa[] {
  // A meta é da família inteira, então o que foi guardado pesa em todos por
  // igual — como acontece com uma conta compartilhada.
  const aportePorPessoa =
    pessoas.length > 0 ? somarAportes(aportesMes) / pessoas.length : 0;

  return pessoas.map((pessoa) => {
    let gastos = aportePorPessoa;

    for (const conta of fixasMes) {
      if (conta.tipo === "INDIVIDUAL") {
        if (conta.pessoaId === pessoa.id) {
          gastos += conta.valor;
        }

        continue;
      }

      gastos += conta.valor / pessoas.length;
    }

    for (const conta of variaveisMes) {
      if (conta.pessoaId === pessoa.id) {
        gastos += conta.valorParcela;
      }
    }

    const ganhosExtras = somarGanhos(
      ganhosMes.filter((ganho) => ganho.pessoaId === pessoa.id),
    );

    const renda = pessoa.salario + ganhosExtras;
    const sobra = renda - gastos;

    return {
      id: pessoa.id,
      nome: pessoa.nome,
      salario: pessoa.salario,
      ganhosExtras,
      renda,
      gastos,
      sobra,
      livrePorDia: sobra / 30,
    };
  });
}

export type MetaCalculada = MetaDTO & {
  contribuicao: number;
  automatica: boolean;
  percentual: number;
  concluida: boolean;
  mesConclusao: string | null;
  /** Quanto já foi guardado nesta meta dentro do mês em foco. */
  aportadoNoMes: number;
};

/** Metas sem contribuição fixa dividem a sobra do mês entre si. */
export function calcularMetas(
  metas: MetaDTO[],
  sobra: number,
  mes: string,
  aportesMes: AporteMetaDTO[] = [],
): MetaCalculada[] {
  const sobraPositiva = Math.max(0, sobra);

  const automaticas = metas.filter((meta) => !meta.contribuicaoMensal);

  const contribuicaoAutomatica =
    automaticas.length > 0 ? sobraPositiva / automaticas.length : 0;

  return metas.map((meta) => {
    const automatica = !meta.contribuicaoMensal;

    const contribuicao = meta.contribuicaoMensal ?? contribuicaoAutomatica;

    const faltando = Math.max(0, meta.valorAlvo - meta.valorAtual);

    const percentual =
      meta.valorAlvo > 0
        ? Math.min(100, Math.round((meta.valorAtual / meta.valorAlvo) * 100))
        : 0;

    const mesesRestantes =
      contribuicao > 0 ? Math.ceil(faltando / contribuicao) : null;

    return {
      ...meta,
      contribuicao,
      automatica,
      percentual,
      concluida: meta.valorAtual >= meta.valorAlvo,
      mesConclusao:
        mesesRestantes === null ? null : adicionarMeses(mes, mesesRestantes),
      aportadoNoMes: somarAportes(
        aportesMes.filter((aporte) => aporte.metaId === meta.id),
      ),
    };
  });
}

export function calcularPorCategoria(
  fixasMes: ContaFixaDTO[],
  variaveisMes: ContaVariavelDTO[],
  aportesMes: AporteMetaDTO[] = [],
) {
  const acumulado = new Map<string, number>();

  const totalAportes = somarAportes(aportesMes);

  if (totalAportes > 0) {
    acumulado.set("Metas", totalAportes);
  }

  for (const conta of fixasMes) {
    const categoria = conta.categoria || "Outros";
    acumulado.set(categoria, (acumulado.get(categoria) ?? 0) + conta.valor);
  }

  for (const conta of variaveisMes) {
    const categoria = conta.categoria || "Outros";
    acumulado.set(
      categoria,
      (acumulado.get(categoria) ?? 0) + conta.valorParcela,
    );
  }

  return [...acumulado.entries()].map(([nome, valor]) => ({ nome, valor }));
}

/** Doze meses do ano corrente, com gastos reais e sobra projetada. */
export function calcularEvolucaoAnual(
  ano: string,
  totalSalarios: number,
  todasFixas: ContaFixaDTO[],
  todasVariaveis: ContaVariavelDTO[],
  todosGanhos: GanhoExtraDTO[] = [],
) {
  const rotulos = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return rotulos.map((rotulo, indice) => {
    const mes = `${ano}-${String(indice + 1).padStart(2, "0")}`;

    const gastos =
      somarFixas(contasFixasDoMes(todasFixas, mes)) +
      somarVariaveis(contasVariaveisDoMes(todasVariaveis, mes));

    const receitas =
      totalSalarios + somarGanhos(ganhosExtrasDoMes(todosGanhos, mes));

    return {
      mes: rotulo,
      salarios: receitas,
      gastos,
      sobra: Math.max(0, receitas - gastos),
    };
  });
}
