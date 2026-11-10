#!/usr/bin/env node
// ============================================================
// Tour do Site v5 (Rodada 12) — só a NARRAÇÃO é refeita (ver
// DECISOES.md pro diagnóstico medido: a v4 sintetizava 13 frases
// MOBILE curtas isoladas, cada uma com pausa fixa de 0,3s, o que soa
// "travando" mesmo cada frase saindo de 1 síntese só). Visual
// (celular grande, logo, legenda karaokê, música, linha do tempo
// "cena = fala real") É O MESMO da v4 — este arquivo é uma cópia de
// gerar-v4.js com só o necessário pra narração fluida:
//   - roteiro em TRECHOS mais longos (roteiro-v5-dados.js) — no
//     mobile isso agrupa várias das 13 cenas visuais por trecho (a
//     duração de cada cena passa a ser uma FATIA proporcional da
//     duração do trecho que a narra, não mais 1:1 com 1 frase);
//   - 1 chamada de Piper por TRECHO inteiro (nunca por cláusula),
//     parâmetros escolhidos por medição (configs-sintese-v5.js);
//   - tempo de palavra por ASR (alinhar-palavras-v5.js), com fallback
//     por proporção de caractere;
//   - cena de checkout do Instagram passa a usar um clipe pré-cortado
//     (prepararManifestoCheckoutCep) que já termina com o CEP e o
//     endereço preenchidos (antes do scroll pros selos) — "estende"
//     a visão do CEP por código, sem recapturar nada.
//
//   node gerar-v5.js --versao a      (Instagram)
//   node gerar-v5.js --versao b      (portfólio)
//   node gerar-v5.js --versao ambas
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
const { duracaoSegundos } = require('../narracao/narrar.js');
const { sintetizarTrechoV5 } = require('../narracao/sintetizar-trecho-v5.js');
const { palavrasComTempoV5 } = require('../narracao/alinhar-palavras-v5.js');
const { CONFIGS_V5, CONFIG_PADRAO_V5 } = require('../narracao/configs-sintese-v5.js');
const { FRASES_MOBILE_V5, FECHO_MOBILE_V5, FRASES_DESKTOP_V5 } = require('../narracao/roteiro-v5-dados.js');

const FPS = 30;
const LEAD = 0.15; // início do trecho = início da cena - 0,15s (pedido: 0,35-0,45s de silêncio TOTAL entre trechos, junto com GAP)
const GAP = 0.25; // pausa depois de cada trecho — LEAD+GAP = 0,40s entre trechos
const MIN_CENA = 2.0; // segundos, mínimo de leitura por cena
const TRAIL_FECHO = 3.0; // cartão final, depois da última frase
const PAD_CHECKOUT = 0.4; // "estenda um pouco essa cena" (pedido item 4) — segundos extras só na cena de checkout do Instagram

const RAIZ = path.resolve(__dirname, '..', '..', '..'); // anasor-shop
const PUBLIC_DIR = path.join(__dirname, 'public');
const DIR_CAPTURAS = path.join(__dirname, '.tmp', 'capturas');
const SAIDA = 'E:/projetos/site-mae/tour/v5';
const DADOS = path.join(SAIDA, '_dados');
const PRINTS = 'E:/projetos/site-mae/_prints/tours-v5';
const MUSICA = 'E:/projetos/site-mae/musica/trilha-atelie.wav';
const TMP_V5 = 'E:/projetos/_tmp/narracao-v5';

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

// Mapa cena (nome lógico, o mesmo usado em roteiro-mobile.js/
// roteiro-v5-dados.js) -> clipe (chave do manifest.json de captura) —
// só os 2 nomes que divergem (home-scroll/adicionar-carrinho) importam
// de verdade; os outros são iguais. Lista fixa (não deriva de
// roteiro-mobile.js pra não acoplar os 2 arquivos) — qualquer clipe
// novo precisa entrar aqui TAMBÉM em roteiro-mobile.js.
const NOME_PARA_CLIPE = {
  'home-hero': 'home-hero', 'home-scroll': 'home-scroll-carrosseis', 'card-selo': 'card-selo',
  'produto-galeria': 'produto-galeria', 'produto-video': 'produto-video', 'produto-medidas': 'produto-medidas',
  'produto-upsell': 'produto-upsell', carrinho: 'adicionar-carrinho', checkout: 'checkout',
  'vendida-secao': 'vendida-secao', 'vendida-produto': 'vendida-produto', links: 'links',
};

// Divide `framesTotais` (duração do TRECHO, em quadros) entre as
// cenas visuais que ele narra, proporcional ao tamanho ORIGINAL de
// cada clipe capturado (clipe maior = fatia maior) — item 1 do pedido
// ("1 trecho por cena" deixou de ser 1:1 no mobile; 13 clipes
// continuam todos aparecendo, na mesma ordem, só a duração de cada um
// agora vem de uma fatia do trecho, não de 1 frase própria). Piso de
// 15 quadros (0,5s) por clipe — nunca um corte tão rápido que pareça
// glitch.
function dividirDuracaoEntreClipes(manifest, nomesCenas, framesTotais) {
  const pesos = nomesCenas.map((nome) => manifest[NOME_PARA_CLIPE[nome]].quadros);
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const PISO = 15;
  const out = {};
  let restantes = framesTotais;
  nomesCenas.forEach((nome, i) => {
    if (i === nomesCenas.length - 1) {
      out[nome] = Math.max(PISO, restantes);
      return;
    }
    const fatia = Math.max(PISO, Math.round((pesos[i] / somaPesos) * framesTotais));
    out[nome] = fatia;
    restantes -= fatia;
  });
  return out;
}

// ACHADO (Rodada 12, item 4 do pedido): o clipe mobile de checkout
// capturado (88 quadros) termina rolando pra seção de selos — se a
// cena precisar de mais quadros que o ponto em que o CEP é
// confirmado, o freeze (ajustarClipe) prende no quadro ERRADO (selos,
// sem CEP visível). Pré-corta o clipe ORIGINAL em 36 quadros (medido
// nos manterFoto() de cenas-mobile.js: 10+8+10+10 = 38 quadros até o
// endereço auto-preenchido pelo ViaCEP aparecer, 2 quadros de margem
// antes do preenchimento do número/scroll pros selos) — devolve um
// manifest CLONADO (nunca sobrescreve o manifest.json real) com só a
// entrada "checkout" trocada pro clipe pré-cortado; qualquer duração
// de cena >=36 quadros congela exatamente no CEP+endereço preenchidos.
// ACHADO conferindo o print (_prints/tours-v5/): mesmo com o corte em
// 36 quadros, o CEP (perto do fim da página capturada) saía raspando
// o canto arredondado de baixo da moldura (MolduraCelular recorta o
// vídeo centralizado, `objectFit: cover`, pro tamanho fixo da moldura
// — LARGURA 560/ALTURA 1150, bem mais "quadrado" que o vídeo bruto
// 1180x2556 — qualquer conteúdo perto da BORDA do clipe perde uma
// fatia). Corrigido ACRESCENTANDO uma faixa de fundo (cor da página,
// pega de style.css) embaixo do quadro ANTES do recorte — o corte
// centralizado passa a comer essa faixa extra, não mais o campo do
// CEP. Só afeta este clipe (checkout do Instagram); os outros 12
// continuam exatamente como a captura trouxe.
function prepararManifestoCheckoutCep(manifestMobile, corFundo) {
  const origem = manifestMobile.checkout;
  const destino = path.join(TMP_V5, 'checkout-cep-v5.mp4');
  const QUADROS_CEP = 36;
  const PAD_INFERIOR_PX = 420;
  execFileSync(FFMPEG, [
    '-y', '-i', origem.arquivo, '-frames:v', String(QUADROS_CEP),
    '-vf', `pad=iw:ih+${PAD_INFERIOR_PX}:0:0:color=${corFundo}`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', destino,
  ], { stdio: 'ignore' });
  return { ...manifestMobile, checkout: { ...origem, arquivo: destino, quadros: QUADROS_CEP } };
}

// Monta a linha do tempo da Versão A (mobile) a partir dos TRECHOS
// (não mais 1 frase por cena) — cada trecho narra 1+ cenas visuais
// (ver roteiro-v5-dados.js); a duração de cada cena-filha é uma fatia
// proporcional da duração real do trecho (dividirDuracaoEntreClipes).
function construirTimelineMobileV5(manifestMobile, config) {
  const overridesDuracao = {};
  const palavras = [];
  const frases = [];
  let cursorS = 0;

  for (const grupo of FRASES_MOBILE_V5) {
    const idPrefixo = `mob-${grupo.id}`;
    const { arquivo, duracao } = sintetizarTrechoV5(grupo.texto, config, idPrefixo);
    const inicioTrechoAbs = cursorS + LEAD;
    const { palavras: palavrasTrecho, fonte } = palavrasComTempoV5(grupo.texto, arquivo, inicioTrechoAbs, duracao);
    palavras.push(...palavrasTrecho);
    console.log(`  [mobile/${grupo.id}] "${grupo.texto}" — ${duracao.toFixed(2)}s (${fonte}, ${grupo.cenas.length} cena(s): ${grupo.cenas.join(', ')})`);

    let duracaoTrechoS = Math.max(duracao + GAP, MIN_CENA);
    if (grupo.cenas.includes('checkout')) duracaoTrechoS += PAD_CHECKOUT;
    const framesTotais = Math.round(duracaoTrechoS * FPS);
    const fatiasPorCena = dividirDuracaoEntreClipes(manifestMobile, grupo.cenas, framesTotais);
    Object.assign(overridesDuracao, fatiasPorCena);

    frases.push({ cena: grupo.id, texto: grupo.texto, arquivo, duracao, inicioAbs: inicioTrechoAbs });
    cursorS += duracaoTrechoS;
  }

  // Fechamento fixo — nunca cortado, falado inteiro quando o cartão
  // final (com o @) entra; TRAIL_FECHO depois, mesma régua da v4.
  const idPrefixo = 'mob-fecho';
  const { arquivo, duracao } = sintetizarTrechoV5(FECHO_MOBILE_V5.texto, config, idPrefixo);
  const inicioFechoAbs = cursorS + LEAD;
  const { palavras: palavrasFecho, fonte } = palavrasComTempoV5(FECHO_MOBILE_V5.texto, arquivo, inicioFechoAbs, duracao);
  palavras.push(...palavrasFecho);
  console.log(`  [mobile/fecho] "${FECHO_MOBILE_V5.texto}" — ${duracao.toFixed(2)}s (${fonte})`);
  const duracaoFechoCenaS = duracao + GAP + TRAIL_FECHO;
  overridesDuracao.fecho = Math.round(duracaoFechoCenaS * FPS);
  frases.push({ cena: 'fecho', texto: FECHO_MOBILE_V5.texto, arquivo, duracao, inicioAbs: inicioFechoAbs });
  cursorS += duracaoFechoCenaS;

  return { overridesDuracao, palavras, frases, duracaoTotalS: cursorS };
}

// Versão B (desktop) — mesma estrutura de agrupamento por cena já
// existente (checkout/fecho com 2 itens cada), só troca a síntese
// (trecho inteiro, config escolhida) e o tempo de palavra (ASR em vez
// de proporção). `balao` só nas frases que JÁ tinham balão (nenhum
// elemento novo na tela).
function construirTimelineDesktopV5(config) {
  const grupos = [];
  for (const item of FRASES_DESKTOP_V5) {
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
      const idPrefixo = `desk-${grupo.cena}-${idx}`;
      const { arquivo, duracao } = sintetizarTrechoV5(item.texto, config, idPrefixo);
      const inicioFraseAbs = cursorS + offsetDentro;
      const { palavras: palavrasItem, fonte } = palavrasComTempoV5(item.texto, arquivo, inicioFraseAbs, duracao);
      palavras.push(...palavrasItem);
      console.log(`  [desktop/${grupo.cena}#${idx}] "${item.texto}" — ${duracao.toFixed(2)}s (${fonte})`);
      frases.push({ cena: grupo.cena, texto: item.texto, arquivo, duracao, inicioAbs: inicioFraseAbs });
      if (item.balao) {
        temBalao = true;
        destaques.push({ texto: item.texto, atraso: Math.round(offsetDentro * FPS), duracao: Math.round((duracao + GAP) * FPS) });
      }
      offsetDentro += duracao + GAP;
    });
    let duracaoGrupoS = Math.max(offsetDentro - GAP + 0.1, MIN_CENA);
    if (grupo.cena === 'fecho') duracaoGrupoS += TRAIL_FECHO;
    overrides[grupo.cena] = { duracao: Math.round(duracaoGrupoS * FPS), ...(temBalao ? { destaques } : {}) };
    cursorS += duracaoGrupoS;
  }
  return { overrides, palavras, frases, duracaoTotalS: cursorS };
}

// Idêntica à v4 — concatena silêncio real + cada trecho no instante
// certo; cada trecho já tem fade de 30ms nas pontas (sintetizar-
// trecho-v5), então só gera silêncio novo entre eles.
function montarVozCompleta(frases, duracaoTotalS, saidaWav) {
  const inputs = [];
  let cursorS = 0;
  frases.forEach((f) => {
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
  const pad2 = (n) => String(n).padStart(2, '0');
  const hora = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
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
function escreverSrt(palavras, arquivo) {
  const blocos = agruparBlocosSemPreposicaoFinal(palavras);
  const linhas = blocos.map((b, i) => `${i + 1}\n${tempoSrt(b.inicio)} --> ${tempoSrt(b.fim)}\n${b.palavras.map((p) => p.texto).join(' ')}\n`);
  fs.writeFileSync(arquivo, linhas.join('\n'), 'utf8');
  return blocos;
}

module.exports = {
  FPS, LEAD, GAP, MIN_CENA, TRAIL_FECHO, PAD_CHECKOUT, SAIDA, DADOS, PRINTS, MUSICA, PUBLIC_DIR, RAIZ, TMP_V5,
  CONFIGS_V5, CONFIG_PADRAO_V5,
  lerVariaveisCss, gerarLogoTransparente, gerarRetratoDataUri, lerManifesto,
  ajustarClipe, construirTimelineMobileV5, construirTimelineDesktopV5, prepararManifestoCheckoutCep,
  dividirDuracaoEntreClipes, NOME_PARA_CLIPE,
  montarVozCompleta, copiarClipesAjustados, arquivarSeExistir, renderizar,
  tempoSrt, escreverSrt, agruparBlocosSemPreposicaoFinal, dataHoje,
  montarRoteiroMobile, montarRoteiroDesktop,
};
