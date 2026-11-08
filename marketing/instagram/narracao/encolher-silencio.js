// Encolhedor de silêncio PRÓPRIO (Rodada 10/v3) — achado testando:
// `ffmpeg -af silenceremove=stop_periods=-1:...` (a forma "oficial" de
// encolher TODOS os silêncios internos de um áudio, não só as bordas)
// não encolheu quase nada nos testes (synth do Piper ritmo 0,7 tem
// pausas internas de ~0,5-0,7s ENTRE PALAVRAS, não só entre frases) —
// os parâmetros start_periods/stop_periods do filtro não se comportam
// como "aplique em todo silêncio interno" na prática (ver DECISOES.md
// pros testes). Mais simples e confiável: ler o WAV (PCM16 mono) em
// Node, medir um envelope RMS por janela curta, e CORTAR fisicamente o
// MEIO de qualquer trecho silencioso mais longo que o alvo — controle
// total, sem depender do comportamento exato do filtro do ffmpeg.
const fs = require('fs');

function lerWavPcm16Mono(arquivo) {
  const buf = fs.readFileSync(arquivo);
  let off = 12;
  let sampleRate = null;
  let dataOffset = null;
  let dataSize = null;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') sampleRate = buf.readUInt32LE(off + 12);
    if (id === 'data') { dataOffset = off + 8; dataSize = size; break; }
    off += 8 + size + (size % 2);
  }
  const n = dataSize / 2;
  const amostras = new Int16Array(n);
  for (let i = 0; i < n; i += 1) amostras[i] = buf.readInt16LE(dataOffset + i * 2);
  return { amostras, sampleRate };
}

function escreverWavPcm16Mono(amostras, sampleRate, arquivo) {
  const dataSize = amostras.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < amostras.length; i += 1) buf.writeInt16LE(amostras[i], 44 + i * 2);
  fs.writeFileSync(arquivo, buf);
}

// Envelope RMS por janela de ~15ms — curto o bastante pra não "comer"
// consoantes rápidas, longo o bastante pra não reagir a ruído de 1
// amostra.
function envelopeRms(amostras, sampleRate, janelaMs = 15) {
  const janela = Math.max(1, Math.round((janelaMs / 1000) * sampleRate));
  const n = Math.ceil(amostras.length / janela);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const ini = i * janela;
    const fim = Math.min(amostras.length, ini + janela);
    let soma = 0;
    for (let j = ini; j < fim; j += 1) soma += amostras[j] * amostras[j];
    env[i] = Math.sqrt(soma / (fim - ini)) / 32768;
  }
  return { env, janela };
}

// Corta o MEIO de todo trecho silencioso (RMS < limiar) mais longo que
// `alvoSegundos` — mantém `alvoSegundos` de silêncio real (metade no
// início do trecho, metade no fim), garantindo nenhum gap interno além
// do alvo. Bordas (início/fim do áudio inteiro) são tratadas à parte
// por `apararBordas` (corta quase tudo, só uma pitada de respiro).
function encolherSilenciosInternos(amostras, sampleRate, { limiar = 0.02, alvoSegundos = 0.3 } = {}) {
  const { env, janela } = envelopeRms(amostras, sampleRate);
  const partes = [];
  let i = 0;
  let cursor = 0;
  while (i < env.length) {
    if (env[i] >= limiar) { i += 1; continue; }
    let j = i;
    while (j < env.length && env[j] < limiar) j += 1;
    const inicioAmostra = i * janela;
    const fimAmostra = Math.min(amostras.length, j * janela);
    const duracaoSilencio = (fimAmostra - inicioAmostra) / sampleRate;
    // copia o trecho sonoro ANTES deste silêncio
    partes.push(amostras.subarray(cursor, inicioAmostra));
    if (duracaoSilencio > alvoSegundos) {
      const manterAmostras = Math.round(alvoSegundos * sampleRate);
      const metade = Math.floor(manterAmostras / 2);
      partes.push(amostras.subarray(inicioAmostra, inicioAmostra + metade));
      partes.push(amostras.subarray(fimAmostra - (manterAmostras - metade), fimAmostra));
    } else {
      partes.push(amostras.subarray(inicioAmostra, fimAmostra));
    }
    cursor = fimAmostra;
    i = j;
  }
  partes.push(amostras.subarray(cursor));
  const total = partes.reduce((a, p) => a + p.length, 0);
  const out = new Int16Array(total);
  let off = 0;
  for (const p of partes) { out.set(p, off); off += p.length; }
  return out;
}

// Apara o silêncio das BORDAS (início/fim) até sobrar só `folgaSegundos`
// — usado pra narração começar quase imediatamente (pedido: ≤0,6s
// desde o início do vídeo, e a mixagem já soma +0,3s de OFFSET_VOZ).
function apararBordas(amostras, sampleRate, { limiar = 0.02, folgaSegundos = 0.03 } = {}) {
  const { env, janela } = envelopeRms(amostras, sampleRate);
  let inicio = 0;
  while (inicio < env.length && env[inicio] < limiar) inicio += 1;
  let fim = env.length - 1;
  while (fim >= 0 && env[fim] < limiar) fim -= 1;
  const folga = Math.round(folgaSegundos * sampleRate);
  const ini = Math.max(0, inicio * janela - folga);
  const fin = Math.min(amostras.length, (fim + 1) * janela + folga);
  return amostras.subarray(ini, fin);
}

function processarArquivo(entrada, saida, opcoes = {}) {
  const { amostras, sampleRate } = lerWavPcm16Mono(entrada);
  const semBordas = apararBordas(amostras, sampleRate, opcoes);
  const semGapsLongos = encolherSilenciosInternos(semBordas, sampleRate, opcoes);
  escreverWavPcm16Mono(semGapsLongos, sampleRate, saida);
  return semGapsLongos.length / sampleRate;
}

module.exports = { processarArquivo, lerWavPcm16Mono, escreverWavPcm16Mono, envelopeRms };
