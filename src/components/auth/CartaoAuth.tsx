export function CartaoAuth({
  titulo,
  descricao,
  children,
  rodape,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* A marca aparece pela logo, não por um emoji genérico. As duas
            versões ficam empilhadas e o CSS mostra a do tema em uso. */}
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="auth-logo logo-tema-escuro"
            src="/logo-fyntra.svg"
            alt="Fyntra"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="auth-logo logo-tema-claro"
            src="/logo-fyntra-light.svg"
            alt="Fyntra"
          />
        </div>

        <h1 className="auth-title">{titulo}</h1>

        <p className="auth-sub">{descricao}</p>

        {children}

        {rodape ? <div className="auth-rodape">{rodape}</div> : null}
      </div>
    </div>
  );
}
