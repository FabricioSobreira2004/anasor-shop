#!/usr/bin/env node
// ============================================================
// Narração em TODOS os vídeos (Rodada 5, item 4; refeito na Rodada
// 6, item A — voz travada/lenta reportada pelo Fabrício).
//
// O QUE MUDOU NA RODADA 6 (ver DECISOES.md pros detalhes):
//   - Ritmo agora é ajustado NA PRÓPRIA VOZ (--ritmo: Rate do SAPI
//     ou length_scale do Piper), nunca esticando o áudio depois com
//     atempo — isso causava o efeito "picado" relatado. Se o texto
//     não couber nem cortado ao máximo, o script AVISA e segue (não
//     acelera).
//   - Suporta 2 motores — SAPI (Microsoft Maria, feminina) e Piper
//     (vozes neurais pt_BR, masculinas — ver narracao-amostras/):
//     node narrar.js --voz maria --ritmo 5
//     node narrar.js --voz faber --ritmo 0.4
//     Padrão sem --voz/--ritmo (Rodada 7, ESCOLHA DO FABRÍCIO depois
//     de ouvir as amostras): jeff, ritmo 0.7 — ver VOZES abaixo.
//   - Checa por código se a voz tem algum silêncio ≥0,6s NO MEIO da
//     fala (silencedetect) antes de mixar — registra aviso, não
//     bloqueia (editar o roteiro.md é o jeito de corrigir).
//   - Acabamento: highpass 80Hz, compressão suave, fade-out de
//     120ms no FIM da voz, loudnorm -16 LUFS (mesma cadeia de
//     sempre). Sem reverberação — decisão registrada em
//     DECISOES.md (não dava pra confirmar por ouvido que não ficaria
//     artificial, então pulei em vez de arriscar).
//
// Lê marketing/instagram/narracao/roteiros.md (fonte única do texto
// — editar o roteiro ali e rodar este script de novo regenera a
// narração). Mixa com o vídeo mudo original via ffmpeg:
//   - voz começa ~0,3s depois do início;
//   - áudio final AAC 48kHz estéreo 128kbps; vídeo copiado sem
//     recompressão (-c:v copy);
//   - a trilha de voz é "preenchida" com silêncio até o fim do
//     vídeo (apad + -shortest limitado pelo vídeo).
//
// O vídeo mudo ORIGINAL nunca é sobrescrito: antes de qualquer
// mixagem, é arquivado em reels\_mudo\ ou tour\_mudo\ (uma vez só).
//
//   node narrar.js                                       → todos os 18
//   node narrar.js --nome r1-caneca-surpresa-gatinho      → só 1 (teste)
//   node narrar.js --voz faber --ritmo 0.4                → troca de voz/ritmo
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path.js');
const { caminhoMaster } = require('./legendar.js');

const DIR_NARRACAO = __dirname;
const SITE_MAE_REELS = 'E:/projetos/site-mae/reels';
// NARRAR_TOUR_DIR/NARRAR_DADOS_DIR (opcionais) — Rodada 10 (v3): mesmo
// padrão de LEGENDAR_* (legendar.js) — redireciona o pipeline do TOUR
// pra tour\v3\ sem tocar nos arquivos v2 (reels nunca é afetado, usa
// sempre SITE_MAE_REELS). Sem as env vars, comportamento idêntico.
const SITE_MAE_TOUR = process.env.NARRAR_TOUR_DIR || 'E:/projetos/site-mae/tour';
const MUDO_REELS = path.join(SITE_MAE_REELS, '_mudo');
const MUDO_TOUR = path.join(SITE_MAE_TOUR, '_mudo');
const ANTERIORES_REELS = path.join(SITE_MAE_REELS, '_anteriores');
const ANTERIORES_TOUR = path.join(SITE_MAE_TOUR, '_anteriores');
const DADOS_LEGENDA = process.env.NARRAR_DADOS_DIR || 'E:/projetos/site-mae/_narracao-dados';
const TMP = 'E:/projetos/_tmp/narracao';
const PIPER_MODELOS = 'E:/projetos/_tmp/piper-modelos';

// Data de hoje (AAAA-MM-DD), usada só pro nome da subpasta de
// arquivamento — regra fixa do usuário (Rodada 7): NUNCA sobrescrever
// o .mp4 atual sem arquivar a versão anterior primeiro.
function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// wpsReferencia: palavras/s medida na AMOSTRA de referência de cada
// voz+ritmo (narracao-amostras/, texto de 85 palavras) — usada só pra
// checar se uma síntese de produção saiu dentro do esperado PRA
// AQUELA voz (cada voz/ritmo tem seu próprio ritmo natural; o antigo
// limiar fixo 2.8-3.1 era calibrado só pra Maria Rate=4/5 e reportaria
// "FALHA" em qualquer voz Piper por não ser a mesma métrica).
const VOZES = {
  maria: { tipo: 'sapi', vozSapi: 'Microsoft Maria Desktop', ritmoPadrao: 4, wpsReferencia: 2.95 },
  faber: { tipo: 'piper', modelo: path.join(PIPER_MODELOS, 'pt_BR-faber-medium.onnx'), ritmoPadrao: 0.4, wpsReferencia: 85 / 15.151020 },
  cadu: { tipo: 'piper', modelo: path.join(PIPER_MODELOS, 'pt_BR-cadu-medium.onnx'), ritmoPadrao: 0.4, wpsReferencia: null },
  // jeff/ritmo 0.7 — ESCOLHA DO FABRÍCIO (Rodada 7): ouviu as amostras
  // em narracao-amostras/ e escolheu esta (voz masculina, ritmo mais
  // pausado) como PADRÃO pra todos os vídeos. wpsReferencia medida na
  // própria amostra voz-piper-jeff-ritmo-0.7.wav (85 palavras / 23,59s
  // = 3,60 wps) — ver DECISOES.md.
  jeff: { tipo: 'piper', modelo: path.join(PIPER_MODELOS, 'pt_BR-jeff-medium.onnx'), ritmoPadrao: 0.7, wpsReferencia: 85 / 23.591474 },
  edresson: { tipo: 'piper', modelo: path.join(PIPER_MODELOS, 'pt_BR-edresson-low.onnx'), ritmoPadrao: 0.35, wpsReferencia: null },
};
const VOZ_PADRAO = 'jeff';

const OFFSET_VOZ = 0.3; // segundos
const FOLGA_FIM = 0.5; // segundos
const FADE_OUT = 0.12; // segundos, pedido explícito (A5)

const VIDEOS = [
  { nome: 'r1-caneca-surpresa-gatinho', pasta: 'reels' },
  { nome: 'r7-casinhas-de-fada', pasta: 'reels' },
  { nome: 'prato-canario-flor-de-outono', pasta: 'reels' },
  { nome: 'vaso-refugio-de-petalas', pasta: 'reels' },
  { nome: 'caneca-passaro-azul', pasta: 'reels' },
  { nome: 'colecao-objetos-decorativos', pasta: 'reels' },
  { nome: 'caneca-surpresa-cachorrinho', pasta: 'reels' },
  { nome: 'kit-canequinhas-arlequim', pasta: 'reels' },
  { nome: 'anjo-guardiao-porta-incenso', pasta: 'reels' },
  { nome: 'kit-copos-ondas-do-mar', pasta: 'reels' },
  { nome: 'prato-ave-da-alvorada', pasta: 'reels' },
  { nome: 'colecao-pecas-de-alma', pasta: 'reels' },
  { nome: 'cuidados-conteudo', pasta: 'reels' },
  { nome: 'como-comprar-conteudo', pasta: 'reels' },
  { nome: 'peca-unica-conteudo', pasta: 'reels' },
  { nome: 'encomenda-conteudo', pasta: 'reels' },
  { nome: 'tour-instagram', pasta: 'tour' },
  { nome: 'tour-portfolio', pasta: 'tour' },
];

const FECHAMENTO = 'Link na bio, no arroba anasor ponto cerâmica.';

function lerArgs() {
  const args = process.argv.slice(2);
  const pegar = (bandeira) => {
    const i = args.indexOf(bandeira);
    return i >= 0 ? args[i + 1] : null;
  };
  return {
    nomeFiltro: pegar('--nome'),
    voz: pegar('--voz') || VOZ_PADRAO,
    ritmoArg: pegar('--ritmo'),
  };
}

// Lê roteiros.md e extrai { nome -> texto } a partir dos cabeçalhos
// "### <nome> (...)" seguidos da primeira linha "> texto" depois dele.
function lerRoteiros() {
  const md = fs.readFileSync(path.join(DIR_NARRACAO, 'roteiros.md'), 'utf8');
  const linhas = md.split('\n');
  const roteiros = {};
  let nomeAtual = null;
  for (const linha of linhas) {
    const titulo = linha.match(/^### ([a-z0-9-]+)\s*\(/);
    if (titulo) {
      nomeAtual = titulo[1];
      continue;
    }
    if (nomeAtual && linha.startsWith('> ')) {
      roteiros[nomeAtual] = linha.slice(2).trim();
      nomeAtual = null;
    }
  }
  return roteiros;
}

function contarPalavras(texto) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

function duracaoSegundos(arquivo) {
  const out = execSync(`"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${arquivo}"`).toString().trim();
  return parseFloat(out);
}

function contarAudioEVideo(arquivo) {
  const out = execSync(`"${FFPROBE}" -v error -show_entries stream=codec_type,codec_name -of csv=p=0 "${arquivo}"`).toString().trim();
  const linhas = out.split('\n').filter(Boolean);
  return {
    audio: linhas.filter((l) => l.includes('audio')).length,
    video: linhas.filter((l) => l.includes('video')).length,
  };
}

// volumedetect imprime o resultado no stderr; ffmpeg sai com código 0
// mesmo assim, então basta redirecionar stderr pro mesmo fluxo (2>&1).
function volumeDetect(arquivo) {
  const saida = execSync(`"${FFMPEG}" -y -i "${arquivo}" -af volumedetect -f null - 2>&1`).toString();
  const mean = saida.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const max = saida.match(/max_volume:\s*(-?[\d.]+) dB/);
  return {
    mean: mean ? parseFloat(mean[1]) : null,
    max: max ? parseFloat(max[1]) : null,
  };
}

// Procura silêncio ≥0,6s DENTRO da fala (exclui o começo e o fim
// naturais) — item A4: detectar corte abrupto/artefato por código,
// já que não dá pra ouvir. noise=-35dB é um limiar conservador (fala
// normal fica bem acima disso; só pausa/silêncio real cai abaixo).
function detectarSilencioInterno(arquivoWav, duracaoVoz) {
  const saida = execSync(`"${FFMPEG}" -i "${arquivoWav}" -af silencedetect=noise=-35dB:d=0.6 -f null - 2>&1`).toString();
  const inicios = [...saida.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const fins = [...saida.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const internos = [];
  for (let i = 0; i < inicios.length; i += 1) {
    const inicio = inicios[i];
    const fim = fins[i] != null ? fins[i] : duracaoVoz;
    // ignora silêncio colado no começo (<0,3s) ou no fim (>duração-0,3s)
    if (inicio > 0.3 && fim < duracaoVoz - 0.3) {
      internos.push({ inicio: inicio.toFixed(2), fim: fim.toFixed(2) });
    }
  }
  return internos;
}

// Corta o CONTEÚDO (nunca o fechamento fixo) preservando frases ou
// cláusulas inteiras — (1) solta a última FRASE (último ". "); (2)
// solta a última CLÁUSULA (última ", "); (3) só por último, palavra.
function cortarConteudo(texto) {
  if (!texto.endsWith(FECHAMENTO)) return texto;
  const conteudo = texto.slice(0, texto.length - FECHAMENTO.length).trim();

  const ultimoPonto = conteudo.lastIndexOf('. ');
  const ultimaVirgula = conteudo.lastIndexOf(', ');
  let novoConteudo;
  if (ultimoPonto > 0) {
    novoConteudo = conteudo.slice(0, ultimoPonto + 1);
  } else if (ultimaVirgula > 0) {
    novoConteudo = conteudo.slice(0, ultimaVirgula);
  } else {
    const palavras = conteudo.split(/\s+/);
    if (palavras.length <= 3) return texto;
    palavras.pop();
    novoConteudo = palavras.join(' ');
  }

  novoConteudo = novoConteudo.replace(/[,:;—-]+$/, '').trim();
  if (!/[.!?]$/.test(novoConteudo)) novoConteudo += '.';
  if (!novoConteudo || novoConteudo === '.') return texto;
  return `${novoConteudo} ${FECHAMENTO}`;
}

// SAPI e Piper só diferem no script .ps1 e nos parâmetros finais —
// 1 função só (achado do simplify: eram 2 quase idênticas + um
// despachante).
function sintetizar(texto, arquivoWav, voz, ritmo) {
  const arquivoTxt = path.join(TMP, 'texto-atual.txt');
  fs.writeFileSync(arquivoTxt, texto, 'utf8');
  const parametros = voz.tipo === 'sapi'
    ? `-Rate ${ritmo} -Voz "${voz.vozSapi}"`
    : `-Modelo "${voz.modelo}" -LengthScale ${ritmo}`;
  const script = path.join(DIR_NARRACAO, voz.tipo === 'sapi' ? 'sintetizar-voz.ps1' : 'sintetizar-piper.ps1');
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -File "${script}" -TextoArquivo "${arquivoTxt}" -SaidaWav "${arquivoWav}" ${parametros}`,
    { stdio: 'ignore' }
  );
}

// Sintetiza e, se a voz não couber na duração disponível, corta o
// texto e tenta de novo. NUNCA acelera o áudio (proibido na Rodada
// 6) — se mesmo cortado ao máximo não couber, avisa e segue com o
// que saiu (a mixagem corta no fim pelo -shortest, o que é menos
// ruim que esticar o áudio, mas o ideal é o roteiro caber sozinho).
function sintetizarComAjuste(textoOriginal, limiteSegundos, voz, ritmo, decisoes) {
  let texto = textoOriginal;
  const arquivoWav = path.join(TMP, 'voz.wav');
  let duracao;
  let tentativas = 0;
  const MAX_TENTATIVAS_CORTE = 8;

  while (true) {
    sintetizar(texto, arquivoWav, voz, ritmo);
    duracao = duracaoSegundos(arquivoWav);
    if (duracao <= limiteSegundos || tentativas >= MAX_TENTATIVAS_CORTE) break;
    const novoTexto = cortarConteudo(texto);
    if (novoTexto === texto) break;
    texto = novoTexto;
    tentativas += 1;
  }

  if (tentativas > 0) {
    decisoes.push(`texto cortado ${tentativas}x pra caber na duração (texto final: "${texto}")`);
  }
  if (duracao > limiteSegundos) {
    decisoes.push(`AVISO: mesmo cortado ao máximo, a voz (${duracao.toFixed(2)}s) passa do limite (${limiteSegundos.toFixed(2)}s) — não acelerei (proibido); revisar o roteiro.md pra este vídeo`);
  }

  return { arquivoWav, duracao, texto };
}

function mixar(video, voz, duracaoVoz, saida) {
  const inicioFade = Math.max(0, duracaoVoz - FADE_OUT).toFixed(3);
  const filtroVoz =
    `highpass=f=80,` +
    `acompressor=threshold=-18dB:ratio=3:attack=20:release=250,` +
    `afade=t=out:st=${inicioFade}:d=${FADE_OUT},` +
    `adelay=${Math.round(OFFSET_VOZ * 1000)}:all=1,` +
    `apad,` +
    `loudnorm=I=-16:TP=-1.5:LRA=11`;
  execSync(
    `"${FFMPEG}" -y -i "${video}" -i "${voz}" -filter_complex "[1:a]${filtroVoz}[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 128k -shortest "${saida}"`,
    { stdio: 'ignore' }
  );
}

// Função isolada (testável sem precisar sintetizar voz de verdade —
// ver teste-narrar.js) — Etapa 3d da code-review: antes, uma voz sem
// wpsReferencia própria (cadu/edresson) pulava a checagem (okRitmo
// sempre true). Agora SEMPRE compara: usa a referência da própria voz
// quando existe, senão cai pra referência da voz PADRÃO (jeff/0.7,
// que sempre tem wpsReferencia medida) — rígida pra qualquer voz.
function calcularFaixaRitmo(voz, wps) {
  const usouReferenciaPropria = typeof voz.wpsReferencia === 'number';
  const referenciaUsada = usouReferenciaPropria ? voz.wpsReferencia : VOZES[VOZ_PADRAO].wpsReferencia;
  const faixa = [referenciaUsada * 0.85, referenciaUsada * 1.15];
  return { faixa, okRitmo: wps >= faixa[0] && wps <= faixa[1], usouReferenciaPropria };
}

function processarVideo(item, roteiros, nomeVoz, voz, ritmo, relatorio) {
  const { nome, pasta } = item;
  const texto = roteiros[nome];
  if (!texto) {
    console.log(`⚠️  ${nome}: sem roteiro em roteiros.md, pulando`);
    relatorio.push(`${nome}: PULADO — sem roteiro em roteiros.md`);
    return;
  }

  const dirPasta = pasta === 'reels' ? SITE_MAE_REELS : SITE_MAE_TOUR;
  const dirMudo = pasta === 'reels' ? MUDO_REELS : MUDO_TOUR;
  const arquivoAtual = path.join(dirPasta, `${nome}.mp4`);
  const arquivoMudo = path.join(dirMudo, `${nome}.mp4`);

  if (!fs.existsSync(arquivoAtual)) {
    console.log(`⚠️  ${nome}: ${arquivoAtual} não existe, pulando`);
    relatorio.push(`${nome}: PULADO — arquivo de vídeo não encontrado`);
    return;
  }

  fs.mkdirSync(dirMudo, { recursive: true });
  if (!fs.existsSync(arquivoMudo)) {
    fs.copyFileSync(arquivoAtual, arquivoMudo);
  }

  // Regra fixa (Rodada 7): nunca sobrescrever o .mp4 atual sem
  // arquivar a versão anterior (ela pode já ter narração Maria da
  // Rodada 6) numa subpasta com a data de hoje — 1x por dia, pra não
  // acumular cópia idêntica se o script rodar de novo no mesmo dia.
  const dirAnteriores = pasta === 'reels' ? ANTERIORES_REELS : ANTERIORES_TOUR;
  const subpastaHoje = path.join(dirAnteriores, dataHoje());
  fs.mkdirSync(subpastaHoje, { recursive: true });
  const arquivoArquivado = path.join(subpastaHoje, `${nome}.mp4`);
  if (!fs.existsSync(arquivoArquivado)) {
    fs.copyFileSync(arquivoAtual, arquivoArquivado);
  }

  const duracaoVideo = duracaoSegundos(arquivoMudo);
  const limite = duracaoVideo - OFFSET_VOZ - FOLGA_FIM;

  const decisoes = [];
  const { arquivoWav, duracao: duracaoVoz, texto: textoFinal } = sintetizarComAjuste(texto, limite, voz, ritmo, decisoes);

  const silenciosInternos = detectarSilencioInterno(arquivoWav, duracaoVoz);
  if (silenciosInternos.length > 0) {
    decisoes.push(`AVISO: ${silenciosInternos.length} silêncio(s) ≥0,6s no meio da fala: ${silenciosInternos.map((s) => `${s.inicio}-${s.fim}s`).join(', ')}`);
  }

  const saidaTmp = path.join(TMP, `${nome}-narrado.mp4`);
  mixar(arquivoMudo, arquivoWav, duracaoVoz, saidaTmp);
  fs.renameSync(saidaTmp, arquivoAtual);

  // ACHADO da code-review (Rodada 8): legendar.js guarda um MASTER
  // permanente sem legenda em `_sem_legenda/<nome>.mp4`, criado uma
  // única vez e nunca mais tocado — pensado pra legendar.js não poder
  // se auto-contaminar rodando 2x. Mas isso deixava essa narração NOVA
  // (voz/ritmo diferente, ex. `--voz faber`) sem efeito nenhum: o
  // legendar.js continuaria lendo o master VELHO e sobrescreveria este
  // vídeo recém-narrado com a legenda da narração ANTERIOR. Quem muda
  // a narração (aqui) tem que invalidar esse cache — o master não é um
  // entregável do Fabrício (isso é `_mudo/`, preservado à parte), é só
  // um cache interno do legendar.js, seguro de apagar: ele se
  // regenera sozinho, a partir deste vídeo, na próxima vez que
  // legendar.js rodar. `caminhoMaster` vem de legendar.js (achado do
  // simplify: o caminho `_sem_legenda/<nome>.mp4` estava hardcoded nos
  // dois arquivos, sem contrato entre eles).
  const masterLegenda = caminhoMaster(dirPasta, nome);
  if (fs.existsSync(masterLegenda)) {
    fs.rmSync(masterLegenda);
    decisoes.push('narração mudou: cache de legenda (_sem_legenda/) invalidado — rode legendar.js de novo pra re-queimar a legenda nesta narração nova');
  }

  const streams = contarAudioEVideo(arquivoAtual);
  const duracaoFinal = duracaoSegundos(arquivoAtual);
  const volume = volumeDetect(arquivoAtual);
  const palavras = contarPalavras(textoFinal.slice(0, textoFinal.length - FECHAMENTO.length)) + contarPalavras(FECHAMENTO);
  const wps = duracaoVoz > 0 ? palavras / duracaoVoz : 0;

  const okStreams = streams.audio === 1 && streams.video === 1;
  const okSilencio = volume.mean !== null && volume.mean > -50;
  const okClipping = volume.max !== null && volume.max <= 0.5;
  const okDuracaoVoz = duracaoVoz < duracaoFinal - 0.5;
  // Ver calcularFaixaRitmo() acima — faixa de ±15% em volta da
  // referência da própria voz, ou da voz padrão quando não existe.
  const { faixa: faixaRitmo, okRitmo, usouReferenciaPropria } = calcularFaixaRitmo(voz, wps);
  const okSemCortesInternos = silenciosInternos.length === 0;

  const linha =
    `${nome} — voz=${nomeVoz} ritmo=${ritmo} | vídeo ${duracaoVideo.toFixed(2)}s, voz ${duracaoVoz.toFixed(2)}s, final ${duracaoFinal.toFixed(2)}s | ` +
    `palavras=${palavras} wps=${wps.toFixed(2)} | fluxos: ${streams.audio}a/${streams.video}v | ` +
    `volume mean=${volume.mean}dB max=${volume.max}dB | ` +
    `${okStreams ? 'OK' : 'FALHA'} fluxos, ${okSilencio ? 'OK' : 'FALHA'} silêncio-total, ` +
    `${okClipping ? 'OK' : 'FALHA'} clipping, ${okDuracaoVoz ? 'OK' : 'FALHA'} duração(+0.5s), ` +
    `${okRitmo ? 'OK' : 'FALHA'} ritmo(${faixaRitmo[0].toFixed(2)}-${faixaRitmo[1].toFixed(2)}${usouReferenciaPropria ? '' : ', referência da voz padrão'}), ${okSemCortesInternos ? 'OK' : 'FALHA'} sem-corte-interno` +
    (decisoes.length ? ` | decisões: ${decisoes.join('; ')}` : '');

  console.log(`✅ ${linha}`);
  relatorio.push(linha);

  // Sidecar JSON pro script de legenda (legendar.js) — guarda o texto
  // FINAL (já cortado se precisou) e os tempos reais da voz, pra
  // gerar o .srt sincronizado sem precisar re-sintetizar nem adivinhar.
  fs.mkdirSync(DADOS_LEGENDA, { recursive: true });
  fs.writeFileSync(
    path.join(DADOS_LEGENDA, `${nome}.json`),
    JSON.stringify({
      nome, pasta, voz: nomeVoz, ritmo,
      textoFinal, offsetVoz: OFFSET_VOZ, duracaoVoz, duracaoFinal, duracaoVideo,
    }, null, 2),
    'utf8'
  );
}

function main() {
  const { nomeFiltro, voz: nomeVoz, ritmoArg } = lerArgs();
  fs.mkdirSync(TMP, { recursive: true });
  process.env.TEMP = TMP;
  process.env.TMP = TMP;

  const voz = VOZES[nomeVoz];
  if (!voz) {
    console.error(`Voz desconhecida: "${nomeVoz}". Opções: ${Object.keys(VOZES).join(', ')}`);
    process.exit(1);
  }
  const ritmo = ritmoArg != null ? parseFloat(ritmoArg) : voz.ritmoPadrao;

  const roteiros = lerRoteiros();
  const lista = nomeFiltro ? VIDEOS.filter((v) => v.nome === nomeFiltro) : VIDEOS;
  if (lista.length === 0) {
    console.error(`Nenhum vídeo encontrado com o nome "${nomeFiltro}"`);
    process.exit(1);
  }

  console.log(`Voz: ${nomeVoz} (${voz.tipo}), ritmo: ${ritmo}\n`);

  const relatorio = [`Voz: ${nomeVoz} (${voz.tipo}), ritmo: ${ritmo}`];
  for (const item of lista) {
    try {
      processarVideo(item, roteiros, nomeVoz, voz, ritmo, relatorio);
    } catch (erro) {
      console.error(`❌ ${item.nome}: FALHOU — ${erro.message}`);
      relatorio.push(`${item.nome}: FALHOU — ${erro.message}`);
    }
  }

  const arquivoRelatorio = 'E:/projetos/_tmp/narracao-relatorio.txt';
  fs.writeFileSync(arquivoRelatorio, relatorio.join('\n') + '\n', 'utf8');
  console.log(`\nRelatório salvo em ${arquivoRelatorio}`);
}

// Só roda sozinho quando chamado direto (`node narrar.js`) — quando
// importado (teste-narrar.js), só expõe calcularFaixaRitmo, sem
// sintetizar voz nem tocar em vídeo nenhum.
if (require.main === module) {
  main();
}

// Exports ADICIONAIS (Rodada 10/v3, achado: narrar-tour-v3.js precisa
// sintetizar por FRASE, não o roteiro inteiro de uma vez, pra controlar
// a pausa entre frases por código — ver DECISOES.md) — só EXPÕE funções
// já existentes (nenhuma mudou de comportamento), pra não duplicar a
// chamada do PowerShell/Piper numa 2ª cópia que pudesse desalinhar.
module.exports = {
  calcularFaixaRitmo, VOZES, VOZ_PADRAO,
  sintetizar, lerRoteiros, duracaoSegundos, mixar, FFMPEG, FFPROBE,
  OFFSET_VOZ, FOLGA_FIM, FADE_OUT, TMP,
};
