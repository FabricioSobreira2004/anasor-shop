#!/usr/bin/env node
// ============================================================
// CLI de composição/render do Tour do Site (Rodada 4).
//
//   node tour.js --versao a      (Instagram, 1080x1920)
//   node tour.js --versao b      (portfólio/LinkedIn, 1920x1080)
//   node tour.js --versao ambas
//
// Pré-requisito: já ter rodado "node src/capturar.js --device mobile"
// e "--device desktop" (manifest.json + clipes em .tmp/capturas/).
// Saída: E:\projetos\site-mae\tour\tour-instagram.mp4 /
// tour-portfolio.mp4 (1080x1920/1920x1080, H.264 High, yuv420p,
// faststart, sem áudio) + quadros de conferência em
// tour\_conferencia\.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path'); // util puro (sem React/Remotion) — seguro reaproveitar, ver DECISOES.md
const { lerArgs } = require('./src/cli');
const { FPS } = require('./src/dispositivos');
const { montarRoteiroMobile } = require('./src/roteiro-mobile');
const { montarRoteiroDesktop } = require('./src/roteiro-desktop');
const { agruparBlocos } = require('./src/blocos-legenda');

const RAIZ = path.resolve(__dirname, '..', '..', '..'); // anasor-shop
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIR_CAPTURAS = path.join(__dirname, '.tmp', 'capturas');
// TOUR_SAIDA_DIR (opcional) — Rodada 10 (v3): permite redirecionar a
// saída pra uma subpasta nova (tour\v3\) SEM tocar no pipeline v2
// (mesmo padrão de LEGENDAR_* em narracao/legendar.js). Sem a env var,
// comportamento idêntico a sempre.
const SAIDA = process.env.TOUR_SAIDA_DIR || path.resolve(RAIZ, '..', 'site-mae', 'tour');
const SAIDA_CONFERENCIA = path.join(SAIDA, '_conferencia');

// Legenda cinética do Remotion (Rodada 4/5, roteiro-mobile.js/
// roteiro-desktop.js) e a legenda NOVA, sincronizada com a narração
// e queimada depois por `narracao/legendar.js`, são DOIS sistemas
// diferentes — rodar os dois juntos dá "legenda dupla" (achado do
// Fabrício, Rodada 9: textos diferentes, fora de sincronia, um por
// cima do outro). Por padrão agora a legenda cinética NÃO renderiza
// (`--com-legenda-embutida` liga de volta, só se algum dia fizer
// sentido publicar sem narração). As `legendas:` continuam no
// roteiro — descrevem o que cada cena mostra e isso ainda é útil
// como referência pra escrever o roteiro de narração.
// `legendas` (Versão A/mobile) e `destaques` (Versão B/desktop,
// DestaqueTecnico) são os 2 nomes do mesmo problema — texto
// descritivo embutido no Remotion, hoje conflitando com a legenda da
// narração.
function semLegendaEmbutida(cenas, args) {
  if (args['com-legenda-embutida']) return cenas;
  return cenas.map((c) => {
    const limpa = { ...c };
    if (limpa.legendas) limpa.legendas = [];
    if (limpa.destaques) limpa.destaques = [];
    return limpa;
  });
}

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function lerVariaveisCss() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'style.css'), 'utf8');
  const pegar = (nome) => {
    const m = css.match(new RegExp(`--${nome}:\\s*((?:url\\(|#)[^;]+);`));
    if (!m) throw new Error(`Variável --${nome} não encontrada em style.css`);
    return m[1].trim();
  };
  return {
    fundo: pegar('cor-fundo'),
    texto: pegar('cor-texto'),
    destaque: pegar('cor-destaque'),
    destaqueEscuro: pegar('cor-destaque-escuro'),
    secundaria: pegar('cor-secundaria'),
  };
}

// Mesma técnica de reels/reel.js (gerarLogoTransparente) — duplicada
// de propósito (pacote próprio, ver DECISOES.md).
async function gerarLogoTransparente(pagina) {
  const jpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));
  const uri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  return pagina.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const CORTE_TOTAL = 250;
    const CORTE_INICIO = 228;
    for (let i = 0; i < d.length; i += 4) {
      const luminancia = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminancia >= CORTE_TOTAL) d[i + 3] = 0;
      else if (luminancia > CORTE_INICIO) d[i + 3] = Math.round(255 * (CORTE_TOTAL - luminancia) / (CORTE_TOTAL - CORTE_INICIO));
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }, uri);
}

// Retrato da Anasor (img/institucional/quem-somos.jpg) pro fechamento
// rico (Rodada 5, item 2) — SEM remover fundo (é uma ilustração com
// fundo próprio, diferente da logo): só base64 direto, mesmo padrão
// de leitura de arquivo da logo, sem processar nada.
function gerarRetratoDataUri() {
  const jpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'quem-somos.jpg'));
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

// Por quê um clipe às vezes precisa ser "esticado": <OffthreadVideo
// loop> do Remotion exige um <Sequence durationInFrames> explícito
// ("requires a finite durationInFrames" — erro só visto rodando), e
// cada cena já troca de <Sequence> por fora (ver templates). Mais
// simples e robusto garantir ANTES, com ffmpeg, que o ARQUIVO já tem
// quadros o bastante — nunca depender do player repetir nada em
// tempo de render.
//
// IMPORTANTE (achado de performance): só esticar os clipes que
// REALMENTE precisam, e só até o mínimo de cada um — a 1ª versão
// deste script esticava TODO clipe pra 360 quadros, sempre, mesmo na
// Versão A (onde nenhuma cena passa do tamanho real do próprio
// clipe). Isso deixava os vídeos muito maiores que o necessário e o
// compositor do Remotion (cache de decodificação) MUITO mais lento —
// cada seek de frame chegou a levar 3-6 SEGUNDOS. Ver DECISOES.md.
function calcularMinimosNecessarios(cenas) {
  const minimos = {};
  for (const cena of cenas) {
    if (cena.desktop) minimos[cena.desktop] = Math.max(minimos[cena.desktop] || 0, cena.duracao);
    if (cena.mobile) minimos[cena.mobile] = Math.max(minimos[cena.mobile] || 0, cena.duracao);
  }
  return minimos;
}

// Copia os clipes de um device pra public/ (staticFile do Remotion
// exige publicDir) e devolve um manifesto com caminho RELATIVO (o que
// resolverSrc()/staticFile() esperam) em vez do caminho absoluto de
// .tmp/capturas. `minimos[nome]` (opcional) é o menor nº de quadros
// que aquele clipe precisa ter — se faltar, "estica" repetindo o
// próprio clipe (ffmpeg -stream_loop), nunca distorce nem acelera.
function copiarClipesParaPublic(manifestoAbsoluto, device, minimos = {}) {
  const relativo = {};
  for (const [nome, info] of Object.entries(manifestoAbsoluto)) {
    const destinoRelativo = `clipes/${device}/${nome}.mp4`;
    const destino = path.join(PUBLIC_DIR, destinoRelativo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const minimo = minimos[nome] || 0;
    if (info.quadros >= minimo) {
      fs.copyFileSync(info.arquivo, destino);
    } else {
      const repeticoes = Math.ceil(minimo / info.quadros);
      execFileSync(FFMPEG, [
        '-y', '-stream_loop', String(repeticoes - 1), '-i', info.arquivo,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p',
        '-frames:v', String(minimo), destino,
      ], { stdio: 'inherit' });
    }
    relativo[nome] = { ...info, arquivo: destinoRelativo };
  }
  return relativo;
}

function lerManifesto(device) {
  const arquivo = path.join(DIR_CAPTURAS, device, 'manifest.json');
  if (!fs.existsSync(arquivo)) {
    throw new Error(`Manifesto de captura "${device}" não encontrado (${arquivo}) — rode "node src/capturar.js --device ${device}" antes.`);
  }
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

async function renderizar({ id, nome, props, bundleLocation }) {
  console.log(`\nRenderizando "${nome}" (composição ${id}, ${(props.duracaoTotal / FPS).toFixed(1)}s, ${props.duracaoTotal} quadros)...`);

  const composition = await selectComposition({ serveUrl: bundleLocation, id, inputProps: props });

  fs.mkdirSync(SAIDA, { recursive: true });
  fs.mkdirSync(SAIDA_CONFERENCIA, { recursive: true });
  const saidaBruta = path.join(SAIDA, `_bruto-${nome}.mp4`);
  // concurrency MENOR que o padrão (8, 1 por núcleo) — achado nesta
  // rodada: o render morria sem mensagem de erro clara, sempre no
  // meio da renderização de verdade (não no carregamento), com o
  // cache do compositor perto de 2-3GB numa máquina com só ~8,8GB
  // livres. "TourDesktop" (Versão B) decodifica 2 vídeos por quadro
  // (desktop + celular lado a lado) — dobra a memória por thread
  // comparado a "TourMobile" (1 vídeo só), por isso precisa do nível
  // mais conservador (1, sequencial); concurrency:3 já bastou pra
  // "TourMobile" sem morrer, bem mais rápido que rodar tudo em série.
  const concurrency = id === 'TourDesktop' ? 1 : 3;
  await renderMedia({
    composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: saidaBruta,
    inputProps: props, pixelFormat: 'yuv420p', crf: 18, x264Preset: 'slow', logLevel: 'verbose',
    concurrency,
  });

  const saidaFinal = path.join(SAIDA, `${nome}.mp4`);
  // Regra fixa (sempre, desde a Rodada 7): nunca sobrescrever um .mp4
  // final sem arquivar a versão anterior antes. tour.js RE-RENDERIZA
  // da fonte (Remotion) — isso ainda não tinha o arquivamento que
  // narrar.js/legendar.js já tinham (achado da Rodada 9: um
  // `node tour.js` direto sobrescrevia sem arquivar).
  if (fs.existsSync(saidaFinal)) {
    const dirAnteriores = path.join(SAIDA, '_anteriores', dataHoje());
    fs.mkdirSync(dirAnteriores, { recursive: true });
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const hora = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    fs.copyFileSync(saidaFinal, path.join(dirAnteriores, `${nome}-remotion-${hora}.mp4`));
  }
  execFileSync(FFMPEG, [
    '-y', '-i', saidaBruta, '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', saidaFinal,
  ], { stdio: 'inherit' });
  fs.rmSync(saidaBruta);

  const duracaoS = props.duracaoTotal / FPS;
  const pontos = [0, 0.25, 0.5, 0.75, 0.98];
  for (const [i, p] of pontos.entries()) {
    const t = Math.max(0, p * duracaoS).toFixed(2);
    const arquivo = path.join(SAIDA_CONFERENCIA, `${nome}-${i + 1}.png`);
    execFileSync(FFMPEG, ['-y', '-ss', t, '-i', saidaFinal, '-frames:v', '1', '-update', '1', arquivo], { stdio: 'inherit' });
    if (!fs.existsSync(arquivo)) throw new Error(`Quadro de conferência ${i + 1} (t=${t}s) não foi gerado`);
  }

  const infoRaw = execFileSync(FFPROBE, [
    '-v', 'error', '-show_entries', 'format=duration,size',
    '-show_entries', 'stream=width,height,avg_frame_rate,codec_name,pix_fmt,profile',
    '-of', 'json', saidaFinal,
  ]).toString();
  const info = JSON.parse(infoRaw);
  const streamVideo = info.streams.find((s) => s.codec_name === 'h264') || info.streams[0];
  const tamanhoMB = (Number(info.format.size) / 1024 / 1024).toFixed(1);
  const [fpsNum, fpsDen] = streamVideo.avg_frame_rate.split('/').map(Number);
  console.log(`\n✅ ${nome}.mp4`);
  console.log(`   ${streamVideo.width}x${streamVideo.height} · ${streamVideo.codec_name} ${streamVideo.profile} · ${streamVideo.pix_fmt} · ${(fpsNum / fpsDen).toFixed(2)}fps · ${Number(info.format.duration).toFixed(1)}s · ${tamanhoMB}MB`);
  console.log(`   Saída: ${saidaFinal}`);
  return saidaFinal;
}

async function main() {
  // Redireciona TEMP/TMP pro drive E: (mesmo padrão de narrar.js) —
  // achado da Rodada 9: o disco C: estava com só 2,6GB livres (não
  // 0 bytes como na Rodada 5, mas baixo o bastante pra o Chrome do
  // Remotion recusar carregar um clipe de vídeo durante o render,
  // "Chrome rejecting the request because the disk space is low").
  // tour.js nunca tinha esse redirecionamento (narrar.js/legendar.js
  // já tinham, por isso nunca deram esse erro).
  const TEMP_E = 'E:/projetos/_tmp/remotion-tour';
  fs.mkdirSync(TEMP_E, { recursive: true });
  process.env.TEMP = TEMP_E;
  process.env.TMP = TEMP_E;

  const args = lerArgs();
  const versao = args.versao || 'ambas';
  if (!['a', 'b', 'ambas'].includes(versao)) throw new Error('Uso: node tour.js --versao a|b|ambas');

  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const cores = lerVariaveisCss();
  const browser = await chromium.launch();
  const pagina = await browser.newPage();
  const logoUri = await gerarLogoTransparente(pagina);
  await browser.close();
  const retratoUri = gerarRetratoDataUri();

  // Monta os props de CADA versão pedida ANTES de bundlar — o
  // bundle() do Remotion COPIA o conteúdo de publicDir pro próprio
  // diretório temporário do bundle NA HORA (não serve public/ ao
  // vivo, como uma 1ª versão deste comentário supunha — achado só
  // rodando "--versao ambas": a Versão A dava 404 procurando um
  // clipe, porque esse clipe só tinha sido copiado DEPOIS do bundle).
  // Por isso os 2 blocos abaixo só preparam `propsPorVersao` — a
  // cópia pra public/ (copiarClipesParaPublic) e o bundle() só rodam
  // depois, uma vez, com TUDO que qualquer versão pedida precisa já
  // no lugar.
  const propsPorVersao = {};

  // Manifesto/clipes mobile são lidos e copiados pra public/ 1 SÓ VEZ
  // (achado do simplify: em "--versao ambas", o caminho padrão, uma
  // 1ª versão lia o manifest.json mobile 2x e copiava os clipes 2x —
  // a 1ª cópia, sem padding, era sempre jogada fora pela 2ª, que
  // sobrescrevia os MESMOS arquivos já com o padding da Versão B).
  // `minimos` vem das cenas da Versão B quando ela é pedida — um
  // clipe "esticado" de sobra nunca atrapalha a Versão A, que só usa
  // os quadros que o próprio roteiro pede (ver DECISOES.md).
  const roteiroB = (versao === 'b' || versao === 'ambas') ? montarRoteiroDesktop() : null;
  const minimosMobile = roteiroB ? calcularMinimosNecessarios(roteiroB.cenas) : {};

  let clipesMobile = null;
  if (versao === 'a' || versao === 'b' || versao === 'ambas') {
    clipesMobile = copiarClipesParaPublic(lerManifesto('mobile'), 'mobile', minimosMobile);
  }

  if (versao === 'a' || versao === 'ambas') {
    const { cenas, duracaoTotal } = montarRoteiroMobile(clipesMobile);
    // --legenda-json <sidecar.json> (Rodada 10/v3, opcional) — queima a
    // legenda karaokê DENTRO da composição (narracao/narrar-tour-v3.js
    // já rodou antes e gravou os tempos de palavra; tour.js só agrupa
    // em blocos de 3-6 palavras, mesma função usada pro .srt — ver
    // DECISOES.md pro motivo de não ser mais um overlay de vídeo
    // transparente).
    let legendaBlocos = null;
    if (args['legenda-json']) {
      const dadosLegenda = JSON.parse(fs.readFileSync(args['legenda-json'], 'utf8'));
      legendaBlocos = agruparBlocos(dadosLegenda.palavras);
    }
    propsPorVersao.a = { cenas: semLegendaEmbutida(cenas, args), duracaoTotal, fps: FPS, cores, logoUri, retratoUri, clipes: clipesMobile, legendaBlocos };
  }

  if (roteiroB) {
    const { cenas, duracaoTotal, faixaTecnologias } = roteiroB;
    const clipesDesktop = copiarClipesParaPublic(lerManifesto('desktop'), 'desktop', minimosMobile);
    propsPorVersao.b = { cenas: semLegendaEmbutida(cenas, args), duracaoTotal, fps: FPS, cores, logoUri, retratoUri, clipesDesktop, clipesMobile, faixaTecnologias };
  }

  // 1 bundle só, reaproveitado por quantas composições forem pedidas
  // (achado do code-review: "--versao ambas" bundlava 2x o MESMO
  // entry point, que já registra as 2 composições — tempo perdido à
  // toa, ainda mais num pipeline que esta rodada já tratou a
  // performance com cuidado).
  const bundleLocation = await bundle({ entryPoint: path.join(__dirname, 'src', 'index.js'), publicDir: PUBLIC_DIR });

  if (propsPorVersao.a) {
    await renderizar({ id: 'TourMobile', nome: 'tour-instagram', props: propsPorVersao.a, bundleLocation });
  }
  if (propsPorVersao.b) {
    await renderizar({ id: 'TourDesktop', nome: 'tour-portfolio', props: propsPorVersao.b, bundleLocation });
  }

  console.log(`\nQuadros de conferência: ${SAIDA_CONFERENCIA}`);
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
