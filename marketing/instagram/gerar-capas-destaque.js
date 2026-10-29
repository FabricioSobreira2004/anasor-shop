#!/usr/bin/env node
// ============================================================
// Capas dos 5 destaques do Instagram — v2 (Rodada 5, item 3).
//
// A v1 (E:\projetos\site-mae\instagram-perfil\*.png) usava o EMOJI
// literal (🏺🎬🛍️✨🤎) sobre um círculo bege — cores genéricas do
// emoji (amarelo/laranja vivo), fora da paleta da marca. Esta v2 usa
// ilustração vetorial em LINHA (SVG, traço único, cor da marca),
// temática por destaque, com fundo alternando bege/marrom pra fileira
// ficar harmônica — pedido explícito.
//
//   node gerar-capas-destaque.js
//
// Saída: E:\projetos\site-mae\instagram-perfil\v2\capa-<nome>.png
// (1080x1920, mesmo formato da v1) + _folha-contato.png (as 5 lado a
// lado, pra crítica visual em bloco).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..', '..');
const SAIDA = path.resolve(RAIZ, '..', 'site-mae', 'instagram-perfil', 'v2');
const LARGURA = 1080;
const ALTURA = 1920;

// ---- Cores da marca (mesma técnica de gerar-posts.js/reel.js) ----
function lerVariaveisCss() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'style.css'), 'utf8');
  const pegar = (nome) => {
    const m = css.match(new RegExp(`--${nome}:\\s*((?:url\\(|#)[^;]+);`));
    if (!m) throw new Error(`Variável --${nome} não encontrada em style.css`);
    return m[1].trim();
  };
  return {
    fundo: pegar('cor-fundo'),
    texto: pegar('cor-texto'),
    destaque: pegar('cor-destaque'),
    destaqueEscuro: pegar('cor-destaque-escuro'),
    secundaria: pegar('cor-secundaria'),
  };
}

// ---- Ícones de linha (SVG, viewBox 0 0 100 100, stroke único) ----
// Traço consistente (stroke-width 3.2, round cap/join) nos 5 — é isso
// que dá "série"/consistência entre os destaques, mesmo com desenhos
// diferentes. Vetoriais de propósito (escala sem perder nitidez).
const TRACO = 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';

const ICONES = {
  // Vaso com brilho — mesma silhueta "artesanal" das ilustrações
  // decorativas do próprio site (ver fundo da Home).
  'pecas-unicas': `
    <path ${TRACO} d="M38 30 Q38 22 50 22 Q62 22 62 30 L65 55 Q68 70 68 80 Q68 92 50 92 Q32 92 32 80 Q32 70 35 55 Z"/>
    <path ${TRACO} d="M40 30 L60 30"/>
    <path ${TRACO} d="M40 48 Q50 52 60 48" opacity="0.6"/>
    <path ${TRACO} d="M74 24 L78 32 L86 34 L78 36 L74 44 L70 36 L62 34 L70 32 Z"/>
  `,
  // Roda de oleiro (disco visto de lado, em perspectiva) + peça
  // subindo + 2 linhas de movimento — "bastidores do torno".
  bastidores: `
    <ellipse cx="50" cy="72" rx="30" ry="9" ${TRACO}/>
    <path ${TRACO} d="M42 72 L44 48 Q44 38 50 38 Q56 38 56 48 L58 72"/>
    <path ${TRACO} d="M18 60 Q14 66 18 72" opacity="0.7"/>
    <path ${TRACO} d="M82 60 Q86 66 82 72" opacity="0.7"/>
  `,
  // Sacola de compras com laço — "como comprar".
  'como-comprar': `
    <path ${TRACO} d="M28 40 L72 40 L68 88 L32 88 Z"/>
    <path ${TRACO} d="M38 40 Q38 22 50 22 Q62 22 62 40"/>
    <path ${TRACO} d="M44 56 Q50 62 56 56" opacity="0.7"/>
    <circle cx="50" cy="48" r="4" ${TRACO}/>
  `,
  // Lápis + esboço + estrela — "encomendas sob medida".
  encomendas: `
    <path ${TRACO} d="M30 82 L34 68 L68 34 L78 44 L44 78 Z"/>
    <path ${TRACO} d="M64 38 L74 48"/>
    <path ${TRACO} d="M30 82 L24 86 L28 78 Z"/>
    <path ${TRACO} d="M80 22 L83 29 L90 31 L83 33 L80 40 L77 33 L70 31 L77 29 Z"/>
  `,
  // Gotas d'água sobre mãos em concha — "cuidados com a peça".
  cuidados: `
    <path ${TRACO} d="M24 68 Q24 84 42 84 Q52 84 56 76"/>
    <path ${TRACO} d="M76 68 Q76 84 58 84"/>
    <path ${TRACO} d="M50 28 Q62 44 62 54 Q62 64 50 64 Q38 64 38 54 Q38 44 50 28 Z"/>
  `,
};

const DESTAQUES = [
  { nome: 'pecas-unicas', titulo: 'Peças Únicas', fundoAlt: false },
  { nome: 'bastidores', titulo: 'Bastidores', fundoAlt: true },
  { nome: 'como-comprar', titulo: 'Como Comprar', fundoAlt: false },
  { nome: 'encomendas', titulo: 'Encomendas', fundoAlt: true },
  { nome: 'cuidados', titulo: 'Cuidados com a Peça', fundoAlt: false },
];

// Textura de papel — ruído SVG leve, mesma técnica de VinhetaGrao no
// motor de Reels (feTurbulence), reaproveitada aqui como padrão, não
// importada (arquivo HTML solto, sem require entre pacotes).
function texturaPapelCss() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
    <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter>
    <rect width='100%' height='100%' filter='url(#n)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function montarHtml(destaque, v) {
  const corFundo = destaque.fundoAlt ? v.texto : v.fundo;
  const corIcone = destaque.fundoAlt ? v.fundo : v.destaque;
  const corAro = destaque.fundoAlt ? 'rgba(251,246,239,0.35)' : 'rgba(62,46,34,0.22)';
  const logoJpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'logo-anasor.jpg')).toString('base64');
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Jost:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${LARGURA}px; height: ${ALTURA}px; position: relative; overflow: hidden;
    background: ${corFundo};
    background-image: url("${texturaPapelCss()}");
    background-blend-mode: ${destaque.fundoAlt ? 'soft-light' : 'multiply'};
    background-size: 180px 180px;
  }
  .marca-dagua {
    position: absolute; right: 56px; bottom: 56px; width: 110px; opacity: ${destaque.fundoAlt ? 0.5 : 0.35};
  }
  .circulo {
    position: absolute; left: 50%; top: 790px; transform: translate(-50%, -50%);
    width: 780px; height: 780px; border-radius: 50%;
    border: 2px solid ${corAro};
  }
  .icone {
    position: absolute; left: 50%; top: 790px; transform: translate(-50%, -50%);
    width: 300px; height: 300px; color: ${corIcone};
  }
</style></head>
<body>
  <div class="circulo"></div>
  <svg class="icone" viewBox="0 0 100 100">${ICONES[destaque.nome]}</svg>
  <img class="marca-dagua" src="data:image/jpeg;base64,${logoJpg}">
</body></html>`;
}

async function renderizar(pagina, html, arquivo) {
  await pagina.setViewportSize({ width: LARGURA, height: ALTURA });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: arquivo, clip: { x: 0, y: 0, width: LARGURA, height: ALTURA } });
}

async function montarFolhaContato(pagina, arquivos) {
  // Mesma ideia de folha-contato.js (raiz de marketing/instagram): as
  // 5 capas lado a lado, pequenas, pra avaliar a série de uma vez só
  // — reimplementado aqui em vez de reaproveitado porque aquele
  // script lê de instagram-posts/, não de instagram-perfil/v2/.
  const COL = 300;
  // data URI, não "file:///" — ACHADO NA 1ª RODADA DE CRÍTICA VISUAL:
  // com file:///, o Chromium (página aberta via setContent, origem
  // about:blank) recusa carregar a imagem (ícone de "imagem quebrada"
  // nas 5) — provavelmente uma restrição de segurança do próprio
  // Chromium pra esse tipo de origem. Base64 embutido não depende de
  // nenhuma permissão de arquivo.
  const imgsBase64 = arquivos.map((a) => fs.readFileSync(a).toString('base64'));
  const html = `<!doctype html><html><head><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; background: #ccc; }
    img { width: ${COL}px; height: ${Math.round(COL * ALTURA / LARGURA)}px; object-fit: cover; }
  </style></head><body>${imgsBase64.map((b64) => `<img src="data:image/png;base64,${b64}">`).join('')}</body></html>`;
  const largura = COL * arquivos.length;
  const altura = Math.round(COL * ALTURA / LARGURA);
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.screenshot({ path: path.join(SAIDA, '_folha-contato.png'), clip: { x: 0, y: 0, width: largura, height: altura } });
}

async function main() {
  fs.mkdirSync(SAIDA, { recursive: true });
  const v = lerVariaveisCss();
  const browser = await chromium.launch();
  const pagina = await browser.newPage();

  const arquivos = [];
  for (const destaque of DESTAQUES) {
    const html = montarHtml(destaque, v);
    const arquivo = path.join(SAIDA, `capa-${destaque.nome}.png`);
    await renderizar(pagina, html, arquivo);
    arquivos.push(arquivo);
    console.log(`✅ capa-${destaque.nome}.png — ${destaque.titulo}`);
  }

  await montarFolhaContato(pagina, arquivos);
  console.log(`✅ _folha-contato.png`);

  await browser.close();
  console.log(`\nSaída: ${SAIDA}`);
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
