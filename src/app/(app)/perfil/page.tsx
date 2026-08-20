import { Notificacoes } from "@/components/perfil/Notificacoes";
import { ListaMembros } from "@/components/perfil/ListaMembros";
import { ListaMetas } from "@/components/perfil/ListaMetas";
import { PainelPerfil } from "@/components/perfil/PainelPerfil";
import { SeletorTema } from "@/components/perfil/SeletorTema";
import { TrocarSenha } from "@/components/perfil/TrocarSenha";
import {
  listarMembros,
  listarMetas,
  listarPessoas,
  obterConfiguracao,
} from "@/lib/dados";
import { obterMesSelecionado } from "@/lib/mes";
import { obterContexto, podeAdministrar } from "@/lib/workspace";

export const metadata = {
  title: "Perfil — Fyntra",
};

export default async function PerfilPage() {
  const contexto = await obterContexto();

  const [metas, configuracao, membros, pessoas, mes] = await Promise.all([
    listarMetas(contexto.workspaceId),
    obterConfiguracao(contexto.workspaceId),
    listarMembros(contexto.workspaceId, contexto.userId),
    listarPessoas(contexto.workspaceId),
    obterMesSelecionado(),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚙️ Perfil &amp; Configurações</h1>

        <p className="text-muted" style={{ marginTop: 4 }}>
          {contexto.workspaceNome} — relatórios, acesso e metas da família
        </p>
      </div>

      <PainelPerfil
        mes={mes}
        compartilharComContadora={configuracao.compartilharComContadora}
        podeAlterarCompartilhamento={podeAdministrar(contexto.role)}
      />

      <div className="perfil-grid mt-16">
        <SeletorTema />

        <Notificacoes
          chavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
        />

        <TrocarSenha />
      </div>

      <ListaMembros
        membros={membros}
        podeAdministrar={podeAdministrar(contexto.role)}
      />

      <ListaMetas metas={metas} pessoas={pessoas} />
    </>
  );
}
