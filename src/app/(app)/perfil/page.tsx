import { ListaMembros } from "@/components/perfil/ListaMembros";
import { ListaMetas } from "@/components/perfil/ListaMetas";
import { PainelPerfil } from "@/components/perfil/PainelPerfil";
import { TrocarSenha } from "@/components/perfil/TrocarSenha";
import { listarMembros, listarMetas, obterConfiguracao } from "@/lib/dados";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

export const metadata = {
  title: "Perfil — Fyntra",
};

export default async function PerfilPage() {
  const contexto = await obterContexto();

  const [metas, configuracao, membros] = await Promise.all([
    listarMetas(contexto.workspaceId),
    obterConfiguracao(contexto.workspaceId),
    listarMembros(contexto.workspaceId, contexto.userId),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚙️ Perfil &amp; Configurações</h1>

        <p className="text-muted" style={{ marginTop: 4 }}>
          {contexto.workspaceNome} — gerencie seus dados e integrações
        </p>
      </div>

      <PainelPerfil
        temTokenIa={configuracao.temTokenIa}
        compartilharComContadora={configuracao.compartilharComContadora}
        podeAlterarCompartilhamento={podeAdministrar(contexto.role)}
      />

      <div className="perfil-grid mt-16">
        <TrocarSenha />
      </div>

      <ListaMembros
        membros={membros}
        podeAdministrar={podeAdministrar(contexto.role)}
      />

      <ListaMetas metas={metas} />
    </>
  );
}
