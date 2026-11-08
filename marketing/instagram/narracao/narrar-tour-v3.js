#!/usr/bin/env node
// ============================================================
// Narração v3 dos 2 Tours (Rodada 10) — achado medindo o pipeline
// existente (narrar.js): a voz sai inteira de 1 síntese só, com pausas
// NATURAIS do motor Piper entre frases (~0,5-0,7s, medido por
// silencedetect no tour-instagram.mp4 atual) — mais longas que o
// pedido explícito do Fabrício (0,25-0,35s entre frases, nunca >0,45s
// de silêncio dentro da fala). Não dá pra controlar a pausa do Piper
// por parâmetro nenhum (LengthScale só afeta a velocidade da FALA, não
// o silêncio entre frases) — a solução é sintetizar FRASE POR FRASE
// (cada frase sai com silêncio de borda natural do motor), CORTAR essa
// borda com `silenceremove` (ida e volta: remove no início, inverte,
// remove nos 2 "inícios" = início+fim, inverte de volta) e concatenar
// com um silêncio GERADO (não o do motor) de exatamente 0,3s entre
// cada par — dentro da faixa pedida e sempre <0,45s.
//
// NÃO toca em narrar.js (só IMPORTA funções já existentes de lá,
// exportadas a mais nesta rodada) — Reels e os outros 16 vídeos
// continuam exatamente como estavam, pipeline antigo intacto.
//
//   node narrar-tour-v3.js --nome tour-instagram --video <mudo.mp4> --saida <narrado.mp4> --json <sidecar.json>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  sintetizar, lerRoteiros, duracaoSegundos, mixar, FFMPEG,
  OFFSET_VOZ, VOZES, VOZ_PADRAO, TMP,
} = require('./narrar.js');
const { processarArquivo: encolherSilencio } = require('./encolher-silencio.js');

const GAP_ENTRE_FRASES = 0.3; // segundos — pedido: 0,25 a 0,35s

function lerArgs() {
  const args = process.argv.slice(2);
  const pegar = (bandeira) => {
    const i = args.indexOf(bandeira);
    return i >= 0 ? args[i + 1] : null;
  };
  return {
    nome: pegar('--nome'),
    video: pegar('--video'),
    saida: pegar('--saida'),
    json: pegar('--json'),
    vozSaida: pegar('--voz-saida'),
  };
}

// Divide em frases por pontuação forte (. ! ?), mantendo a pontuação
// na frase anterior — regra simples, suficiente pro texto do roteiro
// (sem abreviações com ponto no meio).
function dividirFrases(texto) {
  return texto.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}

// Apara borda + encolhe silêncio INTERNO — ACHADO testando (Rodada
// 10): o filtro `silenceremove` do ffmpeg (start/stop_periods) não
// encolheu as pausas internas do Piper ritmo 0,7 (~0,5-0,7s ENTRE
// PALAVRAS, não só entre frases) nos testes — trocado por
// encolher-silencio.js (envelope RMS em Node, corte físico do meio de
// todo trecho silencioso >alvoSegundos), controle total e confirmado
// por teste (ver DECISOES.md). alvoSegundos:0.3 cobre tanto a pausa
// INTERNA (dentro da frase) quanto deixa margem pro gap FIXO entre
// frases (GAP_ENTRE_FRASES, adicionado na concatenação).
function sintetizarFraseAparada(frase, voz, ritmo, idx) {
  const bruto = path.join(TMP, `tour-v3-frase-${idx}.wav`);
  sintetizar(frase, bruto, voz, ritmo);
  const aparado = path.join(TMP, `tour-v3-frase-${idx}-aparado.wav`);
  encolherSilencio(bruto, aparado, { limiar: 0.02, alvoSegundos: 0.3, folgaSegundos: 0.03 });
  const duracao = duracaoSegundos(aparado);
  return { arquivo: aparado, duracao };
}

// Mesma estimativa por PROPORÇÃO DE CARACTERES já usada em
// narracao/legendar.js (peso = tamanho da palavra + 3) — aqui aplicada
// só DENTRO de uma frase já com duração real medida (não a frase
// inteira do roteiro), o que deixa a estimativa mais fiel (sem
// silêncio de pausa entre frases "contaminando" a proporção).
function montarPalavras(frase, inicio, duracao) {
  const palavras = frase.trim().split(/\s+/).filter(Boolean);
  const pesos = palavras.map((p) => p.length + 3);
  const total = pesos.reduce((a, b) => a + b, 0);
  const out = [];
  let acumulado = 0;
  for (let i = 0; i < palavras.length; i += 1) {
    const ini = inicio + (acumulado / total) * duracao;
    acumulado += pesos[i];
    const fim = inicio + (acumulado / total) * duracao;
    out.push({ texto: palavras[i], inicio: ini, fim });
  }
  return out;
}

function gerarSilencio(duracaoS) {
  const arquivo = path.join(TMP, `tour-v3-silencio-${duracaoS}.wav`);
  if (fs.existsSync(arquivo)) return arquivo;
  execFileSync(FFMPEG, [
    '-y', '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${duracaoS}`, arquivo,
  ], { stdio: 'ignore' });
  return arquivo;
}

function concatenarComGaps(clipesFrase, saidaWav) {
  const silencio = gerarSilencio(GAP_ENTRE_FRASES);
  const inputs = [];
  clipesFrase.forEach((c, i) => {
    inputs.push(c.arquivo);
    if (i < clipesFrase.length - 1) inputs.push(silencio);
  });
  const args = [];
  inputs.forEach((f) => { args.push('-i', f); });
  const labels = inputs.map((_, i) => `[${i}:a]`).join('');
  args.push('-filter_complex', `${labels}concat=n=${inputs.length}:v=0:a=1[a]`, '-map', '[a]', '-y', saidaWav);
  execFileSync(FFMPEG, args, { stdio: 'ignore' });
}

function main() {
  const { nome, video, saida, json, vozSaida } = lerArgs();
  // Modo B (--voz-saida): achado da Rodada 10 — pra queimar a legenda
  // karaokê DENTRO da composição Remotion (não mais overlay de vídeo
  // transparente, ver componentes.js/LegendaKaraoke), os tempos de
  // palavra precisam existir ANTES do render do vídeo com legenda.
  // Esse modo sintetiza a voz e grava o sidecar SEM mixar em vídeo
  // nenhum (o vídeo passado em --video só serve pra medir a duração
  // disponível) — a mixagem de verdade roda DEPOIS, com o vídeo que
  // JÁ tem a legenda queimada (`mixar()` chamado por fora, ver
  // tour/renderizar-v3.js).
  if (!nome || !video || !json || (!saida && !vozSaida)) {
    console.error('Uso: node narrar-tour-v3.js --nome <nome> --video <mudo.mp4> --json <sidecar.json> (--saida <narrado.mp4> | --voz-saida <voz.wav>)');
    process.exit(1);
  }
  fs.mkdirSync(TMP, { recursive: true });
  if (saida) fs.mkdirSync(path.dirname(saida), { recursive: true });
  if (vozSaida) fs.mkdirSync(path.dirname(vozSaida), { recursive: true });
  fs.mkdirSync(path.dirname(json), { recursive: true });

  const voz = VOZES[VOZ_PADRAO];
  const ritmo = voz.ritmoPadrao;
  const roteiros = lerRoteiros();
  const textoFinal = roteiros[nome];
  if (!textoFinal) throw new Error(`Sem roteiro para "${nome}" em roteiros.md`);

  const frases = dividirFrases(textoFinal);
  console.log(`${nome}: ${frases.length} frases, voz=${VOZ_PADRAO} ritmo=${ritmo}`);

  const clipesFrase = [];
  const palavras = [];
  let cursor = 0;
  frases.forEach((frase, i) => {
    const { arquivo, duracao } = sintetizarFraseAparada(frase, voz, ritmo, i);
    const inicioFrase = OFFSET_VOZ + cursor;
    clipesFrase.push({ arquivo, duracao });
    palavras.push(...montarPalavras(frase, inicioFrase, duracao));
    cursor += duracao + GAP_ENTRE_FRASES;
    console.log(`  [${i + 1}/${frases.length}] "${frase}" — ${duracao.toFixed(2)}s`);
  });
  const duracaoVoz = cursor - GAP_ENTRE_FRASES; // sem o gap depois da última frase

  const duracaoVideo = duracaoSegundos(video);
  const limite = duracaoVideo - OFFSET_VOZ - 0.5;
  if (duracaoVoz > limite) {
    console.warn(`⚠️  AVISO: narração (${duracaoVoz.toFixed(2)}s) passa do limite do vídeo (${limite.toFixed(2)}s) — a mixagem corta pelo -shortest.`);
  }

  const vozConcatenada = path.join(TMP, `tour-v3-${nome}-voz.wav`);
  concatenarComGaps(clipesFrase, vozConcatenada);
  const duracaoVozReal = duracaoSegundos(vozConcatenada);

  let duracaoFinal = null;
  if (vozSaida) {
    fs.copyFileSync(vozConcatenada, vozSaida);
  } else {
    mixar(video, vozConcatenada, duracaoVozReal, saida);
    duracaoFinal = duracaoSegundos(saida);
  }

  fs.writeFileSync(json, JSON.stringify({
    nome, textoFinal, offsetVoz: OFFSET_VOZ, duracaoVoz: duracaoVozReal, duracaoFinal, duracaoVideo,
    frases: frases.map((texto, i) => ({ texto, duracao: clipesFrase[i].duracao })),
    palavras,
  }, null, 2), 'utf8');

  console.log(`✅ ${nome}: vídeo ${duracaoVideo.toFixed(2)}s, voz ${duracaoVozReal.toFixed(2)}s (${frases.length} frases, gap ${GAP_ENTRE_FRASES}s)${duracaoFinal ? `, final ${duracaoFinal.toFixed(2)}s` : ''}`);
  console.log(`   ${vozSaida || saida}`);
  console.log(`   ${json}`);
}

main();
