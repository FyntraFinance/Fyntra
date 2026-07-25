"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { criarContasDetectadas, perguntarIa } from "@/actions/ia";
import { Markdown } from "@/components/assistente/Markdown";
import { useToast } from "@/components/ui/Toast";
import { formatarMoeda } from "@/lib/format";

type ContaDetectada = { nome: string; valor: number };

type Mensagem = {
  id: number;
  autor: "usuario" | "ia";
  texto: string;
  /** Presente quando a IA extraiu contas do texto enviado. */
  contas?: ContaDetectada[];
};

const ATALHOS = [
  { rotulo: "📊 Resumo do mês", pergunta: "Faça um resumo financeiro do mês." },
  { rotulo: "💸 Quem gasta mais?", pergunta: "Quem está gastando mais?" },
  { rotulo: "💡 Economia", pergunta: "Como economizar?" },
  { rotulo: "👥 Sobras", pergunta: "Quanto sobra para cada pessoa?" },
];

/** Linhas do tipo "Luz: 250,00" viram contas fixas prontas para adicionar. */
function detectarContas(texto: string): ContaDetectada[] {
  const padrao = /^(.+?)\s*[:\-]\s*R?\$?\s*([\d.,]+)$/i;

  return texto
    .split("\n")
    .map((linha) => linha.trim().match(padrao))
    .filter((achado): achado is RegExpMatchArray => Boolean(achado))
    .map((achado) => ({
      nome: achado[1].trim(),
      valor: Number(achado[2].replace(/\./g, "").replace(",", ".")),
    }))
    .filter((conta) => Number.isFinite(conta.valor) && conta.valor > 0);
}

export function ChatIA({
  temToken,
  mes,
}: {
  temToken: boolean;
  mes: string;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [digitando, setDigitando] = useState(false);

  const proximoId = useRef(1);
  const areaMensagens = useRef<HTMLDivElement>(null);

  useEffect(() => {
    areaMensagens.current?.scrollTo({
      top: areaMensagens.current.scrollHeight,
    });
  }, [mensagens, digitando]);

  function adicionar(mensagem: Omit<Mensagem, "id">) {
    setMensagens((atuais) => [
      ...atuais,
      { ...mensagem, id: proximoId.current++ },
    ]);
  }

  function enviar(texto: string) {
    const conteudo = texto.trim();

    if (!conteudo || digitando) return;

    adicionar({ autor: "usuario", texto: conteudo });
    setPergunta("");

    const contas = detectarContas(conteudo);

    if (contas.length > 0) {
      adicionar({ autor: "ia", texto: "", contas });
      return;
    }

    setDigitando(true);

    iniciar(async () => {
      const resultado = await perguntarIa(conteudo);

      setDigitando(false);
      adicionar({ autor: "ia", texto: resultado.resposta });
    });
  }

  function adicionarContas(contas: ContaDetectada[]) {
    iniciar(async () => {
      const resultado = await criarContasDetectadas(contas, mes);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");
    });
  }

  return (
    <div className="ai-container">
      <div className="ai-messages" ref={areaMensagens}>
        {mensagens.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">🤖</div>

            <h2>Assistente Financeiro</h2>

            <p>
              Posso analisar gastos, sobras mensais, comparar salários, criar
              contas automaticamente e ajudar no planejamento financeiro.
            </p>

            {!temToken ? (
              <p className="mt-4">
                <Link href="/perfil" className="auth-link">
                  Configure o token da Poe no Perfil
                </Link>{" "}
                para começar.
              </p>
            ) : null}
          </div>
        ) : null}

        {mensagens.map((mensagem) => {
          const ehIa = mensagem.autor === "ia";
          const contas = mensagem.contas;

          return (
            <div
              className={`ai-msg ${ehIa ? "bot" : "user"}`}
              key={mensagem.id}
            >
              <div className="ai-msg-avatar">{ehIa ? "🤖" : "👤"}</div>

              <div
                className={`ai-msg-bubble${ehIa ? " ai-msg-markdown" : ""}`}
              >
                {contas ? (
                  <div className="ai-parsed-bills">
                    <h4>📋 Contas Detectadas</h4>

                    {contas.map((conta, indice) => (
                      <div className="ai-parsed-item" key={indice}>
                        <span>{conta.nome}</span>
                        <span>{formatarMoeda(conta.valor)}</span>
                      </div>
                    ))}

                    <button
                      className="btn btn-primary mt-16"
                      type="button"
                      onClick={() => adicionarContas(contas)}
                      disabled={pendente}
                    >
                      Adicionar Contas
                    </button>
                  </div>
                ) : ehIa ? (
                  <Markdown texto={mensagem.texto} />
                ) : (
                  mensagem.texto
                )}
              </div>
            </div>
          );
        })}

        {digitando ? (
          <div className="ai-msg bot">
            <div className="ai-msg-avatar">🤖</div>

            <div className="ai-msg-bubble">
              <div className="ai-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="ai-quick-actions">
        {ATALHOS.map((atalho) => (
          <button
            key={atalho.rotulo}
            className="quick-btn"
            type="button"
            onClick={() => enviar(atalho.pergunta)}
          >
            {atalho.rotulo}
          </button>
        ))}
      </div>

      <div className="ai-input-area">
        <Link
          className="btn-token-config"
          href="/perfil"
          title="Configurar token da API"
        >
          ⚙️
        </Link>

        <input
          type="text"
          placeholder="Pergunte algo..."
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              enviar(pergunta);
            }
          }}
        />

        <button type="button" onClick={() => enviar(pergunta)}>
          <span>➤</span>
        </button>
      </div>
    </div>
  );
}
