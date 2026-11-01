// ============================================================
//  TESTE LOCAL — legendar.js (sem tocar na mídia real de site-mae)
// ============================================================
//
//  Criado depois da code-review apontar 3 bugs reais em legendar.js
//  (Etapa 3 do pedido de 2026-10-31, "notebook do pai"):
//    a) rodar legendar.js duas vezes queimava uma 2ª legenda em cima
//       da 1ª (lia e escrevia o MESMO arquivo);
//    b) o formatador de tempo do .srt podia gerar milissegundos fora
//       de 000-999 (ex.: "00:00:03,1000") perto de frações de segundo
//       bem próximas de 1;
//    c) a checagem de área livre só avisava — nunca impedia gravar um
//       vídeo com a legenda em cima do aparelho/produto/CTA.
//  Cada teste abaixo prova que a correção correspondente funciona, e
//  falharia de novo com o código antigo (comentado em cada teste).
//
//  Usa vídeos SINTÉTICOS (gerados por ffmpeg, cor sólida ou ruído) numa
//  pasta sandbox em E:/projetos/_tmp/teste-legendar/ — nunca grava nem
//  lê nada em E:/projetos/site-mae. As variáveis de ambiente
//  LEGENDAR_REELS/LEGENDAR_TOUR/LEGENDAR_DADOS/LEGENDAR_TMP (lidas por
//  legendar.js) apontam pra essa sandbox antes do require, e por isso
//  isso tem que ser a PRIMEIRA coisa que o script faz.
//
//      node marketing/instagram/narracao/teste-legendar.js
// ============================================================

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SANDBOX = 'E:/projetos/_tmp/teste-legendar';
const DIR_REELS = path.join(SANDBOX, 'reels');
const DIR_TOUR = path.join(SANDBOX, 'tour');
const DIR_DADOS = path.join(SANDBOX, 'dados');
const DIR_TMP = path.join(SANDBOX, 'tmp');

// Sandbox limpa a cada execução — isolamento entre rodadas de teste,
// não é a regra "nunca apagar nada" (que é sobre mídia de produção do
// Fabrício; isto aqui é só fixture de teste, recriado toda vez).
fs.rmSync(SANDBOX, { recursive: true, force: true });
for (const d of [DIR_REELS, DIR_TOUR, DIR_DADOS, DIR_TMP]) fs.mkdirSync(d, { recursive: true });

process.env.LEGENDAR_REELS = DIR_REELS;
process.env.LEGENDAR_TOUR = DIR_TOUR;
process.env.LEGENDAR_DADOS = DIR_DADOS;
process.env.LEGENDAR_TMP = DIR_TMP;

const { decompor, tempoSrt, tempoAss, processarVideo } = require('./legendar.js');
const { FFMPEG } = require('../reels/src/ffmpeg-path.js');
const { criarRunner } = require('./teste-util.js');

const { teste, finalizar } = criarRunner();

// ---- Teste b: formatador de tempo não pode "vazar" dígito extra ----
// O bug antigo arredondava segundos (Math.floor) e ms (Math.round da
// fração) SEPARADAMENTE — valores com fração perto de 1 (ex. 3.9996)
// arredondavam a fração pra 1000 sem "carregar" pro segundo seguinte,
// virando "00:00:03,1000" (inválido, 4 dígitos). O decompor() novo
// arredonda pra UMA unidade inteira antes de decompor, então o carry
// é automático.
teste('tempoSrt nunca gera milissegundos fora de 000-999 (valores de borda)', () => {
  const casos = [
    3.9996,      // o caso exato do bug relatado: "00:00:03,1000"
    0.9999,
    59.9996,     // borda de minuto
    3599.9996,   // borda de hora
    0,
    0.0001,
    12.5,
  ];
  for (const segundos of casos) {
    const s = tempoSrt(segundos);
    assert.match(s, /^\d{2}:\d{2}:\d{2},\d{3}$/, `formato inválido pra ${segundos}s: "${s}"`);
    const ms = Number(s.split(',')[1]);
    assert.ok(ms >= 0 && ms <= 999, `ms fora de 0-999 pra ${segundos}s: "${s}" (ms=${ms})`);
  }
  // o caso relatado especificamente não pode voltar a acontecer
  assert.equal(tempoSrt(3.9996), '00:00:04,000');
});

teste('tempoAss nunca gera centissegundos fora de 00-99 (mesmo formatador)', () => {
  const casos = [3.9996, 59.9996, 3599.9996, 0];
  for (const segundos of casos) {
    const s = tempoAss(segundos);
    assert.match(s, /^\d+:\d{2}:\d{2}\.\d{2}$/, `formato inválido pra ${segundos}s: "${s}"`);
    const cs = Number(s.split('.')[1]);
    assert.ok(cs >= 0 && cs <= 99, `centissegundo fora de 0-99 pra ${segundos}s: "${s}" (cs=${cs})`);
  }
});

teste('decompor() propaga o carry entre segundo, minuto e hora', () => {
  // 1 unidade abaixo do próximo minuto, arredondando pra cima
  const r = decompor(59.9996, 1000);
  assert.deepEqual(r, { h: 0, m: 1, s: 0, frac: 0 });
});

// ---- Fixtures de vídeo sintético (reaproveitadas pelos testes a/c) ----
function gerarVideo(saida, { filtroVideo, duracao }) {
  execSync(
    `"${FFMPEG}" -y -f lavfi -i "${filtroVideo}:duration=${duracao}" -f lavfi -i "anullsrc=r=48000:cl=stereo" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac "${saida}"`,
    { stdio: 'ignore' }
  );
}

function escreverSidecar(nome, pasta, textoFinal, duracaoVoz) {
  fs.writeFileSync(
    path.join(DIR_DADOS, `${nome}.json`),
    JSON.stringify({ nome, pasta, textoFinal, offsetVoz: 0.3, duracaoVoz, duracaoFinal: duracaoVoz + 1, duracaoVideo: duracaoVoz + 1 }),
    'utf8'
  );
}

function hashArquivo(caminho) {
  return execSync(`certutil -hashfile "${caminho}" MD5`).toString();
}

// ---- Teste a: rodar duas vezes não pode queimar uma 2ª legenda ----
// Com o código antigo, a 2ª chamada leria `arquivoAtual` (já com
// legenda da 1ª) como fonte da queima — o hash do arquivo final
// mudaria entre a 1ª e a 2ª execução (uma legenda "em dobro" por
// cima). O master permanente em `_sem_legenda/` faz a 2ª execução
// partir do mesmo vídeo limpo da 1ª — o resultado tem que ser
// byte-a-byte idêntico.
teste('legendar.js: rodar 2x no mesmo vídeo produz o MESMO arquivo (idempotente)', () => {
  const nome = 'teste-idempotencia';
  const video = path.join(DIR_REELS, `${nome}.mp4`);
  gerarVideo(video, { filtroVideo: 'color=c=gray:size=1080x1920:rate=10', duracao: 4 });
  escreverSidecar(nome, 'reels', 'Texto curto de teste. Link na bio.', 3);

  const relatorio1 = [];
  processarVideo(nome, relatorio1);
  const hash1 = hashArquivo(video);

  const masterAntes = fs.readFileSync(path.join(DIR_REELS, '_sem_legenda', `${nome}.mp4`));

  const relatorio2 = [];
  processarVideo(nome, relatorio2);
  const hash2 = hashArquivo(video);

  const masterDepois = fs.readFileSync(path.join(DIR_REELS, '_sem_legenda', `${nome}.mp4`));

  assert.equal(hash1, hash2, 'o vídeo final mudou entre a 1ª e a 2ª execução — sinal de legenda em dobro');
  assert.ok(masterAntes.equals(masterDepois), 'o master sem legenda foi tocado na 2ª execução — devia ser imutável depois de criado');
});

// ---- Teste extra (achado da code-review desta rodada): o master de
// legenda tem que se REGENERAR quando a narração muda, não ficar
// preso na versão antiga ----
// Sem a invalidação (adicionada em narrar.js depois que a code-review
// achou o bug), rodar `narrar.js --voz outra` sobre um vídeo que já
// tinha sido legendado deixaria `legendar.js` queimando a legenda
// NOVA em cima do vídeo VELHO (o master nunca seria atualizado).
// Simula aqui o que narrar.js agora faz ao renarrar: sobrescreve
// `arquivoAtual` com conteúdo novo e apaga o master de legenda.
teste('legendar.js: o master se regenera depois que a narração muda (invalidado por narrar.js)', () => {
  const nome = 'teste-invalidacao';
  const video = path.join(DIR_REELS, `${nome}.mp4`);
  const masterPath = path.join(DIR_REELS, '_sem_legenda', `${nome}.mp4`);

  gerarVideo(video, { filtroVideo: 'color=c=gray:size=1080x1920:rate=10', duracao: 4 });
  escreverSidecar(nome, 'reels', 'Texto da narração A. Link na bio.', 3);
  processarVideo(nome, []);
  const masterA = fs.readFileSync(masterPath);

  // "re-narração" (o que narrar.js faz de verdade): grava um vídeo
  // NOVO em arquivoAtual e invalida o cache de legenda.
  gerarVideo(video, { filtroVideo: 'color=c=blue:size=1080x1920:rate=10', duracao: 4 });
  fs.rmSync(masterPath);
  escreverSidecar(nome, 'reels', 'Texto da narração B, bem diferente da A. Link na bio.', 3);

  processarVideo(nome, []);
  const masterB = fs.readFileSync(masterPath);

  assert.ok(!masterA.equals(masterB), 'o master não foi regenerado — legendar.js queimaria a legenda nova em cima do vídeo VELHO (bug achado na code-review)');
});

// ---- Teste c: legenda forçada sobre o "aparelho" tem que FALHAR ----
// Gera um vídeo com ruído forte bem na caixa da legenda (simula um
// elemento gráfico importante ali) — a checagem de área livre tem que
// bloquear: lançar erro e NÃO escrever o vídeo final.
teste('legendar.js: legenda sobre elemento importante BLOQUEIA a gravação', () => {
  const nome = 'teste-bloqueio-area';
  const video = path.join(DIR_REELS, `${nome}.mp4`);
  // testsrc2 cobre o quadro inteiro (incluindo a caixa da legenda,
  // y=1540-1800 pra categoria "reels") com padrão de cores variado —
  // amplitude alta de propósito, bem acima do limiar de 140.
  gerarVideo(video, { filtroVideo: 'testsrc2=size=1080x1920:rate=10', duracao: 4 });
  escreverSidecar(nome, 'reels', 'Texto curto de teste. Link na bio.', 3);

  const hashAntes = hashArquivo(video);

  assert.throws(
    () => processarVideo(nome, []),
    /intersecta elemento importante/,
    'esperava erro de área livre, mas processarVideo não lançou (ou lançou outra coisa)'
  );

  const hashDepois = hashArquivo(video);
  assert.equal(hashAntes, hashDepois, 'o vídeo final foi escrito mesmo com a checagem de área livre falhando');
});

finalizar();
