// Síntese de UM TRECHO, v5 (Rodada 12) — achado medindo o pipeline v4
// (ver DECISOES.md, "narração travando"): mesmo sintetizando a frase
// INTEIRA numa passada só (já era assim na v4), o roteiro tinha ~13
// frases CURTAS (6-12 palavras) concatenadas com pausa FIXA de 0,3s
// entre cada — o ouvido percebe isso como "fala, para, fala, para"
// porque a prosódia nunca tem chance de fazer uma frase mais longa
// (2-3 orações) soar corrida. A correção é no ROTEIRO (trechos mais
// longos, ver roteiro-v5-dados.js) + aqui: SEMPRE 1 chamada do Piper
// por trecho inteiro (nunca frase a frase), parâmetros configuráveis
// (ver configs-sintese-v5.js) em vez do length_scale/noise_w fixos da
// v4.
//
// Só apara BORDA (80ms de folga) — nunca corta silêncio interno
// (pedido explícito desta rodada, mesma decisão já tomada na v4, ver
// DECISOES.md 2026-11-09 "ACHADO testando... usa síntese de UMA
// PASSADA por frase"). Normaliza loudness por TRECHO (-16 LUFS, pico
// -1,5dBTP) — mesma régua da v4, só o limiar de pico mais estrito
// (pedido desta rodada, item 6).
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const { duracaoSegundos, FFMPEG, TMP } = require('./narrar.js');
const { processarArquivo: apararBordasArquivo } = require('./encolher-silencio.js');

const DIR_NARRACAO = __dirname;
const TMP_V5 = 'E:/projetos/_tmp/narracao-v5';

function sintetizarComConfig(texto, arquivoWav, config) {
  fs.mkdirSync(TMP_V5, { recursive: true });
  const arquivoTxt = path.join(TMP_V5, `texto-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(arquivoTxt, texto, 'utf8');
  const script = path.join(DIR_NARRACAO, 'sintetizar-piper-v5.ps1');
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -File "${script}" -TextoArquivo "${arquivoTxt}" -SaidaWav "${arquivoWav}" ` +
    `-Modelo "${config.modelo}" -LengthScale ${config.lengthScale} -NoiseScale ${config.noiseScale} ` +
    `-NoiseWScale ${config.noiseWScale} -SentenceSilence ${config.sentenceSilence}`,
    { stdio: 'ignore' }
  );
  fs.rmSync(arquivoTxt, { force: true });
}

function apararSoBorda(entrada, saida, folgaSegundos) {
  // alvoSegundos bem alto: a função de encolher MIOLO (2ª metade de
  // processarArquivo) nunca encontra silêncio interno maior que isso
  // — só a borda (1ª metade) realmente age, igual sintetizar-frase-v4.js.
  apararBordasArquivo(entrada, saida, { limiar: 0.02, alvoSegundos: 9999, folgaSegundos });
}

function normalizarEFade(entrada, saida, duracaoS, fadeS = 0.03) {
  const fimFade = Math.max(0, duracaoS - fadeS).toFixed(3);
  execFileSync(FFMPEG, [
    '-y', '-i', entrada,
    '-af', `afade=t=in:st=0:d=${fadeS},afade=t=out:st=${fimFade}:d=${fadeS},loudnorm=I=-16:TP=-1.5:LRA=6`,
    saida,
  ], { stdio: 'ignore' });
}

// Sintetiza um trecho INTEIRO (sem cortar miolo), apara borda,
// normaliza. Retorna { arquivo, duracao, texto, config }.
function sintetizarTrechoV5(texto, config, idPrefixo) {
  fs.mkdirSync(TMP_V5, { recursive: true });
  const bruto = path.join(TMP_V5, `${idPrefixo}-bruto.wav`);
  sintetizarComConfig(texto, bruto, config);
  const aparado = path.join(TMP_V5, `${idPrefixo}-aparado.wav`);
  apararSoBorda(bruto, aparado, 0.08);
  const duracaoAparada = duracaoSegundos(aparado);
  const final = path.join(TMP_V5, `${idPrefixo}-final.wav`);
  normalizarEFade(aparado, final, duracaoAparada);
  const duracao = duracaoSegundos(final);
  return { arquivo: final, duracao, texto };
}

module.exports = { sintetizarTrechoV5, sintetizarComConfig, TMP_V5 };
