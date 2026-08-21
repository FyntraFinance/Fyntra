"use client";

const OPCOES_POR_PAGINA = [10, 25, 50];

/** Rodapé de paginação: contagem, botões de página e itens por página. */
export function PaginacaoContas({
  total,
  pagina,
  porPagina,
  onPagina,
  onPorPagina,
}: {
  total: number;
  pagina: number;
  porPagina: number;
  onPagina: (pagina: number) => void;
  onPorPagina: (porPagina: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(total, pagina * porPagina);

  if (total === 0) return null;

  return (
    <div className="contas-paginacao">
      <span className="text-muted text-xs">
        Mostrando {inicio} a {fim} de {total} conta(s)
      </span>

      <div className="contas-paginacao-paginas">
        <button
          type="button"
          className="picker-nav"
          disabled={pagina <= 1}
          onClick={() => onPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <span className="contas-paginacao-num">{pagina}</span>

        <button
          type="button"
          className="picker-nav"
          disabled={pagina >= totalPaginas}
          onClick={() => onPagina(pagina + 1)}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>

      <select
        className="input contas-paginacao-select"
        value={porPagina}
        onChange={(evento) => onPorPagina(Number(evento.target.value))}
      >
        {OPCOES_POR_PAGINA.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao} por página
          </option>
        ))}
      </select>
    </div>
  );
}
