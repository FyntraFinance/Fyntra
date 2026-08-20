"use client";

import { useEffect, useState } from "react";

type Tema = "automatico" | "claro" | "escuro";

const CHAVE = "fyntra_tema";

const OPCOES: { valor: Tema; rotulo: string; descricao: string }[] = [
  {
    valor: "automatico",
    rotulo: "🌗 Automático",
    descricao: "Acompanha o aparelho",
  },
  { valor: "claro", rotulo: "☀️ Claro", descricao: "Sempre claro" },
  { valor: "escuro", rotulo: "🌙 Escuro", descricao: "Sempre escuro" },
];

/**
 * Escolha do tema. Sem escolha, o atributo `data-tema` fica de fora e o CSS
 * cai na preferência do sistema — que é o comportamento automático.
 *
 * A escolha vale por aparelho, então mora no navegador e não no banco: o
 * mesmo login pode preferir escuro no celular e claro no computador.
 */
export function SeletorTema() {
  const [tema, setTema] = useState<Tema>("automatico");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);

    if (salvo === "claro" || salvo === "escuro") {
      setTema(salvo);
    }

    setMontado(true);
  }, []);

  function escolher(novo: Tema) {
    setTema(novo);

    if (novo === "automatico") {
      window.localStorage.removeItem(CHAVE);
      document.documentElement.removeAttribute("data-tema");
    } else {
      window.localStorage.setItem(CHAVE, novo);
      document.documentElement.setAttribute("data-tema", novo);
    }
  }

  return (
    <div className="card perfil-card">
      <div
        className="perfil-card-icon"
        style={{ background: "rgba(139,92,246,.15)", color: "var(--texto-roxo)" }}
      >
        🎨
      </div>

      <div className="perfil-card-body">
        <h3 className="perfil-card-title">Aparência</h3>

        <p className="text-muted perfil-card-desc">
          Escolha como o Fyntra aparece neste aparelho. No automático, ele
          segue o tema do seu celular ou computador.
        </p>

        <div className="tema-opcoes">
          {OPCOES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`tema-opcao${
                montado && tema === opcao.valor ? " selecionada" : ""
              }`}
              onClick={() => escolher(opcao.valor)}
              aria-pressed={montado && tema === opcao.valor}
            >
              <strong>{opcao.rotulo}</strong>
              <span className="text-muted">{opcao.descricao}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
