#!/usr/bin/env node
// Driver do Tour do Site v6 (Rodada 13) — SEM narração sintética, SEM
// legenda queimada, só a trilha original (ver gerar-v6.js pro
// porquê/detalhe de cada peça). Reaproveita integralmente o visual e
// as durações da v5 (lidas do JSON já salvo — NUNCA chama o Piper).
//
//   node rodar-v6.js --versao a|b|ambas
const fs = require('fs');
const path = require('path');
const { bundle } = require('@remotion/bundler');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path');
const { lerArgs } = require('./src/cli');
const { montarRoteiroMobile } = require('./src/roteiro-mobile');
const G5 = require('./gerar-v5.js');
const G6 = require('./gerar-v6.js');
const { duracaoSegundos } = require('../narracao/narrar.js');

async function processarInstagram() {
  console.log('\n=== Instagram (mobile) — v6, sem narração, sem legenda queimada ===');
  const manifestMobile = G5.lerManifesto('mobile');

  fs.mkdirSync(G6.SAIDA, { recursive: true });
  fs.mkdirSync(G6.PRINTS, { recursive: true });
  fs.rmSync(G5.PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(G5.PUBLIC_DIR, { recursive: true });

  const cores = G5.lerVariaveisCss();
  const browser = await chromium.launch();
  const pagina = await browser.newPage();
  const logoUri = await G5.gerarLogoTransparente(pagina);
  await browser.close();
  const retratoUri = G5.gerarRetratoDataUri();

  const manifestCheckoutCep = G5.prepararManifestoCheckoutCep(manifestMobile, cores.fundo);
  const dadosV5 = G6.lerDadosV5('tour-instagram');
  const { overridesDuracao } = G6.reconstruirOverridesMobile(manifestCheckoutCep, dadosV5);
  const { cenas: cenasComLegendaCinetica, duracaoTotal } = montarRoteiroMobile(manifestMobile, overridesDuracao);
  // legendas (cinética antiga) sempre fora, igual v5/v4; legendaBlocos
  // fica de fora dos props (null) — É A FLAG que desliga a legenda
  // karaokê (TourMobile.js só renderiza <LegendaKaraoke> se
  // `legendaBlocos` existir) — pedido explícito: "use prop/flag, não
  // apague o código da legenda".
  const cenas = cenasComLegendaCinetica.map((c) => ({ ...c, legendas: [] }));

  const overridesQuadrosPorClipe = {};
  for (const c of cenas) if (c.clipe) overridesQuadrosPorClipe[c.clipe] = c.duracao;
  console.log('\nAjustando clipes (freeze/corte) pra bater com a duração da v5...');
  const clipes = await G5.copiarClipesAjustados(manifestCheckoutCep, 'mobile', overridesQuadrosPorClipe, Object.keys(overridesQuadrosPorClipe));
  const bundleLocation = await bundle({ entryPoint: path.join(__dirname, 'src', 'index.js'), publicDir: G5.PUBLIC_DIR });

  const props = { cenas, duracaoTotal, fps: G5.FPS, cores, logoUri, retratoUri, clipes, legendaBlocos: null };

  console.log('\nValidando 3 quadros (início/meio/fim) antes do render completo...');
  await G6.validarQuadros({ id: 'TourMobile', props, bundleLocation });

  const silencioso = await G6.renderizar({ id: 'TourMobile', nome: 'tour-instagram-v6', props, bundleLocation, concurrency: 3 });
  const duracaoReal = duracaoSegundos(silencioso);

  const destinoFinal = path.join(G6.SAIDA, 'tour-instagram-sem-voz.mp4');
  G6.arquivarSeExistir(destinoFinal);
  const musicaIsolada = path.join(G6.SAIDA, 'musica-tour-instagram.wav');
  G6.mixarSoMusica(silencioso, duracaoReal, destinoFinal, musicaIsolada);
  fs.rmSync(silencioso);

  console.log(`\n✅ ${destinoFinal} — ${duracaoReal.toFixed(1)}s`);
  console.log(`   ${musicaIsolada}`);
}

async function processarPortfolio() {
  console.log('\n=== Portfólio (desktop) — v6, sem narração ===');
  fs.mkdirSync(G6.SAIDA, { recursive: true });

  // Nunca teve legenda queimada — reaproveita o vídeo silencioso da
  // v5 direto (sem render Remotion nenhum): pega o "-narrado" (vídeo +
  // voz, sem música) e tira o áudio, igual pedido ("rerrenderize" só
  // valia pro Instagram, por causa da legenda; aqui é só reaproveitar).
  const origemV5 = path.join(G6.SAIDA_V5, 'tour-portfolio-narrado.mp4');
  if (!fs.existsSync(origemV5)) throw new Error(`Vídeo da v5 não encontrado: ${origemV5}`);
  const silencioso = path.join('E:/projetos/_tmp/narracao-v5', 'v6-portfolio-silencioso.mp4');
  fs.mkdirSync(path.dirname(silencioso), { recursive: true });
  require('child_process').execFileSync(FFMPEG, [
    '-y', '-i', origemV5, '-an', '-c:v', 'copy', silencioso,
  ], { stdio: 'ignore' });
  const duracaoReal = duracaoSegundos(silencioso);

  const destinoFinal = path.join(G6.SAIDA, 'tour-portfolio-sem-voz.mp4');
  G6.arquivarSeExistir(destinoFinal);
  const musicaIsolada = path.join(G6.SAIDA, 'musica-tour-portfolio.wav');
  G6.mixarSoMusica(silencioso, duracaoReal, destinoFinal, musicaIsolada);
  fs.rmSync(silencioso);

  console.log(`\n✅ ${destinoFinal} — ${duracaoReal.toFixed(1)}s`);
  console.log(`   ${musicaIsolada}`);
}

async function main() {
  const TEMP_E = 'E:/projetos/_tmp/remotion-tour-v6';
  fs.mkdirSync(TEMP_E, { recursive: true });
  process.env.TEMP = TEMP_E;
  process.env.TMP = TEMP_E;

  const args = lerArgs();
  const versao = args.versao || 'ambas';
  if (!['a', 'b', 'ambas'].includes(versao)) throw new Error('Uso: node rodar-v6.js --versao a|b|ambas');

  if (versao === 'a' || versao === 'ambas') await processarInstagram();
  if (versao === 'b' || versao === 'ambas') await processarPortfolio();
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
