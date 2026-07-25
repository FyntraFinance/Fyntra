import { ConviteInstalar } from "@/components/app/ConviteInstalar";
import { Shell } from "@/components/app/Shell";
import { ToastProvider } from "@/components/ui/Toast";
import { obterMesSelecionado } from "@/lib/mes";
import { obterContexto } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contexto, mes] = await Promise.all([
    obterContexto(),
    obterMesSelecionado(),
  ]);

  return (
    <ToastProvider>
      <Shell
        usuario={{ nome: contexto.userNome, email: contexto.userEmail }}
        mes={mes}
      >
        {children}
      </Shell>

      <ConviteInstalar />
    </ToastProvider>
  );
}
