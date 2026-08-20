import { diasAte } from "@/lib/format";

/**
 * Aviso de vencimento da conta no mês em foco. Conta já paga não cobra nada:
 * mostra só o dia, sem alarme.
 */
export function SeloVencimento({
  dias,
  dia,
  pago,
}: {
  /** Dias até o vencimento; negativo quando já passou. */
  dias: number;
  dia: number;
  pago: boolean;
}) {
  if (pago) {
    return <span className="venc-selo neutro">🗓️ vence dia {dia}</span>;
  }

  if (dias < 0) {
    const atraso = Math.abs(dias);

    return (
      <span className="venc-selo atrasado">
        ⚠️ venceu há {atraso} {atraso === 1 ? "dia" : "dias"}
      </span>
    );
  }

  if (dias === 0) {
    return <span className="venc-selo hoje">🔔 vence hoje</span>;
  }

  if (dias <= 5) {
    return (
      <span className="venc-selo perto">
        ⏰ vence em {dias} {dias === 1 ? "dia" : "dias"}
      </span>
    );
  }

  return <span className="venc-selo neutro">🗓️ vence dia {dia}</span>;
}

/** Mesma leitura, a partir da data completa do vencimento. */
export function SeloVencimentoData({
  data,
  pago,
}: {
  data: string;
  pago: boolean;
}) {
  return (
    <SeloVencimento
      dias={diasAte(data)}
      dia={Number(data.slice(8, 10))}
      pago={pago}
    />
  );
}
