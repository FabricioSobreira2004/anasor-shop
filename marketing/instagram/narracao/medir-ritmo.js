#!/usr/bin/env node
// Mede o RITMO da fala num .wav (ou extrai a trilha de áudio de um
// .mp4 primeiro) — rajadas de fala (envelope RMS acima do limiar),
// pausas entre elas, % do tempo em pausa e palavras/segundo (se
// `--palavras` for passado). Usado pra: (1) decidir entre as 4
// configurações de síntese testadas na Rodada 12 e (2) comparar
// antes (v4) x depois (v5) no relatório final — mesma régua nos 2
// casos, pra a comparação ser justa (ver DECISOES.md).
//
//   node medir-ritmo.js <arquivo.wav|mp4> [--palavras N] [--limiar 0.02]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { lerWavPcm16Mono, envelopeRms } = require('./encolher-silencio.js');
const { FFMPEG, TMP } = require('./narrar.js');

function lerArgs() {
  const args = process.argv.slice(2);
  const arquivo = args[0];
  const pegar = (bandeira, padrao) => {
    const i = args.indexOf(bandeira);
    return i >= 0 ? args[i + 1] : padrao;
  };
  return {
    arquivo,
    palavras: pegar('--palavras', null),
    limiar: parseFloat(pegar('--limiar', '0.02')),
    minPausaS: parseFloat(pegar('--min-pausa', '0.06')),
  };
}

function extrairWavSeNecessario(arquivo) {
  if (arquivo.toLowerCase().endsWith('.wav')) return arquivo;
  fs.mkdirSync(TMP, { recursive: true });
  const saida = path.join(TMP, `medir-ritmo-${path.basename(arquivo, path.extname(arquivo))}.wav`);
  execFileSync(FFMPEG, ['-y', '-i', arquivo, '-vn', '-ac', '1', '-ar', '48000', saida], { stdio: 'ignore' });
  return saida;
}

// Rajadas = trechos com envelope >= limiar; pausas internas = trechos
// < limiar ENTRE 2 rajadas (silêncio antes da 1ª rajada e depois da
// última NÃO conta como "pausa interna" — é borda do clipe, não ritmo
// de fala). Pausas menores que `minPausaS` são fundidas à rajada
// (evita contar queda de consoante/plosiva como pausa própria).
function medirRitmo({ arquivo, palavras, limiar, minPausaS }) {
  const wav = extrairWavSeNecessario(arquivo);
  const { amostras, sampleRate } = lerWavPcm16Mono(wav);
  const { env, janela } = envelopeRms(amostras, sampleRate);
  const duracaoTotal = amostras.length / sampleRate;

  // 1ª passada: trechos >=limiar (brutos)
  const brutos = [];
  let i = 0;
  while (i < env.length) {
    if (env[i] < limiar) { i += 1; continue; }
    let j = i;
    while (j < env.length && env[j] >= limiar) j += 1;
    brutos.push([i * janela, Math.min(amostras.length, j * janela)]);
    i = j;
  }

  // Funde rajadas separadas por uma pausa curtíssima (<minPausaS)
  const rajadas = [];
  for (const [ini, fim] of brutos) {
    const ultima = rajadas[rajadas.length - 1];
    if (ultima && (ini - ultima[1]) / sampleRate < minPausaS) {
      ultima[1] = fim;
    } else {
      rajadas.push([ini, fim]);
    }
  }

  const duracoesRajadas = rajadas.map(([ini, fim]) => (fim - ini) / sampleRate);
  const pausas = [];
  for (let k = 1; k < rajadas.length; k += 1) {
    pausas.push((rajadas[k][0] - rajadas[k - 1][1]) / sampleRate);
  }

  const soma = (arr) => arr.reduce((a, b) => a + b, 0);
  const media = (arr) => (arr.length ? soma(arr) / arr.length : 0);
  const mediana = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const meio = Math.floor(s.length / 2);
    return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2;
  };

  const tempoPausaInterno = soma(pausas);
  const spanFala = rajadas.length ? (rajadas[rajadas.length - 1][1] - rajadas[0][0]) / sampleRate : 0;
  const pctPausa = spanFala > 0 ? (tempoPausaInterno / spanFala) * 100 : 0;
  const wps = palavras != null ? parseFloat(palavras) / duracaoTotal : null;

  return {
    arquivo,
    duracaoTotal: Number(duracaoTotal.toFixed(2)),
    numRajadas: rajadas.length,
    rajadaMediaS: Number(media(duracoesRajadas).toFixed(3)),
    rajadaMedianaS: Number(mediana(duracoesRajadas).toFixed(3)),
    pausaMediaS: Number(media(pausas).toFixed(3)),
    pausaMedianaS: Number(mediana(pausas).toFixed(3)),
    pctTempoPausa: Number(pctPausa.toFixed(1)),
    wps: wps != null ? Number(wps.toFixed(2)) : null,
  };
}

if (require.main === module) {
  const args = lerArgs();
  if (!args.arquivo) {
    console.error('Uso: node medir-ritmo.js <arquivo.wav|mp4> [--palavras N] [--limiar 0.02] [--min-pausa 0.06]');
    process.exit(1);
  }
  const r = medirRitmo(args);
  console.log(JSON.stringify(r, null, 2));
}

module.exports = { medirRitmo };
