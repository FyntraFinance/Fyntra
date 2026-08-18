"use client";

import { useTransition } from "react";

import { alternarStatusConta } from "@/actions/contas";
import { useToast } from "@/components/ui/Toast";

/**
 * Selo de pagamento do mês em foco. Clicar alterna entre pago e em andamento —
 * o estado real vive no servidor, então o botão só dispara a action e deixa o
 * revalidate trazer o valor novo.
 */
export function BotaoStatus({
  tipo,
  contaId,
  mes,
  pago,
}: {
  tipo: "FIXA" | "VARIAVEL";
  contaId: string;
  mes: string;
  pago: boolean;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  function alternar() {
    iniciar(async () => {
      const resultado = await alternarStatusConta({
        tipo,
        contaId,
        mes,
        pago: !pago,
      });

      if (!resultado.ok) {
        mostrarToast(resultado.mensagem, "error");
      }
    });
  }

  return (
    <button
      type="button"
      className={`status-badge${pago ? " pago" : " andamento"}`}
      onClick={alternar}
      disabled={pendente}
      title={
        pago
          ? "Pago neste mês — clique para voltar a em andamento"
          : "Em andamento — clique para marcar como pago"
      }
    >
      {pendente ? "…" : pago ? "✓ Pago" : "⏳ Em andamento"}
    </button>
  );
}
