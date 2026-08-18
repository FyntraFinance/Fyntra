"use client";

import { useEffect, useState } from "react";

import { DUVIDAS, GUIA, type TopicoAjuda } from "@/lib/ajuda";
import { CHANGELOG, ULTIMA_ATUALIZACAO } from "@/lib/changelog";
import { formatarData } from "@/lib/format";

type Aba = "novidades" | "guia" | "duvidas";

const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: "novidades", rotulo: "🆕 Novidades" },
  { chave: "guia", rotulo: "📘 Como usar" },
  { chave: "duvidas", rotulo: "❓ Dúvidas" },
];

/** Guarda a data da atualização mais recente que o usuário já leu. */
const CHAVE_LIDO = "fyntra_changelog_lido";

/** Bloco que abre e fecha ao clicar no título. */
function ItemExpansivel({
  titulo,
  subtitulo,
  aberto,
  onAlternar,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  aberto: boolean;
  onAlternar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`ajuda-item${aberto ? " aberto" : ""}`}>
      <button className="ajuda-item-topo" type="button" onClick={onAlternar}>
        <span className="ajuda-item-texto">
          {subtitulo ? (
            <span className="ajuda-item-data">{subtitulo}</span>
          ) : null}

          <span className="ajuda-item-titulo">{titulo}</span>
        </span>

        <span className="ajuda-item-seta" aria-hidden="true">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto ? <div className="ajuda-item-corpo">{children}</div> : null}
    </div>
  );
}

function ListaTopicos({ topicos }: { topicos: TopicoAjuda[] }) {
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <div className="ajuda-lista">
      {topicos.map((topico) => (
        <ItemExpansivel
          key={topico.titulo}
          titulo={topico.titulo}
          aberto={aberto === topico.titulo}
          onAlternar={() =>
            setAberto((atual) =>
              atual === topico.titulo ? null : topico.titulo,
            )
          }
        >
          {topico.paragrafos.map((paragrafo, indice) => (
            <p key={indice}>{paragrafo}</p>
          ))}
        </ItemExpansivel>
      ))}
    </div>
  );
}

/**
 * Central de Ajuda: botão fixo no canto inferior direito que abre um painel
 * com as novidades do app, o guia de uso e as dúvidas frequentes.
 */
export function CentralAjuda() {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<Aba>("novidades");
  const [temNovidade, setTemNovidade] = useState(false);
  const [entradaAberta, setEntradaAberta] = useState<string | null>(
    CHANGELOG[0] ? `${CHANGELOG[0].data}-${CHANGELOG[0].titulo}` : null,
  );

  // O aviso só nasce no cliente: o servidor não sabe o que este usuário leu.
  useEffect(() => {
    const lido = window.localStorage.getItem(CHAVE_LIDO);

    setTemNovidade(lido !== ULTIMA_ATUALIZACAO);
  }, []);

  useEffect(() => {
    if (!aberto || aba !== "novidades") return;

    window.localStorage.setItem(CHAVE_LIDO, ULTIMA_ATUALIZACAO);
    setTemNovidade(false);
  }, [aberto, aba]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("keydown", aoTeclar);

    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <>
      {aberto ? (
        <div className="ajuda-overlay" onClick={() => setAberto(false)} />
      ) : null}

      <button
        className="ajuda-botao"
        type="button"
        title="Central de ajuda"
        aria-label="Central de ajuda"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        {aberto ? "✕" : "?"}

        {!aberto && temNovidade ? (
          <span className="ajuda-ponto" aria-hidden="true" />
        ) : null}
      </button>

      {aberto ? (
        <section className="ajuda-painel" aria-label="Central de ajuda">
          <header className="ajuda-cabecalho">
            <div>
              <h2 className="ajuda-titulo">Central de Ajuda</h2>

              <p className="ajuda-subtitulo">
                Novidades, guia rápido e dúvidas do Fyntra
              </p>
            </div>

            <button
              className="ajuda-fechar"
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
            >
              ✕
            </button>
          </header>

          <nav className="ajuda-abas">
            {ABAS.map((item) => (
              <button
                key={item.chave}
                type="button"
                className={`ajuda-aba${aba === item.chave ? " ativa" : ""}`}
                onClick={() => setAba(item.chave)}
              >
                {item.rotulo}

                {item.chave === "novidades" && temNovidade ? (
                  <span className="ajuda-ponto-aba" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </nav>

          <div className="ajuda-conteudo">
            {aba === "novidades" ? (
              <div className="ajuda-lista">
                {CHANGELOG.map((entrada) => {
                  const chave = `${entrada.data}-${entrada.titulo}`;

                  return (
                    <ItemExpansivel
                      key={chave}
                      titulo={entrada.titulo}
                      subtitulo={formatarData(entrada.data)}
                      aberto={entradaAberta === chave}
                      onAlternar={() =>
                        setEntradaAberta((atual) =>
                          atual === chave ? null : chave,
                        )
                      }
                    >
                      <ul className="ajuda-itens">
                        {entrada.itens.map((item, indice) => (
                          <li key={indice}>{item}</li>
                        ))}
                      </ul>
                    </ItemExpansivel>
                  );
                })}
              </div>
            ) : null}

            {aba === "guia" ? <ListaTopicos topicos={GUIA} /> : null}

            {aba === "duvidas" ? <ListaTopicos topicos={DUVIDAS} /> : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
