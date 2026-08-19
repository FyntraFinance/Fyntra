"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { selecionarMes } from "@/actions/mes";
import { NOMES_MESES, adicionarMeses, obterMesAtual } from "@/lib/format";

/** Seta em traço, no lugar do caractere "←" que herdava a fonte do texto. */
function Seta({ para }: { para: "esquerda" | "direita" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={para === "esquerda" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export function SeletorMes({ mes }: { mes: string }) {
  const pathname = usePathname();
  const [pendente, iniciar] = useTransition();

  const [pickerAberto, setPickerAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(() => Number(mes.split("-")[0]));

  const referencia = useRef<HTMLDivElement>(null);

  const [anoAtual, mesAtual] = mes.split("-").map(Number);

  const mesCorrente = obterMesAtual();

  useEffect(() => {
    if (!pickerAberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (!referencia.current?.contains(evento.target as Node)) {
        setPickerAberto(false);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setPickerAberto(false);
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
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
        className="month-nav"
        title="Mês anterior"
        aria-label="Mês anterior"
        disabled={pendente}
        onClick={() => irPara(adicionarMeses(mes, -1))}
      >
        <Seta para="esquerda" />
      </button>

      <button
        type="button"
        className="month-label"
        title="Escolher mês"
        aria-expanded={pickerAberto}
        onClick={() => {
          setAnoVisivel(anoAtual);
          setPickerAberto((aberto) => !aberto);
        }}
      >
        <span className="month-nome">{NOMES_MESES[mesAtual - 1]}</span>
        <span className="month-ano">{anoAtual}</span>
      </button>

      <button
        type="button"
        className="month-nav"
        title="Próximo mês"
        aria-label="Próximo mês"
        disabled={pendente}
        onClick={() => irPara(adicionarMeses(mes, 1))}
      >
        <Seta para="direita" />
      </button>

      {pickerAberto ? (
        <div className="mes-picker">
          <div className="picker-header">
            <button
              type="button"
              className="picker-nav"
              aria-label="Ano anterior"
              onClick={() => setAnoVisivel((ano) => ano - 1)}
            >
              <Seta para="esquerda" />
            </button>

            <span className="picker-ano">{anoVisivel}</span>

            <button
              type="button"
              className="picker-nav"
              aria-label="Próximo ano"
              onClick={() => setAnoVisivel((ano) => ano + 1)}
            >
              <Seta para="direita" />
            </button>
          </div>

          <div className="picker-meses">
            {NOMES_MESES.map((nome, indice) => {
              const alvo = `${anoVisivel}-${String(indice + 1).padStart(2, "0")}`;
              const ativo = alvo === mes;
              const ehHoje = alvo === mesCorrente;

              return (
                <button
                  key={nome}
                  type="button"
                  title={`${nome} de ${anoVisivel}`}
                  className={`picker-mes-btn${ativo ? " ativo" : ""}${
                    ehHoje && !ativo ? " hoje" : ""
                  }`}
                  onClick={() => {
                    setPickerAberto(false);
                    irPara(alvo);
                  }}
                >
                  {nome.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {mes !== mesCorrente ? (
            <button
              type="button"
              className="picker-hoje"
              onClick={() => {
                setPickerAberto(false);
                irPara(mesCorrente);
              }}
            >
              Voltar para o mês atual
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
