#!/usr/bin/env node
// ============================================================
// Trilha de fundo ORIGINAL (Rodada 10/v3), gerada por código — pad
// quente + arpejo lento tipo harpa/piano, ~70 BPM, Lá menor (tom
// acolhedor), sem bateria, com reverb leve e corte de agudos. Original
// = SEM risco de direitos autorais/ContentID (pedido explícito: "se
// existir música minha em musica\, use-a; senão GERE uma trilha
// original por código").
//
// Síntese pura (sem numpy/librosa — nenhum instalado nesta máquina):
// osciladores senoidais somados por acorde (pad, com crossfade trapezoidal
// entre acordes) + notas "dedilhadas" (arpejo, envelope de ataque rápido
// e decaimento exponencial) + reverb algorítmico leve (combs + allpass,
// Schroeder simplificado) + filtro passa-baixa de 1 polo (corte de
// agudos) + normalização de pico. Escreve um .wav PCM16 estéreo direto
// (sem dependências).
//
//   node gerar-trilha.js [duracaoSegundos]
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DURACAO = parseFloat(process.argv[2]) || 95; // cobre os 2 tours (até ~40s) com sobra pra loop
const SAIDA = 'E:/projetos/site-mae/musica/trilha-atelie.wav';

const BPM = 70;
const BEAT = 60 / BPM; // 0,857s
const COMPASSO = BEAT * 4; // 1 acorde por compasso (4 tempos) ≈ 3,43s

// Progressão Lá menor acolhedor: i – VI – III – VII (Am – F – C – G),
// diatônica, sem nenhuma nota "estranha" — soa quente/resolvida, nunca
// tensa. Oitavas 3-4 (graves/médios, nada estridente).
const ACORDES = [
  { nome: 'Am', notas: [220.00, 261.63, 329.63] }, // A3 C4 E4
  { nome: 'F', notas: [174.61, 220.00, 261.63] },  // F3 A3 C4
  { nome: 'C', notas: [261.63, 329.63, 392.00] },  // C4 E4 G4
  { nome: 'G', notas: [196.00, 246.94, 293.66] },  // G3 B3 D4
];

function construirSequenciaAcordes(duracao) {
  const seq = [];
  let t = 0;
  let i = 0;
  while (t < duracao) {
    seq.push({ ...ACORDES[i % ACORDES.length], inicio: t, fim: t + COMPASSO });
    t += COMPASSO;
    i += 1;
  }
  return seq;
}

function envelopeTrapezio(t, inicio, fim, fade) {
  if (t < inicio || t > fim) return 0;
  let g = 1;
  if (t < inicio + fade) g = (t - inicio) / fade;
  if (t > fim - fade) g = Math.min(g, (fim - t) / fade);
  return Math.max(0, Math.min(1, g));
}

// Pad: soma de senoides nas notas do acorde ativo (+ uma sub-oitava do
// fundamental, bem baixa, só pra dar "corpo"), com crossfade
// trapezoidal de 1,2s entre acordes — nunca um corte brusco.
function sintetizarPad(duracao) {
  const seq = construirSequenciaAcordes(duracao);
  const N = Math.floor(duracao * SR);
  const out = new Float32Array(N);
  const FADE = 1.2;
  for (const acorde of seq) {
    const i0 = Math.max(0, Math.floor((acorde.inicio - FADE) * SR));
    const i1 = Math.min(N, Math.floor((acorde.fim + FADE) * SR));
    for (let i = i0; i < i1; i += 1) {
      const t = i / SR;
      const g = envelopeTrapezio(t, acorde.inicio, acorde.fim, FADE);
      if (g <= 0) continue;
      let amostra = 0;
      for (const freq of acorde.notas) amostra += Math.sin(2 * Math.PI * freq * t) * 0.14;
      amostra += Math.sin(2 * Math.PI * (acorde.notas[0] / 2) * t) * 0.10; // sub-oitava, corpo
      out[i] += amostra * g;
    }
  }
  return out;
}

// Arpejo (harpa/piano) — 1 nota dedilhada a cada 2 tempos (meio
// compasso), ciclando pelas notas do acorde ativo em ordem crescente,
// ataque rápido (8ms) + decaimento exponencial (~1,1s) — soa como
// corda dedilhada, nunca percussivo/bateria.
function sintetizarArpejo(duracao) {
  const seq = construirSequenciaAcordes(duracao);
  const N = Math.floor(duracao * SR);
  const out = new Float32Array(N);
  const PASSO = BEAT * 1.5; // ritmo lento, "respirado"
  for (const acorde of seq) {
    let t = acorde.inicio;
    let idx = 0;
    while (t < acorde.fim) {
      const freq = acorde.notas[idx % acorde.notas.length] * (idx % 6 < 3 ? 1 : 2); // sobe 1 oitava a cada 3 notas, efeito de "subida"
      const inicioAmostra = Math.floor(t * SR);
      const DURACAO_NOTA = 1.1;
      const fimAmostra = Math.min(N, Math.floor((t + DURACAO_NOTA) * SR));
      for (let i = inicioAmostra; i < fimAmostra; i += 1) {
        const dt = (i - inicioAmostra) / SR;
        const ataque = Math.min(1, dt / 0.008);
        const decaimento = Math.exp(-dt / 0.75);
        const env = ataque * decaimento;
        const fase = 2 * Math.PI * freq * dt;
        const amostra = (Math.sin(fase) * 0.8 + Math.sin(fase * 2) * 0.15) * env * 0.11;
        out[i] += amostra;
      }
      t += PASSO;
      idx += 1;
    }
  }
  return out;
}

// Reverb leve (Schroeder simplificado): 3 combs em paralelo + 1
// allpass em série, mix ~16% — dá uma cauda suave sem lavar o som.
function reverbLeve(sinal) {
  const N = sinal.length;
  const combDelays = [0.029, 0.037, 0.041].map((s) => Math.round(s * SR));
  const combGain = 0.33;
  const combOut = new Float32Array(N);
  for (const d of combDelays) {
    const buf = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      const atraso = i >= d ? buf[i - d] : 0;
      buf[i] = sinal[i] + atraso * combGain;
      combOut[i] += buf[i] / combDelays.length;
    }
  }
  const allpassDelay = Math.round(0.005 * SR);
  const allpassGain = 0.5;
  const apBuf = new Float32Array(N);
  const saida = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    const atrasado = i >= allpassDelay ? apBuf[i - allpassDelay] : 0;
    const entrada = combOut[i];
    const v = -allpassGain * entrada + atrasado;
    apBuf[i] = entrada + allpassGain * v;
    saida[i] = v;
  }
  const MIX = 0.16;
  const final = new Float32Array(N);
  for (let i = 0; i < N; i += 1) final[i] = sinal[i] * (1 - MIX) + saida[i] * MIX;
  return final;
}

// Passa-baixa de 1 polo — corte de agudos pedido ("reverb leve e corte
// de agudos"), ~6,5kHz, suave (não é um filtro agressivo, só tira o
// brilho mais áspero dos harmônicos agudos do arpejo).
function passaBaixa(sinal, cutoffHz) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SR;
  const a = dt / (rc + dt);
  const out = new Float32Array(sinal.length);
  let y = 0;
  for (let i = 0; i < sinal.length; i += 1) {
    y = y + a * (sinal[i] - y);
    out[i] = y;
  }
  return out;
}

function normalizarPico(sinal, picoAlvo = 0.85) {
  let pico = 0;
  for (let i = 0; i < sinal.length; i += 1) pico = Math.max(pico, Math.abs(sinal[i]));
  if (pico === 0) return sinal;
  const ganho = picoAlvo / pico;
  const out = new Float32Array(sinal.length);
  for (let i = 0; i < sinal.length; i += 1) out[i] = sinal[i] * ganho;
  return out;
}

function escreverWavEstereo(amostrasL, amostrasR, arquivo) {
  const N = amostrasL.length;
  const bytesPorAmostra = 2;
  const dataSize = N * 2 * bytesPorAmostra;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // estéreo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2 * bytesPorAmostra, 28);
  buf.writeUInt16LE(2 * bytesPorAmostra, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < N; i += 1) {
    const l = Math.max(-1, Math.min(1, amostrasL[i]));
    const r = Math.max(-1, Math.min(1, amostrasR[i]));
    buf.writeInt16LE(Math.round(l * 32767), offset);
    buf.writeInt16LE(Math.round(r * 32767), offset + 2);
    offset += 4;
  }
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, buf);
}

function main() {
  console.log(`Sintetizando trilha original — ${DURACAO}s, ${BPM}BPM, Lá menor (Am-F-C-G)...`);
  const pad = sintetizarPad(DURACAO);
  const arpejo = sintetizarArpejo(DURACAO);
  const mix = new Float32Array(pad.length);
  for (let i = 0; i < mix.length; i += 1) mix[i] = pad[i] + arpejo[i];

  const comReverb = reverbLeve(mix);
  const comCorteAgudos = passaBaixa(comReverb, 6500);
  const normalizado = normalizarPico(comCorteAgudos, 0.85);

  // Leve diferença L/R (largura estéreo sutil) — atraso de 6 amostras
  // e um pingo de ganho diferente, suficiente pra não soar mono "seco"
  // sem nenhum processamento estéreo de verdade.
  const atrasoAmostras = 6;
  const R = new Float32Array(normalizado.length);
  for (let i = 0; i < R.length; i += 1) {
    const j = i >= atrasoAmostras ? i - atrasoAmostras : i;
    R[i] = normalizado[j] * 0.98;
  }

  escreverWavEstereo(normalizado, R, SAIDA);
  console.log(`✅ ${SAIDA}`);

  const leiame = path.join(path.dirname(SAIDA), 'README.md');
  fs.writeFileSync(leiame,
    `# Trilha de fundo — Ateliê Anasor\n\n`
    + `Origem: gerada por código (\`marketing/instagram/musica/gerar-trilha.js\`), síntese de osciladores senoidais (pad quente + arpejo tipo harpa/piano, ~70 BPM, Lá menor: Am-F-C-G) + reverb algorítmico leve + corte de agudos. Nenhuma amostra, loop ou sample de terceiros — 100% original, sem risco de direitos autorais/ContentID.\n\n`
    + `Gerada em ${new Date().toISOString().slice(0, 10)} pro Tour do Site v3 (Rodada 10). Rode \`node gerar-trilha.js [segundos]\` de novo pra regenerar (determinístico só na progressão de acordes — o resultado em áudio é sempre o mesmo algoritmo, sem aleatoriedade).\n`,
    'utf8');
  console.log(`✅ ${leiame}`);
}

main();
