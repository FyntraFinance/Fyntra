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
        <div className="auth-brand">
          <div className="brand-icon">💰</div>
          <div className="brand-text">
            Fyn<span>tra</span>
          </div>
        </div>

        <h1 className="auth-title">{titulo}</h1>

        <p className="auth-sub">{descricao}</p>

        {children}

        {rodape ? <div className="auth-rodape">{rodape}</div> : null}
      </div>
    </div>
  );
}
