import Link from "next/link";

import { listarFamiliasAdmin } from "@/lib/admin-dados";
import { formatarData } from "@/lib/format";
import { exigirAdminSistema } from "@/lib/workspace";

export const metadata = {
  title: "Painel Contábil — Fyntra",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await exigirAdminSistema();

  const { q } = await searchParams;
  const { familias, ocultas } = await listarFamiliasAdmin(q);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🧮 Painel Contábil</h1>

        <p className="text-muted" style={{ marginTop: 4 }}>
          Consulte as famílias cadastradas e abra o relatório financeiro de
          cada uma.
        </p>
      </div>

      <form className="mt-16" method="get">
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Buscar por nome da família, dono ou e-mail..."
          defaultValue={q ?? ""}
        />
      </form>

      <div className="card mt-16">
        <div className="card-header">
          <div className="card-title">
            {familias.length} família(s) encontrada(s)
          </div>
        </div>

        <div className="membros-lista">
          {familias.length === 0 ? (
            <div className="text-slate-400">Nenhuma família encontrada.</div>
          ) : (
            familias.map((familia) => (
              <Link
                className="membro-item admin-familia-link"
                href={`/admin/${familia.id}`}
                key={familia.id}
              >
                <div>
                  <div className="list-title">{familia.nome}</div>

                  <div className="list-sub">
                    <span>
                      Dono: {familia.dono?.nome ?? familia.dono?.email ?? "—"}
                    </span>
                    <span>{familia.totalPessoas} pessoa(s)</span>
                    <span>{familia.totalMembros} com acesso</span>
                    <span>Criada em {formatarData(familia.criadaEm.slice(0, 10))}</span>
                  </div>
                </div>

                <span className="membro-role">Ver relatório →</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {ocultas > 0 ? (
        <p className="text-muted mt-16" style={{ fontSize: 13 }}>
          🔒 {ocultas} família(s) optaram por não compartilhar os dados com a
          contabilidade e não aparecem nesta lista.
        </p>
      ) : null}
    </>
  );
}
