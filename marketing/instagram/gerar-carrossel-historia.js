#!/usr/bin/env node
// ============================================================
// Carrossel de HISTÓRIA ("do barro à peça") — formato NOVO, diferente de
// gerar-posts.js/gerar-posts-tematicos.js: em vez de 1 produto por
// carrossel, conta o PROCESSO (barro -> forno -> esmalte -> luz) em tema
// visual próprio ("noite dourada"), pedido explícito do Fabrício
// (2026-11-23) pro lançamento dos "Anjos de Luz". Reaproveita utilitários
// de gerar-posts.js (dataUri, rostoAnasorHtml, ícones, RAIZ) mas NÃO o
// motor de slides dele — a composição aqui é um "carrossel contínuo":
// os 9 slides são recortes de UMA tela larga (9720x1350) renderizada de
// uma vez só, com um fio dourado (referência ao terço da peça) e um
// degradê de fundo contínuos atravessando as divisas — por isso usa
// `page.screenshot({clip})` em vez do `renderizar()` de gerar-posts.js
// (que redimensiona o viewport pro tamanho de 1 slide só).
//
// Como rodar:
//   cd marketing/instagram
//   node gerar-carrossel-historia.js
//
// Saída: E:\projetos\site-mae\instagram-posts\anjos-do-barro-a-luz\
// (pasta citada explicitamente no pedido, NÃO a E:\...\instagram-posts\
// direto onde gerar-posts.js escreve) — 1.png..9.png (1080x1350),
// legenda.txt, alt-text.txt, _preview-carrossel.png (prévia com os 9
// slides lado a lado, pra conferir o efeito contínuo sem abrir um por
// um). Sincroniza sozinha pro Google Drive do Fabrício.
//
// ---- Pra reaproveitar num "do barro à peça" diferente no futuro ----
// 1. Troque PASTA_FOTOS (pasta com as fotos-fonte) e os nomes de arquivo
//    usados em FOTOS/SLIDES.
// 2. Reescreva o array SLIDES (9 objetos, 1 por cartela) — cada função
//    de slide (slideCapa, slideEtapa, slideAntesDepois...) já é genérica
//    o bastante pra aceitar fotos/textos diferentes; só os TEXTOS e
//    OBJECT-POSITIONs do recorte são específicos desta história.
// 3. Troque PASTA_SAIDA e o conteúdo de LEGENDA/HASHTAGS/ALT_TEXTS.
// 4. O tema visual (paleta NOITE, fio dourado, medalhão da assinatura)
//    é genérico — não precisa mudar nada nele pra uma história diferente
//    da mesma marca.
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const P = require('./gerar-posts.js');

// ---- Caminhos ----
const PASTA_FOTOS = path.resolve(P.RAIZ, '..', 'site-mae', 'Criativos', 'anjos', 'fotos');
const CAMINHO_ASSINATURA = path.resolve(P.RAIZ, '..', 'site-mae', 'Marca Anasor Sobreira.jpeg');
const CAMINHO_ROSTO = path.join(P.RAIZ, 'img', 'institucional', 'quem-somos.jpg');
const PASTA_SAIDA = path.resolve(P.RAIZ, '..', 'site-mae', 'instagram-posts', 'anjos-do-barro-a-luz');

// ---- Geometria: N slides de 1080x1350 lado a lado numa ÚNICA tela ----
const SLIDE_W = 1080;
const SLIDE_H = 1350;
const N = 9;
const CANVAS_W = SLIDE_W * N;
const MARGEM = P.MARGEM_SEGURA; // 72 — mesma área segura do resto do projeto

// Converte (índice do slide, x local 0-1080) -> x absoluto no canvas.
const abs = (i, xLocal) => i * SLIDE_W + xLocal;

// ---- Paleta "noite dourada" ----
// v.destaque/v.destaqueEscuro são a terracota REAL da marca (lida de
// css/style.css, mesma fonte de sempre) — entram nos medalhões de
// confiança do slide 8 pra não inventar uma 3ª cor só pra esta rodada.
// NOITE_OURO (#F2B84B) é um dourado mais CLARO/quente que o DOURADO do
// site (P.DOURADO, #D9B06A, pensado pra texto sobre fundo bege/claro) —
// decisão: sobre um fundo quase preto, o dourado do site lia "opaco";
// este tom (pedido explícito do Fabrício: "brilho de vela dourado
// #F2B84B") é o que de fato parece luz de vela no fundo escuro.
const v = P.lerVariaveisCss();
const NOITE_BG_1 = '#2B1A12';
const NOITE_BG_2 = '#4A2A1A';
const NOITE_OURO = '#F2B84B';
const NOITE_OURO_CLARO = '#F8D98A';
const NOITE_CREME = '#FBF6EF';

// ---- RNG determinístico (mesma técnica já usada no projeto — ver
// captura-ferramentas.js do tour/: "a mesma pasta roda 2x dá os mesmos
// quadros") — o bokeh/brilho de fundo não muda a cada execução. ----
function criarRng(semente) {
  let h = 1779033703 ^ semente.length;
  for (let i = 0; i < semente.length; i += 1) {
    h = Math.imul(h ^ semente.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function mulberry32() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ---- Fotos-fonte (todas via data URI — Chromium recusa file:// numa
// página sem origem, mesmo motivo de dataUri() em gerar-posts.js) ----
const ARQ = (nome) => path.join(PASTA_FOTOS, nome);
const FOTOS = {
  barroCru: P.dataUri(ARQ('01-barro-anjo-cru.jpg')),
  barroPrateleira: P.dataUri(ARQ('02-barro-anjos-prateleira.jpg')),
  fornoCarregado: P.dataUri(ARQ('03-forno-carregado.jpg')),
  fornoPB: P.dataUri(ARQ('05-forno-pb-b.jpg')),
  esmaltadosSol: P.dataUri(ARQ('06-esmaltados-3-modelos-sol.jpg')),
  esmaltadosMesa: P.dataUri(ARQ('07-esmaltados-mesa.jpg')),
  acesos2Modelos: P.dataUri(ARQ('11-acesos-2-modelos-vela.jpg')),
  acesosPratos: P.dataUri(ARQ('12-acesos-par-pratos.jpg')),
  acesosCloseup: P.dataUri(ARQ('13-acesos-closeup.jpg')),
  acesosDeCima: P.dataUri(ARQ('16-acesos-mesa-de-cima.jpg')),
  embalagem: P.dataUri(ARQ('17-embalagem-presente.jpg')),
};
// NOTA (decisão registrada no relatório final): as fotos 08, 09, 10, 14
// e 15 (todas marcadas "QUADRO" no nome) têm ao fundo um quadro com uma
// figura masculina nua de corpo inteiro (e, em 10/14/15, também uma
// figura feminina) — em NENHUMA delas dá pra cortar o quadro sem também
// cortar a maior parte do grupo de anjos que é o motivo da foto (o
// quadro ocupa boa parte do quadro/fundo, atrás e entre os anjos). Regra
// do pedido: "na dúvida, não use a foto" — nenhuma das 5 entra neste
// carrossel. O slide "antes x depois" (que o pedido sugeria montar com
// 08/09 x 14/15) foi remontado com 07 (esmalte, apagado) x 13 (aceso) —
// mesma ideia (glacê branco x luz acesa), zero risco de reprovação.
const CAMINHO_ASSINATURA_URI = P.dataUri(CAMINHO_ASSINATURA);
const ROSTO_URI = P.dataUri(CAMINHO_ROSTO);

// ============================================================
// Fio de luz dourado (referência ao terço/correntinha da peça) — 1 SVG
// só, cobrindo o CANVAS INTEIRO, com "contas" (círculos) ao longo de uma
// curva suave (Catmull-Rom -> Bézier cúbica). Os pontos de controle
// abaixo foram ESCOLHIDOS À MÃO (não aleatórios) pra passar por cima de
// áreas de fundo "vazias" de cada slide e, no slide 5 (antes x depois),
// cruzar exatamente a costura diagonal entre as 2 fotos — é o ponto em
// que o pedido mais insiste em "sentir vontade de arrastar".
// ============================================================
const PONTOS_FIO = [
  [-60, 1040], [280, 1140], [760, 880], [1160, 420], [1620, 240],
  [2060, 620], [2480, 1080], [2920, 760], [3380, 340], [3780, 640],
  [4320, 300], [4860, 725], [5400, 280], [5840, 620], [6280, 1100],
  [6760, 760], [7220, 320], [7680, 980], [8160, 1180], [8640, 380],
  [9080, 760], [9420, 1040], [9780, 900],
];

function catmullRomParaBezier(pontos) {
  const pts = [pontos[0], ...pontos, pontos[pontos.length - 1]];
  const segmentos = [];
  for (let i = 1; i < pts.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    segmentos.push({ p0: p1, c1, c2, p1: p2 });
  }
  return segmentos;
}

function pontoNaCubica(p0, c1, c2, p1, t) {
  const mt = 1 - t;
  const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p1[0];
  const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p1[1];
  return [x, y];
}

function fioDeLuzSvg() {
  const segmentos = catmullRomParaBezier(PONTOS_FIO);
  const d = segmentos
    .map((s, i) => (i === 0 ? `M ${s.p0[0]},${s.p0[1]} ` : '') + `C ${s.c1[0]},${s.c1[1]} ${s.c2[0]},${s.c2[1]} ${s.p1[0]},${s.p1[1]}`)
    .join(' ');

  // Contas douradas (estilo terço) amostradas ao longo da MESMA curva —
  // RNG semeado só pro raio/brilho variar sem perder reprodutibilidade.
  const rng = criarRng('fio-de-luz-anjos');
  const CONTAS_POR_SEGMENTO = 3;
  const contas = [];
  segmentos.forEach((s) => {
    for (let k = 0; k < CONTAS_POR_SEGMENTO; k += 1) {
      const t = (k + 0.5) / CONTAS_POR_SEGMENTO;
      const [x, y] = pontoNaCubica(s.p0, s.c1, s.c2, s.p1, t);
      const raio = 4 + rng() * 7;
      contas.push({ x, y, raio });
    }
  });

  return `<svg class="fio-svg" width="${CANVAS_W}" height="${SLIDE_H}" viewBox="0 0 ${CANVAS_W} ${SLIDE_H}">
    <defs>
      <filter id="brilhoFio" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <radialGradient id="contaGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${NOITE_OURO_CLARO}" />
        <stop offset="55%" stop-color="${NOITE_OURO}" />
        <stop offset="100%" stop-color="#9C6A22" />
      </radialGradient>
    </defs>
    <path d="${d}" fill="none" stroke="${NOITE_OURO}" stroke-width="10" opacity="0.45" filter="url(#brilhoFio)" />
    <path d="${d}" fill="none" stroke="${NOITE_OURO_CLARO}" stroke-width="2.5" opacity="0.9" />
    ${contas.map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${c.raio.toFixed(1)}" fill="url(#contaGrad)" />`).join('')}
  </svg>`;
}

// ---- Bokeh (brilho de vela desfocado) espalhado pelo fundo inteiro ----
function bokehHtml() {
  const rng = criarRng('bokeh-anjos');
  const pontos = [];
  const QTD = Math.round(N * 6.5);
  for (let i = 0; i < QTD; i += 1) {
    pontos.push({
      x: rng() * CANVAS_W,
      y: rng() * SLIDE_H,
      d: 60 + rng() * 220,
      op: 0.05 + rng() * 0.16,
    });
  }
  return `<div class="bokeh-camada">${pontos.map((p) => `<div class="bokeh" style="left:${p.x.toFixed(0)}px;top:${p.y.toFixed(0)}px;width:${p.d.toFixed(0)}px;height:${p.d.toFixed(0)}px;opacity:${p.op.toFixed(2)};"></div>`).join('')}</div>`;
}

// ---- Marca d'água "AS" sutil, em dourado (pedido explícito: tema novo,
// dourado bem discreto — mesma TÉCNICA do --marca-monograma do site
// (texto "AS" em Fraunces itálico, só stroke, sem preenchimento), só que
// recolorido pra este tema escuro; não reaproveita a variável --marca-
// monograma-clara porque o traço dela é creme, não dourado). ----
// v1 (opacidade 0.06, ladrilho 260px) ficou "tapeçaria" demais num fundo
// liso escuro (a repetição reforça o traço mesmo em baixa opacidade) —
// ladrilho maior (380) + opacidade menor (0.035) deixou o monograma só
// perceptível de perto, como pedido ("bem sutil").
const MONOGRAMA_NOITE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='380' height='380'%3E%3Ctext x='190' y='245' text-anchor='middle' font-family='Fraunces, Georgia, serif' font-style='italic' font-size='170' fill='none' stroke='%23F2B84B' stroke-width='2' opacity='0.035'%3EAS%3C/text%3E%3C/svg%3E")`;

// ---- Textura de grão (mesma técnica de --textura-grao do site: ruído
// SVG via feTurbulence) — só tingida pro tom escuro, bem fraca. ----
const GRAO_NOITE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='0.06'/%3E%3C/svg%3E")`;

// ============================================================
// Medalhão redondo 3D com a assinatura floral da Anasor (fundo branco
// removido) — pedido explícito: "nunca quadrado". Reaproveita a MESMA
// técnica de corte por luminância de removerFundoLogo() (gerar-posts.js)
// mas com corte mais alto (238-253, não 228-250): o logo normal tem
// fundo CREME (luminância ~246, precisa de faixa larga pra não sobrar
// halo); esta assinatura tem fundo BRANCO PURO (255) sobre um desenho
// com cor (dourado/rosa das rosas) — faixa mais estreita evita comer as
// pétalas rosa-claras, que também têm luminância alta.
// ============================================================
async function removerFundoBranco(pagina, jpgDataUri) {
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
    const CORTE_TOTAL = 253;
    const CORTE_INICIO = 238;
    for (let i = 0; i < d.length; i += 4) {
      const luminancia = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminancia >= CORTE_TOTAL) {
        d[i + 3] = 0;
      } else if (luminancia > CORTE_INICIO) {
        d[i + 3] = Math.round(255 * (CORTE_TOTAL - luminancia) / (CORTE_TOTAL - CORTE_INICIO));
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }, jpgDataUri);
}

// Medalhão (fundo circular escuro + anel dourado + sombra deslocada,
// receita 3D já usada no projeto: brilho inset, sombra inset, degrau
// sólido, sombra de contato) é montado inline em montarHtml() — só ali
// a imagem SEM fundo (removerFundoBranco, que precisa do Chromium já
// aberto) está disponível.

// ---- Botão gummy 3D (mesma receita de sombras em camadas já usada no
// projeto — cssLegendaGummy/checkout.css — recolorida em dourado) ----
function botaoGummyHtml(texto) {
  return `<div class="botao-gummy"><span>${P.escaparHtml(texto)}</span></div>`;
}

// ---- Badge numerado redondo 3D ----
function badgeNumeroHtml(n) {
  return `<div class="badge-numero"><span>${n}</span></div>`;
}

// ---- Cartão de foto (cantos arredondados, filete dourado fino, sombra
// 3D) — SEM nenhuma borda branca sobrando (pedido: "fotos sangrando até
// a borda, ou em cartões com cantos arredondados, contorno fino dourado
// e sombra 3D"); aqui sempre a 2ª opção (cartão), a capa usa sangria
// total (slideCapa, mais abaixo). object-fit:cover em todos — a foto
// nunca é esticada/distorcida, só recortada. ----
function cartaoFotoHtml(xGlobal, yLocal, w, h, uri, posicao = '50% 50%', extraStyle = '') {
  return `<div class="cartao-foto" style="left:${xGlobal}px;top:${yLocal}px;width:${w}px;height:${h}px;${extraStyle}">
    <img src="${uri}" alt="" style="object-position:${posicao};">
  </div>`;
}

// ---- Medalhão de confiança (slide "por que comprar") — mesmo gradiente
// terracota->ouro e receita de sombra de faixaConfiancaHtml (gerar-
// posts.js), reaproveitado aqui porque já é dourado/terracota por
// natureza (funciona igual sobre fundo escuro). ----
function medalhaoConfiancaHtml(icone, texto) {
  return `<div class="confianca-noite__item">
    <span class="confianca-noite__medalhao">${P.svgIcone(icone, 34, '#2B1A12')}</span>
    <span class="confianca-noite__texto">${P.escaparHtml(texto)}</span>
  </div>`;
}

// ============================================================
// CSS compartilhado (1 vez só, a página inteira é 1 documento) ----
// ============================================================
function cssPagina() {
  return `
    * { box-sizing: border-box; margin: 0; }
    html, body { width: ${CANVAS_W}px; height: ${SLIDE_H}px; overflow: hidden; }
    body {
      position: relative; font-family: 'Jost', sans-serif; color: ${NOITE_CREME};
      background: linear-gradient(100deg, ${NOITE_BG_1} 0%, ${NOITE_BG_2} 45%, #3A2216 70%, ${NOITE_BG_1} 100%);
    }
    .textura { position: absolute; inset: 0; background-image: ${MONOGRAMA_NOITE}, ${GRAO_NOITE}; background-size: 380px, 140px; pointer-events: none; z-index: 0; }
    .bokeh-camada { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
    .bokeh { position: absolute; border-radius: 50%; background: radial-gradient(circle, ${NOITE_OURO} 0%, transparent 70%); filter: blur(4px); transform: translate(-50%, -50%); }
    .fio-svg { position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none; }
    .slide-conteudo { position: absolute; top: 0; width: ${SLIDE_W}px; height: ${SLIDE_H}px; z-index: 3; }
    .cartao-foto {
      position: absolute; border-radius: 26px; overflow: hidden;
      box-shadow: 0 0 0 2.5px rgba(242, 184, 75, 0.85), 0 22px 44px rgba(10, 6, 3, 0.55), 0 2px 0 rgba(255,255,255,0.08) inset;
    }
    .cartao-foto img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .eyebrow {
      font-family: 'Jost', sans-serif; font-weight: 600; font-size: 25px;
      letter-spacing: 0.14em; text-transform: uppercase; color: ${NOITE_OURO};
      text-align: center; margin-bottom: 10px;
    }
    h2.titulo-etapa {
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 600;
      font-size: 58px; line-height: 1.12; text-align: center; color: ${NOITE_CREME};
      text-shadow: 0 0 26px rgba(242, 184, 75, 0.35);
    }
    p.sub-etapa {
      font-family: 'Jost', sans-serif; font-weight: 400; font-size: 27px;
      text-align: center; color: ${NOITE_OURO_CLARO}; margin-top: 12px;
    }
    .badge-numero {
      width: 108px; height: 108px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background-image: linear-gradient(135deg, ${NOITE_OURO_CLARO}, ${NOITE_OURO} 55%, #B9802C);
      box-shadow: inset 2px 2px 4px rgba(255,255,255,0.55), inset -3px -4px 7px rgba(62,34,10,0.4), 0 6px 0 #8A5A1E, 0 16px 26px rgba(10,6,3,0.5);
    }
    .badge-numero span { font-family: 'Fraunces', serif; font-weight: 700; font-size: 46px; color: #2B1A12; }
    .medalhao-assinatura {
      border-radius: 50%; padding: 13%;
      background: radial-gradient(circle at 34% 28%, #4A2A1A, #20120B 78%);
      box-shadow: inset 0 2px 5px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.55), 0 0 0 4px ${NOITE_OURO}, 0 3px 0 #7A4E1C, 0 14px 30px rgba(0,0,0,0.55);
    }
    .medalhao-assinatura img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .botao-gummy {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 24px 64px; border-radius: 999px;
      background-image: linear-gradient(135deg, ${NOITE_OURO_CLARO}, ${NOITE_OURO} 60%, #B9802C);
      box-shadow: inset 2px 2px 4px rgba(255,255,255,0.5), inset -3px -4px 7px rgba(62,34,10,0.35), 0 7px 0 #8A5A1E, 0 18px 32px rgba(10,6,3,0.5);
    }
    .botao-gummy span { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 32px; color: #2B1A12; letter-spacing: 0.01em; }
    .tag-gummy {
      display: inline-flex; align-items: center; gap: 12px; padding: 16px 32px; border-radius: 999px;
      background: rgba(20, 11, 6, 0.55); border: 1.5px solid ${NOITE_OURO};
      font-family: 'Jost', sans-serif; font-weight: 500; font-size: 24px; color: ${NOITE_CREME};
      backdrop-filter: blur(2px);
    }
    .confianca-noite { display: flex; flex-direction: column; gap: 34px; align-items: flex-start; }
    .confianca-noite__item { display: flex; align-items: center; gap: 26px; }
    .confianca-noite__medalhao {
      flex-shrink: 0; width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background-image: linear-gradient(135deg, ${v.destaque}, ${NOITE_OURO});
      box-shadow: inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(42,20,8,0.35), 0 5px 0 ${v.destaqueEscuro}, 0 12px 22px rgba(0,0,0,0.4);
    }
    .confianca-noite__texto { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 29px; color: ${NOITE_CREME}; line-height: 1.3; }
    /* .rosto-anasor é criado por P.rostoAnasorHtml() (gerar-posts.js) —
       a função só devolve a <div>/<img>, quem desenha o recorte redondo é
       esta classe (mesma técnica de lá: anéis em box-shadow), copiada
       aqui com as cores do tema noite (lá usa v.fundo/v.destaque/DOURADO
       do bege diurno; aqui usa a versão escura + o ouro-vela). */
    .rosto-anasor {
      position: relative; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: inline-block;
      box-shadow: 0 0 0 8px ${NOITE_BG_1}, 0 0 0 14px ${NOITE_OURO}, 0 18px 38px rgba(0,0,0,0.5);
    }
    .rosto-anasor img { position: absolute; display: block; }
    .pill-rotulo {
      position: absolute; padding: 10px 26px; border-radius: 999px;
      font-family: 'Jost', sans-serif; font-weight: 600; font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase;
    }
    .pill-rotulo--antes { background: rgba(20,11,6,0.72); color: ${NOITE_CREME}; border: 1px solid rgba(251,246,239,0.5); }
    .pill-rotulo--depois { background: ${NOITE_OURO}; color: #2B1A12; }
    .coracao-linha { display: inline-flex; vertical-align: -6px; margin: 0 6px; }
  `;
}

// ============================================================
// Slides
// ============================================================

// ---- Slide 0: CAPA ----
function slideCapa(i) {
  const xBase = abs(i, 0);
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div class="cartao-foto" style="left:0;top:0;width:${SLIDE_W}px;height:${SLIDE_H}px;border-radius:0;box-shadow:none;">
      <img src="${FOTOS.acesosCloseup}" alt="" style="object-position: 58% 40%;">
    </div>
    <div class="capa-escurecido" style="position:absolute;inset:0;background:linear-gradient(to top, rgba(18,10,5,0.95) 0%, rgba(18,10,5,0.68) 34%, rgba(18,10,5,0.08) 58%, transparent 72%), linear-gradient(to bottom, rgba(10,5,2,0.55) 0%, transparent 260px);"></div>
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:${MARGEM}px; text-align:center;">
      <div class="tag-gummy">${P.svgIcone('sparkles', 22, NOITE_OURO)}<span>Últimas unidades desta fornada</span></div>
    </div>
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; bottom:96px; text-align:center;">
      <p class="eyebrow">Anjos de Luz</p>
      <h1 style="font-family:'Fraunces',serif; font-style:italic; font-weight:600; font-size:92px; line-height:1.03; text-shadow:0 0 36px rgba(242,184,75,0.45);">Do barro à luz</h1>
      <p class="sub-etapa" style="margin-top:18px;">Feitos à mão, um a um ${`<span class="coracao-linha">${P.svgCoracao(26, NOITE_OURO)}</span>`}</p>
    </div>
  </div>`;
}

// ---- Slides 1-3 e 5: ETAPA numerada, 1 badge + título + fotos ----
function slideEtapa(i, { numero, titulo, sub, fotos }) {
  const xBase = abs(i, 0);
  // IMPORTANTE: .slide-conteudo já tem position:absolute + left:xBase (é
  // o próprio elemento quem desloca o slide pro seu trecho do canvas) —
  // vira o "containing block" de tudo aqui dentro, então os filhos usam
  // coordenada LOCAL (0-1080), nunca xBase+local (dobraria o deslocamento
  // e jogaria o cartão pra fora da área visível daquele slide).
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div style="position:absolute; left:50%; top:${MARGEM}px; transform:translateX(-50%);">${badgeNumeroHtml(numero)}</div>
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:${MARGEM + 140}px; text-align:center;">
      <h2 class="titulo-etapa">${P.escaparHtml(titulo)}</h2>
      <p class="sub-etapa">${P.escaparHtml(sub)}</p>
    </div>
    ${fotos.map((f) => cartaoFotoHtml(f.x, f.y, f.w, f.h, f.uri, f.posicao, f.extra || '')).join('')}
  </div>`;
}

// ---- Slide 4: ANTES x DEPOIS (diagonal) ----
function slideAntesDepois(i) {
  const xBase = abs(i, 0);
  const frameX = MARGEM;
  const frameY = 300;
  const frameW = SLIDE_W - MARGEM * 2;
  const frameH = 850;
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:${MARGEM}px; text-align:center;">
      <p class="eyebrow">Antes &amp; depois</p>
      <h2 class="titulo-etapa">A luz muda tudo</h2>
    </div>
    <div style="position:absolute; left:${frameX}px; top:${frameY}px; width:${frameW}px; height:${frameH}px; border-radius:30px; overflow:hidden; box-shadow:0 0 0 2.5px rgba(242,184,75,0.85), 0 26px 50px rgba(10,6,3,0.55);">
      <img src="${FOTOS.esmaltadosMesa}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:22% 35%; clip-path: polygon(0 0, 62% 0, 38% 100%, 0% 100%);">
      <img src="${FOTOS.acesosCloseup}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:60% 40%; clip-path: polygon(62% 0, 100% 0, 100% 100%, 38% 100%);">
      <div style="position:absolute; left:0; top:0; bottom:0; width:2px; background:transparent;"></div>
      <div class="pill-rotulo pill-rotulo--antes" style="left:34px; bottom:34px;">Antes</div>
      <div class="pill-rotulo pill-rotulo--depois" style="right:34px; bottom:34px;">Depois</div>
    </div>
  </div>`;
}

// ---- Slide 6: Pronto pra presentear ----
function slidePresentear(i) {
  const xBase = abs(i, 0);
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:${MARGEM + 20}px; text-align:center;">
      <p class="eyebrow">Pronto pra presentear</p>
      <h2 class="titulo-etapa">Um presente com fé<br>e afeto</h2>
      <p class="sub-etapa">O Natal está chegando.</p>
    </div>
    ${cartaoFotoHtml((SLIDE_W - 700) / 2, 460, 700, 760, FOTOS.embalagem, '50% 42%')}
  </div>`;
}

// ---- Slide 7: Por que comprar ----
function slidePorqueComprar(i, rostoUri) {
  const xBase = abs(i, 0);
  const itens = [
    ['truck', 'Frete grátis para todo o Brasil'],
    ['credit-card', 'Pix, crédito ou débito'],
    ['package', 'Envio em até 7 dias úteis'],
    ['gem', 'Peça única, feita à mão'],
  ];
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:${MARGEM}px; text-align:center;">
      <p class="eyebrow">Anasor Sobreira</p>
      <h2 class="titulo-etapa" style="font-size:50px;">Por que comprar<br>com a Anasor</h2>
    </div>
    <div style="position:absolute; left:50%; top:330px; transform:translateX(-50%); text-align:center;">
      ${P.rostoAnasorHtml(rostoUri, 190)}
    </div>
    <div style="position:absolute; left:${MARGEM + 40}px; right:${MARGEM + 40}px; top:600px;">
      <div class="confianca-noite">${itens.map(([ic, tx]) => medalhaoConfiancaHtml(ic, tx)).join('')}</div>
    </div>
  </div>`;
}

// ---- Slide 8: CHAMADA FINAL ----
function slideChamadaFinal(i) {
  const xBase = abs(i, 0);
  return `<div class="slide-conteudo" style="left:${xBase}px;">
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; top:220px; text-align:center;">
      <p class="eyebrow">Encomendas abertas</p>
      <h1 style="font-family:'Fraunces',serif; font-style:italic; font-weight:600; font-size:84px; line-height:1.08; text-shadow:0 0 36px rgba(242,184,75,0.45);">Garanta o seu anjo</h1>
      <p class="sub-etapa" style="margin-top:14px;">Restam poucas unidades desta fornada</p>
    </div>
    <div style="position:absolute; left:50%; top:620px; transform:translateX(-50%);">
      <div id="medalhao-chamada" style="width:220px;height:220px;"></div>
    </div>
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; bottom:280px; text-align:center;">
      ${botaoGummyHtml('Link na bio')}
    </div>
    <div style="position:absolute; left:${MARGEM}px; right:${MARGEM}px; bottom:170px; text-align:center;">
      <p style="font-family:'Jost', sans-serif; font-weight:500; font-size:30px; color:${NOITE_OURO_CLARO};">${P.svgCoracao(24, NOITE_OURO)} @anasor.ceramica</p>
    </div>
  </div>`;
}

// ============================================================
// Legenda e alt-text
// ============================================================
const LEGENDA_TEXTO = `🕯️ **Do barro à luz** 🤎
_Os Anjos de Luz saindo do forno, um a um._

Cada Anjo de Luz começa como um pedaço de barro cru, modelado à mão — a bolinha da cabeça, as asas, os furinhos que um dia vão deixar a luz escapar. Depois vêm os dias dentro do forno a lenha, até o barro virar cerâmica de verdade.

Aí entra o esmalte branco, e um terço dourado em miniatura no pescoço de cada anjo — uma bênção que ele carrega pra sempre. Mas a peça só ganha vida mesmo quando a vela acende por dentro: a luz escapa pelos furinhos, e cada Anjo de Luz vira um pontinho de fé iluminando a casa.

São 3 modelos nesta fornada — o cone grande, o cone menor e a plaquinha com porta-vela — e são as **últimas unidades** que saíram do forno até agora.

🎁 Com o Natal chegando, é um presente que carrega mais que decoração: carrega fé e afeto.

✨ Toque no **link da bio** pra ver os Anjos de Luz de perto
📩 Quer encomendar um parecido? **Chama no direct** que a gente conversa`;
const LEGENDA_HASHTAGS = '#anjodeceramica #anjodaguarda #luminaria #ceramicaartesanal #presentedenatal #feitoamao #decoracaoafetiva #artesanatobrasileiro #pecaunica';

const ALT_TEXTS = [
  'Anjo de Luz de cerâmica branca aceso, luz dourada escapando pelos furinhos do vestido, terço dourado no pescoço — capa "Do barro à luz", Anasor Sobreira.',
  'Etapa 1: Anjo de Luz em barro cru recém-modelado à mão e uma prateleira com vários anjos crus lado a lado, antes do forno.',
  'Etapa 2: forno a lenha carregado com os Anjos de Luz em barro cru, visto de cima, com um close em preto e branco do mesmo momento.',
  'Etapa 3: os 3 modelos do Anjo de Luz já esmaltados em branco, com terço dourado no pescoço, ao sol — cone grande, cone menor e porta-vela.',
  'Antes e depois: à esquerda o Anjo de Luz esmaltado e apagado, à direita o mesmo tipo de peça com a vela acesa por dentro, luz saindo pelos furinhos.',
  'Etapa 4: Anjos de Luz acesos sobre a mesa, vistos de cima, e dois outros ângulos com a vela acesa e o terço dourado brilhando.',
  'Anjo de Luz embalado numa caixinha transparente de presente, pronto para ser dado de presente de Natal.',
  'Retrato de Anasor Sobreira em medalhão dourado, ao lado dos motivos para comprar: frete grátis, Pix ou cartão, envio em até 7 dias úteis, peça única.',
  'Chamada final "Garanta o seu anjo", medalhão com a assinatura floral da Anasor Sobreira, botão Link na bio e @anasor.ceramica.',
];

// ============================================================
// Montagem da página inteira + render
// ============================================================
function montarHtml(medalhaoUri) {
  const slides = [
    slideCapa(0),
    slideEtapa(1, {
      numero: 1,
      titulo: 'Modelado à mão',
      sub: 'Barro cru, antes do forno',
      fotos: [
        { x: MARGEM, y: 480, w: 448, h: 740, uri: FOTOS.barroCru, posicao: '78% 36%' },
        { x: MARGEM + 448 + 40, y: 480, w: 448, h: 740, uri: FOTOS.barroPrateleira, posicao: '50% 45%' },
      ],
    }),
    slideEtapa(2, {
      numero: 2,
      titulo: 'A queima',
      sub: 'Dias dentro do forno a lenha',
      fotos: [
        { x: MARGEM, y: 480, w: SLIDE_W - MARGEM * 2, h: 700, uri: FOTOS.fornoCarregado, posicao: '50% 42%' },
        {
          x: MARGEM + (SLIDE_W - MARGEM * 2) - 290, y: 1000, w: 330, h: 240, uri: FOTOS.fornoPB, posicao: '50% 42%',
          extra: 'box-shadow: 0 0 0 2.5px rgba(242,184,75,0.9), 0 20px 36px rgba(10,6,3,0.6); z-index:4;',
        },
      ],
    }),
    slideEtapa(3, {
      numero: 3,
      titulo: 'Esmalte branco & terço dourado',
      sub: 'Os 3 modelos da coleção',
      fotos: [
        { x: MARGEM, y: 440, w: SLIDE_W - MARGEM * 2, h: 560, uri: FOTOS.esmaltadosSol, posicao: '50% 38%' },
        { x: MARGEM, y: 1020, w: SLIDE_W - MARGEM * 2, h: 230, uri: FOTOS.esmaltadosMesa, posicao: '50% 30%' },
      ],
    }),
    slideAntesDepois(4),
    slideEtapa(5, {
      numero: 4,
      titulo: 'A luz',
      sub: 'A vela acesa revela os furinhos',
      fotos: [
        { x: MARGEM, y: 440, w: SLIDE_W - MARGEM * 2, h: 520, uri: FOTOS.acesosDeCima, posicao: '50% 50%' },
        { x: MARGEM, y: 990, w: 448, h: 270, uri: FOTOS.acesosPratos, posicao: '50% 42%' },
        { x: MARGEM + 448 + 40, y: 990, w: 448, h: 270, uri: FOTOS.acesos2Modelos, posicao: '50% 38%' },
      ],
    }),
    slidePresentear(6),
    slidePorqueComprar(7, ROSTO_URI),
    slideChamadaFinal(8),
  ];

  // Medalhão da assinatura: pequeno no canto inferior direito de TODOS
  // os slides (pedido "melhorias pra todos os posts": selo da assinatura
  // sempre redondo — aqui nasce redondo, não precisa de correção) +
  // 1 grande, centralizado, na chamada final (slide 8).
  const medalhoesCanto = Array.from({ length: N }, (_, i) => {
    if (i === 8) return ''; // slide 8 usa o medalhão grande central (ver #medalhao-chamada)
    const x = abs(i, SLIDE_W - MARGEM - 116);
    const y = SLIDE_H - MARGEM - 116;
    return `<div style="position:absolute; left:${x}px; top:${y}px; z-index:4;">
      <div class="medalhao-assinatura" style="width:116px;height:116px;"><img src="${medalhaoUri}" alt=""></div>
    </div>`;
  }).join('');

  const medalhaoGrandeChamada = `<div style="position:absolute; left:${abs(8, SLIDE_W / 2 - 110)}px; top:620px; z-index:4;">
    <div class="medalhao-assinatura" style="width:220px;height:220px;"><img src="${medalhaoUri}" alt="Assinatura Anasor Sobreira"></div>
  </div>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400..700;9..144,1,400..700&family=Jost:wght@400;500;600&display=block" rel="stylesheet">
<style>${cssPagina()}</style></head>
<body>
  <div class="textura"></div>
  ${bokehHtml()}
  ${fioDeLuzSvg()}
  ${slides.join('')}
  ${medalhoesCanto}
  ${medalhaoGrandeChamada}
</body></html>`;
}

async function gerarPreview(pagina, slidePaths) {
  const uris = slidePaths.map((p) => P.dataUri(p));
  const ESCALA = 320;
  const alturaPreview = Math.round(ESCALA * SLIDE_H / SLIDE_W);
  const html = `<!doctype html><html><head><style>
    * { margin:0; box-sizing:border-box; }
    body { width:${ESCALA * N}px; height:${alturaPreview}px; display:flex; background:#111; }
    img { width:${ESCALA}px; height:${alturaPreview}px; display:block; object-fit:cover; border-right:2px solid #000; }
  </style></head><body>${uris.map((u) => `<img src="${u}">`).join('')}</body></html>`;
  await pagina.setViewportSize({ width: ESCALA * N, height: alturaPreview });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.screenshot({ path: path.join(PASTA_SAIDA, '_preview-carrossel.png') });
}

async function main() {
  fs.mkdirSync(PASTA_SAIDA, { recursive: true });

  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage();

    // Assinatura sem fundo branco (1x, reaproveitada em todo medalhão).
    const medalhaoUri = await removerFundoBranco(pagina, CAMINHO_ASSINATURA_URI);

    const html = montarHtml(medalhaoUri);
    await pagina.setViewportSize({ width: CANVAS_W, height: SLIDE_H });
    await pagina.setContent(html, { waitUntil: 'networkidle' });
    await pagina.evaluate(async () => { await document.fonts.ready; });

    const slidePaths = [];
    for (let i = 0; i < N; i += 1) {
      const arquivo = path.join(PASTA_SAIDA, `${i + 1}.png`);
      await pagina.screenshot({ path: arquivo, clip: { x: i * SLIDE_W, y: 0, width: SLIDE_W, height: SLIDE_H } });
      slidePaths.push(arquivo);
      console.log(`  -> ${i + 1}.png`);
    }

    await gerarPreview(pagina, slidePaths);
    console.log('  -> _preview-carrossel.png');

    const corpoFormatado = require('./formatar-legenda.js').formatarLegenda(LEGENDA_TEXTO);
    fs.writeFileSync(path.join(PASTA_SAIDA, 'legenda.txt'), `${corpoFormatado}\n\n${LEGENDA_HASHTAGS}`, 'utf8');
    fs.writeFileSync(
      path.join(PASTA_SAIDA, 'alt-text.txt'),
      ALT_TEXTS.map((t, i) => `Slide ${i + 1} (${i + 1}.png): ${t}`).join('\n'),
      'utf8'
    );

    console.log(`\nOK: carrossel "Do barro à luz" gerado em ${PASTA_SAIDA}`);
  } finally {
    await navegador.close();
  }
}

module.exports = { montarHtml, removerFundoBranco };

if (require.main === module) {
  main().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
