/**
 * Gera os assets visuais do Fyntra a partir da logo original.
 *
 *   node scripts/gerar-assets.mjs [caminho-da-logo]
 *
 * A logo de origem vem sobre fundo preto sólido. O fundo é removido por
 * limiar suave na luminância — não por comparação de cor — para preservar o
 * anti-aliasing das bordas, e as bordas parciais têm a cor "desmultiplicada"
 * (desfazendo a mistura com o preto) para não ficar halo escuro sobre fundos
 * claros.
 *
 * Saídas:
 *   public/logo-fyntra.png        logo completa, fundo transparente
 *   public/logo-simbolo.png       apenas o símbolo, fundo transparente
 *   src/app/icon.png              favicon (símbolo sobre fundo escuro)
 *   src/app/apple-icon.png        ícone do atalho no iOS
 *   public/icons/icon-192.png     ícone do PWA
 *   public/icons/icon-512.png     ícone do PWA
 *   public/icons/icon-maskable-512.png  ícone com safe zone para Android
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");

const ORIGEM_PADRAO = "C:/Users/heber/Downloads/fyntra-logo.png";

/** Abaixo disso é fundo; acima é conteúdo. Entre os dois, borda parcial. */
const LIMIAR_FUNDO = 0.06;
const LIMIAR_CONTEUDO = 0.22;

/** Cor de fundo dos ícones — mesma do --bg-0 do app. */
const FUNDO_ICONE = { r: 3, g: 7, b: 18, alpha: 1 };

async function lerComAlfa(origem) {
  const { data, info } = await sharp(origem)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { pixels: data, largura: info.width, altura: info.height };
}

/** Substitui o fundo preto por transparência real. */
function removerFundo({ pixels, largura, altura }) {
  const saida = Buffer.alloc(pixels.length);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const luminancia = Math.max(r, g, b) / 255;

    let alfa;

    if (luminancia <= LIMIAR_FUNDO) {
      alfa = 0;
    } else if (luminancia >= LIMIAR_CONTEUDO) {
      alfa = 1;
    } else {
      alfa = (luminancia - LIMIAR_FUNDO) / (LIMIAR_CONTEUDO - LIMIAR_FUNDO);
    }

    if (alfa === 0) {
      saida[i] = 0;
      saida[i + 1] = 0;
      saida[i + 2] = 0;
      saida[i + 3] = 0;
      continue;
    }

    // Nas bordas, desfaz a mistura com o preto para a cor não sair escurecida.
    const divisor = alfa < 1 ? alfa : 1;

    saida[i] = Math.min(255, Math.round(r / divisor));
    saida[i + 1] = Math.min(255, Math.round(g / divisor));
    saida[i + 2] = Math.min(255, Math.round(b / divisor));
    saida[i + 3] = Math.round(alfa * 255);
  }

  return { pixels: saida, largura, altura };
}

/** Soma de opacidade por linha — usada para achar recortes e blocos. */
function perfilDeLinhas({ pixels, largura, altura }) {
  const perfil = new Array(altura).fill(0);

  for (let y = 0; y < altura; y += 1) {
    let soma = 0;

    for (let x = 0; x < largura; x += 1) {
      soma += pixels[(y * largura + x) * 4 + 3];
    }

    perfil[y] = soma;
  }

  return perfil;
}

function perfilDeColunas({ pixels, largura, altura }) {
  const perfil = new Array(largura).fill(0);

  for (let x = 0; x < largura; x += 1) {
    let soma = 0;

    for (let y = 0; y < altura; y += 1) {
      soma += pixels[(y * largura + x) * 4 + 3];
    }

    perfil[x] = soma;
  }

  return perfil;
}

function limitesComConteudo(perfil, limiar) {
  let inicio = perfil.findIndex((valor) => valor > limiar);
  let fim = -1;

  for (let i = perfil.length - 1; i >= 0; i -= 1) {
    if (perfil[i] > limiar) {
      fim = i;
      break;
    }
  }

  if (inicio === -1) {
    inicio = 0;
    fim = perfil.length - 1;
  }

  return { inicio, fim };
}

/**
 * Divide a arte em blocos separados por faixas vazias. Na logo do Fyntra o
 * primeiro bloco é o símbolo e os seguintes são o texto e a tagline.
 */
function blocosVerticais(perfil, limiar, alturaMinima) {
  const blocos = [];
  let inicio = null;

  perfil.forEach((valor, y) => {
    const temConteudo = valor > limiar;

    if (temConteudo && inicio === null) {
      inicio = y;
      return;
    }

    if (!temConteudo && inicio !== null) {
      if (y - inicio >= alturaMinima) {
        blocos.push({ inicio, fim: y - 1 });
      }

      inicio = null;
    }
  });

  if (inicio !== null) {
    blocos.push({ inicio, fim: perfil.length - 1 });
  }

  return blocos;
}

function recortar(imagem, { esquerda, topo, largura, altura }) {
  const saida = Buffer.alloc(largura * altura * 4);

  for (let y = 0; y < altura; y += 1) {
    const origemInicio = ((topo + y) * imagem.largura + esquerda) * 4;

    imagem.pixels.copy(
      saida,
      y * largura * 4,
      origemInicio,
      origemInicio + largura * 4,
    );
  }

  return { pixels: saida, largura, altura };
}

function paraSharp(imagem) {
  return sharp(imagem.pixels, {
    raw: { width: imagem.largura, height: imagem.altura, channels: 4 },
  });
}

/** Coloca a arte centralizada num quadrado com fundo opaco. */
async function iconeQuadrado(arte, tamanho, margemRelativa, destino) {
  const util = Math.round(tamanho * (1 - margemRelativa * 2));

  const arteRedimensionada = await paraSharp(arte)
    .resize(util, util, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: tamanho,
      height: tamanho,
      channels: 4,
      background: FUNDO_ICONE,
    },
  })
    .composite([{ input: arteRedimensionada, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(destino);

  return destino;
}

async function principal() {
  const origem = path.resolve(process.argv[2] ?? ORIGEM_PADRAO);

  console.log("Logo de origem:", origem);

  const original = await lerComAlfa(origem);

  console.log(`Dimensões originais: ${original.largura}x${original.altura}`);

  const semFundo = removerFundo(original);

  // Recorte geral: remove a moldura vazia em volta da arte.
  const linhas = perfilDeLinhas(semFundo);
  const colunas = perfilDeColunas(semFundo);

  const limiarRuido = 255 * 2;

  const vertical = limitesComConteudo(linhas, limiarRuido);
  const horizontal = limitesComConteudo(colunas, limiarRuido);

  const completa = recortar(semFundo, {
    esquerda: horizontal.inicio,
    topo: vertical.inicio,
    largura: horizontal.fim - horizontal.inicio + 1,
    altura: vertical.fim - vertical.inicio + 1,
  });

  console.log(`Arte recortada: ${completa.largura}x${completa.altura}`);

  // Separa o símbolo (primeiro bloco) do texto.
  const perfilCompleta = perfilDeLinhas(completa);

  const blocos = blocosVerticais(
    perfilCompleta,
    limiarRuido,
    Math.round(completa.altura * 0.04),
  );

  console.log(
    "Blocos detectados:",
    blocos.map((b) => `${b.inicio}-${b.fim}`).join(", ") || "(nenhum)",
  );

  const blocoSimbolo = blocos[0] ?? { inicio: 0, fim: completa.altura - 1 };

  const faixaSimbolo = recortar(completa, {
    esquerda: 0,
    topo: blocoSimbolo.inicio,
    largura: completa.largura,
    altura: blocoSimbolo.fim - blocoSimbolo.inicio + 1,
  });

  // O símbolo é mais estreito que a logo: recorta as laterais vazias dele.
  const colunasSimbolo = perfilDeColunas(faixaSimbolo);
  const horizontalSimbolo = limitesComConteudo(colunasSimbolo, limiarRuido);

  const simbolo = recortar(faixaSimbolo, {
    esquerda: horizontalSimbolo.inicio,
    topo: 0,
    largura: horizontalSimbolo.fim - horizontalSimbolo.inicio + 1,
    altura: faixaSimbolo.altura,
  });

  console.log(`Símbolo isolado: ${simbolo.largura}x${simbolo.altura}`);

  await mkdir(path.join(RAIZ, "public/icons"), { recursive: true });

  const gerados = [];

  const logoCompleta = path.join(RAIZ, "public/logo-fyntra.png");

  await paraSharp(completa)
    .resize({ width: 640, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(logoCompleta);

  gerados.push(logoCompleta);

  const logoSimbolo = path.join(RAIZ, "public/logo-simbolo.png");

  await paraSharp(simbolo)
    .resize({ width: 512, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(logoSimbolo);

  gerados.push(logoSimbolo);

  // Favicon e ícones: símbolo sobre fundo escuro, legível em tema claro.
  gerados.push(
    await iconeQuadrado(simbolo, 512, 0.12, path.join(RAIZ, "src/app/icon.png")),
  );

  gerados.push(
    await iconeQuadrado(
      simbolo,
      180,
      0.1,
      path.join(RAIZ, "src/app/apple-icon.png"),
    ),
  );

  gerados.push(
    await iconeQuadrado(
      simbolo,
      192,
      0.12,
      path.join(RAIZ, "public/icons/icon-192.png"),
    ),
  );

  gerados.push(
    await iconeQuadrado(
      simbolo,
      512,
      0.12,
      path.join(RAIZ, "public/icons/icon-512.png"),
    ),
  );

  // Maskable: o Android recorta em círculo, então a arte precisa de folga.
  gerados.push(
    await iconeQuadrado(
      simbolo,
      512,
      0.26,
      path.join(RAIZ, "public/icons/icon-maskable-512.png"),
    ),
  );

  console.log("\nArquivos gerados:");

  for (const arquivo of gerados) {
    const { width, height } = await sharp(arquivo).metadata();
    console.log(` - ${path.relative(RAIZ, arquivo)} (${width}x${height})`);
  }
}

principal().catch((erro) => {
  console.error("Falha ao gerar assets:", erro.message);
  process.exit(1);
});
