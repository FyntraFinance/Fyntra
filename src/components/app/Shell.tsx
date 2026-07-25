"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { sair } from "@/actions/auth";
import { SeletorMes } from "@/components/app/SeletorMes";
import { inicialNome } from "@/lib/format";

const MENU = [
  { href: "/dashboard", rotulo: "📊 Dashboard" },
  { href: "/pessoas", rotulo: "👥 Pessoas" },
  { href: "/contas-fixas", rotulo: "🏠 Contas Fixas" },
  { href: "/contas-variaveis", rotulo: "💳 Contas Variáveis" },
  { href: "/assistente", rotulo: "🤖 Assistente IA" },
];

export function Shell({
  usuario,
  mes,
  souAdmin = false,
  children,
}: {
  usuario: { nome: string; email: string };
  mes: string;
  souAdmin?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  const menu = souAdmin
    ? [...MENU, { href: "/admin", rotulo: "🧮 Painel Contábil" }]
    : MENU;

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
            <img src="/logo-simbolo.png" alt="Fyntra" />
          </div>

          <div className="brand-text">
            Fyn<span>tra</span>
          </div>
        </div>

        <div className="sidebar-section">MENU</div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const ativo =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${ativo ? " active" : ""}`}
                onClick={() => setMenuAberto(false)}
              >
                {item.rotulo}
              </Link>
            );
          })}
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

            <form action={sair}>
              <button className="sidebar-sair" type="submit" title="Sair">
                ⏻
              </button>
            </form>
          </div>

          <Link
            href="/perfil"
            className={`nav-item nav-item-perfil${
              pathname === "/perfil" ? " active" : ""
            }`}
            onClick={() => setMenuAberto(false)}
          >
            ⚙️ Perfil
          </Link>
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

        <div id="app">{children}</div>
      </main>
    </>
  );
}
