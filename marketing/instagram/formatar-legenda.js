// ============================================================
// Converte **negrito** e _itálico_ (markdown, que o Instagram NÃO
// reconhece) em negrito/itálico de verdade usando os caracteres Unicode
// do bloco "Mathematical Alphanumeric Symbols" — são letras diferentes
// de verdade (não uma formatação), por isso colam "em negrito" em
// qualquer lugar que aceite só texto puro, como a legenda do Instagram.
//
// Como rodar:
//   node formatar-legenda.js <número da legenda em legendas.md>
//   node formatar-legenda.js --arquivo caminho/para/legenda.md
//
// Saída: marketing/instagram/legendas-formatadas/legenda-NN.txt — texto
// pronto pra copiar e colar direto no Instagram (sem nenhum ** ou _
// sobrando).
//
// Cuidado tratado aqui (pedido explícito do Fabrício): o bloco Unicode
// usado só tem A-Z, a-z e 0-9 — NÃO tem letras acentuadas (á, ã, é, ê,
// í, ó, ô, õ, ú, ç, à, â...). Se convertêssemos letra por letra, uma
// palavra acentuada sairia com a maior parte em negrito e o acento
// "caído" de volta pro normal — pior que não negritar. Por isso a
// conversão decide por PALAVRA inteira: só negrita/italiza a palavra se
// TODAS as letras dela tiverem versão Unicode; senão, a palavra inteira
// fica no texto normal (ver converterPalavra).
// ============================================================

const fs = require('fs');
const path = require('path');

// ---- Mapas de caractere -> caractere Unicode "bold"/"italic" ----
// Negrito: Mathematical Sans-Serif Bold (A-Z: U+1D5D4, a-z: U+1D5EE,
// 0-9: U+1D7EC) — bloco "cheio", sem buracos, cobre A-Z/a-z/0-9 inteiros.
function paraNegrito(ch) {
  const cod = ch.codePointAt(0);
  if (ch >= 'A' && ch <= 'Z') return String.fromCodePoint(0x1d5d4 + cod - 65);
  if (ch >= 'a' && ch <= 'z') return String.fromCodePoint(0x1d5ee + cod - 97);
  if (ch >= '0' && ch <= '9') return String.fromCodePoint(0x1d7ec + cod - 48);
  return null; // sem versão Unicode (acento, pontuação, espaço, emoji...)
}

// Itálico: Mathematical Italic (A-Z: U+1D434, a-z: U+1D44E) — com UMA
// exceção conhecida: o "h" itálico minúsculo NÃO está nesse bloco (ponto
// de código reservado); o Unicode reaproveita U+210E (PLANCK CONSTANT,
// "ℎ"), que é visualmente idêntico. Sem esse caso especial, qualquer
// palavra com "h" ("mão", "ateliê", "olhos"...) quebraria no meio.
function paraItalico(ch) {
  if (ch === 'h') return 'ℎ';
  const cod = ch.codePointAt(0);
  if (ch >= 'A' && ch <= 'Z') return String.fromCodePoint(0x1d434 + cod - 65);
  if (ch >= 'a' && ch <= 'z') return String.fromCodePoint(0x1d44e + cod - 97);
  return null;
}

// Converte 1 palavra (sequência de letras/dígitos, sem espaço nem
// pontuação) inteira, OU devolve a palavra original se alguma letra não
// tiver versão Unicode (acento, por exemplo) — nunca meio-convertida.
function converterPalavra(palavra, mapa) {
  const convertida = [...palavra].map(mapa);
  if (convertida.some((c) => c === null)) return palavra;
  return convertida.join('');
}

// Aplica o mapa em todo o texto, palavra por palavra — pontuação, espaços
// e emojis passam direto (o regex \p{L}\p{N} só casa letra/dígito, então
// eles nunca entram na troca e continuam exatamente onde estavam).
function aplicarEstilo(texto, mapa) {
  return texto.replace(/[\p{L}\p{N}]+/gu, (palavra) => converterPalavra(palavra, mapa));
}

// **negrito** e _itálico_ do texto-fonte (markdown "fake", só pra marcar
// intenção em legendas.md) viram texto Unicode puro, sem nenhum
// delimitador sobrando. `s` (dotAll) deixa **.../_..._ quebrar linha por
// dentro, útil se um trecho em negrito abranger mais de uma linha.
function formatarLegenda(texto) {
  let saida = texto.replace(/\*\*(.+?)\*\*/gs, (_, miolo) => aplicarEstilo(miolo, paraNegrito));
  saida = saida.replace(/_(.+?)_/gs, (_, miolo) => aplicarEstilo(miolo, paraItalico));
  return saida;
}

// ---- Leitura de uma legenda numerada de legendas.md (mesmo formato que
// carregarLegendas() em gerar-posts.js) ----
function lerLegendaPorNumero(numero) {
  const md = fs.readFileSync(path.join(__dirname, 'legendas.md'), 'utf8');
  const bloco = md.split(/\n### /).slice(1).find((b) => b.match(new RegExp(`^${numero}\\.\\s`)));
  if (!bloco) throw new Error(`Legenda nº ${numero} não encontrada em legendas.md`);
  const [, ...resto] = bloco.split('\n');
  const corpo = resto.join('\n').split(/\n---/)[0].trim();
  const linhas = corpo.split('\n');
  const hashtags = linhas.filter((l) => l.startsWith('#')).join(' ');
  const texto = linhas.filter((l) => !l.startsWith('#')).join('\n').trim();
  return { texto, hashtags };
}

function main() {
  const [arg1, arg2] = process.argv.slice(2);
  if (!arg1) {
    console.error('Uso: node formatar-legenda.js <número da legenda em legendas.md>');
    console.error('  ou: node formatar-legenda.js --arquivo caminho/para/legenda.txt');
    process.exit(1);
  }

  let texto;
  let hashtags = '';
  let nomeSaida;
  if (arg1 === '--arquivo') {
    if (!arg2) throw new Error('Falta o caminho do arquivo depois de --arquivo');
    texto = fs.readFileSync(arg2, 'utf8');
    nomeSaida = path.basename(arg2, path.extname(arg2));
  } else {
    const numero = Number(arg1);
    if (!Number.isInteger(numero)) throw new Error(`"${arg1}" não é um número de legenda válido`);
    ({ texto, hashtags } = lerLegendaPorNumero(numero));
    nomeSaida = `legenda-${String(numero).padStart(2, '0')}`;
  }

  const corpoFormatado = formatarLegenda(texto);
  const final = hashtags ? `${corpoFormatado}\n\n${hashtags}` : corpoFormatado;

  const pastaSaida = path.join(__dirname, 'legendas-formatadas');
  fs.mkdirSync(pastaSaida, { recursive: true });
  const arquivoSaida = path.join(pastaSaida, `${nomeSaida}.txt`);
  fs.writeFileSync(arquivoSaida, final, 'utf8');
  console.log(`Legenda formatada em: ${arquivoSaida}`);
  console.log('\n---\n');
  console.log(final);
}

// Exporta as funções pra reaproveitar num teste ou noutro script, mas só
// roda main() quando chamado direto (node formatar-legenda.js ...).
if (require.main === module) {
  main();
}

module.exports = { formatarLegenda, paraNegrito, paraItalico };
