/**
 * Gera as variantes "tema claro" da logo a partir dos PNGs já processados
 * (fundo transparente) em public/logo-fyntra.png e public/logo-simbolo.png.
 *
 *   node scripts/gerar-tema-claro.mjs
 *
 * O traço branco da logo (a parte de baixo do "F") só existe pra contrastar
 * com fundo escuro. Em vez de gerar tudo de novo a partir da logo original,
 * este script parte dos PNGs já recortados/sem fundo e troca só os pixels
 * "brancos" (baixa saturação, alto brilho) por um tom escuro — dourado e
 * verde, que já têm saturação própria, saem intactos.
 *
 * Saídas:
 *   public/logo-fyntra-light.png
 *   public/logo-simbolo-light.png
 */

import path from "node:path";

import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");

/** Cor que substitui o branco no tema claro — mesmo tom de --text-1 claro. */
const COR_ESCURA = { r: 15, g: 23, b: 42 };

/** Acima disso é "claro"; abaixo, mantém a cor original. */
const LIMIAR_BRILHO = 0.55;

/** Abaixo disso é "sem cor" (cinza/branco); acima, é dourado/verde — mantém. */
const LIMIAR_SATURACAO = 0.18;

async function paraTemaClaro(origem, destino) {
  const { data, info } = await sharp(origem)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const saida = Buffer.from(data);

  for (let i = 0; i < saida.length; i += 4) {
    const r = saida[i];
    const g = saida[i + 1];
    const b = saida[i + 2];

    const maximo = Math.max(r, g, b);
    const minimo = Math.min(r, g, b);

    const brilho = maximo / 255;
    const saturacao = maximo === 0 ? 0 : (maximo - minimo) / maximo;

    if (brilho >= LIMIAR_BRILHO && saturacao <= LIMIAR_SATURACAO) {
      saida[i] = COR_ESCURA.r;
      saida[i + 1] = COR_ESCURA.g;
      saida[i + 2] = COR_ESCURA.b;
    }
  }

  await sharp(saida, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(destino);

  console.log(`${path.relative(RAIZ, destino)} (${info.width}x${info.height})`);
}

async function principal() {
  await paraTemaClaro(
    path.join(RAIZ, "public/logo-fyntra.png"),
    path.join(RAIZ, "public/logo-fyntra-light.png"),
  );

  await paraTemaClaro(
    path.join(RAIZ, "public/logo-simbolo.png"),
    path.join(RAIZ, "public/logo-simbolo-light.png"),
  );
}

principal().catch((erro) => {
  console.error("Falha ao gerar tema claro:", erro.message);
  process.exit(1);
});
