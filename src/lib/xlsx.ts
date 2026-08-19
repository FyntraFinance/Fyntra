import { deflateRawSync } from "node:zlib";

/**
 * Escritor de planilha .xlsx sem dependência externa.
 *
 * Um .xlsx é um zip de arquivos XML no formato OOXML. Montar o zip aqui (o
 * Node já traz o deflate) evita trazer uma biblioteca inteira para gerar um
 * relatório — e as bibliotecas mais comuns não criam gráfico nativo, que é
 * justamente o que o relatório precisa ter.
 */

export type Celula = string | number | null;

export type Aba = {
  nome: string;
  /** Larguras das colunas, em caracteres. */
  larguras: number[];
  /** Primeira linha é o cabeçalho. */
  linhas: Celula[][];
  /** Colunas (base 0) que devem sair formatadas como dinheiro. */
  colunasMoeda?: number[];
  /** Gráfico de colunas desenhado ao lado da tabela. */
  grafico?: Grafico;
};

export type Grafico = {
  titulo: string;
  /** Linha do cabeçalho das categorias, 1-based, na própria aba. */
  linhaInicial: number;
  linhaFinal: number;
  /** Coluna dos rótulos e coluna dos valores, 1-based. */
  colunaRotulos: number;
  colunaValores: number;
};

// ---------------------------------------------------------------- utilitários

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 1 → A, 27 → AA. */
function letraColuna(indice: number) {
  let n = indice;
  let letra = "";

  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }

  return letra;
}

// ------------------------------------------------------------------ zip (mín.)

const TABELA_CRC = (() => {
  const tabela = new Int32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;

    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    tabela[i] = c;
  }

  return tabela;
})();

function crc32(dados: Buffer) {
  let c = 0xffffffff;

  for (const byte of dados) {
    c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  }

  return (c ^ 0xffffffff) >>> 0;
}

type Arquivo = { nome: string; conteudo: Buffer };

/** Monta o zip no formato que o Excel espera (deflate + diretório central). */
function zipar(arquivos: Arquivo[]) {
  const locais: Buffer[] = [];
  const central: Buffer[] = [];

  let deslocamento = 0;

  for (const arquivo of arquivos) {
    const nome = Buffer.from(arquivo.nome, "utf8");
    const comprimido = deflateRawSync(arquivo.conteudo);
    const crc = crc32(arquivo.conteudo);

    const cabecalho = Buffer.alloc(30);
    cabecalho.writeUInt32LE(0x04034b50, 0);
    cabecalho.writeUInt16LE(20, 4); // versão mínima
    cabecalho.writeUInt16LE(0, 6); // flags
    cabecalho.writeUInt16LE(8, 8); // deflate
    cabecalho.writeUInt16LE(0, 10); // hora
    cabecalho.writeUInt16LE(0x2100, 12); // data (2016-01-01, fixa)
    cabecalho.writeUInt32LE(crc, 14);
    cabecalho.writeUInt32LE(comprimido.length, 18);
    cabecalho.writeUInt32LE(arquivo.conteudo.length, 22);
    cabecalho.writeUInt16LE(nome.length, 26);
    cabecalho.writeUInt16LE(0, 28);

    locais.push(cabecalho, nome, comprimido);

    const entrada = Buffer.alloc(46);
    entrada.writeUInt32LE(0x02014b50, 0);
    entrada.writeUInt16LE(20, 4); // versão de criação
    entrada.writeUInt16LE(20, 6); // versão mínima
    entrada.writeUInt16LE(0, 8);
    entrada.writeUInt16LE(8, 10);
    entrada.writeUInt16LE(0, 12);
    entrada.writeUInt16LE(0x2100, 14);
    entrada.writeUInt32LE(crc, 16);
    entrada.writeUInt32LE(comprimido.length, 20);
    entrada.writeUInt32LE(arquivo.conteudo.length, 24);
    entrada.writeUInt16LE(nome.length, 28);
    entrada.writeUInt16LE(0, 30);
    entrada.writeUInt16LE(0, 32);
    entrada.writeUInt16LE(0, 34);
    entrada.writeUInt16LE(0, 36);
    entrada.writeUInt32LE(0, 38);
    entrada.writeUInt32LE(deslocamento, 42);

    central.push(entrada, nome);

    deslocamento += cabecalho.length + nome.length + comprimido.length;
  }

  const corpoCentral = Buffer.concat(central);

  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(0, 4);
  fim.writeUInt16LE(0, 6);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(corpoCentral.length, 12);
  fim.writeUInt32LE(deslocamento, 16);
  fim.writeUInt16LE(0, 20);

  return Buffer.concat([...locais, corpoCentral, fim]);
}

// -------------------------------------------------------------------- planilha

/**
 * Estilos: 0 padrão, 1 cabeçalho, 2 dinheiro, 3 dinheiro em negrito,
 * 4 título da seção.
 */
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/></numFmts>
<fonts count="4">
<font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF0F766E"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF10B981"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function xmlDaAba(aba: Aba) {
  const colunas = aba.larguras
    .map(
      (largura, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${largura}" customWidth="1"/>`,
    )
    .join("");

  const linhas = aba.linhas
    .map((linha, indiceLinha) => {
      const numero = indiceLinha + 1;
      const ehCabecalho = indiceLinha === 0;

      const celulas = linha
        .map((valor, indiceColuna) => {
          if (valor === null || valor === "") return "";

          const ref = `${letraColuna(indiceColuna + 1)}${numero}`;

          if (typeof valor === "number") {
            const moeda = aba.colunasMoeda?.includes(indiceColuna);
            const estilo = moeda ? 2 : 0;

            return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
          }

          const estilo = ehCabecalho ? 1 : 0;

          return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${escapar(
            valor,
          )}</t></is></c>`;
        })
        .join("");

      return `<row r="${numero}">${celulas}</row>`;
    })
    .join("");

  const desenho = aba.grafico ? `<drawing r:id="rId1"/>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"${
    aba.linhas.length > 1 ? ' tabSelected="0"' : ""
  }><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${colunas}</cols>
<sheetData>${linhas}</sheetData>
${desenho}
</worksheet>`;
}

function xmlDoGrafico(grafico: Grafico, nomeAba: string) {
  const aba = escapar(nomeAba);
  const colRotulos = letraColuna(grafico.colunaRotulos);
  const colValores = letraColuna(grafico.colunaValores);

  const refRotulos = `'${aba}'!$${colRotulos}$${grafico.linhaInicial}:$${colRotulos}$${grafico.linhaFinal}`;
  const refValores = `'${aba}'!$${colValores}$${grafico.linhaInicial}:$${colValores}$${grafico.linhaFinal}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${escapar(
    grafico.titulo,
  )}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/>
<c:plotArea><c:layout/>
<c:barChart>
<c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="1"/>
<c:ser>
<c:idx val="0"/><c:order val="0"/>
<c:tx><c:v>${escapar(grafico.titulo)}</c:v></c:tx>
<c:cat><c:strRef><c:f>${refRotulos}</c:f></c:strRef></c:cat>
<c:val><c:numRef><c:f>${refValores}</c:f></c:numRef></c:val>
</c:ser>
<c:gapWidth val="60"/>
<c:axId val="111111111"/><c:axId val="222222222"/>
</c:barChart>
<c:catAx><c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="222222222"/></c:catAx>
<c:valAx><c:axId val="222222222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="&quot;R$&quot;\\ #,##0" sourceLinked="0"/><c:majorGridlines/><c:crossAx val="111111111"/></c:valAx>
</c:plotArea>
<c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>
<c:plotVisOnly val="1"/>
</c:chart>
</c:chartSpace>`;
}

function xmlDoDesenho(colunaInicial: number, linhaInicial: number) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<xdr:twoCellAnchor>
<xdr:from><xdr:col>${colunaInicial}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${linhaInicial}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${colunaInicial + 8}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${linhaInicial + 18}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro="">
<xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Gráfico 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId1"/></a:graphicData></a:graphic>
</xdr:graphicFrame>
<xdr:clientData/>
</xdr:twoCellAnchor>
</xdr:wsDr>`;
}

/** Monta o arquivo .xlsx completo a partir das abas. */
export function gerarXlsx(abas: Aba[]): Buffer {
  const arquivos: Arquivo[] = [];

  const texto = (nome: string, conteudo: string) =>
    arquivos.push({ nome, conteudo: Buffer.from(conteudo, "utf8") });

  const comGrafico = abas.findIndex((aba) => aba.grafico);

  const tiposExtras =
    comGrafico >= 0
      ? `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
      : "";

  texto(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${abas
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${tiposExtras}
</Types>`,
  );

  texto(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );

  texto(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${abas
      .map(
        (aba, i) =>
          `<sheet name="${escapar(aba.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets>
</workbook>`,
  );

  texto(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${abas
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  )
  .join("")}
<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );

  texto("xl/styles.xml", ESTILOS);

  abas.forEach((aba, i) => {
    texto(`xl/worksheets/sheet${i + 1}.xml`, xmlDaAba(aba));

    if (aba.grafico) {
      texto(
        `xl/worksheets/_rels/sheet${i + 1}.xml.rels`,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`,
      );
    }
  });

  if (comGrafico >= 0) {
    const aba = abas[comGrafico];

    texto(
      "xl/drawings/drawing1.xml",
      xmlDoDesenho(aba.larguras.length + 1, 1),
    );

    texto(
      "xl/drawings/_rels/drawing1.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
</Relationships>`,
    );

    texto("xl/charts/chart1.xml", xmlDoGrafico(aba.grafico!, aba.nome));
  }

  return zipar(arquivos);
}
