/**
 * Logo em opacidade reduzida, pulsando, enquanto a rota carrega.
 * `cobrirTela` usa a viewport inteira (transições entre login e app);
 * sem ela o componente ocupa só a área de conteúdo.
 */
export function TelaCarregando({
  cobrirTela = false,
  rotulo = "Carregando...",
}: {
  cobrirTela?: boolean;
  rotulo?: string;
}) {
  return (
    <div
      className={cobrirTela ? "carregando-tela" : "carregando-area"}
      role="status"
      aria-live="polite"
    >
      <div className="carregando-logo" />

      <span className="sr-only">{rotulo}</span>
    </div>
  );
}
