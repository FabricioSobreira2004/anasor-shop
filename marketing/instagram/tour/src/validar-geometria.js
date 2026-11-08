#!/usr/bin/env node
// ============================================================
// Validação GEOMÉTRICA (Rodada 5, item 1a) — prova por código, não só
// visualmente, que o celular (com zoom/panorâmica da câmera) NUNCA
// alcança a faixa da legenda, em NENHUM quadro de NENHUMA cena.
//
// Como: EASE_CAMERA (bezier 0.16,1,0.3,1) é monotônica de 0 a 1, sem
// "overshoot" — então o retângulo do celular ao longo de uma cena
// inteira fica sempre DENTRO do envelope formado pelos extremos
// (t=0 e t=1, já limitados por CAMERA_ESCALA_*/CAMERA_TRANSLATE_* em
// componentes.js). Não precisa simular quadro a quadro: testar os 2
// extremos de cada cena é matematicamente equivalente a testar todos.
//
//   node src/validar-geometria.js
//
// Saída: 1 linha por cena (celular: topo/fundo; legenda: topo/fundo
// estimado) + PASS/FAIL. Sai com código 1 se algo não bater.
const fs = require('fs');
const path = require('path');
const { LAYOUT_CELULAR } = require('./componentes');
const { montarRoteiroMobile } = require('./roteiro-mobile');

const ALTURA_CANVAS = 1920;
// Zona segura NOVA (Rodada 10/v3, pedido explícito): 220px no topo e
// 250px na base — não mais 250/420 (eram os números da versão
// anterior, com o celular menor).
const ZONA_SEGURA_TOPO = 220;
const ZONA_SEGURA_BASE = 1920 - 250; // = 1670 — nada importante abaixo disso
const GAP_MINIMO_CELULAR_LEGENDA = 20;

// Estimativa CONSERVADORA da altura da legenda — ATUALIZADA na Rodada
// 9: a legenda cinética embutida (LegendaCinetica, até 6 palavras em
// 62px/3 linhas) foi DESATIVADA no render (ver tour.js,
// semLegendaEmbutida) — quem queima legenda agora é
// narracao/legendar.js, com no máximo 2 linhas e fonte 42
// (CATEGORIAS.tourMobile.fonte, mesmo número aqui pra não desalinhar).
// Cada linha ~ fontSize*1.2 (texto) + 16 (padding vertical do "pill")
// + 12 (gap entre linhas).
function alturaMaximaLegendaEstimada(tamanhoFonte = 42) {
  const alturaLinha = tamanhoFonte * 1.2 + 16;
  const LINHAS_MAX = 2;
  const GAP_ENTRE_LINHAS = 12;
  return alturaLinha * LINHAS_MAX + GAP_ENTRE_LINHAS * (LINHAS_MAX - 1);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Retângulo vertical do celular NO PIOR CASO (envelope dos extremos
// de escala/translate, já clampados como o componente faz de verdade).
function retanguloCelularPiorCaso(cena) {
  const centro = LAYOUT_CELULAR.TOPO + LAYOUT_CELULAR.ALTURA / 2;
  const escalas = [cena.de.escala, cena.para.escala].map((e) =>
    clamp(e, LAYOUT_CELULAR.CAMERA_ESCALA_MIN, LAYOUT_CELULAR.CAMERA_ESCALA_MAX));
  const ys = [cena.de.y, cena.para.y].map((y) =>
    clamp(y, -LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT, LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT));
  const escalaMax = Math.max(...escalas);
  // Pixel de deslocamento mais NEGATIVO (sobe o celular) e mais
  // POSITIVO (desce o celular) entre os 2 extremos da cena (de/para)
  // — cada ponta usa só a direção que de fato piora aquele lado do
  // retângulo (achado corrigindo o 1º cálculo: somar as DUAS direções
  // no mesmo lado inflava o resultado sem sentido físico — a câmera
  // nunca está ao mesmo tempo deslocada pra cima E pra baixo).
  const pxPositivoMax = Math.max(0, ...ys.map((y) => (y * LAYOUT_CELULAR.ALTURA) / 100));
  const pxNegativoMin = Math.min(0, ...ys.map((y) => (y * LAYOUT_CELULAR.ALTURA) / 100));
  const fundo = centro + (LAYOUT_CELULAR.ALTURA / 2) * escalaMax + pxPositivoMax;
  const topo = centro - (LAYOUT_CELULAR.ALTURA / 2) * escalaMax + pxNegativoMin;
  return { topo, fundo, escalaMax };
}

function main() {
  const manifestoPath = path.join(__dirname, '..', '.tmp', 'capturas', 'mobile', 'manifest.json');
  if (!fs.existsSync(manifestoPath)) {
    throw new Error(`Manifesto não encontrado em ${manifestoPath} — rode "node src/capturar.js --device mobile" antes (a validação usa a duração real de cada clipe).`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestoPath, 'utf8'));
  const { cenas } = montarRoteiroMobile(manifest);

  let tudoOk = true;
  for (const cena of cenas) {
    if (cena.tipo === 'fecho') continue; // sem celular nessa cena

    const celular = retanguloCelularPiorCaso(cena);
    const legendas = cena.legendas || [];
    const legendaTopo = LAYOUT_CELULAR.CAPTION_TOP;
    const maiorFonte = legendas.reduce((max, l) => Math.max(max, l.tamanho || 42), 42);
    const legendaFundo = legendaTopo + alturaMaximaLegendaEstimada(maiorFonte);

    const semSobreposicao = celular.fundo + GAP_MINIMO_CELULAR_LEGENDA <= legendaTopo;
    const celularNaZonaSegura = celular.topo >= ZONA_SEGURA_TOPO;
    const legendaNaZonaSegura = legendas.length === 0 || legendaFundo <= ZONA_SEGURA_BASE;

    const ok = semSobreposicao && celularNaZonaSegura && legendaNaZonaSegura;
    tudoOk = tudoOk && ok;

    const status = ok ? '✅' : '❌';
    console.log(
      `${status} ${cena.nome.padEnd(20)} celular: ${celular.topo.toFixed(0)}–${celular.fundo.toFixed(0)}` +
      (legendas.length ? `  legenda: ${legendaTopo}–${legendaFundo.toFixed(0)}` : '  (sem legenda)')
    );
    if (!semSobreposicao) console.log(`     FALHA: fundo do celular (${celular.fundo.toFixed(0)}) + ${GAP_MINIMO_CELULAR_LEGENDA}px encosta na legenda (topo ${legendaTopo})`);
    if (!celularNaZonaSegura) console.log(`     FALHA: topo do celular (${celular.topo.toFixed(0)}) invade a zona segura do topo (<${ZONA_SEGURA_TOPO})`);
    if (!legendaNaZonaSegura) console.log(`     FALHA: fundo da legenda (${legendaFundo.toFixed(0)}) invade a zona segura de baixo (>${ZONA_SEGURA_BASE})`);
  }

  console.log(tudoOk ? '\n✅ Geometria OK em todas as cenas — celular e legenda nunca se sobrepõem, mesmo no pior caso de zoom/panorâmica.' : '\n❌ Alguma cena falhou — ver acima.');
  return tudoOk;
}

const ok = main();
process.exit(ok ? 0 : 1);
