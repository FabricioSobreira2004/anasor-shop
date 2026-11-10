// Tempo de cada PALAVRA dentro de um trecho — Rodada 12, item 5 do
// pedido: "regere os tempos palavra a palavra a partir do ÁUDIO NOVO
// (use faster-whisper com word_timestamps; se falhar, distribua
// proporcionalmente por caracteres)". A v4 só fazia a 2ª parte
// (proporção de caractere, nunca mediu a voz de verdade). Aqui tenta
// o ASR primeiro; só cai pra proporção se o Whisper claramente não
// achou o número certo de palavras (voz sintética + nomes próprios
// erram a TRANSCRIÇÃO com frequência — ver DECISOES.md/STATUS.md da
// v4 — mas como só usamos a CONTAGEM e os TEMPOS, não o texto
// reconhecido, continua útil mesmo com o texto errado).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG, TMP } = require('./narrar.js');

const TMP_V5 = 'E:/projetos/_tmp/narracao-v5';
const TOLERANCIA = 0.3; // aceita ASR se a contagem de palavras bater dentro de ±30%

function palavrasPorProporcao(texto, inicioAbs, duracaoFrase) {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const pesos = palavras.map((p) => p.length + 3);
  const total = pesos.reduce((a, b) => a + b, 0);
  const out = [];
  let acumulado = 0;
  for (let i = 0; i < palavras.length; i += 1) {
    const ini = inicioAbs + (acumulado / total) * duracaoFrase;
    acumulado += pesos[i];
    const fim = inicioAbs + (acumulado / total) * duracaoFrase;
    out.push({ texto: palavras[i], inicio: ini, fim });
  }
  return out;
}

function tentarAsr(arquivoWav, numPalavrasEsperado) {
  try {
    fs.mkdirSync(TMP_V5, { recursive: true });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const wav16k = path.join(TMP_V5, `asr-${id}-16k.wav`);
    const jsonSaida = path.join(TMP_V5, `asr-${id}.json`);
    execFileSync(FFMPEG, ['-y', '-i', arquivoWav, '-ar', '16000', '-ac', '1', wav16k], { stdio: 'ignore' });
    execFileSync('python', [path.join(__dirname, 'asr-palavras-v5.py'), wav16k, jsonSaida], { stdio: 'ignore' });
    const dados = JSON.parse(fs.readFileSync(jsonSaida, 'utf8'));
    fs.rmSync(wav16k, { force: true });
    fs.rmSync(jsonSaida, { force: true });
    const asrPalavras = dados.palavras || [];
    const diff = Math.abs(asrPalavras.length - numPalavrasEsperado) / numPalavrasEsperado;
    if (asrPalavras.length === 0 || diff > TOLERANCIA) return null;
    return asrPalavras;
  } catch {
    return null;
  }
}

// Retorna [{ texto, inicio, fim }] com tempos ABSOLUTOS (inicioAbs +
// deslocamento medido dentro do trecho). Tenta ASR no áudio do trecho
// (`arquivoWav`, ainda sem deslocamento); se a contagem de palavras
// não bater o bastante, cai pra proporção de caractere (igual v4).
function palavrasComTempoV5(texto, arquivoWav, inicioAbs, duracaoFrase) {
  const palavrasTexto = texto.trim().split(/\s+/).filter(Boolean);
  const asr = tentarAsr(arquivoWav, palavrasTexto.length);
  if (!asr) {
    return { palavras: palavrasPorProporcao(texto, inicioAbs, duracaoFrase), fonte: 'proporcao' };
  }
  // Mapeia POSICIONALMENTE (índice a índice) — o texto reconhecido
  // pelo Whisper pode estar errado (nomes próprios, voz sintética),
  // mas os TEMPOS de cada posição são da voz real; a contagem já foi
  // confirmada compatível (dentro de TOLERANCIA) antes de chegar aqui.
  const n = Math.min(asr.length, palavrasTexto.length);
  const palavras = [];
  for (let i = 0; i < n; i += 1) {
    palavras.push({ texto: palavrasTexto[i], inicio: inicioAbs + asr[i].inicio, fim: inicioAbs + asr[i].fim });
  }
  // Sobra de palavras do roteiro sem par no ASR (contagens próximas,
  // não idênticas) — distribui o resto proporcionalmente no tempo que
  // falta, pra nunca perder palavra da legenda.
  if (palavrasTexto.length > n) {
    const inicioResto = palavras.length ? palavras[palavras.length - 1].fim : inicioAbs;
    const restante = palavrasTexto.slice(n);
    const extra = palavrasPorProporcao(restante.join(' '), inicioResto, Math.max(0, inicioAbs + duracaoFrase - inicioResto));
    palavras.push(...extra);
  }
  return { palavras, fonte: 'asr' };
}

module.exports = { palavrasComTempoV5, palavrasPorProporcao };
