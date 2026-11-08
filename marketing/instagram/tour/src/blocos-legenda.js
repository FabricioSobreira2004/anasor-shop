// Agrupa palavras com tempo (vindas do sidecar de
// narracao/narrar-tour-v3.js) em blocos de 3 a 6 palavras pra legenda
// karaokê — usado tanto pelo render (tour.js, legenda queimada DENTRO
// da composição) quanto pelo gerador de .srt (narracao/gerar-srt-v3.js)
// — 1 função só, pra nunca desalinhar o que aparece no vídeo do que
// está escrito no .srt entregue.
function agruparBlocos(palavras) {
  const blocos = [];
  let atual = [];
  for (const p of palavras) {
    atual.push(p);
    const terminaFrase = /[.!?,]$/.test(p.texto);
    if (atual.length >= 6 || (atual.length >= 3 && terminaFrase)) {
      blocos.push(atual);
      atual = [];
    }
  }
  if (atual.length) blocos.push(atual);
  return blocos.map((grupo) => ({
    inicio: grupo[0].inicio,
    fim: grupo[grupo.length - 1].fim,
    palavras: grupo,
  }));
}

module.exports = { agruparBlocos };
