// Síntese de UMA frase, v4 (Rodada 11) — achado medindo a Rodada 10: o
// encolhedor de silêncio INTERNO (encolher-silencio.js,
// `encolherSiléenciosInternos`) cortava miolo de frase (0,5-1,8s por
// frase, ver DECISOES.md) — às vezes dentro da própria palavra, nunca
// só pausa. Pedido explícito agora: frase inteira, de UMA síntese só,
// SEM cortar silêncio interno — só apara borda (80ms de folga) e
// normaliza loudness por FRASE (não mais um loudnorm só no fim do
// áudio inteiro, que deixava a variação de volume entre frases bem
// alta — 15 a 27dB RMS medido na Rodada 10).
const path = require('path');
const { execFileSync } = require('child_process');
const { sintetizar, duracaoSegundos, FFMPEG, TMP } = require('./narrar.js');
const { processarArquivo: apararBordasArquivo } = require('./encolher-silencio.js');

// `apararBordasArquivo` já faz borda+miolo (2 funções); aqui só
// queremos a borda — chamando com `alvoSegundos` bem alto (nenhum
// trecho de uma frase de narração chega perto disso) a função de
// encolher miolo nunca encontra nada acima do alvo, então não corta
// nada no meio — só a função de aparar borda (já exportada e testada
// isoladamente na Rodada 10) realmente age.
function apararSoBorda(entrada, saida, folgaSegundos) {
  apararBordasArquivo(entrada, saida, { limiar: 0.02, alvoSegundos: 9999, folgaSegundos });
}

// Normaliza loudness da FRASE (não do áudio inteiro) — alvo -16 LUFS,
// mesma régua do projeto. Fade de 30ms nas 2 pontas (dentro da folga
// de 80ms deixada por apararSoBorda, nunca corta fala) — pedido
// explícito: "crossfade de ~30ms" nas emendas entre frases; como cada
// frase já tem silêncio real (não áudio da frase seguinte) dos 2
// lados, um fade-in/fade-out de 30ms em cada ponta evita qualquer
// clique na emenda sem precisar sobrepor áudio de verdade.
function normalizarEFade(entrada, saida, duracaoS, fadeS = 0.03) {
  const fimFade = Math.max(0, duracaoS - fadeS).toFixed(3);
  execFileSync(FFMPEG, [
    '-y', '-i', entrada,
    '-af', `afade=t=in:st=0:d=${fadeS},afade=t=out:st=${fimFade}:d=${fadeS},loudnorm=I=-16:TP=-1.5:LRA=6`,
    saida,
  ], { stdio: 'ignore' });
}

// Sintetiza UMA frase inteira (sem corte de miolo), apara borda
// (80ms), normaliza loudness + fade de 30ms. Retorna { arquivo,
// duracao } do WAV final, pronto pra entrar na linha do tempo.
function sintetizarFraseV4(texto, voz, ritmo, idPrefixo) {
  const bruto = path.join(TMP, `v4-${idPrefixo}-bruto.wav`);
  sintetizar(texto, bruto, voz, ritmo);
  const aparado = path.join(TMP, `v4-${idPrefixo}-aparado.wav`);
  apararSoBorda(bruto, aparado, 0.08);
  const duracaoAparada = duracaoSegundos(aparado);
  const final = path.join(TMP, `v4-${idPrefixo}-final.wav`);
  normalizarEFade(aparado, final, duracaoAparada);
  const duracao = duracaoSegundos(final);
  return { arquivo: final, duracao, texto };
}

module.exports = { sintetizarFraseV4 };
