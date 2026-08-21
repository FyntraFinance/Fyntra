import type { EstiloCategoria } from "@/lib/categorias";

/** Quadrado colorido que identifica a categoria de relance na tabela. */
export function IconeCategoria({ estilo }: { estilo: EstiloCategoria }) {
  return (
    <span
      className="icone-categoria"
      style={{ background: `${estilo.cor}22`, color: estilo.cor }}
      aria-hidden="true"
    >
      {estilo.icone}
    </span>
  );
}
