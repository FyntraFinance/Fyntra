import { Fragment, type ReactNode } from "react";

/**
 * Mini renderizador de markdown para as respostas da IA: títulos, listas,
 * parágrafos, **negrito** e *itálico*. Substitui o innerHTML do protótipo.
 */

function inline(texto: string, chave: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const padrao = /\*\*(.+?)\*\*|\*(.+?)\*/g;

  let ultimo = 0;
  let indice = 0;
  let achado: RegExpExecArray | null;

  while ((achado = padrao.exec(texto)) !== null) {
    if (achado.index > ultimo) {
      partes.push(texto.slice(ultimo, achado.index));
    }

    if (achado[1] !== undefined) {
      partes.push(<strong key={`${chave}-f-${indice}`}>{achado[1]}</strong>);
    } else {
      partes.push(<em key={`${chave}-i-${indice}`}>{achado[2]}</em>);
    }

    ultimo = achado.index + achado[0].length;
    indice += 1;
  }

  if (ultimo < texto.length) {
    partes.push(texto.slice(ultimo));
  }

  return partes;
}

export function Markdown({ texto }: { texto: string }) {
  const blocos: ReactNode[] = [];
  let itensLista: string[] = [];

  function fecharLista() {
    if (itensLista.length === 0) return;

    const itens = itensLista;
    itensLista = [];

    blocos.push(
      <ul key={`ul-${blocos.length}`}>
        {itens.map((item, indice) => (
          <li key={indice}>{inline(item, `li-${blocos.length}-${indice}`)}</li>
        ))}
      </ul>,
    );
  }

  texto.split("\n").forEach((linha, indice) => {
    const chave = `linha-${indice}`;

    if (linha.startsWith("### ")) {
      fecharLista();
      blocos.push(<h3 key={chave}>{inline(linha.slice(4), chave)}</h3>);
      return;
    }

    if (linha.startsWith("## ")) {
      fecharLista();
      blocos.push(<h2 key={chave}>{inline(linha.slice(3), chave)}</h2>);
      return;
    }

    if (linha.startsWith("# ")) {
      fecharLista();
      blocos.push(<h1 key={chave}>{inline(linha.slice(2), chave)}</h1>);
      return;
    }

    if (/^[-*] /.test(linha) || /^\d+\.\s/.test(linha)) {
      itensLista.push(linha.replace(/^[-*] /, "").replace(/^\d+\.\s/, ""));
      return;
    }

    if (linha.trim() === "") {
      fecharLista();
      return;
    }

    fecharLista();
    blocos.push(<p key={chave}>{inline(linha, chave)}</p>);
  });

  fecharLista();

  return <Fragment>{blocos}</Fragment>;
}
