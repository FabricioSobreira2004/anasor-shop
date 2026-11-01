#!/usr/bin/env node
// ============================================================
// Legenda queimada em todos os vídeos narrados (Rodada 7, item novo
// — nunca implementado nas rodadas anteriores). Lê o sidecar que
// narrar.js grava em E:/projetos/site-mae/_narracao-dados/<nome>.json
// (texto FINAL já falado + duração real da voz) e:
//   1) gera um .srt com blocos de 3-6 palavras, com o tempo de cada
//      palavra estimado por PROPORÇÃO DE CARACTERES dentro da
//      duração real da voz (ver DECISOES.md: tentei o filtro
//      `whisper` do ffmpeg pra alinhamento por ASR de verdade, mas a
//      voz sintética do Piper saiu transcrita errada demais pro
//      modelo "base" confiar no texto reconhecido — fiquei com a
//      estimativa proporcional, mais simples e sem risco de legenda
//      dizer palavra errada);
//   2) queima o .srt no vídeo via libass (filtro `subtitles` do
//      ffmpeg), numa posição FIXA por categoria de vídeo (tour
//      mobile/desktop/reels) escolhida a partir da mesma zona seguro
//      já validada no projeto (LAYOUT_CELULAR.CAPTION_TOP do tour,
//      "nada importante nos 250px topo/420px base" dos Reels);
//   3) confere por código, numa amostra de quadros, que a caixa da
//      legenda não cai numa região "ocupada" (variância de luminância
//      alta = tem elemento gráfico ali) antes de aceitar a posição.
//
// Nunca sobrescreve o .mp4 atual sem arquivar antes (mesma regra do
// narrar.js) — a versão legendada anterior (se houver) vai pra
// `_anteriores/<data>/<nome>-<hora>.mp4`.
//
// IDEMPOTÊNCIA (achado da code-review, Etapa 3a — rodar duas vezes
// estava queimando legenda em cima de legenda): antes, a queima lia
// e escrevia o MESMO arquivo (`arquivoAtual`) — na 2ª execução,
// `arquivoAtual` já vinha com legenda da 1ª, e a queima rodava de
// novo por cima. Agora existe um MASTER permanente, sem legenda, em
// `<pasta>/_sem_legenda/<nome>.mp4`: na 1ª vez que um vídeo passa por
// aqui, o master é criado a partir do `arquivoAtual` de então (que
// nesse momento é assumido limpo — acabou de sair do narrar.js).
// A partir daí, a queima SEMPRE lê do master (nunca de `arquivoAtual`,
// que passa a ser só o destino final) — rodar de novo produz a mesma
// legenda em cima do mesmo vídeo limpo, nunca uma segunda camada.
// Esse master fica OBSOLETO se o vídeo for renarrado (voz/ritmo
// diferente) — é por isso que `narrar.js` apaga
// `_sem_legenda/<nome>.mp4` sempre que regera a narração de um vídeo
// (achado de uma code-review posterior, ver DECISOES.md): sem isso,
// uma narração nova seria legendada com o áudio/texto da ANTERIOR.
//
//   node legendar.js                                  → todos os 18
//   node legendar.js --nome tour-instagram             → só 1 (teste)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path.js');

// Caminhos sobrepostos por variável de ambiente — usado só por
// teste-legendar.js, pra rodar o pipeline de verdade (ffmpeg incluso)
// numa pasta sandbox em vez de mexer na mídia real de site-mae.
const DIR_NARRACAO = __dirname;
const DADOS_LEGENDA = process.env.LEGENDAR_DADOS || 'E:/projetos/site-mae/_narracao-dados';
const SITE_MAE_REELS = process.env.LEGENDAR_REELS || 'E:/projetos/site-mae/reels';
const SITE_MAE_TOUR = process.env.LEGENDAR_TOUR || 'E:/projetos/site-mae/tour';
const TMP = process.env.LEGENDAR_TMP || 'E:/projetos/_tmp/narracao';

// Formatador comum (achado do simplify: tempoSrt/tempoAss/
// dataHoraArquivo definiam a mesma função 3x) — 2 dígitos por padrão,
// usado pra hora/minuto/segundo em todo o arquivo.
const pad = (n, l = 2) => String(n).padStart(l, '0');

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Limiar de amplitude (YMAX-YMIN) acima do qual a caixa da legenda é
// considerada "ocupada" por um elemento gráfico — único lugar que
// define o número (achado do simplify: estava duplicado na comparação
// e na mensagem de erro).
const LIMIAR_AMPLITUDE_LEGENDA = 140;

// Aprovações manuais de falso-positivo na checagem de área livre —
// DADOS, não código (achado da code-review: um array de nomes
// hardcoded no .js cresceria 1 linha por vídeo flaky, sem histórico
// nem forma de expirar). Cada entrada trava a AMPLITUDE aprovada na
// hora da inspeção visual, não só o nome — se uma amostragem futura
// sair muito mais alta que a aprovada (TOLERANCIA abaixo), a aprovação
// velha não cobre silenciosamente um problema novo.
const TOLERANCIA_APROVACAO = 1.3;
function lerAprovacoesAreaLivre() {
  const arquivo = path.join(DIR_NARRACAO, 'aprovacoes-area-livre.json');
  if (!fs.existsSync(arquivo)) return {};
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

// Caminho do master permanente sem legenda — função única (achado da
// code-review: o literal '_sem_legenda' estava hardcoded tanto aqui
// quanto em narrar.js, que precisa apagar esse arquivo quando renarra
// um vídeo; narrar.js importa esta função em vez de remontar o
// caminho por conta própria).
function caminhoMaster(dirPasta, nome) {
  return path.join(dirPasta, '_sem_legenda', `${nome}.mp4`);
}

// Categoria de vídeo -> geometria do canvas + zona segura pra legenda
// (ver DECISOES.md pela origem de cada número):
//   - tourMobile: 1080x1920, abaixo do celular (LAYOUT_CELULAR.CAPTION_TOP
//     = 1140 em componentes.js do tour) e acima da faixa de 250px
//     reservada pra UI do Instagram.
//   - tourDesktop: 1920x1080, abaixo da moldura de navegador
//     (MolduraDesktop: top 54 + altura 738 = base em 792).
//   - reels: 1080x1920, dentro da faixa "nada importante" já usada
//     pros selos/CTA nos templates (250px topo / 420px base), perto
//     do fim dessa faixa mas com folga antes da UI do Instagram.
const CATEGORIAS = {
  tourMobile: { largura: 1080, altura: 1920, caixaTop: 1160, caixaAltura: 420, fonte: 42 },
  // caixaTop ACHADO testando (Rodada 7): a moldura do navegador
  // desktop termina mais embaixo do que os números do componentes.js
  // sugeriam (~860px reais, não 792) — a 1ª tentativa (caixaTop:840)
  // cortava a borda do mockup e os pontinhos do carrossel. Empurrado
  // pra 890, com caixa mais baixa (90px), pra caber folgado entre o
  // fim do mockup (~860) e a barra de tecnologias do rodapé (~1010).
  tourDesktop: { largura: 1920, altura: 1080, caixaTop: 890, caixaAltura: 90, fonte: 34 },
  reels: { largura: 1080, altura: 1920, caixaTop: 1540, caixaAltura: 260, fonte: 44 },
};

function categoriaDoVideo(nome, pasta) {
  if (nome === 'tour-portfolio') return 'tourDesktop';
  if (pasta === 'tour') return 'tourMobile';
  return 'reels';
}

// Formatador único de tempo (achado da code-review, Etapa 3b): o jeito
// antigo arredondava SEPARADAMENTE os segundos (Math.floor) e os ms
// (Math.round da fração) — em frações bem perto de 1 (ex.: 3.9996s),
// os segundos truncavam pra 3 e os ms arredondavam pra 1000, saindo
// "00:00:03,1000" (4 dígitos, SRT inválido). Agora arredonda o valor
// INTEIRO pra uma única unidade pequena (ms ou centissegundo) ANTES de
// decompor em h/m/s/frac — a decomposição por módulo garante que a
// fração nunca "vaza" pra fora de 0-999 (ou 0-99).
function decompor(segundos, unidadesPorSegundo) {
  let total = Math.round(segundos * unidadesPorSegundo);
  const frac = total % unidadesPorSegundo;
  total = Math.floor(total / unidadesPorSegundo);
  const s = total % 60;
  total = Math.floor(total / 60);
  const m = total % 60;
  const h = Math.floor(total / 60);
  return { h, m, s, frac };
}

function tempoSrt(segundos) {
  const { h, m, s, frac } = decompor(segundos, 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(frac, 3)}`;
}

// Separa o texto final em palavras e estima o tempo de cada uma por
// PROPORÇÃO DE CARACTERES (peso = tamanho da palavra + 3, pra palavras
// curtas não ficarem com tempo perto de zero — toda palavra tem um
// mínimo de abertura/fechamento de fonema). Depois agrupa em blocos de
// 3 a 6 palavras (padrão 4-5, legenda queimada em blocos, não
// palavra-por-palavra — decisão registrada em DECISOES.md).
function construirBlocos(textoFinal, offsetVoz, duracaoVoz) {
  const palavras = textoFinal.trim().split(/\s+/).filter(Boolean);
  const pesos = palavras.map((p) => p.length + 3);
  const pesoTotal = pesos.reduce((a, b) => a + b, 0);
  const tempos = [];
  let acumulado = 0;
  for (let i = 0; i < palavras.length; i += 1) {
    const inicio = offsetVoz + (acumulado / pesoTotal) * duracaoVoz;
    acumulado += pesos[i];
    const fim = offsetVoz + (acumulado / pesoTotal) * duracaoVoz;
    tempos.push({ palavra: palavras[i], inicio, fim });
  }

  const blocos = [];
  const TAMANHO_BLOCO = 4;
  for (let i = 0; i < tempos.length; i += TAMANHO_BLOCO) {
    const grupo = tempos.slice(i, i + TAMANHO_BLOCO);
    blocos.push({
      texto: grupo.map((g) => g.palavra).join(' '),
      inicio: grupo[0].inicio,
      fim: grupo[grupo.length - 1].fim,
    });
  }
  return blocos;
}

function escreverSrt(blocos, arquivo) {
  const linhas = blocos.map((b, i) =>
    `${i + 1}\n${tempoSrt(b.inicio)} --> ${tempoSrt(b.fim)}\n${b.texto}\n`
  );
  fs.writeFileSync(arquivo, linhas.join('\n'), 'utf8');
}

// ACHADO testando (Rodada 7): queimar um .srt puro com `force_style`
// no filtro `subtitles` do ffmpeg saiu com o texto GIGANTE e fora de
// posição — o libass converte o .srt pra ASS internamente com uma
// resolução de script PADRÃO que não bate com o vídeo real (1080x1920
// ou 1920x1080), e nem `original_size` corrigiu (parâmetro pensado
// pra legendas de imagem tipo DVD, não texto puro). A solução robusta
// é escrever o .ass por conta própria, com `PlayResX`/`PlayResY`
// IGUAIS à resolução real do vídeo — assim a posição e o tamanho da
// fonte batem exatamente com os pixels do quadro, sem adivinhação do
// libass. Confirmado visualmente (ver DECISOES.md) antes de aceitar.
function tempoAss(segundos) {
  const { h, m, s, frac } = decompor(segundos, 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(frac)}`;
}

// Cor ASS = &HAABBGGRR& (alfa,azul,verde,vermelho; alfa 00=opaco,
// FF=invisível). Texto creme (#F7EFE1, identidade da marca) com
// CONTORNO grosso marrom quase preto (#140C08, Outline=5 + Shadow=2)
// — ACHADO testando: a caixa opaca (BorderStyle=3/BackColour) não
// aparecia nesta build do libass (testei contra o cartão final claro
// e o texto ficou quase invisível, sem nenhuma caixa atrás). Contorno
// grosso garante AA em QUALQUER fundo (claro ou escuro), sem depender
// de BackColour — mais simples e mais robusto. Confirmado visualmente
// nas cenas claras e escuras antes de aceitar (ver DECISOES.md).
function escreverAss(blocos, arquivo, geom) {
  const cabecalho = `[Script Info]
ScriptType: v4.00+
PlayResX: ${geom.largura}
PlayResY: ${geom.altura}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Legenda,Arial,${geom.fonte},&H00E1EFF7,&H00E1EFF7,&H00140C08,&H2A1B2B10,1,0,0,0,100,100,0,0,1,5,2,8,40,40,${geom.caixaTop},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const eventos = blocos.map((b) =>
    `Dialogue: 0,${tempoAss(b.inicio)},${tempoAss(b.fim)},Legenda,,0,0,0,,${b.texto}`
  );
  fs.writeFileSync(arquivo, cabecalho + eventos.join('\n') + '\n', 'utf8');
}

// Checagem automática da área da legenda: extrai N quadros no meio de
// cada bloco de legenda, recorta a CAIXA DA LEGENDA e uma CAIXA DE
// REFERÊNCIA conhecida como vazia (a faixa dos 250px do topo, sempre
// livre pelo próprio projeto), e compara o desvio padrão de luminância
// (signalstats) das duas — se a caixa da legenda tiver variância muito
// maior que a de referência, tem elemento gráfico (celular/produto/
// selo/CTA) por baixo, e a posição falha.
function checarAreaLivre(videoSemLegenda, categoria, geom) {
  // Duração calculada aqui dentro (achado do simplify: antes vinha de
  // um `duracaoVideoCache` global, setado pelo chamador um pouco
  // antes — acoplamento por estado de módulo sem necessidade, já que
  // a função já recebe o vídeo como parâmetro).
  const duracaoVideo = duracaoSegundos(videoSemLegenda);
  const amostras = [0.2, 0.5, 0.8].map((f) => f * duracaoVideo);
  const resultados = [];
  for (const t of amostras) {
    const statsLegenda = extrairDesvioPadrao(videoSemLegenda, t, 0, geom.caixaTop, geom.largura, geom.caixaAltura);
    const statsRef = extrairDesvioPadrao(videoSemLegenda, t, 0, 10, geom.largura, 120);
    resultados.push({ t, statsLegenda, statsRef });
  }
  return resultados;
}

function extrairDesvioPadrao(video, t, x, y, w, h) {
  const saida = execSync(
    `"${FFMPEG}" -ss ${t.toFixed(2)} -i "${video}" -frames:v 1 -vf "crop=${w}:${h}:${x}:${y},signalstats,metadata=print" -f null - 2>&1`
  ).toString();
  const mins = [...saida.matchAll(/signalstats\.YMIN=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const maxs = [...saida.matchAll(/signalstats\.YMAX=([\d.]+)/g)].map((m) => parseFloat(m[1]));
  if (mins.length === 0 || maxs.length === 0) return null;
  // Último par (o -ss pode decodificar quadros extras até achar o
  // pedido) — amplitude (YMAX-YMIN) do recorte como proxy de "tanta
  // coisa visual ali": fundo liso/gradiente = amplitude baixa;
  // texto/ícone/borda de celular = amplitude bem mais alta.
  return maxs[maxs.length - 1] - mins[mins.length - 1];
}

function duracaoSegundos(arquivo) {
  const out = execSync(`"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${arquivo}"`).toString().trim();
  return parseFloat(out);
}

function escaparCaminhoFiltro(p) {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

function queimarLegenda(video, arquivoAss, saida) {
  const filtro = `subtitles='${escaparCaminhoFiltro(arquivoAss)}'`;
  execSync(
    `"${FFMPEG}" -y -i "${video}" -vf "${filtro}" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a copy -movflags +faststart "${saida}"`,
    { stdio: 'ignore' }
  );
}

function dataHoraArquivo() {
  const d = new Date();
  return `${dataHoje()}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function processarVideo(nome, relatorio) {
  const arquivoJson = path.join(DADOS_LEGENDA, `${nome}.json`);
  if (!fs.existsSync(arquivoJson)) {
    relatorio.push(`${nome}: PULADO — sem sidecar de narração (rode narrar.js antes)`);
    return;
  }
  const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));
  const { pasta, textoFinal, offsetVoz, duracaoVoz } = dados;
  const dirPasta = pasta === 'reels' ? SITE_MAE_REELS : SITE_MAE_TOUR;
  const arquivoAtual = path.join(dirPasta, `${nome}.mp4`);
  const arquivoSrt = path.join(dirPasta, `${nome}.srt`);
  const arquivoAss = path.join(TMP, `${nome}.ass`);

  // Master permanente, sem legenda — ver comentário no topo do
  // arquivo (Etapa 3a). Seedado uma única vez; depois disso, toda
  // queima lê SÓ deste arquivo, nunca de `arquivoAtual`.
  const arquivoMaster = caminhoMaster(dirPasta, nome);
  fs.mkdirSync(path.dirname(arquivoMaster), { recursive: true });
  if (!fs.existsSync(arquivoMaster)) {
    if (!fs.existsSync(arquivoAtual)) {
      relatorio.push(`${nome}: PULADO — vídeo não encontrado em ${arquivoAtual}`);
      return;
    }
    fs.copyFileSync(arquivoAtual, arquivoMaster);
  }

  const categoria = categoriaDoVideo(nome, pasta);
  const geom = CATEGORIAS[categoria];

  const blocos = construirBlocos(textoFinal, offsetVoz, duracaoVoz);
  escreverSrt(blocos, arquivoSrt); // entregável pro Fabrício reusar
  escreverAss(blocos, arquivoAss, geom); // usado só pra queimar (controle total de posição/tamanho)

  // Checagem de área livre ANTES de queimar, sempre contra o MASTER
  // limpo (garantidamente sem legenda, mesmo que `arquivoAtual` já
  // tenha uma de uma rodada anterior) — compara a caixa da legenda
  // com a faixa de referência conhecida como vazia (topo).
  const checagem = checarAreaLivre(arquivoMaster, categoria, geom);
  const amplitudes = checagem.map((c) => c.statsLegenda).filter((v) => v !== null);
  const amplitudeMedia = amplitudes.length ? amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length : null;
  // Fundo liso/gradiente tem amplitude baixa (~30-90 em 0-255);
  // qualquer elemento gráfico nítido (texto, borda de celular, ícone)
  // empurra a amplitude bem mais alto — LIMIAR_AMPLITUDE_LEGENDA (140)
  // dá folga generosa.
  const areaLivre = amplitudeMedia !== null && amplitudeMedia < LIMIAR_AMPLITUDE_LEGENDA;
  const aprovacao = lerAprovacoesAreaLivre()[nome];
  const dentroDaAprovacao = !areaLivre && aprovacao && amplitudeMedia !== null
    && amplitudeMedia <= aprovacao.amplitudeAprovada * TOLERANCIA_APROVACAO;

  // Etapa 3c (code-review): a checagem de área livre BLOQUEIA a
  // gravação — se a caixa da legenda cair sobre algo importante, o
  // vídeo final NÃO é gerado (nem arquivado, nem sobrescrito), erro
  // claro, e quem chamou ajusta a posição/geometria antes de tentar
  // de novo. Exceção só pra falso-positivo JÁ aprovado em
  // `aprovacoes-area-livre.json` E dentro da tolerância da amplitude
  // aprovada (uma amplitude muito maior que a aprovada é tratada como
  // problema NOVO, não coberta pela aprovação velha).
  if (!areaLivre && !dentroDaAprovacao) {
    throw new Error(
      `legenda intersecta elemento importante da cena (amplitude ${amplitudeMedia === null ? 'n/d' : amplitudeMedia.toFixed(1)} ≥ limiar ${LIMIAR_AMPLITUDE_LEGENDA}, caixa y=${geom.caixaTop}-${geom.caixaTop + geom.caixaAltura}) — ajuste CATEGORIAS.${categoria} em legendar.js antes de regenerar`
    );
  }

  // Arquiva a versão final ATUAL (o que tiver lá — já legendada numa
  // rodada anterior, ou ainda limpa na 1ª vez) antes de sobrescrever.
  // Nome com data+hora: evita que duas execuções no mesmo dia pisem
  // no arquivo uma da outra (a regra é nunca sobrescrever sem
  // arquivar, não arquivar só a 1ª vez do dia).
  if (fs.existsSync(arquivoAtual)) {
    const dirAnteriores = path.join(dirPasta, '_anteriores', dataHoje());
    fs.mkdirSync(dirAnteriores, { recursive: true });
    fs.copyFileSync(arquivoAtual, path.join(dirAnteriores, `${nome}-${dataHoraArquivo()}.mp4`));
  }

  const saidaTmp = path.join(TMP, `${nome}-legendado.mp4`);
  queimarLegenda(arquivoMaster, arquivoAss, saidaTmp);
  fs.renameSync(saidaTmp, arquivoAtual);

  const notaFalsoPositivo = dentroDaAprovacao ? ` (falso-positivo aprovado: ${aprovacao.motivo} — seguiu mesmo assim)` : '';
  // amplitudeMedia !== null (não "amplitudeMedia ?") — 0 é uma
  // amplitude válida (quadro perfeitamente liso) e é falsy em JS; o
  // operador ternário antigo mostrava "n/d" pra esse caso real.
  const linha = `${nome} [${categoria}] — ${blocos.length} blocos de legenda, caixa y=${geom.caixaTop}-${geom.caixaTop + geom.caixaAltura} | amplitude da caixa=${amplitudeMedia !== null ? amplitudeMedia.toFixed(1) : 'n/d'} | ${areaLivre ? 'OK área-livre' : 'FALHA área-livre'}${notaFalsoPositivo}`;
  console.log(`${areaLivre ? '✅' : '⚠️ '} ${linha}`);
  relatorio.push(linha);
}

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--nome');
  const nomeFiltro = i >= 0 ? args[i + 1] : null;

  const todos = fs.readdirSync(DADOS_LEGENDA).map((f) => f.replace('.json', ''));
  const lista = nomeFiltro ? todos.filter((n) => n === nomeFiltro) : todos;

  const relatorio = [];
  for (const nome of lista) {
    try {
      processarVideo(nome, relatorio);
    } catch (erro) {
      console.error(`❌ ${nome}: FALHOU — ${erro.message}`);
      relatorio.push(`${nome}: FALHOU — ${erro.message}`);
    }
  }
  fs.writeFileSync('E:/projetos/_tmp/legenda-relatorio.txt', relatorio.join('\n') + '\n', 'utf8');
  console.log('\nRelatório salvo em E:/projetos/_tmp/legenda-relatorio.txt');
}

// Só roda sozinho quando chamado direto (`node legendar.js`) — quando
// importado (teste-legendar.js), só expõe as funções, sem processar
// os 18 vídeos de produção.
if (require.main === module) {
  main();
}

module.exports = { decompor, tempoSrt, tempoAss, construirBlocos, processarVideo, categoriaDoVideo, CATEGORIAS, caminhoMaster };
