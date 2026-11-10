#!/usr/bin/env node
// ============================================================
// Tour do Site v6 (Rodada 13) — SEM narração sintética nenhuma
// (decisão do Fabrício: a voz Piper, mesmo na config D escolhida por
// medição na v5, soa robótica/arrastada — narração e legenda passam a
// ser feitas por fora, CapCut/Clipchamp). Visual idêntico à v5
// (celular grande, logo, rolagem, cartão final, cenas e DURAÇÕES) —
// este arquivo só RECONSTRÓI as mesmas durações de cena a partir do
// JSON já salvo pela v5 (`tour/v5/_dados/*.json`, que guarda a
// duração REAL de cada trecho sintetizado), sem chamar o Piper de
// novo — é pura aritmética (mesma conta de `gerar-v5.js`
// construirTimelineMobileV5/DesktopV5, só trocando "sintetizar agora"
// por "ler a duração que já foi medida"). O Instagram precisa de 1
// RE-RENDER do Remotion (pra tirar a legenda queimada — a v5 já tinha
// isso no vídeo, não dá pra "apagar" pixel); o portfólio NUNCA teve
// legenda queimada, então reaproveita o vídeo silencioso da v5 direto
// (sem render nenhum).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderMedia, renderStill, selectComposition } = require('@remotion/renderer');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path');
const {
  FPS, LEAD, GAP, MIN_CENA, TRAIL_FECHO, PAD_CHECKOUT, MUSICA,
  dividirDuracaoEntreClipes, dataHoje,
} = require('./gerar-v5.js');
const { FRASES_MOBILE_V5, FECHO_MOBILE_V5, FRASES_DESKTOP_V5 } = require('../narracao/roteiro-v5-dados.js');

const SAIDA = 'E:/projetos/site-mae/tour/v6';
const PRINTS = 'E:/projetos/site-mae/_prints/tours-v6';
const DADOS_V5 = 'E:/projetos/site-mae/tour/v5/_dados';
const SAIDA_V5 = 'E:/projetos/site-mae/tour/v5';

function lerDadosV5(nome) {
  return JSON.parse(fs.readFileSync(path.join(DADOS_V5, `${nome}.json`), 'utf8'));
}

// Mesma conta de construirTimelineMobileV5 (gerar-v5.js), mas a
// duração de cada TRECHO vem do JSON já salvo (`frases[].duracao`,
// medida na síntese da v5) — nunca sintetiza de novo. Retorna só
// `overridesDuracao` (frames por cena/clipe) e `duracaoTotalS` — não
// precisa de `palavras` nem `frases` com arquivo de áudio (v6 não tem
// voz nenhuma).
function reconstruirOverridesMobile(manifestCheckoutCep, dadosJson) {
  const porCena = {};
  for (const f of dadosJson.frases) porCena[f.cena] = f.duracao;

  const overridesDuracao = {};
  let cursorS = 0;
  for (const grupo of FRASES_MOBILE_V5) {
    const duracao = porCena[grupo.id];
    if (duracao == null) throw new Error(`Trecho "${grupo.id}" não encontrado no JSON da v5`);
    let duracaoTrechoS = Math.max(duracao + GAP, MIN_CENA);
    if (grupo.cenas.includes('checkout')) duracaoTrechoS += PAD_CHECKOUT;
    const framesTotais = Math.round(duracaoTrechoS * FPS);
    Object.assign(overridesDuracao, dividirDuracaoEntreClipes(manifestCheckoutCep, grupo.cenas, framesTotais));
    cursorS += duracaoTrechoS;
  }
  const duracaoFecho = porCena.fecho;
  if (duracaoFecho == null) throw new Error('Trecho "fecho" não encontrado no JSON da v5');
  const duracaoFechoCenaS = duracaoFecho + GAP + TRAIL_FECHO;
  overridesDuracao.fecho = Math.round(duracaoFechoCenaS * FPS);
  cursorS += duracaoFechoCenaS;

  return { overridesDuracao, duracaoTotalS: cursorS };
}

// Mesma conta de construirTimelineDesktopV5 — zippa FRASES_DESKTOP_V5
// (ordem fixa, de onde vem `balao`) com `dadosJson.frases` (MESMA
// ordem — construirTimelineDesktopV5 empurra nessa ordem — de onde
// vem a duração real medida).
function reconstruirOverridesDesktop(dadosJson) {
  if (dadosJson.frases.length !== FRASES_DESKTOP_V5.length) {
    throw new Error('Número de frases do JSON da v5 não bate com roteiro-v5-dados.js (portfólio)');
  }
  const grupos = [];
  FRASES_DESKTOP_V5.forEach((item, i) => {
    const duracao = dadosJson.frases[i].duracao;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.cena === item.cena) ultimo.itens.push({ ...item, duracao });
    else grupos.push({ cena: item.cena, itens: [{ ...item, duracao }] });
  });

  const overrides = {};
  let cursorS = 0;
  for (const grupo of grupos) {
    let offsetDentro = LEAD;
    grupo.itens.forEach((item) => {
      offsetDentro += item.duracao + GAP;
    });
    let duracaoGrupoS = Math.max(offsetDentro - GAP + 0.1, MIN_CENA);
    if (grupo.cena === 'fecho') duracaoGrupoS += TRAIL_FECHO;
    overrides[grupo.cena] = { duracao: Math.round(duracaoGrupoS * FPS) };
    cursorS += duracaoGrupoS;
  }
  return { overrides, duracaoTotalS: cursorS };
}

function arquivarSeExistir(destinoFinal) {
  if (!fs.existsSync(destinoFinal)) return;
  const dirAnteriores = path.join(SAIDA, '_anteriores', dataHoje());
  fs.mkdirSync(dirAnteriores, { recursive: true });
  const d = new Date();
  const pad2 = (n) => String(n).padStart(2, '0');
  const hora = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  fs.copyFileSync(destinoFinal, path.join(dirAnteriores, `${path.basename(destinoFinal, '.mp4')}-${hora}.mp4`));
}

// Valida 3 quadros (início, meio, fim) por renderStill ANTES do render
// completo (pedido explícito, item 1 — "só 1 render completo, depois
// de validar 3 quadros") — bem mais barato que renderizar os ~40s
// inteiros só pra descobrir que a legenda ficou ligada por engano.
async function validarQuadros({ id, props, bundleLocation }) {
  const composition = await selectComposition({ serveUrl: bundleLocation, id, inputProps: props });
  fs.mkdirSync(PRINTS, { recursive: true });
  const frames = [0, Math.round(props.duracaoTotal / 2), props.duracaoTotal - 1];
  const nomes = ['inicio', 'meio', 'fim'];
  for (let i = 0; i < frames.length; i += 1) {
    const out = path.join(PRINTS, `valida-${id}-${nomes[i]}.png`);
    await renderStill({ composition, serveUrl: bundleLocation, output: out, frame: frames[i], inputProps: props });
    console.log(`  validação: ${out}`);
  }
}

async function renderizar({ id, nome, props, bundleLocation, concurrency }) {
  console.log(`\nRenderizando "${nome}" (${id}, ${(props.duracaoTotal / FPS).toFixed(1)}s)...`);
  const composition = await selectComposition({ serveUrl: bundleLocation, id, inputProps: props });
  fs.mkdirSync(SAIDA, { recursive: true });
  const saidaBruta = path.join(SAIDA, `_bruto-${nome}.mp4`);
  await renderMedia({
    composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: saidaBruta,
    inputProps: props, pixelFormat: 'yuv420p', crf: 18, x264Preset: 'slow', logLevel: 'verbose', concurrency,
  });
  const saidaSilenciosa = path.join(SAIDA, `_silencioso-${nome}.mp4`);
  execFileSync(FFMPEG, [
    '-y', '-i', saidaBruta, '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', saidaSilenciosa,
  ], { stdio: 'inherit' });
  fs.rmSync(saidaBruta);
  return saidaSilenciosa;
}

// Mixa SÓ a trilha (sem voz nenhuma) — loop contínuo, fade-in 1s/
// fade-out 2s, loudnorm -24 LUFS / pico -3dBTP (pedido explícito:
// "baixinha mas audível", o Fabrício abaixa mais no app quando entrar
// a voz). Também salva a trilha ISOLADA já no tamanho do vídeo
// (`musicaIsoladaWav`), caso ele queira usar fora.
function mixarSoMusica(videoSilencioso, duracaoTotalS, saidaFinal, musicaIsoladaWav) {
  execFileSync(FFMPEG, [
    '-y', '-stream_loop', '-1', '-i', MUSICA,
    '-filter_complex',
    `[0:a]atrim=0:${duracaoTotalS.toFixed(3)},asetpts=PTS-STARTPTS,` +
    `afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duracaoTotalS - 2).toFixed(3)}:d=2,` +
    `loudnorm=I=-24:TP=-3:LRA=11[aout]`,
    '-map', '[aout]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-y', musicaIsoladaWav,
  ], { stdio: 'ignore' });

  execFileSync(FFMPEG, [
    '-y', '-i', videoSilencioso, '-i', musicaIsoladaWav,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', saidaFinal,
  ], { stdio: 'ignore' });
}

module.exports = {
  SAIDA, PRINTS, SAIDA_V5,
  lerDadosV5, reconstruirOverridesMobile, reconstruirOverridesDesktop,
  arquivarSeExistir, validarQuadros, renderizar, mixarSoMusica,
};
