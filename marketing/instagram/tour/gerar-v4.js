#!/usr/bin/env node
// ============================================================
// Tour do Site v4 (Rodada 11) — linha do tempo construída A PARTIR DA
// NARRAÇÃO (não mais duração fixa de 45/47s): cada cena dura o tempo
// da fala dela (+0,3s, mínimo 2s), a voz NUNCA é cortada. Visual
// (celular grande, logo, legenda pílula, rolagem, cartão final,
// música) continua o mesmo da v3 — só tempo/narração mudam aqui, ver
// DECISOES.md pro diagnóstico medido que motivou a rodada.
//
//   node gerar-v4.js --versao a      (Instagram)
//   node gerar-v4.js --versao b      (portfólio)
//   node gerar-v4.js --versao ambas
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path');
const { lerArgs } = require('./src/cli');
const { montarRoteiroMobile } = require('./src/roteiro-mobile');
const { montarRoteiroDesktop } = require('./src/roteiro-desktop');
const { agruparBlocos } = require('./src/blocos-legenda');
const { VOZES, VOZ_PADRAO, mixar, duracaoSegundos } = require('../narracao/narrar.js');
const { sintetizarFraseV4 } = require('../narracao/sintetizar-frase-v4.js');
const { FRASES_MOBILE, FRASES_DESKTOP } = require('../narracao/roteiro-v4-dados.js');

const FPS = 30;
const LEAD = 0.2; // início da cena = início da frase - 0,2s
const GAP = 0.3; // pausa entre frases
const MIN_CENA = 2.0; // segundos, mínimo de leitura por cena
const TRAIL_FECHO = 3.0; // cartão final, depois da última frase

const RAIZ = path.resolve(__dirname, '..', '..', '..'); // anasor-shop
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIR_CAPTURAS = path.join(__dirname, '.tmp', 'capturas');
const SAIDA = 'E:/projetos/site-mae/tour/v4';
const DADOS = path.join(SAIDA, '_dados');
const PRINTS = 'E:/projetos/site-mae/_prints/tours-v4';
const MUSICA = 'E:/projetos/site-mae/musica/trilha-atelie.wav';

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function lerVariaveisCss() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'style.css'), 'utf8');
  const pegar = (nome) => {
    const m = css.match(new RegExp(`--${nome}:\\s*((?:url\\(|#)[^;]+);`));
    if (!m) throw new Error(`Variável --${nome} não encontrada em style.css`);
    return m[1].trim();
  };
  return {
    fundo: pegar('cor-fundo'), texto: pegar('cor-texto'), destaque: pegar('cor-destaque'),
    destaqueEscuro: pegar('cor-destaque-escuro'), secundaria: pegar('cor-secundaria'),
  };
}

async function gerarLogoTransparente(pagina) {
  const jpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));
  const uri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  return pagina.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const CORTE_TOTAL = 250, CORTE_INICIO = 228;
    for (let i = 0; i < d.length; i += 4) {
      const luminancia = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminancia >= CORTE_TOTAL) d[i + 3] = 0;
      else if (luminancia > CORTE_INICIO) d[i + 3] = Math.round(255 * (CORTE_TOTAL - luminancia) / (CORTE_TOTAL - CORTE_INICIO));
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }, uri);
}

function gerarRetratoDataUri() {
  const jpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'quem-somos.jpg'));
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

function lerManifesto(device) {
  const arquivo = path.join(DIR_CAPTURAS, device, 'manifest.json');
  if (!fs.existsSync(arquivo)) {
    throw new Error(`Manifesto de captura "${device}" não encontrado (${arquivo}) — rode "node src/capturar.js --device ${device}" antes.`);
  }
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

// Ajusta um clipe capturado pra durar EXATAMENTE `quadrosAlvo`: se o
// clipe real tem MENOS quadros, segura o último quadro (freeze —
// pedido explícito: "segure o último quadro com a rolagem parada",
// nunca repete/reinicia a animação); se tem MAIS, corta o excesso do
// FIM (tempo morto da captura).
function ajustarClipe(origemAbs, quadrosAtual, quadrosAlvo, destinoAbs) {
  fs.mkdirSync(path.dirname(destinoAbs), { recursive: true });
  if (quadrosAtual >= quadrosAlvo) {
    execFileSync(FFMPEG, [
      '-y', '-i', origemAbs, '-frames:v', String(quadrosAlvo),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', destinoAbs,
    ], { stdio: 'ignore' });
  } else {
    const faltamSeg = (quadrosAlvo - quadrosAtual) / FPS;
    execFileSync(FFMPEG, [
      '-y', '-i', origemAbs, '-vf', `tpad=stop_mode=clone:stop_duration=${faltamSeg.toFixed(3)}`,
      '-frames:v', String(quadrosAlvo),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', destinoAbs,
    ], { stdio: 'ignore' });
  }
}

// Tempo de cada PALAVRA dentro de uma frase, por proporção de
// caractere (mesmo modelo já usado no projeto) — `inicioAbs` é o
// instante (segundos, linha do tempo inteira) em que a frase começa.
function palavrasComTempo(texto, inicioAbs, duracaoFrase) {
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

// Monta a linha do tempo da Versão A (mobile) — 1 frase por cena,
// nessa ordem. Retorna overrides de duração (quadros) por cena, as
// frases sintetizadas (c/ áudio final) e os tempos de palavra (pra
// legenda), tudo derivado da ÁUDIO real.
function construirTimelineMobile(voz, ritmo) {
  const overridesDuracao = {};
  const palavras = [];
  const frases = [];
  let cursorS = 0;
  for (const { cena, texto } of FRASES_MOBILE) {
    const f = sintetizarFraseV4(texto, voz, ritmo, `mob-${cena}`);
    const inicioFraseAbs = cursorS + LEAD;
    palavras.push(...palavrasComTempo(texto, inicioFraseAbs, f.duracao));
    let duracaoCena = Math.max(f.duracao + GAP, MIN_CENA);
    if (cena === 'fecho') duracaoCena += TRAIL_FECHO;
    overridesDuracao[cena] = Math.round(duracaoCena * FPS);
    frases.push({ cena, texto, arquivo: f.arquivo, duracao: f.duracao, inicioAbs: inicioFraseAbs });
    cursorS += duracaoCena;
  }
  return { overridesDuracao, palavras, frases, duracaoTotalS: cursorS };
}

// Mesma ideia pra Versão B (desktop) — mas algumas cenas (checkout,
// fecho) têm 2 frases seguidas na MESMA cena (mesmo visual de antes,
// só os tempos vêm da fala agora). `balao` controla se aquela frase
// também vira um DestaqueTecnico na tela (só nas que JÁ tinham balão
// antes — nunca um elemento novo).
function construirTimelineDesktop(voz, ritmo) {
  const grupos = [];
  for (const item of FRASES_DESKTOP) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.cena === item.cena) ultimo.itens.push(item);
    else grupos.push({ cena: item.cena, itens: [item] });
  }
  const overrides = {};
  const palavras = [];
  const frases = [];
  let cursorS = 0;
  for (const grupo of grupos) {
    let offsetDentro = LEAD;
    const destaques = [];
    let temBalao = false;
    grupo.itens.forEach((item, idx) => {
      const f = sintetizarFraseV4(item.texto, voz, ritmo, `desk-${grupo.cena}-${idx}`);
      const inicioFraseAbs = cursorS + offsetDentro;
      palavras.push(...palavrasComTempo(item.texto, inicioFraseAbs, f.duracao));
      frases.push({ cena: grupo.cena, texto: item.texto, arquivo: f.arquivo, duracao: f.duracao, inicioAbs: inicioFraseAbs });
      if (item.balao) {
        temBalao = true;
        destaques.push({ texto: item.texto, atraso: Math.round(offsetDentro * FPS), duracao: Math.round((f.duracao + GAP) * FPS) });
      }
      offsetDentro += f.duracao + GAP;
    });
    let duracaoGrupoS = Math.max(offsetDentro - GAP + 0.1, MIN_CENA);
    if (grupo.cena === 'fecho') duracaoGrupoS += TRAIL_FECHO;
    overrides[grupo.cena] = { duracao: Math.round(duracaoGrupoS * FPS), ...(temBalao ? { destaques } : {}) };
    cursorS += duracaoGrupoS;
  }
  return { overrides, palavras, frases, duracaoTotalS: cursorS };
}

// Monta a trilha de voz INTEIRA (silêncio + cada frase no instante
// certo) a partir da lista de frases já posicionadas (`inicioAbs`) —
// generaliza pro caso de gaps maiores que 0,3s (cena com mínimo de
// 2s). Cada frase já tem fade de 30ms nas pontas (sintetizar-frase-v4)
// — só concatena silêncio real entre elas, sem gerar clique novo.
function montarVozCompleta(frases, duracaoTotalS, saidaWav) {
  const inputs = [];
  const filtros = [];
  let cursorS = 0;
  frases.forEach((f, i) => {
    const silencioAntes = f.inicioAbs - cursorS;
    if (silencioAntes > 0.001) {
      inputs.push(['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${silencioAntes.toFixed(3)}`]);
    } else {
      inputs.push(null);
    }
    inputs.push(['-i', f.arquivo]);
    cursorS = f.inicioAbs + f.duracao;
  });
  const silencioFinal = Math.max(0, duracaoTotalS - cursorS);
  if (silencioFinal > 0.001) inputs.push(['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${silencioFinal.toFixed(3)}`]);

  const args = [];
  inputs.forEach((inp) => { if (inp) args.push(...inp); });
  const labels = inputs.filter(Boolean).map((_, i) => `[${i}:a]`).join('');
  args.push('-filter_complex', `${labels}concat=n=${inputs.filter(Boolean).length}:v=0:a=1[a]`, '-map', '[a]', '-y', saidaWav);
  execFileSync(FFMPEG, args, { stdio: 'ignore' });
}

async function copiarClipesAjustados(manifest, device, overridesQuadros, nomesClipeUsados) {
  const relativo = {};
  for (const nome of nomesClipeUsados) {
    const info = manifest[nome];
    if (!info) throw new Error(`Clipe "${nome}" não encontrado no manifesto "${device}"`);
    const destinoRelativo = `clipes/${device}/${nome}.mp4`;
    const destino = path.join(PUBLIC_DIR, destinoRelativo);
    const alvo = overridesQuadros[nome];
    if (alvo != null) {
      ajustarClipe(info.arquivo, info.quadros, alvo, destino);
      relativo[nome] = { ...info, arquivo: destinoRelativo, quadros: alvo };
    } else {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(info.arquivo, destino);
      relativo[nome] = { ...info, arquivo: destinoRelativo };
    }
  }
  return relativo;
}

function arquivarSeExistir(destinoFinal) {
  if (!fs.existsSync(destinoFinal)) return;
  const dirAnteriores = path.join(SAIDA, '_anteriores', dataHoje());
  fs.mkdirSync(dirAnteriores, { recursive: true });
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const hora = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  fs.copyFileSync(destinoFinal, path.join(dirAnteriores, `${path.basename(destinoFinal, '.mp4')}-${hora}.mp4`));
}

async function renderizar({ id, nome, props, bundleLocation, concurrency }) {
  console.log(`\nRenderizando "${nome}" (${id}, ${(props.duracaoTotal / FPS).toFixed(1)}s)...`);
  const composition = await selectComposition({ serveUrl: bundleLocation, id, inputProps: props });
  fs.mkdirSync(SAIDA, { recursive: true });
  const saidaBruta = path.join(SAIDA, `_bruto-${nome}.mp4`);
  await renderMedia({
    composition, serveUrl: bundleLocation, codec: 'h264', outputLocation: saidaBruta,
    inputProps: props, pixelFormat: 'yuv420p', crf: 18, x264Preset: 'slow', logLevel: 'verbose', concurrency,
  });
  const saidaSilenciosa = path.join(SAIDA, `_silencioso-${nome}.mp4`);
  execFileSync(FFMPEG, [
    '-y', '-i', saidaBruta, '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', saidaSilenciosa,
  ], { stdio: 'inherit' });
  fs.rmSync(saidaBruta);
  return saidaSilenciosa;
}

function pad(n, l = 2) { return String(n).padStart(l, '0'); }
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
function escreverSrt(palavras, arquivo) {
  const blocos = agruparBlocosSemPreposicaoFinal(palavras);
  const linhas = blocos.map((b, i) => `${i + 1}\n${tempoSrt(b.inicio)} --> ${tempoSrt(b.fim)}\n${b.palavras.map((p) => p.texto).join(' ')}\n`);
  fs.writeFileSync(arquivo, linhas.join('\n'), 'utf8');
  return blocos;
}

// Agrupamento v4 — 3 a 6 palavras, NUNCA terminando em artigo/
// preposição/conjunção nem palavra solta (pedido explícito, item 6).
// `agruparBlocos` (blocos-legenda.js) já quebra em pontuação; aqui só
// REFINA: se o corte cairia numa palavra de função, empurra ela pro
// próximo bloco.
// ACHADO conferindo o 1º .srt gerado (antes de qualquer render
// completo): "pelas" (contração "por"+"as") terminava um bloco
// ("...passeia pelas" / "coleções de..." no próximo) — faltava no
// conjunto original (só tinha "por" solto, não as contrações
// por+artigo). Lista ampliada com as contrações mais comuns de
// preposição+artigo do português.
const PALAVRAS_FUNCAO = new Set([
  'de', 'a', 'o', 'as', 'os', 'na', 'no', 'nas', 'nos', 'em', 'que', 'e', 'tem',
  'um', 'uma', 'uns', 'umas', 'da', 'do', 'das', 'dos', 'pra', 'por', 'com',
  'pelo', 'pela', 'pelos', 'pelas', 'num', 'numa', 'nuns', 'numas',
  'dum', 'duma', 'duns', 'dumas', 'ao', 'aos', 'à', 'às', 'se', 'ou',
]);
function agruparBlocosSemPreposicaoFinal(palavras) {
  const base = agruparBlocos(palavras);
  const blocos = [];
  let carregar = [];
  for (let i = 0; i < base.length; i += 1) {
    let grupo = [...carregar, ...base[i].palavras];
    carregar = [];
    while (grupo.length > 3) {
      const ultima = grupo[grupo.length - 1].texto.toLowerCase().replace(/[.,!?;:]/g, '');
      if (PALAVRAS_FUNCAO.has(ultima) && i < base.length - 1) {
        carregar.unshift(grupo.pop());
      } else break;
    }
    if (grupo.length) blocos.push({ inicio: grupo[0].inicio, fim: grupo[grupo.length - 1].fim, palavras: grupo });
  }
  if (carregar.length && blocos.length) {
    const ultimoBloco = blocos[blocos.length - 1];
    ultimoBloco.palavras.push(...carregar);
    ultimoBloco.fim = carregar[carregar.length - 1].fim;
  }
  return blocos;
}

module.exports = {
  FPS, LEAD, GAP, MIN_CENA, TRAIL_FECHO, SAIDA, DADOS, PRINTS, MUSICA, PUBLIC_DIR, RAIZ,
  lerVariaveisCss, gerarLogoTransparente, gerarRetratoDataUri, lerManifesto,
  ajustarClipe, palavrasComTempo, construirTimelineMobile, construirTimelineDesktop,
  montarVozCompleta, copiarClipesAjustados, arquivarSeExistir, renderizar,
  tempoSrt, escreverSrt, agruparBlocosSemPreposicaoFinal, dataHoje,
};
