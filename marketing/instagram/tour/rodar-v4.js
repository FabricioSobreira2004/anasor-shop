#!/usr/bin/env node
// Driver do Tour do Site v4 — ver gerar-v4.js pros detalhes de cada
// peça. Este arquivo só ORQUESTRA: sintetiza a narração, monta a
// linha do tempo, ajusta os clipes, renderiza, mixa voz+música, gera
// legenda/.srt.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path');
const { lerArgs } = require('./src/cli');
const { montarRoteiroMobile } = require('./src/roteiro-mobile');
const { montarRoteiroDesktop } = require('./src/roteiro-desktop');
const { VOZES, VOZ_PADRAO, duracaoSegundos } = require('../narracao/narrar.js');
const G = require('./gerar-v4.js');

function duracaoSegundosArquivo(a) { return duracaoSegundos(a); }

// Mixa a voz (JÁ posicionada certinha na linha do tempo por
// montarVozCompleta — sem precisar de outro adelay) no vídeo
// silencioso: highpass+compressor+loudnorm na voz inteira, sem
// deslocar nada (ACHADO: reusar `mixar()` de narrar.js aqui duplicaria
// um adelay de 0,3s por cima de uma trilha que já começa no instante
// certo — deslocaria tudo).
function mixarVozPosicionada(video, vozWav, saida) {
  const filtroVoz = 'highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=20:release=250,loudnorm=I=-16:TP=-1.5:LRA=11';
  execFileSync(FFMPEG, [
    '-y', '-i', video, '-i', vozWav,
    '-filter_complex', `[1:a]${filtroVoz}[a]`,
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '128k', '-shortest', saida,
  ], { stdio: 'ignore' });
}

async function processarVersao(versao) {
  const manifestMobile = G.lerManifesto('mobile');
  const voz = VOZES[VOZ_PADRAO];
  const ritmo = voz.ritmoPadrao;

  fs.mkdirSync(G.SAIDA, { recursive: true });
  fs.mkdirSync(G.DADOS, { recursive: true });
  fs.mkdirSync(G.PRINTS, { recursive: true });
  fs.rmSync(G.PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(G.PUBLIC_DIR, { recursive: true });

  const cores = G.lerVariaveisCss();
  const browser = await chromium.launch();
  const pagina = await browser.newPage();
  const logoUri = await G.gerarLogoTransparente(pagina);
  await browser.close();
  const retratoUri = G.gerarRetratoDataUri();

  // ACHADO (repetido da Rodada 4 original, achado de novo aqui por
  // ter esquecido — ver tour.js): bundle() COPIA o conteúdo de
  // publicDir pro diretório temporário do bundle NA HORA da chamada,
  // não serve public/ ao vivo — os clipes AJUSTADOS (freeze/corte)
  // precisam estar em public/ ANTES do bundle(), nunca depois (1ª
  // tentativa bundlava antes de copiar os clipes — 404 pro clipe no
  // render, só descoberto rodando).

  if (versao === 'a') {
    console.log('\n=== Instagram (mobile) — sintetizando narração por cena ===');
    const { overridesDuracao, palavras, frases, duracaoTotalS } = G.construirTimelineMobile(voz, ritmo);
    const { cenas: cenasComLegendaCinetica, duracaoTotal } = montarRoteiroMobile(manifestMobile, overridesDuracao);
    // ACHADO RODANDO (1ª tentativa): roteiro-mobile.js sempre manda
    // `legendas` (legenda cinética antiga, texto DIFERENTE da
    // narração) — tour.js (pipeline v3) sempre removia isso
    // (semLegendaEmbutida) antes de montar os props; aqui esquecemos,
    // e as 2 legendas (cinética + karaokê) renderizaram juntas,
    // sobrepostas. Nunca mais usar a legenda cinética nesta versão —
    // só a karaokê (legendaBlocos).
    const cenas = cenasComLegendaCinetica.map((c) => ({ ...c, legendas: [] }));

    const overridesQuadrosPorClipe = {};
    for (const c of cenas) if (c.clipe) overridesQuadrosPorClipe[c.clipe] = c.duracao;
    console.log('\nAjustando clipes (freeze/corte) pra bater com a fala...');
    const clipes = await G.copiarClipesAjustados(manifestMobile, 'mobile', overridesQuadrosPorClipe, Object.keys(overridesQuadrosPorClipe));
    const bundleLocation = await bundle({ entryPoint: path.join(__dirname, 'src', 'index.js'), publicDir: G.PUBLIC_DIR });

    const blocos = G.agruparBlocosSemPreposicaoFinal(palavras);

    const props = { cenas, duracaoTotal, fps: G.FPS, cores, logoUri, retratoUri, clipes, legendaBlocos: blocos };
    const silencioso = await G.renderizar({ id: 'TourMobile', nome: 'tour-instagram-v4', props, bundleLocation, concurrency: 3 });

    const vozWav = path.join(G.DADOS, 'tour-instagram-voz.wav');
    G.montarVozCompleta(frases, duracaoTotalS, vozWav);

    const destinoFinal = path.join(G.SAIDA, 'tour-instagram-narrado.mp4');
    mixarVozPosicionada(silencioso, vozWav, destinoFinal);
    fs.rmSync(silencioso);

    const srtPath = path.join(G.SAIDA, 'tour-instagram.srt');
    G.escreverSrt(palavras, srtPath);

    const jsonPath = path.join(G.DADOS, 'tour-instagram.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ frases, palavras, duracaoTotalS }, null, 2), 'utf8');

    const finalComMusica = path.join(G.SAIDA, 'tour-instagram.mp4');
    G.arquivarSeExistir(finalComMusica);
    execFileSync(FFMPEG, [
      '-y', '-i', destinoFinal, '-stream_loop', '-1', '-i', G.MUSICA,
      '-filter_complex',
      `[1:a]atrim=0:${duracaoTotalS.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duracaoTotalS - 2).toFixed(3)}:d=2,volume=-26dB[musica];` +
      `[musica][0:a]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=450:makeup=1[musicaduck];` +
      `[musicaduck][0:a]amix=inputs=2:duration=first:normalize=0[mix];` +
      `[mix]loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
      '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '160k', '-shortest', '-movflags', '+faststart', finalComMusica,
    ], { stdio: 'inherit' });

    console.log(`\n✅ ${finalComMusica} — ${duracaoTotalS.toFixed(1)}s de narração / ${(duracaoTotal / G.FPS).toFixed(1)}s de vídeo`);
  }

  if (versao === 'b') {
    console.log('\n=== Portfólio (desktop) — sintetizando narração por cena ===');
    const manifestDesktop = G.lerManifesto('desktop');
    const { overrides, palavras, frases, duracaoTotalS } = G.construirTimelineDesktop(voz, ritmo);
    const { cenas, duracaoTotal, faixaTecnologias } = montarRoteiroDesktop(overrides);

    // Clipes desktop (1 por cena "lado-a-lado"/"desktop-solo") + os
    // clipes MOBILE compartilhados nas cenas lado-a-lado (precisam da
    // MESMA duração da cena, senão um dos 2 lados acaba antes do
    // outro).
    const overridesPorClipeDesktop = {};
    const overridesPorClipeMobile = {};
    for (const c of cenas) {
      if (c.desktop) overridesPorClipeDesktop[c.desktop] = c.duracao;
      if (c.mobile) overridesPorClipeMobile[c.mobile] = c.duracao;
    }
    console.log('\nAjustando clipes (freeze/corte) pra bater com a fala...');
    const clipesDesktop = await G.copiarClipesAjustados(manifestDesktop, 'desktop', overridesPorClipeDesktop, Object.keys(overridesPorClipeDesktop));
    const clipesMobile = await G.copiarClipesAjustados(manifestMobile, 'mobile', overridesPorClipeMobile, Object.keys(overridesPorClipeMobile));
    const bundleLocation = await bundle({ entryPoint: path.join(__dirname, 'src', 'index.js'), publicDir: G.PUBLIC_DIR });

    const props = { cenas, duracaoTotal, fps: G.FPS, cores, logoUri, retratoUri, clipesDesktop, clipesMobile, faixaTecnologias };
    const silencioso = await G.renderizar({ id: 'TourDesktop', nome: 'tour-portfolio-v4', props, bundleLocation, concurrency: 1 });

    const vozWav = path.join(G.DADOS, 'tour-portfolio-voz.wav');
    G.montarVozCompleta(frases, duracaoTotalS, vozWav);

    const destinoFinal = path.join(G.SAIDA, 'tour-portfolio-narrado.mp4');
    mixarVozPosicionada(silencioso, vozWav, destinoFinal);
    fs.rmSync(silencioso);

    const srtPath = path.join(G.SAIDA, 'tour-portfolio.srt');
    G.escreverSrt(palavras, srtPath);

    const jsonPath = path.join(G.DADOS, 'tour-portfolio.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ frases, palavras, duracaoTotalS }, null, 2), 'utf8');

    const finalComMusica = path.join(G.SAIDA, 'tour-portfolio.mp4');
    G.arquivarSeExistir(finalComMusica);
    execFileSync(FFMPEG, [
      '-y', '-i', destinoFinal, '-stream_loop', '-1', '-i', G.MUSICA,
      '-filter_complex',
      `[1:a]atrim=0:${duracaoTotalS.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duracaoTotalS - 2).toFixed(3)}:d=2,volume=-26dB[musica];` +
      `[musica][0:a]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=450:makeup=1[musicaduck];` +
      `[musicaduck][0:a]amix=inputs=2:duration=first:normalize=0[mix];` +
      `[mix]loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
      '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '160k', '-shortest', '-movflags', '+faststart', finalComMusica,
    ], { stdio: 'inherit' });

    console.log(`\n✅ ${finalComMusica} — ${duracaoTotalS.toFixed(1)}s de narração / ${(duracaoTotal / G.FPS).toFixed(1)}s de vídeo`);
  }
}

async function main() {
  const TEMP_E = 'E:/projetos/_tmp/remotion-tour-v4';
  fs.mkdirSync(TEMP_E, { recursive: true });
  process.env.TEMP = TEMP_E;
  process.env.TMP = TEMP_E;

  const args = lerArgs();
  const versao = args.versao || 'ambas';
  if (!['a', 'b', 'ambas'].includes(versao)) throw new Error('Uso: node rodar-v4.js --versao a|b|ambas');

  if (versao === 'a' || versao === 'ambas') await processarVersao('a');
  if (versao === 'b' || versao === 'ambas') await processarVersao('b');
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
