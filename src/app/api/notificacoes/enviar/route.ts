import { NextResponse } from "next/server";

import { calcularResumoPessoas, calcularTotais } from "@/lib/calculos";
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
import { diasAte, obterMesAtual, vencimentoNoMes } from "@/lib/format";
import { montarRecado } from "@/lib/mensagens";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

/**
 * Rota do agendador diário: monta o recado de cada família e dispara os
 * avisos. Chamada pelo cron da Vercel, que envia o CRON_SECRET no cabeçalho.
 */
export async function GET(requisicao: Request) {
  const segredo = process.env.CRON_SECRET;

  if (segredo) {
    const autorizacao = requisicao.headers.get("authorization");

    if (autorizacao !== `Bearer ${segredo}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  }

  const inscricoes = await prisma.inscricaoPush.findMany();

  if (inscricoes.length === 0) {
    return NextResponse.json({ familias: 0, avisos: 0 });
  }

  const mes = obterMesAtual();

  // Um cálculo por família, reaproveitado por todos os aparelhos dela.
  const porWorkspace = new Map<string, typeof inscricoes>();

  for (const inscricao of inscricoes) {
    const lista = porWorkspace.get(inscricao.workspaceId) ?? [];
    lista.push(inscricao);
    porWorkspace.set(inscricao.workspaceId, lista);
  }

  let avisos = 0;

  for (const [workspaceId, doWorkspace] of porWorkspace) {
    const [pessoas, fixas, variaveis, ganhos, aportes, status] =
      await Promise.all([
        listarPessoas(workspaceId),
        listarContasFixas(workspaceId),
        listarContasVariaveis(workspaceId),
        listarGanhosExtras(workspaceId),
        listarAportes(workspaceId),
        listarStatusGastos(workspaceId, mes),
      ]);

    const fixasMes = contasFixasDoMes(fixas, mes);
    const variaveisMes = contasVariaveisDoMes(variaveis, mes);
    const ganhosMes = ganhosExtrasDoMes(ganhos, mes);
    const aportesMes = aportesDoMes(aportes, mes);

    const totais = calcularTotais(
      pessoas,
      fixasMes,
      variaveisMes,
      ganhosMes,
      aportesMes,
    );

    const resumo = calcularResumoPessoas(
      pessoas,
      fixasMes,
      variaveisMes,
      ganhosMes,
      aportesMes,
    );

    const livrePorDia = resumo.reduce(
      (soma, pessoa) => soma + Math.max(0, pessoa.livrePorDia),
      0,
    );

    for (const inscricao of doWorkspace) {
      // Contas em aberto que vencem dentro da janela escolhida.
      const vencendo = [
        ...fixasMes
          .filter(
            (conta) =>
              conta.diaVencimento && !status.fixasPagas.includes(conta.id),
          )
          .map((conta) => ({
            nome: conta.nome,
            valor: conta.valor,
            dias: diasAte(vencimentoNoMes(mes, conta.diaVencimento!)),
          })),
        ...variaveisMes
          .filter(
            (conta) =>
              conta.diaVencimento && !status.variaveisPagas.includes(conta.id),
          )
          .map((conta) => ({
            nome: conta.nome,
            valor: conta.valorParcela,
            dias: diasAte(vencimentoNoMes(mes, conta.diaVencimento!)),
          })),
      ]
        .filter((conta) => conta.dias <= inscricao.diasAntes)
        .sort((a, b) => a.dias - b.dias);

      // Sem conta batendo e sem recado do dia ligado, não incomoda ninguém.
      if (vencendo.length === 0 && !inscricao.resumoDiario) continue;

      const recado = montarRecado({
        sobra: totais.sobra,
        livrePorDia,
        vencendo,
      });

      if (!recado) continue;

      const enviados = await enviarPush([inscricao], {
        titulo: recado.titulo,
        corpo: recado.corpo,
        tag: "resumo-diario",
      });

      avisos += enviados;

      if (enviados > 0) {
        await prisma.inscricaoPush.update({
          where: { id: inscricao.id },
          data: { ultimoEnvio: new Date() },
        });
      }
    }
  }

  return NextResponse.json({ familias: porWorkspace.size, avisos });
}

/** Evita que o total de contas do mês vire cache entre execuções. */
export const dynamic = "force-dynamic";
