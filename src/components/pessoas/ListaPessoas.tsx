"use client";

import { useState, useTransition } from "react";

import { removerPessoa, salvarPessoa } from "@/actions/pessoas";
import { ModalConvite } from "@/components/pessoas/ModalConvite";
import { Modal, ModalConfirmar } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { corAvatar, formatarMoeda, inicialNome } from "@/lib/format";
import type { PessoaDTO } from "@/lib/tipos";

export function ListaPessoas({
  pessoas,
  podeConvidar,
}: {
  pessoas: PessoaDTO[];
  podeConvidar: boolean;
}) {
  const mostrarToast = useToast();
  const [pendente, iniciar] = useTransition();

  const [editando, setEditando] = useState<PessoaDTO | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [removendo, setRemovendo] = useState<PessoaDTO | null>(null);
  const [convidando, setConvidando] = useState<PessoaDTO | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [salario, setSalario] = useState("");

  function abrirForm(pessoa: PessoaDTO | null) {
    setEditando(pessoa);
    setNome(pessoa?.nome ?? "");
    setEmail(pessoa?.email ?? "");
    setSalario(pessoa ? String(pessoa.salario) : "");
    setFormAberto(true);
  }

  function salvar() {
    iniciar(async () => {
      const resultado = await salvarPessoa({
        id: editando?.id,
        nome,
        email,
        salario: salario || 0,
      });

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setFormAberto(false);
      }
    });
  }

  function confirmarRemocao() {
    if (!removendo) return;

    iniciar(async () => {
      const resultado = await removerPessoa(removendo.id);

      mostrarToast(resultado.mensagem, resultado.ok ? "success" : "error");

      if (resultado.ok) {
        setRemovendo(null);
      }
    });
  }

  return (
    <>
      <div className="page-actions">
        <div className="text-muted">Quem participa das finanças da casa</div>

        <button
          className="btn btn-primary"
          type="button"
          onClick={() => abrirForm(null)}
        >
          ➕ Nova Pessoa
        </button>
      </div>

      <div className="space-y-4">
        {pessoas.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">Nenhuma pessoa cadastrada</div>
            </div>
          </div>
        ) : (
          pessoas.map((pessoa, indice) => (
            <div className="card" key={pessoa.id}>
              <div className="flex-between">
                <div className="flex items-center gap-12">
                  <div
                    className="person-avatar"
                    style={{ background: corAvatar(indice) }}
                  >
                    {inicialNome(pessoa.nome)}
                  </div>

                  <div>
                    <div className="list-title">{pessoa.nome}</div>

                    <div className="list-sub">
                      Salário: {formatarMoeda(pessoa.salario)}
                    </div>

                    <div className="pessoa-email">
                      {pessoa.email ? <span>✉️ {pessoa.email}</span> : null}

                      {pessoa.userId ? (
                        <span className="convite-badge ativo">
                          ✓ com acesso
                        </span>
                      ) : pessoa.convite ? (
                        <span className="convite-badge pendente">
                          ⏳ convite pendente
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="list-actions">
                  {podeConvidar && !pessoa.userId ? (
                    <button
                      className="btn-icon"
                      type="button"
                      title="Convidar por e-mail"
                      onClick={() => setConvidando(pessoa)}
                    >
                      ✉️
                    </button>
                  ) : null}

                  <button
                    className="btn-icon"
                    type="button"
                    title="Editar"
                    onClick={() => abrirForm(pessoa)}
                  >
                    ✏️
                  </button>

                  <button
                    className="btn-icon"
                    type="button"
                    title="Remover"
                    onClick={() => setRemovendo(pessoa)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        aberto={formAberto}
        titulo={editando ? "Editar Pessoa" : "Nova Pessoa"}
        onFechar={() => setFormAberto(false)}
        footer={
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={salvar}
              disabled={pendente}
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Nome</label>

            <input
              className="input"
              type="text"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">
              E-mail{" "}
              <span className="text-muted text-xs">
                — usado para enviar o convite de acesso
              </span>
            </label>

            <input
              className="input"
              type="email"
              placeholder="pessoa@email.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Salário</label>

            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={salario}
              onChange={(evento) => setSalario(evento.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ModalConfirmar
        aberto={Boolean(removendo)}
        titulo="Remover Pessoa"
        mensagem={`Deseja remover ${removendo?.nome ?? "essa pessoa"}?`}
        confirmarTexto="Remover"
        pendente={pendente}
        onConfirmar={confirmarRemocao}
        onFechar={() => setRemovendo(null)}
      />

      <ModalConvite
        pessoa={convidando}
        onFechar={() => setConvidando(null)}
      />
    </>
  );
}
