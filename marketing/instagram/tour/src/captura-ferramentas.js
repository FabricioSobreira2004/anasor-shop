// ============================================================
// Ferramentas de captura quadro a quadro (Rodada 4 — Tour do Site).
//
// Por quê quadro a quadro em vez de page.video() do Playwright: o
// gravador padrão reamostra pra um fps fixo DEPOIS (vídeo de baixa
// qualidade, pedido explícito pra evitar) e não dá controle sobre
// rolagem/vídeo embutido sincronizados com o frame exato. Aqui cada
// frame é um screenshot PNG tirado com o DOM num estado conhecido
// (scrollTop/scrollLeft definidos à mão, ou o <video> pausado no
// currentTime exato) — determinístico: rodar 2x gera os MESMOS
// frames, não depende da velocidade da máquina.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG } = require('../../reels/src/ffmpeg-path'); // util puro (sem React/Remotion) — seguro reaproveitar entre pacotes, ver DECISOES.md
const { FPS } = require('./dispositivos');

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Contador de frames compartilhado entre as funções de uma cena —
// objeto (não número) só pra passar por referência sem o chamador
// precisar reatribuir a variável a cada chamada.
function novoContador() {
  return { n: 0 };
}

function caminhoFrame(dir, n) {
  return path.join(dir, `f${String(n).padStart(5, '0')}.png`);
}

async function tirarFoto(page, dir, contador) {
  const arquivo = caminhoFrame(dir, contador.n);
  await page.screenshot({ path: arquivo });
  contador.n++;
  return arquivo;
}

// "Hold" estático: 1 screenshot real + cópias de arquivo pras demais —
// muito mais rápido que repetir page.screenshot() quando a tela não
// está mudando (abertura, fechos, pausas de leitura).
async function manterFoto(page, dir, contador, quadros) {
  if (quadros <= 0) return;
  const base = await tirarFoto(page, dir, contador);
  for (let i = 1; i < quadros; i++) {
    fs.copyFileSync(base, caminhoFrame(dir, contador.n));
    contador.n++;
  }
}

// Rola a PÁGINA (window) de `de` a `para` (scrollTop em px) ao longo
// de `quadros` frames, com easing — cada passo move o DOM e tira 1
// screenshot, nunca confia em scroll "smooth" nativo (cujo tempo real
// não é determinístico).
async function rolarPagina(page, dir, contador, { de, para, quadros, easing = easeInOutCubic, aoFinalDeCadaQuadro }) {
  for (let i = 1; i <= quadros; i++) {
    const t = easing(i / quadros);
    const y = Math.round(de + (para - de) * t);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    if (aoFinalDeCadaQuadro) await aoFinalDeCadaQuadro(t, i);
    await tirarFoto(page, dir, contador);
  }
}

// Mesma ideia, mas rolando um ELEMENTO (carrossel horizontal) em vez
// da janela.
async function rolarElemento(page, seletor, dir, contador, { de, para, quadros, easing = easeInOutCubic }) {
  for (let i = 1; i <= quadros; i++) {
    const t = easing(i / quadros);
    const x = Math.round(de + (para - de) * t);
    await page.evaluate(([sel, x]) => { document.querySelector(sel).scrollLeft = x; }, [seletor, x]);
    await tirarFoto(page, dir, contador);
  }
}

// ---- Indicador de toque: um círculo que aparece, "pisca" no ponto
// tocado e some — injetado como DOM real (aparece no screenshot,
// diferente de desenhar por cima da imagem depois). ----
async function instalarIndicadorToque(page) {
  await page.evaluate(() => {
    if (document.getElementById('__tourToque')) return;
    const el = document.createElement('div');
    el.id = '__tourToque';
    Object.assign(el.style, {
      position: 'fixed', width: '72px', height: '72px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.0)', border: '4px solid rgba(255,255,255,0.95)',
      boxShadow: '0 0 0 6px rgba(201,138,74,0.35)',
      pointerEvents: 'none', zIndex: '2147483647', left: '0px', top: '0px',
      transform: 'translate(-50%,-50%) scale(0)', opacity: '0', transition: 'none',
    });
    document.documentElement.appendChild(el);
  });
}

async function moverIndicadorToque(page, x, y, escala, opacidade) {
  await page.evaluate(([x, y, escala, opacidade]) => {
    const el = document.getElementById('__tourToque');
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) scale(${escala})`;
    el.style.opacity = String(opacidade);
  }, [x, y, escala, opacidade]);
}

// Toque "real": usa page.touchscreen (dispara touchstart/end de
// verdade no Chromium, equivalente ao que um device físico manda —
// só funciona em contexto com hasTouch:true, ou seja, device mobile)
// — e, em paralelo, anima o indicador visual por alguns frames pra
// quem está vendo o vídeo entender que ali foi um toque.
async function tocarComIndicador(page, dir, contador, { x, y, quadrosAntes = 4, quadrosDepois = 6 }) {
  await moverIndicadorToque(page, x, y, 0.4, 0);
  for (let i = 1; i <= quadrosAntes; i++) {
    const t = i / quadrosAntes;
    await moverIndicadorToque(page, x, y, 0.4 + 0.6 * t, t);
    await tirarFoto(page, dir, contador);
  }
  await page.touchscreen.tap(x, y);
  for (let i = 1; i <= quadrosDepois; i++) {
    const t = i / quadrosDepois;
    await moverIndicadorToque(page, x, y, 1 + t * 0.5, 1 - t);
    await tirarFoto(page, dir, contador);
  }
  await moverIndicadorToque(page, x, y, 0, 0);
}

// Espera um <video> tocar e captura `quadros` frames reais dele, no
// RITMO do próprio vídeo (seta currentTime e espera chegar lá) — não
// no relógio de parede: roda igual numa máquina rápida ou lenta.
async function capturarVideo(page, seletorVideo, dir, contador, { quadros, fps }) {
  await page.evaluate((sel) => {
    const v = document.querySelector(sel);
    v.currentTime = 0;
    v.play().catch(() => {}); // alguns navegadores rejeitam play() sem gesto; aqui já houve um toque real antes (ver cena)
  }, seletorVideo);
  for (let i = 0; i < quadros; i++) {
    const alvo = i / fps;
    await page.waitForFunction(
      ([sel, alvo]) => {
        const v = document.querySelector(sel);
        return v && (v.currentTime >= alvo || v.ended);
      },
      [seletorVideo, alvo],
      { timeout: 4000 }
    ).catch(() => {}); // vídeo mais curto que o pedido: mantém o que já tem, a cena que chamou decide se segura o último quadro
    await tirarFoto(page, dir, contador);
  }
}

// Espera um campo de texto deixar de estar vazio (preenchimento
// assíncrono, ex.: ViaCEP) — usado em vez de esperar um tempo fixo,
// que seria mais lento OU falharia numa rede mais lenta que o previsto.
async function esperarCampoPreenchido(page, seletor, { timeout = 5000 } = {}) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && el.value && el.value.trim().length > 0;
    },
    seletor,
    { timeout }
  );
}

// Codifica a sequência de PNGs de uma cena num .mp4 (H.264, perto de
// lossless — é material de trabalho pro Remotion, não o entregável
// final; o passo de ffmpeg final de qualidade/perfil roda só 1x, no
// vídeo COMPOSTO, em tour.js) e apaga os PNGs (controla o uso de disco
// — ver nota do disco C: no README).
function codificarCena(dir, destinoMp4, fps) {
  fs.mkdirSync(path.dirname(destinoMp4), { recursive: true });
  execFileSync(FFMPEG, [
    '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.png'),
    // "pad" (não "scale"): o libx264 exige largura/altura PARES — o
    // iPhone 15 a dpr 3 dá 393*3=1179 (ÍMPAR) — descoberto só rodando
    // (ffmpeg falhava com "width not divisible by 2"). Preenche 1px
    // transparente/preto em vez de redimensionar, pra não distorcer
    // nem perder 1px real de conteúdo.
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    destinoMp4,
  ], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
}

// Fábrica da função "cena(nome, fn)" usada por cenas-mobile.js e
// cenas-desktop.js — era duplicada quase igual nos 2 arquivos (achado
// do code-review). Cada chamada: cria a pasta de frames, roda `fn`
// com um contador novo, codifica em .mp4, registra no manifesto e
// loga — `tag` só muda o prefixo do log ("[mobile]"/"[desktop]").
function criarFabricaCena(tag, dirBase, manifest) {
  return async function cena(nome, fn) {
    const dir = path.join(dirBase, nome);
    fs.mkdirSync(dir, { recursive: true });
    const c = novoContador();
    await fn(dir, c);
    const clipe = path.join(dirBase, `${nome}.mp4`);
    codificarCena(dir, clipe, FPS);
    manifest[nome] = { arquivo: clipe, quadros: c.n, fps: FPS };
    console.log(`  [${tag}] ${nome}: ${c.n} quadros (${(c.n / FPS).toFixed(1)}s) -> ${clipe}`);
  };
}

module.exports = {
  easeInOutCubic, easeOutExpo, novoContador,
  tirarFoto, manterFoto, rolarPagina, rolarElemento,
  instalarIndicadorToque, moverIndicadorToque, tocarComIndicador,
  capturarVideo, esperarCampoPreenchido, codificarCena, criarFabricaCena,
};
