#!/usr/bin/env node
// Driver do Tour do Site v5 (Rodada 12) — ver gerar-v5.js pros
// detalhes de cada peça. Mesma orquestração da v4 (rodar-v4.js):
// sintetiza a narração, monta a linha do tempo, ajusta os clipes,
// renderiza, mixa voz+música, gera legenda/.srt. Visual idêntico à
// v4 — só a narração (roteiro+síntese+tempo de palavra) muda.
//
//   node rodar-v5.js --versao a|b|ambas [--config A|B|C|D]
//
// --config (pedido explícito, item 3 — "deixe um comando pronto pra
// eu trocar de configuração depois e regerar SÓ áudio+tempo+legenda,
// sem refazer o visual"): sem a flag, usa CONFIG_PADRAO_V5 (a
// vencedora da medição, ver configs-sintese-v5.js/DECISOES.md).
// Trocar de config SEMPRE regera áudio+tempo+legenda (não dá pra
// regerar só isso sem também re-renderizar o vídeo nesta versão —
// a duração de cada cena vem da fala, então uma voz diferente muda a
// linha do tempo inteira; "sem refazer o visual" aqui quer dizer sem
// tocar em captura/roteiro de cena/estilo, que são os passos caros —
// o render em si é rápido o bastante pra rodar de novo).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path');
const { lerArgs } = require('./src/cli');
const { montarRoteiroMobile } = require('./src/roteiro-mobile');
const { montarRoteiroDesktop } = require('./src/roteiro-desktop');
const G = require('./gerar-v5.js');

// highpass+compressor+loudnorm na voz, posicionada certinha na linha
// do tempo (sem outro adelay — mesmo achado da v4, ver DECISOES.md).
function mixarVozPosicionada(video, vozWav, saida) {
  const filtroVoz = 'highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=20:release=250,loudnorm=I=-16:TP=-1.5:LRA=11';
  execFileSync(FFMPEG, [
    '-y', '-i', video, '-i', vozWav,
    '-filter_complex', `[1:a]${filtroVoz}[a]`,
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '128k', '-shortest', saida,
  ], { stdio: 'ignore' });
}

function mixarMusica(destinoFinal, finalComMusica, duracaoTotalS) {
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
}

async function processarVersao(versao, configChave) {
  const config = G.CONFIGS_V5[configChave];
  if (!config) throw new Error(`Config desconhecida: "${configChave}". Opções: ${Object.keys(G.CONFIGS_V5).join(', ')}`);
  console.log(`Config de síntese: ${configChave} (${config.nome})`);

  const manifestMobile = G.lerManifesto('mobile');

  fs.mkdirSync(G.SAIDA, { recursive: true });
  fs.mkdirSync(G.DADOS, { recursive: true });
  fs.mkdirSync(G.PRINTS, { recursive: true });
  fs.mkdirSync(G.TMP_V5, { recursive: true });
  fs.rmSync(G.PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(G.PUBLIC_DIR, { recursive: true });

  const cores = G.lerVariaveisCss();
  const browser = await chromium.launch();
  const pagina = await browser.newPage();
  const logoUri = await G.gerarLogoTransparente(pagina);
  await browser.close();
  const retratoUri = G.gerarRetratoDataUri();

  if (versao === 'a') {
    console.log('\n=== Instagram (mobile) — sintetizando narração por trecho ===');
    const manifestCheckoutCep = G.prepararManifestoCheckoutCep(manifestMobile, cores.fundo);
    const { overridesDuracao, palavras, frases, duracaoTotalS } = G.construirTimelineMobileV5(manifestCheckoutCep, config);
    const { cenas: cenasComLegendaCinetica, duracaoTotal } = montarRoteiroMobile(manifestMobile, overridesDuracao);
    // Mesmo achado da v4: roteiro-mobile.js sempre devolve a legenda
    // cinética antiga — só a karaokê (legendaBlocos) deve renderizar.
    const cenas = cenasComLegendaCinetica.map((c) => ({ ...c, legendas: [] }));

    const overridesQuadrosPorClipe = {};
    for (const c of cenas) if (c.clipe) overridesQuadrosPorClipe[c.clipe] = c.duracao;
    console.log('\nAjustando clipes (freeze/corte) pra bater com a fala...');
    const clipes = await G.copiarClipesAjustados(manifestCheckoutCep, 'mobile', overridesQuadrosPorClipe, Object.keys(overridesQuadrosPorClipe));
    const bundleLocation = await bundle({ entryPoint: path.join(__dirname, 'src', 'index.js'), publicDir: G.PUBLIC_DIR });

    const blocos = G.agruparBlocosSemPreposicaoFinal(palavras);

    const props = { cenas, duracaoTotal, fps: G.FPS, cores, logoUri, retratoUri, clipes, legendaBlocos: blocos };
    const silencioso = await G.renderizar({ id: 'TourMobile', nome: 'tour-instagram-v5', props, bundleLocation, concurrency: 3 });

    const vozWav = path.join(G.DADOS, 'tour-instagram-voz.wav');
    G.montarVozCompleta(frases, duracaoTotalS, vozWav);

    const destinoFinal = path.join(G.SAIDA, 'tour-instagram-narrado.mp4');
    mixarVozPosicionada(silencioso, vozWav, destinoFinal);
    fs.rmSync(silencioso);

    const srtPath = path.join(G.SAIDA, 'tour-instagram.srt');
    G.escreverSrt(palavras, srtPath);

    const jsonPath = path.join(G.DADOS, 'tour-instagram.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ config: configChave, frases, palavras, duracaoTotalS }, null, 2), 'utf8');

    const finalComMusica = path.join(G.SAIDA, 'tour-instagram.mp4');
    mixarMusica(destinoFinal, finalComMusica, duracaoTotalS);

    console.log(`\n✅ ${finalComMusica} — ${duracaoTotalS.toFixed(1)}s de narração / ${(duracaoTotal / G.FPS).toFixed(1)}s de vídeo`);
  }

  if (versao === 'b') {
    console.log('\n=== Portfólio (desktop) — sintetizando narração por trecho ===');
    const manifestDesktop = G.lerManifesto('desktop');
    const { overrides, palavras, frases, duracaoTotalS } = G.construirTimelineDesktopV5(config);
    const { cenas, duracaoTotal, faixaTecnologias } = montarRoteiroDesktop(overrides);

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
    const silencioso = await G.renderizar({ id: 'TourDesktop', nome: 'tour-portfolio-v5', props, bundleLocation, concurrency: 1 });

    const vozWav = path.join(G.DADOS, 'tour-portfolio-voz.wav');
    G.montarVozCompleta(frases, duracaoTotalS, vozWav);

    const destinoFinal = path.join(G.SAIDA, 'tour-portfolio-narrado.mp4');
    mixarVozPosicionada(silencioso, vozWav, destinoFinal);
    fs.rmSync(silencioso);

    const srtPath = path.join(G.SAIDA, 'tour-portfolio.srt');
    G.escreverSrt(palavras, srtPath);

    const jsonPath = path.join(G.DADOS, 'tour-portfolio.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ config: configChave, frases, palavras, duracaoTotalS }, null, 2), 'utf8');

    const finalComMusica = path.join(G.SAIDA, 'tour-portfolio.mp4');
    mixarMusica(destinoFinal, finalComMusica, duracaoTotalS);

    console.log(`\n✅ ${finalComMusica} — ${duracaoTotalS.toFixed(1)}s de narração / ${(duracaoTotal / G.FPS).toFixed(1)}s de vídeo`);
  }
}

async function main() {
  const TEMP_E = 'E:/projetos/_tmp/remotion-tour-v5';
  fs.mkdirSync(TEMP_E, { recursive: true });
  process.env.TEMP = TEMP_E;
  process.env.TMP = TEMP_E;

  const args = lerArgs();
  const versao = args.versao || 'ambas';
  const configChave = args.config || G.CONFIG_PADRAO_V5;
  if (!['a', 'b', 'ambas'].includes(versao)) throw new Error('Uso: node rodar-v5.js --versao a|b|ambas [--config A|B|C|D]');

  if (versao === 'a' || versao === 'ambas') await processarVersao('a', configChave);
  if (versao === 'b' || versao === 'ambas') await processarVersao('b', configChave);
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
