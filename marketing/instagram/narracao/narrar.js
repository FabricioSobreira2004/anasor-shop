#!/usr/bin/env node
// ============================================================
// Narração em TODOS os vídeos (Rodada 5, item 4).
//
// Lê marketing/instagram/narracao/roteiros.md (fonte única do texto
// — editar o roteiro ali e rodar este script de novo regenera a
// narração), sintetiza cada texto em WAV com a voz do Windows
// (Microsoft Maria Desktop, pt-BR — ver DECISOES.md pra escolha
// sobre o Piper) e mixa com o vídeo mudo original via ffmpeg:
//   - voz começa ~0,3s depois do início;
//   - loudness normalizado a -16 LUFS, pico máximo -1,5 dB (sem
//     estourar);
//   - áudio final AAC 48kHz estéreo 128kbps; vídeo copiado sem
//     recompressão (-c:v copy);
//   - a trilha de voz é "preenchida" com silêncio até o fim do
//     vídeo (apad + -shortest limitado pelo vídeo, que é mais curto
//     que a voz+silêncio infinito do apad).
//
// O vídeo mudo ORIGINAL nunca é sobrescrito: antes de qualquer
// mixagem, é arquivado em reels\_mudo\ ou tour\_mudo\ (uma vez só —
// corridas seguintes deste script não pisam no arquivo já salvo).
//
//   node narrar.js            → todos os 18
//   node narrar.js --nome r1-caneca-surpresa-gatinho   → só 1 (teste)
//
// Se um texto não couber na duração do vídeo com a folga de 0,5s,
// corta palavras do CONTEÚDO (nunca do fechamento fixo) e tenta de
// novo; só se mesmo cortando bastante ainda não couber, acelera o
// áudio até 1,1x (nunca mais). Qualquer corte/aceleração aplicada
// fica no relatório final E:\projetos\_tmp\narracao-relatorio.txt.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path.js');

const DIR_NARRACAO = __dirname;
const DIR_REELS = path.resolve(DIR_NARRACAO, '..', 'reels');
const SITE_MAE_REELS = 'E:/projetos/site-mae/reels';
const SITE_MAE_TOUR = 'E:/projetos/site-mae/tour';
const MUDO_REELS = path.join(SITE_MAE_REELS, '_mudo');
const MUDO_TOUR = path.join(SITE_MAE_TOUR, '_mudo');
const TMP = 'E:/projetos/_tmp/narracao';

const VOZ = 'Microsoft Maria Desktop';
const RATE = 2; // calibrado: ~2,51 palavras/segundo (ver DECISOES.md)
const OFFSET_VOZ = 0.3; // segundos
const FOLGA_FIM = 0.5; // segundos
const ACELERACAO_MAXIMA = 1.1;

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
  const i = args.indexOf('--nome');
  return { nomeFiltro: i >= 0 ? args[i + 1] : null };
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
      nomeAtual = null; // já capturou o texto deste vídeo, próximo "###" é outro
    }
  }
  return roteiros;
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
    linhas,
  };
}

// volumedetect roda em 2 passes (null output) e imprime no stderr;
// extrai mean_volume/max_volume em dB.
function volumeDetect(arquivo) {
  let saida;
  try {
    execSync(`"${FFMPEG}" -y -i "${arquivo}" -af volumedetect -f null -`, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (erro) {
    saida = erro.stderr ? erro.stderr.toString() : '';
  }
  if (!saida) {
    // alguns ambientes não lançam erro mesmo com -f null; tenta capturar via execSync normal
    saida = execSync(`"${FFMPEG}" -y -i "${arquivo}" -af volumedetect -f null - 2>&1`).toString();
  }
  const mean = saida.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const max = saida.match(/max_volume:\s*(-?[\d.]+) dB/);
  return {
    mean: mean ? parseFloat(mean[1]) : null,
    max: max ? parseFloat(max[1]) : null,
  };
}

// Corta o CONTEÚDO (nunca o fechamento fixo) de um jeito que tenta
// preservar frases/cláusulas completas, em vez de truncar no meio
// de uma palavra importante — por ordem de preferência: (1) solta a
// última FRASE inteira (corta no último ". "); (2) solta a última
// CLÁUSULA (corta na última ", "); (3) só se não houver mais nenhum
// separador, solta a última palavra (último recurso).
function cortarConteudo(texto) {
  if (!texto.endsWith(FECHAMENTO)) return texto; // nunca corta o fechamento fixo
  const conteudo = texto.slice(0, texto.length - FECHAMENTO.length).trim();

  const ultimoPonto = conteudo.lastIndexOf('. ');
  const ultimaVirgula = conteudo.lastIndexOf(', ');
  let novoConteudo;
  if (ultimoPonto > 0) {
    novoConteudo = conteudo.slice(0, ultimoPonto + 1); // mantém o "."
  } else if (ultimaVirgula > 0) {
    novoConteudo = conteudo.slice(0, ultimaVirgula);
  } else {
    const palavras = conteudo.split(/\s+/);
    if (palavras.length <= 3) return texto; // já está mínimo, não corta mais
    palavras.pop();
    novoConteudo = palavras.join(' ');
  }

  novoConteudo = novoConteudo.replace(/[,:;—-]+$/, '').trim();
  if (!/[.!?]$/.test(novoConteudo)) novoConteudo += '.';
  if (!novoConteudo || novoConteudo === '.') return texto; // nada sobrou, não corta mais
  return `${novoConteudo} ${FECHAMENTO}`;
}

function sintetizar(texto, arquivoWav) {
  const arquivoTxt = path.join(TMP, 'texto-atual.txt');
  fs.writeFileSync(arquivoTxt, texto, 'utf8');
  const script = path.join(DIR_NARRACAO, 'sintetizar-voz.ps1');
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -File "${script}" -TextoArquivo "${arquivoTxt}" -SaidaWav "${arquivoWav}" -Rate ${RATE} -Voz "${VOZ}"`,
    { stdio: 'ignore' }
  );
}

// Sintetiza, e se a voz não couber na duração disponível (com a
// folga do fim), corta palavras e tenta de novo; por fim, se ainda
// não couber, acelera o ÁUDIO (atempo) até ACELERACAO_MAXIMA.
function sintetizarComAjuste(textoOriginal, limiteSegundos, decisoes) {
  let texto = textoOriginal;
  let arquivoWav = path.join(TMP, 'voz.wav');
  let duracao;
  let tentativas = 0;
  const MAX_TENTATIVAS_CORTE = 8;

  while (true) {
    sintetizar(texto, arquivoWav);
    duracao = duracaoSegundos(arquivoWav);
    if (duracao <= limiteSegundos || tentativas >= MAX_TENTATIVAS_CORTE) break;
    const novoTexto = cortarConteudo(texto);
    if (novoTexto === texto) break; // não dá pra cortar mais
    texto = novoTexto;
    tentativas += 1;
  }

  if (tentativas > 0) {
    decisoes.push(`texto cortado ${tentativas}x pra caber na duração (texto final: "${texto}")`);
  }

  if (duracao > limiteSegundos) {
    // último recurso: acelerar o ÁUDIO (não o vídeo) até 1,1x
    const fator = Math.min(ACELERACAO_MAXIMA, duracao / limiteSegundos);
    const acelerado = path.join(TMP, 'voz-acelerada.wav');
    execSync(`"${FFMPEG}" -y -i "${arquivoWav}" -filter:a "atempo=${fator.toFixed(3)}" "${acelerado}"`, { stdio: 'ignore' });
    arquivoWav = acelerado;
    duracao = duracaoSegundos(arquivoWav);
    decisoes.push(`áudio acelerado ${fator.toFixed(3)}x (ainda não cabia só cortando palavras)`);
    if (duracao > limiteSegundos) {
      decisoes.push(`AVISO: mesmo cortado+acelerado a 1,1x, a voz (${duracao.toFixed(2)}s) ainda passa do limite (${limiteSegundos.toFixed(2)}s) — registrar pro Fabrício revisar o roteiro`);
    }
  }

  return { arquivoWav, duracao, textoFinal: texto };
}

function mixar(video, voz, saida) {
  execSync(
    `"${FFMPEG}" -y -i "${video}" -i "${voz}" -filter_complex "[1:a]adelay=${Math.round(OFFSET_VOZ * 1000)}:all=1,apad,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 128k -shortest "${saida}"`,
    { stdio: 'ignore' }
  );
}

function processarVideo(item, roteiros, relatorio) {
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
  // Arquiva o mudo original UMA VEZ (corridas seguintes deste script
  // não sobrescrevem o arquivo já salvo — ele é a fonte de verdade
  // da duração do vídeo, mesmo que o script seja rodado de novo
  // sobre um arquivo que já tem narração).
  if (!fs.existsSync(arquivoMudo)) {
    fs.copyFileSync(arquivoAtual, arquivoMudo);
  }

  const duracaoVideo = duracaoSegundos(arquivoMudo);
  const limite = duracaoVideo - OFFSET_VOZ - FOLGA_FIM;

  const decisoes = [];
  const { arquivoWav, duracao: duracaoVoz, textoFinal } = sintetizarComAjuste(texto, limite, decisoes);

  const saidaTmp = path.join(TMP, `${nome}-narrado.mp4`);
  mixar(arquivoMudo, arquivoWav, saidaTmp);
  fs.copyFileSync(saidaTmp, arquivoAtual);

  const streams = contarAudioEVideo(arquivoAtual);
  const duracaoFinal = duracaoSegundos(arquivoAtual);
  const volume = volumeDetect(arquivoAtual);

  const okStreams = streams.audio === 1 && streams.video === 1;
  const okSilencio = volume.mean !== null && volume.mean > -50; // não é silêncio total
  const okClipping = volume.max !== null && volume.max <= 0.5; // margem pequena de tolerância de medição
  const okDuracaoVoz = duracaoVoz < duracaoFinal;

  const linha =
    `${nome} — vídeo ${duracaoVideo.toFixed(2)}s, voz ${duracaoVoz.toFixed(2)}s, ` +
    `final ${duracaoFinal.toFixed(2)}s | fluxos: ${streams.audio}a/${streams.video}v | ` +
    `volume mean=${volume.mean}dB max=${volume.max}dB | ` +
    `${okStreams ? 'OK' : 'FALHA'} fluxos, ${okSilencio ? 'OK' : 'FALHA'} silêncio, ` +
    `${okClipping ? 'OK' : 'FALHA'} clipping, ${okDuracaoVoz ? 'OK' : 'FALHA'} duração` +
    (decisoes.length ? ` | decisões: ${decisoes.join('; ')}` : '');

  console.log(`✅ ${linha}`);
  relatorio.push(linha);
}

function main() {
  const { nomeFiltro } = lerArgs();
  fs.mkdirSync(TMP, { recursive: true });
  process.env.TEMP = TMP;
  process.env.TMP = TMP;

  const roteiros = lerRoteiros();
  const lista = nomeFiltro ? VIDEOS.filter((v) => v.nome === nomeFiltro) : VIDEOS;
  if (lista.length === 0) {
    console.error(`Nenhum vídeo encontrado com o nome "${nomeFiltro}"`);
    process.exit(1);
  }

  const relatorio = [];
  for (const item of lista) {
    try {
      processarVideo(item, roteiros, relatorio);
    } catch (erro) {
      console.error(`❌ ${item.nome}: FALHOU — ${erro.message}`);
      relatorio.push(`${item.nome}: FALHOU — ${erro.message}`);
    }
  }

  const arquivoRelatorio = 'E:/projetos/_tmp/narracao-relatorio.txt';
  fs.writeFileSync(arquivoRelatorio, relatorio.join('\n') + '\n', 'utf8');
  console.log(`\nRelatório salvo em ${arquivoRelatorio}`);
}

main();
