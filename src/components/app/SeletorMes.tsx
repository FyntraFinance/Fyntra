"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { selecionarMes } from "@/actions/mes";
import { NOMES_MESES, adicionarMeses } from "@/lib/format";

export function SeletorMes({ mes }: { mes: string }) {
  const pathname = usePathname();
  const [pendente, iniciar] = useTransition();

  const [pickerAberto, setPickerAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(() => Number(mes.split("-")[0]));

  const referencia = useRef<HTMLDivElement>(null);

  const [anoAtual, mesAtual] = mes.split("-").map(Number);

  useEffect(() => {
    if (!pickerAberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (!referencia.current?.contains(evento.target as Node)) {
        setPickerAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);

    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [pickerAberto]);

  function irPara(novoMes: string) {
    iniciar(async () => {
      await selecionarMes(novoMes, pathname ?? "/dashboard");
    });
  }

  return (
    <div className="month-selector" ref={referencia}>
      <button
        type="button"
        disabled={pendente}
        onClick={() => irPara(adicionarMeses(mes, -1))}
      >
        ←
      </button>

      <button
        type="button"
        className="month-label"
        title="Selecionar mês"
        onClick={() => {
          setAnoVisivel(anoAtual);
          setPickerAberto((aberto) => !aberto);
        }}
      >
        {`${NOMES_MESES[mesAtual - 1]} ${anoAtual}`}
      </button>

      <button
        type="button"
        disabled={pendente}
        onClick={() => irPara(adicionarMeses(mes, 1))}
      >
        →
      </button>

      {pickerAberto ? (
        <div className="mes-picker">
          <div className="picker-header">
            <button
              type="button"
              className="picker-nav"
              onClick={() => setAnoVisivel((ano) => ano - 1)}
            >
              ‹
            </button>

            <span className="picker-ano">{anoVisivel}</span>

            <button
              type="button"
              className="picker-nav"
              onClick={() => setAnoVisivel((ano) => ano + 1)}
            >
              ›
            </button>
          </div>

          <div className="picker-meses">
            {NOMES_MESES.map((nome, indice) => {
              const ativo = anoVisivel === anoAtual && indice + 1 === mesAtual;

              return (
                <button
                  key={nome}
                  type="button"
                  className={`picker-mes-btn${ativo ? " ativo" : ""}`}
                  onClick={() => {
                    setPickerAberto(false);
                    irPara(
                      `${anoVisivel}-${String(indice + 1).padStart(2, "0")}`,
                    );
                  }}
                >
                  {nome.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
