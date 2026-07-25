"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { sair } from "@/actions/auth";
import { SeletorMes } from "@/components/app/SeletorMes";
import { ChatIA } from "@/components/assistente/ChatIA";
import { ListaContasFixas } from "@/components/contas/ListaContasFixas";
import { ListaContasVariaveis } from "@/components/contas/ListaContasVariaveis";
import { DashboardConteudo } from "@/components/dashboard/DashboardConteudo";
import { ListaPessoas } from "@/components/pessoas/ListaPessoas";
import type { MetaCalculada, ResumoPessoa, Totais } from "@/lib/calculos";
import { inicialNome } from "@/lib/format";
import type { ContaFixaDTO, ContaVariavelDTO, PessoaDTO } from "@/lib/tipos";

type AbaChave =
  | "dashboard"
  | "pessoas"
  | "contas-fixas"
  | "contas-variaveis"
  | "assistente";

const ABAS: { key: AbaChave; rotulo: string; titulo: string }[] = [
  { key: "dashboard", rotulo: "📊 Dashboard", titulo: "Dashboard" },
  { key: "pessoas", rotulo: "👥 Pessoas", titulo: "Pessoas" },
  { key: "contas-fixas", rotulo: "🏠 Contas Fixas", titulo: "Contas Fixas" },
  {
    key: "contas-variaveis",
    rotulo: "💳 Contas Variáveis",
    titulo: "Contas Variáveis",
  },
  { key: "assistente", rotulo: "🤖 Assistente IA", titulo: "Assistente IA" },
];

const CHAVE_ARMAZENAMENTO = "fyntra_aba_ativa";

export type DadosAbas = {
  dashboard: {
    totais: Totais;
    resumoPessoas: ResumoPessoa[];
    metasCalculadas: MetaCalculada[];
    porCategoria: { nome: string; valor: number }[];
    evolucaoAnual: {
      mes: string;
      salarios: number;
      gastos: number;
      sobra: number;
    }[];
    dadosResumo: { nome: string; valor: number; cor: string }[];
    movimentacoes: {
      id: string;
      nome: string;
      categoria: string;
      valor: number;
    }[];
  };
  pessoas: { pessoas: PessoaDTO[]; podeConvidar: boolean };
  contasFixas: { contas: ContaFixaDTO[]; pessoas: PessoaDTO[]; mes: string };
  contasVariaveis: { contas: ContaVariavelDTO[]; pessoas: PessoaDTO[] };
  assistente: { temToken: boolean; mes: string };
};

/**
 * Dashboard/Pessoas/Contas Fixas/Contas Variáveis/Assistente vivem todas em
 * `/dashboard` e trocam de conteúdo por estado do React — nunca por
 * navegação. É isso que evita o app instalado no celular (atalho em modo
 * standalone) "sair da tela cheia": o iOS mostra a barra do Safari de novo
 * sempre que a URL muda, mesmo em transições client-side do Next.
 */
export function Shell({
  usuario,
  mes,
  souAdmin = false,
  abas,
  children,
}: {
  usuario: { nome: string; email: string };
  mes: string;
  souAdmin?: boolean;
  abas: DadosAbas;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaChave>("dashboard");

  const naTelaDeAbas = pathname === "/dashboard";

  useEffect(() => {
    const salva = window.localStorage.getItem(CHAVE_ARMAZENAMENTO);

    if (salva && ABAS.some((aba) => aba.key === salva)) {
      setAbaAtiva(salva as AbaChave);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, abaAtiva);
  }, [abaAtiva]);

  useEffect(() => {
    if (!naTelaDeAbas) return;

    const titulo = ABAS.find((aba) => aba.key === abaAtiva)?.titulo;

    if (titulo) {
      document.title = `${titulo} — Fyntra`;
    }
  }, [abaAtiva, naTelaDeAbas]);

  function selecionarAba(chave: AbaChave) {
    setAbaAtiva(chave);
    setMenuAberto(false);

    if (!naTelaDeAbas) {
      router.push("/dashboard");
    }
  }

  function conteudoDaAba() {
    switch (abaAtiva) {
      case "dashboard":
        return <DashboardConteudo {...abas.dashboard} />;
      case "pessoas":
        return <ListaPessoas {...abas.pessoas} />;
      case "contas-fixas":
        return <ListaContasFixas {...abas.contasFixas} />;
      case "contas-variaveis":
        return <ListaContasVariaveis {...abas.contasVariaveis} />;
      case "assistente":
        return <ChatIA {...abas.assistente} />;
    }
  }

  return (
    <>
      <div
        id="sidebarOverlay"
        className={menuAberto ? "active" : ""}
        onClick={() => setMenuAberto(false)}
      />

      <aside id="sidebar" className={menuAberto ? "open" : ""}>
        <div className="brand">
          <div className="brand-icon-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="logo-tema-escuro"
              src="/logo-simbolo.png"
              alt="Fyntra"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="logo-tema-claro"
              src="/logo-simbolo-light.png"
              alt="Fyntra"
            />
          </div>

          <div className="brand-text">
            Fyn<span>tra</span>
          </div>
        </div>

        <div className="sidebar-section">MENU</div>

        <nav className="sidebar-nav">
          {ABAS.map((aba) => (
            <button
              key={aba.key}
              type="button"
              className={`nav-item${
                naTelaDeAbas && abaAtiva === aba.key ? " active" : ""
              }`}
              onClick={() => selecionarAba(aba.key)}
            >
              {aba.rotulo}
            </button>
          ))}

          {souAdmin ? (
            <Link
              href="/admin"
              className={`nav-item${
                pathname === "/admin" || pathname?.startsWith("/admin/")
                  ? " active"
                  : ""
              }`}
              onClick={() => setMenuAberto(false)}
            >
              🧮 Painel Contábil
            </Link>
          ) : null}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {inicialNome(usuario.nome)}
            </div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-nome">{usuario.nome}</div>
              <div className="sidebar-user-email">{usuario.email}</div>
            </div>

            <Link
              href="/perfil"
              className="sidebar-icone-perfil"
              title="Perfil"
              onClick={() => setMenuAberto(false)}
            >
              ⚙️
            </Link>

            <form action={sair}>
              <button className="sidebar-sair" type="submit" title="Sair">
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main id="main">
        <header id="main-header">
          <button
            id="menuToggle"
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            ☰
          </button>

          <SeletorMes mes={mes} />
        </header>

        <div id="app">{naTelaDeAbas ? conteudoDaAba() : children}</div>
      </main>
    </>
  );
}
