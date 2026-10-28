// ============================================================
// Gera as artes dos 9 primeiros posts do Instagram (@anasor.ceramica)
// em E:\projetos\site-mae\instagram-posts\: PNGs 1080x1350 (feed, 4:5)
// + a capa de cada post também em 1080x1920 (Stories) na subpasta
// stories\. Um post-NN.md por peça, com legenda, hashtags, ordem dos
// slides e texto alternativo.
//
// Como rodar (uma vez por PC, depois só o último comando):
//   cd marketing/instagram
//   npm install
//   npx playwright install chromium
//   node gerar-posts.js
//
// A pasta de saída fica FORA do git (é de site-mae, repositório à
// parte — ver CLAUDE.md): tudo nela sai deste script, então qualquer
// PC regenera as mesmas artes a partir deste repositório. Precisa de
// internet só para baixar as fontes (Fraunces e Jost) do Google
// Fonts; sem internet as artes saem com fonte de reserva.
//
// v2 (rodada "posts premium"): adiciona selo da peça, marca d'água da
// logo, faixa de confiança (site/politicas.html) e o slide "por que
// comprar" — ver README.md nesta pasta para o detalhe de cada peça.
//
// v3 (rodada "elevar o nível", pedido explícito do Fabrício em modo
// autônomo): os posts de peça v2 ficaram corretos mas repetitivos entre
// si (mesma composição de capa sempre). v3 adiciona 4 LAYOUTS de capa
// que alternam por peça (ver LAYOUT_CAPA_POR_POSICAO) pra dar ritmo à
// grade 3x3 do perfil, um mock dessa grade (_grade-perfil.png) e 4
// carrosséis de CONTEÚDO novos (não-peça: como comprar, cuidados, o
// que "peça única" significa, como encomendar uma parecida) — ver
// README.md para o detalhe de cada layout/carrossel.
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..', '..');
// Saída em site-mae (não no repo git: são artes geradas, pesadas, e o
// usuário já usa essa pasta como "banco" de mídia do Instagram).
const SAIDA = path.resolve(RAIZ, '..', 'site-mae', 'instagram-posts');
const SAIDA_STORIES = path.join(SAIDA, 'stories');
const SAIDA_V1 = path.join(SAIDA, '_v1');
const LARGURA = 1080;
const ALTURA = 1350;
const ALTURA_STORY = 1920;

// ---- As 9 peças, na ordem de publicação ----
// Todas disponíveis e com 3+ fotos, variando a categoria. As 5 primeiras
// são os posts de feed de peça do calendario-30-dias.md, na mesma ordem
// (dias 3, 10, 17, 21 e 24); as outras 4 completam a variedade.
// O número do post (post-NN) é a posição aqui e não muda se uma peça
// for pulada, para não desalinhar o calendário.
const PECAS = [
  { id: 1, motivo: 'prato com 7 fotos; é a legenda nº 1 do calendário' },
  { id: 6, motivo: 'vaso escultórico com 12 fotos, a peça mais fotografada' },
  { id: 5, motivo: 'prato mais sofisticado do ateliê, assinado pela artesã' },
  { id: 24, motivo: 'objeto decorativo (boleira), foge de prato e caneca' },
  { id: 17, motivo: 'kit completo, mostra conjunto e não só peça avulsa' },
  { id: 19, motivo: 'caneca com surpresa (5 fotos): o tipo de peça que mais gera comentário' },
  { id: 27, motivo: 'caneca com escultura na alça, detalhe que pede foto de perto' },
  { id: 13, motivo: 'travessa: categoria que ainda não aparece no feed' },
  { id: 8, motivo: 'segundo vaso, de acabamento metálico bem diferente do 1º' },
];

// Fotos extras por carrossel: com capa + "por que comprar" + chamada,
// fecha em até 6 slides.
const MAX_FOTOS_EXTRAS = 3;

// Ajuste fino do recorte da capa (object-position) quando a peça não
// está no centro da foto. Padrão: centro.
const RECORTE_CAPA = {
  5: '50% 30%',  // pavão: a borda de cima do prato encostava no topo
  13: '50% 8%',  // travessa alta: sem isso a ponta de cima era cortada
};

// ---- v3: layout da capa (1 foto cheia · 2 editorial dividida ·
// 3 círculo sobre bege · 4 fundo marrom/dourado) — ver slideCapaPorLayout.
// Ordem ESCOLHIDA À MÃO (não calculada): o objetivo é harmonia visual
// na grade 3x3 do perfil (3 posts por linha), não uma fórmula. Conferido
// que nenhum vizinho HORIZONTAL nem VERTICAL da grade repete o mesmo
// layout (ver _grade-perfil.png pra validar visualmente depois de gerar):
//   linha 1: 1 4 2
//   linha 2: 3 1 4
//   linha 3: 2 3 1
// Layout 1 (foto cheia, o mais "seguro"/direto) cai na diagonal
// (posições 1, 5, 9) incluindo o centro da grade, de propósito.
const LAYOUT_CAPA_POR_POSICAO = [1, 4, 2, 3, 1, 4, 2, 3, 1];

// Ouro da marca: MESMO hex já usado pro selo "Mais Vendido" (ver
// js/main.js SELOS_PECA / css/style.css .selo-peca--mais-vendido) — não
// é uma cor nova inventada pra v3, só reaproveitada como tipografia no
// layout 4 (fundo marrom).
const DOURADO = '#D9B06A';

// ---- Dados do site (fonte única) ----

// produtos.js é um script de navegador ("const produtos = [...]"); rodar
// o arquivo dentro de uma função devolve a lista sem duplicar dados.
function carregarProdutos() {
  const src = fs.readFileSync(path.join(RAIZ, 'js', 'produtos.js'), 'utf8');
  return new Function(`${src}; return produtos;`)();
}

// Marcas d'água e textura vêm do css/style.css (variáveis de :root), para
// as artes usarem exatamente os mesmos SVGs e cores do site.
function lerVariaveisCss() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'style.css'), 'utf8');
  const pegar = (nome) => {
    // Só aceita valor url(...) ou #cor: o style.css cita os mesmos nomes
    // dentro de comentários, que não podem ser lidos como a variável.
    const m = css.match(new RegExp(`--${nome}:\\s*((?:url\\(|#)[^;]+);`));
    if (!m) throw new Error(`Variável --${nome} não encontrada em style.css`);
    return m[1].trim();
  };
  return {
    grao: pegar('textura-grao'),
    monograma: pegar('marca-monograma-fraca'),
    flor: pegar('marca-flor'),
    vaso: pegar('marca-vaso'),
    fundo: pegar('cor-fundo'),
    fundoAlt: pegar('cor-fundo-alt'),
    texto: pegar('cor-texto'),
    destaque: pegar('cor-destaque'),
    destaqueEscuro: pegar('cor-destaque-escuro'),
    secundaria: pegar('cor-secundaria'),
  };
}

// Legendas prontas de legendas.md, achadas pelo nome da peça no título
// ("### 1. 🏺 Prato ... — R$ 134,90").
function carregarLegendas() {
  const md = fs.readFileSync(path.join(__dirname, 'legendas.md'), 'utf8');
  return md.split(/\n### /).slice(1).map((bloco) => {
    const [titulo, ...resto] = bloco.split('\n');
    const m = titulo.match(/^(\d+)\.\s+\S+\s+(.+?)\s+—\s+R\$\s*([\d.,]+)/u);
    const corpo = resto.join('\n').split(/\n---/)[0].trim();
    const linhas = corpo.split('\n');
    const hashtags = linhas.filter((l) => l.startsWith('#')).join(' ');
    const texto = linhas.filter((l) => !l.startsWith('#')).join('\n').trim();
    return m ? { numero: Number(m[1]), nome: m[2], preco: m[3], texto, hashtags } : null;
  }).filter(Boolean);
}

// As fotos/a logo entram como data URI: o HTML é montado em memória e o
// Chromium bloqueia file:// a partir de uma página sem origem.
function dataUri(arquivo) {
  const ext = path.extname(arquivo).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(arquivo).toString('base64')}`;
}

// Nome curto para a capa: "Kit Jogo de Chá Pétala — Bule, ..." vira só a
// parte antes do travessão, que é o nome da peça em si.
const nomeCurto = (nome) => nome.split(' — ')[0];

// Mesmo formato das legendas ("1.299,90"), para a comparação de preço
// não acusar diferença falsa a partir de R$ 1.000.
const formatarPreco = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// O nome vai dentro do HTML do slide: escapar evita que um "&" ou "<"
// no nome quebre a arte.
const escaparHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- Selo da peça (mesma regra/cores/prioridade de js/main.js) ----
// Lido aqui de novo (não importado) porque main.js é script de navegador,
// sem module.exports; são só 5 linhas e um comentário explica o porquê
// de qualquer divergência futura ter que ser corrigida nos dois lugares.
function montarSelos(v) {
  return {
    'mais-vendido': { label: 'Mais Vendido', bg: '#D9B06A', cor: v.texto },
    assinada: { label: 'Peça Assinada', bg: v.destaque, cor: '#FFF' },
    queridinho: { label: 'Queridinha do Ateliê', bg: v.fundo, cor: v.destaque, contorno: v.destaque },
    novidade: { label: 'Novidade', bg: v.secundaria, cor: '#FFF' },
  };
}

// Mesma prioridade de js/main.js (seloDaPeca): "vendido" fica de fora
// porque PECAS só traz peças disponíveis (ver filtro no main()).
function seloDaPeca(produto, selos) {
  const presentes = new Set([].concat(produto.selo || []));
  return Object.keys(selos).find((chave) => presentes.has(chave)) || null;
}

function seloHtml(v, produto, classeExtra = '') {
  const selos = montarSelos(v);
  const chave = seloDaPeca(produto, selos);
  if (chave) {
    const s = selos[chave];
    const contorno = s.contorno ? `box-shadow: inset 0 0 0 3px ${s.contorno};` : '';
    return `<div class="selo ${classeExtra}" style="background:${s.bg};color:${s.cor};${contorno}">${escaparHtml(s.label)}</div>`;
  }
  // Peça sem selo: rótulo neutro (não é uma das 4 chamadas reais do
  // site, então não usa as cores delas — fundo neutro em vez de afirmar
  // algo que não é verdade sobre a peça). Coração em SVG, não emoji: o
  // 🤎 do Windows sai com contorno preto grosso nas artes (mesmo motivo
  // da troca no slide de chamada).
  return `<div class="selo selo--neutro ${classeExtra}">Peça única ${svgCoracao(26, v.destaque)} feita à mão</div>`;
}

// ---- Ícones (Lucide, mesmo traço do resto do site — ver o SVG inline
// do acordeão de FAQ em politicas.html) ----
const ICONES = {
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  gem: '<path d="M10.5 3 8 9l4 13 4-13-2.5-6"/><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/><path d="M2 9h20"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.5-4 6.3C6 11 5 12.8 5 15a7 7 0 0 0 7 7z"/>',
};
const CORACAO_PATH = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';

function svgIcone(nome, tamanho = 28, cor = 'currentColor') {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;
}

// Coração CHEIO (preenchido), não o emoji 🤎: pedido explícito da rodada
// — o emoji do Windows renderiza com contorno preto grosso nas artes.
function svgCoracao(tamanho = 28, cor = 'currentColor') {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="${cor}" stroke="none"><path d="${CORACAO_PATH}"/></svg>`;
}

// ---- Faixa de confiança (capa + chamada) ----
// SÓ o que politicas.html realmente promete (ver leitura do arquivo):
// frete grátis (id="prazo-envio"), "peça única feita à mão" (regra de
// negócio do CLAUDE.md) e "compra segura" (Mercado Pago processa o
// pagamento — id="privacidade", e é o único canal de pagamento do site).
//
// v3: dois modificadores pros 4 layouts de capa (ver cssComum) —
// `coluna` (layout 2, editorial: bloco estreito, lista vertical em vez
// de linha horizontal) e `dourada` (layout 4, fundo marrom: texto/ícone
// em DOURADO em vez da cor de texto padrão, perdida no fundo escuro).
// Os ícones usam 'currentColor' (padrão de svgIcone) de propósito: a
// cor vem só do CSS (.confianca svg{color:...}), não de um parâmetro
// aqui — um lugar só controla a cor dos dois (ícone E texto).
function faixaConfiancaHtml({ coluna = false, dourada = false } = {}) {
  const itens = [
    ['truck', 'Frete grátis para todo o Brasil'],
    ['gem', 'Peça única, feita à mão'],
    ['shield-check', 'Compra segura'],
  ];
  const classes = ['confianca', coluna && 'confianca--coluna', dourada && 'confianca--dourada'].filter(Boolean).join(' ');
  return `<ul class="${classes}">
    ${itens.map(([icone, texto]) => `<li>${svgIcone(icone, coluna ? 26 : 30)}<span>${escaparHtml(texto)}</span></li>`).join('')}
  </ul>`;
}

// ---- Marca d'água (emblema dourado, img/institucional/logo-anasor.jpg) ----
// O arquivo-fonte é um JPG com fundo creme quase uniforme (sem canal
// alpha — testei mix-blend-mode:multiply primeiro, mas sobrava uma
// borda retangular visível sempre que o creme do JPG não batia exato
// com o que está por baixo). removerFundoLogo() lê os pixels num
// <canvas> (dentro do próprio Chromium do Playwright, sem depender de
// editar o arquivo fora do script) e apaga por LUMINÂNCIA: o fundo é
// bem claro (~246 de luminância, medido) e o traço dourado/texto da
// marca é bem mais escuro, então o corte não alcança o desenho. Uma
// faixa de transição (230-250) evita borda serrilhada.
async function removerFundoLogo(pagina, jpgDataUri) {
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
    const CORTE_TOTAL = 250;
    const CORTE_INICIO = 228;
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

// `comChip`: embrulha a logo num círculo creme translúcido — só usado no
// layout 4 (fundo marrom). Sem o chip, testado e DESCARTADO: o corte por
// luminância (removerFundoLogo) deixa uma faixa de transição (228-250)
// que seguia o ruído de compressão JPEG do arquivo-fonte (blocos quase
// invisíveis sobre fundo claro) — sobre o marrom escuro esse ruído vira
// um halo quadrado visível atrás da logo. O chip resolve (a logo volta
// a pousar sobre o creme que ela já foi desenhada pra ter) E funciona
// como reforço de marca sobre um fundo tão diferente do site.
function marcaDaguaHtml(logoUri, classeExtra = '', comChip = false) {
  const img = `<img class="marca-dagua ${classeExtra}" src="${logoUri}" alt="">`;
  return comChip ? `<div class="marca-dagua-chip">${img}</div>` : img;
}

// ---- CSS comum a todo slide (selo, marca d'água, faixa de confiança) ----
function cssComum(v) {
  return `
    .selo {
      position: absolute; top: 56px; left: 56px; z-index: 2;
      display: inline-flex; align-items: center; gap: 10px;
      font-family: 'Jost', sans-serif; font-weight: 600; font-size: 30px;
      letter-spacing: 0.02em; line-height: 1; white-space: nowrap;
      padding: 20px 34px; border-radius: 999px;
      box-shadow: 0 6px 18px rgba(62, 46, 34, 0.22);
    }
    .selo svg { flex-shrink: 0; position: relative; top: -1px; }
    .selo--neutro {
      background: rgba(251, 246, 239, 0.95);
      color: ${v.texto};
      box-shadow: inset 0 0 0 2px rgba(62, 46, 34, 0.22), 0 6px 18px rgba(62, 46, 34, 0.14);
    }
    .marca-dagua {
      position: absolute; right: 56px; bottom: 56px; width: 136px; height: auto;
      opacity: 0.85; pointer-events: none; z-index: 2;
      filter: drop-shadow(0 2px 6px rgba(62, 46, 34, 0.25));
      /* a sombra suave ajuda o emblema (claro) a não "sumir" quando cai
         sobre uma área clara da foto, já que não há mais blend-mode */
    }
    /* layout 4 (fundo marrom) — ver comentário em marcaDaguaHtml() sobre
       por que o chip existe. Repõe a posição absoluta NO WRAPPER (a img
       lá dentro vira estática, centralizada por flex) e devolve 100% de
       opacidade: dentro do chip a logo não precisa "flutuar" sobre nada. */
    .marca-dagua-chip {
      position: absolute; right: 56px; bottom: 56px; z-index: 2;
      width: 156px; height: 156px; border-radius: 50%; padding: 20px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(251, 246, 239, 0.95);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
    }
    .marca-dagua-chip .marca-dagua {
      position: static; width: 100%; height: auto; opacity: 1; filter: none;
    }
    .confianca {
      list-style: none; display: flex; align-items: flex-start; justify-content: center;
      gap: 28px; color: ${v.texto};
    }
    .confianca li {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      flex: 1 1 0; max-width: 300px; text-align: center;
    }
    .confianca span { font-size: 21px; line-height: 1.3; color: inherit; white-space: nowrap; }
    .confianca svg { color: ${v.destaque}; flex-shrink: 0; }
    /* layout 2 (editorial): bloco estreito — lista vertical, ícone ao
       lado do texto em vez de em cima, texto pode quebrar linha */
    .confianca--coluna { flex-direction: column; align-items: flex-start; gap: 18px; }
    .confianca--coluna li { flex-direction: row; align-items: center; gap: 16px; max-width: none; text-align: left; }
    .confianca--coluna span { white-space: normal; }
    /* layout 4 (fundo marrom): cor de texto padrão (marrom escuro) some
       no fundo escuro — usa o dourado da marca pros dois (texto E ícone,
       já que svg usa currentColor) */
    .confianca--dourada { color: ${DOURADO}; }
    .confianca--dourada svg { color: ${DOURADO}; }
  `;
}

// ---- Modelos dos slides ----

function baseHtml(v, corpo, cssExtra, altura = ALTURA) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400..700;9..144,1,400..700&family=Jost:wght@400;500;600&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${LARGURA}px; height: ${altura}px; overflow: hidden; }
  body {
    position: relative;
    font-family: 'Jost', sans-serif;
    color: ${v.texto};
    background-color: ${v.fundo};
    background-image: ${v.grao};
  }
  ${cssComum(v)}
  ${cssExtra}
</style></head><body>${corpo}</body></html>`;
}

// Capa: foto principal em tela cheia (cover = recorte proporcional, sem
// esticar), selo no canto superior esquerdo (o direito fica livre: é
// onde o Instagram desenha o contador "1/6" do carrossel) e uma faixa
// creme no rodapé com o nome + a faixa de confiança (substitui a antiga
// linha solta "Peça única, feita à mão": a faixa de confiança já cobre
// essa mensagem, então repetir as duas seria redundante). A marca
// d'água fica DENTRO da .faixa mas "flutua" 166px ACIMA dela (top
// negativo) — pousa sobre a FOTO, não sobre o texto/ícones da faixa,
// qualquer que seja a altura da faixa (1 ou 2 linhas de título).
function slideCapa(v, foto, nome, recorte, produto, logoUri) {
  return baseHtml(v, `
    <img class="foto" src="${foto}" alt="">
    ${seloHtml(v, produto)}
    <div class="faixa">
      ${marcaDaguaHtml(logoUri, 'marca-dagua--capa')}
      <h1 id="titulo">${escaparHtml(nome)}</h1>
      ${faixaConfiancaHtml()}
    </div>`, `
    .foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${recorte}; }
    .faixa {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 40px 72px 52px;
      text-align: center;
      /* creme quase opaco + monograma fraco: a faixa conversa com o site
         sem esconder a foto atrás de um bloco pesado */
      background-color: rgba(251, 246, 239, 0.96);
      background-image: ${v.monograma}, ${v.grao};
      background-size: 220px, 140px;
      border-top: 2px solid ${v.destaque};
    }
    .marca-dagua--capa { top: -166px; bottom: auto; right: 40px; }
    h1 {
      font-family: 'Fraunces', serif; font-weight: 600;
      font-size: 68px; line-height: 1.08; letter-spacing: -0.01em;
      max-height: calc(68px * 1.08 * 2 + 4px);
      margin-bottom: 26px;
    }`);
}

// Capa em formato Story (1080x1920): mesma composição da capa do feed,
// só a foto ocupa mais altura (Stories é bem mais vertical) — sem
// confiança nem selo repetidos aqui: a intenção do Story é "pescar"
// pro carrossel do feed/link na bio, não refazer o post inteiro.
function slideCapaStory(v, foto, nome, recorte, logoUri) {
  return baseHtml(v, `
    <img class="foto" src="${foto}" alt="">
    <div class="faixa">
      ${marcaDaguaHtml(logoUri, 'marca-dagua--capa')}
      <h1 id="titulo">${escaparHtml(nome)}</h1>
      <p class="sub">Peça única, feita à mão ${svgCoracao(26, v.destaque)}</p>
    </div>`, `
    .foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${recorte}; }
    .faixa {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 48px 84px 220px;
      /* 220px embaixo: área segura do Story (onde o Instagram desenha o
         nome do perfil/controles) — nada de importante ali */
      text-align: center;
      background-color: rgba(251, 246, 239, 0.96);
      background-image: ${v.monograma}, ${v.grao};
      background-size: 220px, 140px;
      border-top: 2px solid ${v.destaque};
    }
    .marca-dagua--capa { top: -166px; bottom: auto; right: 48px; }
    h1 {
      font-family: 'Fraunces', serif; font-weight: 600;
      font-size: 72px; line-height: 1.1; letter-spacing: -0.01em;
      max-height: calc(72px * 1.1 * 2 + 4px);
    }
    .sub {
      margin-top: 22px; font-size: 34px; color: ${v.destaque};
      display: flex; align-items: center; justify-content: center; gap: 12px;
    }`, ALTURA_STORY);
}

// ---- v3: layouts 2, 3 e 4 da capa (ver LAYOUT_CAPA_POR_POSICAO e
// slideCapaPorLayout, mais abaixo). O layout 1 é a função slideCapa()
// acima (sem mudança — continua o "padrão" mais direto). Em TODOS: selo
// no canto superior ESQUERDO, nada no canto superior direito (onde o
// Instagram desenha o contador "1/N" do carrossel), marca d'água da
// logo, faixa de confiança com os mesmos 3 fatos, coração em SVG, sem
// preço nenhum — pedido explícito da rodada v3.

// Layout 2 — "editorial dividida": foto à esquerda (58%, sangria até a
// borda), bloco creme-encorpado (--cor-fundo-alt, pra destacar do bege
// claro do layout 1/3) à direita com o nome em serifa grande e a faixa
// de confiança em coluna (ver confianca--coluna). O selo cai sobre a
// FOTO (ela ocupa o canto superior esquerdo do cartaz inteiro) sem
// precisar de nenhum ajuste de posição: .selo é position:absolute
// relativo ao <body>, que é quem tem position:relative (cssComum) — a
// foto só por acaso preenche esse canto neste layout.
function slideCapaEditorial(v, foto, nome, recorte, produto, logoUri) {
  return baseHtml(v, `
    ${seloHtml(v, produto)}
    <div class="editorial">
      <div class="editorial__foto"><img src="${foto}" alt="" style="object-position:${recorte}"></div>
      <div class="editorial__bloco">
        <h1 id="titulo" data-max-linhas="3">${escaparHtml(nome)}</h1>
        ${faixaConfiancaHtml({ coluna: true })}
        ${marcaDaguaHtml(logoUri, 'marca-dagua--editorial')}
      </div>
    </div>`, `
    .editorial { position: absolute; inset: 0; display: flex; }
    .editorial__foto { position: relative; width: 58%; height: 100%; overflow: hidden; }
    .editorial__foto img { width: 100%; height: 100%; object-fit: cover; }
    .editorial__bloco {
      width: 42%; height: 100%; position: relative;
      display: flex; flex-direction: column; justify-content: flex-end;
      /* flex-end (não center): texto ancorado no terço de baixo do
         bloco lê mais "cartaz editorial" do que dead-center, e combina
         com a faixa inferior do layout 1 — testado com center primeiro
         e sobrava respiro demais em cima E embaixo ao mesmo tempo */
      padding: 72px 52px 150px;
      /* 150 (não 100) embaixo: dá folga pra marca d'água no canto
         (.marca-dagua--editorial, 36px do canto, ~100px de largura) não
         disputar espaço com a última linha da faixa de confiança */
      background-color: ${v.fundoAlt};
      background-image: ${v.monograma};
      background-size: 260px;
      border-left: 2px solid ${v.destaque};
    }
    .editorial__bloco h1 {
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 600;
      font-size: 54px; line-height: 1.12; letter-spacing: -0.005em;
      max-height: calc(54px * 1.12 * 3 + 4px);
      margin-bottom: 44px;
    }
    .marca-dagua--editorial { position: absolute; right: 36px; bottom: 36px; width: 100px; }
    `);
}

// Layout 3 — "círculo sobre bege": a peça emoldurada num círculo (como
// um prato num pedestal de vidro — as fotos reais já usam esse suporte,
// ver as fotos originais), flutuando sobre --cor-fundo-alt (bege
// encorpado, não a foto). A sombra elíptica embaixo do círculo
// (.circulo-pedestal) é a referência ao pedestal pedida — um gradiente,
// não um desenho 3D, que ficaria falso/genérico perto de fotos reais.
function slideCapaCirculo(v, foto, nome, recorte, produto, logoUri) {
  return baseHtml(v, `
    ${seloHtml(v, produto)}
    <div class="circulo-cena">
      <div class="circulo-pedestal"></div>
      <div class="circulo-foto"><img src="${foto}" alt="" style="object-position:${recorte}"></div>
    </div>
    <div class="circulo-rodape">
      <h1 id="titulo">${escaparHtml(nome)}</h1>
      ${faixaConfiancaHtml()}
    </div>
    ${marcaDaguaHtml(logoUri, 'marca-dagua--circulo')}`, `
    body { background-color: ${v.fundoAlt}; }
    .circulo-cena { position: absolute; top: 150px; left: 50%; transform: translateX(-50%); width: 680px; height: 680px; }
    .circulo-pedestal {
      position: absolute; left: 50%; bottom: -26px; transform: translateX(-50%);
      width: 480px; height: 38px; border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(62, 46, 34, 0.24), transparent 72%);
    }
    .circulo-foto {
      position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
      box-shadow: 0 0 0 10px ${v.fundo}, 0 0 0 12px ${v.destaque}, 0 28px 56px rgba(62, 46, 34, 0.28);
    }
    .circulo-foto img { width: 100%; height: 100%; object-fit: cover; }
    .circulo-rodape { position: absolute; left: 0; right: 0; bottom: 210px; text-align: center; padding: 0 72px; }
    .circulo-rodape h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 58px; line-height: 1.08;
      max-height: calc(58px * 1.08 * 2 + 4px);
      margin-bottom: 30px;
    }
    .marca-dagua--circulo { width: 104px; }
    `);
}

// Layout 4 — "fundo marrom, tipografia dourada": --cor-texto (o marrom
// escuro do site) como FUNDO em vez de cor de texto, nome em dourado
// (DOURADO, ver comentário na constante). A peça ainda aparece — um
// medalhão circular pequeno, contido — pra não virar só uma citação sem
// produto; o foco visual é a tipografia, não a foto.
function slideCapaMarrom(v, foto, nome, recorte, produto, logoUri) {
  return baseHtml(v, `
    ${seloHtml(v, produto)}
    <div class="marrom-cena">
      <div class="marrom-foto"><img src="${foto}" alt="" style="object-position:${recorte}"></div>
      <h1 id="titulo">${escaparHtml(nome)}</h1>
      ${faixaConfiancaHtml({ dourada: true })}
    </div>
    ${marcaDaguaHtml(logoUri, '', true)}`, `
    body { background: ${v.texto}; }
    .marrom-cena {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 0 80px; text-align: center;
    }
    .marrom-foto {
      /* maior que a 1ª versão (340px): sozinho, 340 deixava um vão vazio
         grande entre o bloco centralizado e a marca d'água no canto —
         aumentar o conteúdo central (foto+título) preenche o cartaz
         melhor do que forçar um espaçamento artificial */
      width: 420px; height: 420px; border-radius: 50%; overflow: hidden; margin-bottom: 56px;
      box-shadow: 0 0 0 6px ${DOURADO}, 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .marrom-foto img { width: 100%; height: 100%; object-fit: cover; }
    .marrom-cena h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-style: italic;
      font-size: 66px; line-height: 1.12; color: ${DOURADO};
      max-height: calc(66px * 1.12 * 2 + 4px);
      margin-bottom: 40px;
    }
    `);
}

// Dispatcher: escolhe a função de capa pelo nº do layout (1-4, ver
// LAYOUT_CAPA_POR_POSICAO) — um lugar só decide, main() só consulta.
function slideCapaPorLayout(layout, v, foto, nome, recorte, produto, logoUri) {
  if (layout === 2) return slideCapaEditorial(v, foto, nome, recorte, produto, logoUri);
  if (layout === 3) return slideCapaCirculo(v, foto, nome, recorte, produto, logoUri);
  if (layout === 4) return slideCapaMarrom(v, foto, nome, recorte, produto, logoUri);
  return slideCapa(v, foto, nome, recorte, produto, logoUri);
}

// Foto extra: a imagem inteira (contain), sem texto de preço, só um
// passe-partout branco fino com filete terracota sobre o fundo creme
// do site + a marca d'água no canto e uma legendinha "Detalhe" opcional
// (pedido 2.6: ajuda a variar o ritmo do carrossel sem inventar legenda
// nova pra cada foto).
function slideFoto(v, foto, logoUri, legenda) {
  return baseHtml(v, `
    <div class="moldura"><img src="${foto}" alt=""></div>
    ${legenda ? `<p class="legenda-foto">${escaparHtml(legenda)}</p>` : ''}
    ${marcaDaguaHtml(logoUri)}`, `
    body {
      display: flex; align-items: center; justify-content: center;
      background-image: ${v.monograma}, ${v.grao};
      background-size: 220px, 140px;
    }
    .moldura {
      padding: 14px; background: #FFF;
      box-shadow: 0 0 0 1.5px ${v.destaque}, 0 22px 48px rgba(62, 46, 34, 0.22);
      border-radius: 4px;
    }
    img { display: block; max-width: ${LARGURA - 180}px; max-height: ${ALTURA - 230}px; border-radius: 2px; }
    .legenda-foto {
      position: absolute; left: 0; right: 0; bottom: 64px; text-align: center;
      font-family: 'Fraunces', serif; font-style: italic; font-size: 30px;
      color: ${v.destaque};
    }`);
}

// Novo slide "por que comprar com a Anasor" (pedido 2.4): 4 fatos reais
// de politicas.html, nada inventado — ver leitura do arquivo:
// id="prazo-envio" (frete grátis + prazo), FAQ "formas de pagamento"
// (Pix/crédito/débito) e id="trocas-devolucoes" (7 dias de arrependimento,
// CDC). "via Mercado Pago" no item de pagamento cobre o 5º ponto pedido
// (processamento protegido) sem precisar de um 5º ícone — 4 fica mais
// limpo que 5 numa tela só, e a frase carrega os dois fatos juntos.
function slideConfianca(v, logoUri) {
  const itens = [
    ['truck', 'Frete grátis para todo o Brasil'],
    ['credit-card', 'Pix, crédito ou débito — via Mercado Pago'],
    ['package', 'Envio em até 7 dias úteis'],
    ['rotate-ccw', '7 dias pra se arrepender da compra'],
  ];
  return baseHtml(v, `
    ${marcaDaguaHtml(logoUri)}
    <main class="porque">
      <p class="eyebrow">Por que comprar com a</p>
      <h1>Anasor Sobreira</h1>
      <ul class="lista-porque">
        ${itens.map(([icone, texto]) => `<li>${svgIcone(icone, 46)}<span>${escaparHtml(texto)}</span></li>`).join('')}
      </ul>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    .porque { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 96px; }
    .eyebrow { font-size: 30px; color: ${v.destaque}; letter-spacing: 0.04em; }
    .porque h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-style: italic;
      font-size: 76px; margin-top: 10px; margin-bottom: 64px;
    }
    .lista-porque { list-style: none; width: 100%; max-width: 820px; }
    .lista-porque li {
      display: flex; align-items: center; gap: 30px;
      padding: 26px 8px; border-bottom: 1px solid rgba(62, 46, 34, 0.14);
    }
    .lista-porque li:last-child { border-bottom: none; }
    .lista-porque svg { color: ${v.destaque}; flex-shrink: 0; }
    .lista-porque span { font-size: 36px; line-height: 1.3; }`);
}

// ---- v3/A3: carrosséis de CONTEÚDO (não são de uma peça específica) ----
// "Como comprar", "Cuidados com a peça", "Peça única: o que significa" e
// "Encomende a sua" — mesma identidade visual (fontes, cores, marca
// d'água) dos posts de peça, mas SÓ com fatos de politicas.html e
// produtos.js (ver DECISOES.md pra cada trecho citado). Todos fecham com
// slideChamada() (mais abaixo), que já é genérico — sem preço nem peça
// específica — então não precisa de uma versão própria pra conteúdo.

// Capa de carrossel de conteúdo: mesmos elementos decorativos (flor/
// vaso) de slideChamada, SEM a faixa de confiança — pedir "frete
// grátis/compra segura" na capa de um post sobre "cuidados com a peça",
// por exemplo, seria forçar um selo de venda em um conteúdo que não é
// sobre comprar (a confiança ainda aparece 1x por carrossel, no slide
// de chamada final). A 1ª versão desta capa (só eyebrow + título, sem
// mais nada) saiu vazia demais pro nível de marca pedido — o badge de
// ícone (mesma ideia do círculo "AS" de slideChamada), o divisor e o
// subtítulo dão o mesmo peso visual dos outros slides do carrossel.
function slideCapaInformativa(v, icone, eyebrow, titulo, subtitulo, logoUri) {
  return baseHtml(v, `
    <div class="flor"></div><div class="vaso"></div>
    ${marcaDaguaHtml(logoUri)}
    <main class="info-capa">
      <div class="info-capa__icone">${svgIcone(icone, 56)}</div>
      <p class="eyebrow">${escaparHtml(eyebrow)}</p>
      <h1 id="titulo" data-max-linhas="2">${escaparHtml(titulo)}</h1>
      <div class="info-capa__divisor"></div>
      <p class="info-capa__subtitulo">${escaparHtml(subtitulo)}</p>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    .flor, .vaso { position: absolute; background-repeat: no-repeat; background-size: contain; }
    .flor { width: 560px; height: 560px; top: -70px; right: -150px; transform: rotate(-12deg); background-image: ${v.flor}; opacity: 0.85; }
    .vaso { width: 360px; height: 360px; bottom: -40px; left: -80px; background-image: ${v.vaso}; opacity: 0.85; }
    .info-capa { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 90px; }
    .info-capa__icone {
      width: 124px; height: 124px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: ${v.destaque}; color: #FFF; margin-bottom: 36px;
      box-shadow: 0 0 0 8px ${v.fundo}, 0 0 0 10px ${v.destaque};
    }
    .eyebrow { font-size: 30px; color: ${v.destaque}; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 16px; }
    .info-capa h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 78px; line-height: 1.08;
      max-height: calc(78px * 1.08 * 2 + 4px);
    }
    .info-capa__divisor { width: 110px; height: 2px; background: rgba(62, 46, 34, 0.22); margin: 36px 0; }
    .info-capa__subtitulo { font-size: 30px; color: ${v.texto}; opacity: 0.85; max-width: 680px; line-height: 1.4; }`);
}

// 1 passo grande por slide (não uma lista) — pensado pro carrossel "Como
// comprar"/"Como funciona uma encomenda": cada etapa vira um cartão
// cheio, mais fácil de "parar e ler" ao deslizar do que uma lista densa.
function slidePassoGrande(v, numero, total, icone, titulo, corpo, logoUri) {
  return baseHtml(v, `
    ${marcaDaguaHtml(logoUri)}
    <main class="passo">
      <p class="passo__contador">Passo ${numero} de ${total}</p>
      <div class="passo__icone">${svgIcone(icone, 60)}</div>
      <h1>${escaparHtml(titulo)}</h1>
      <p class="passo__corpo">${escaparHtml(corpo)}</p>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    .passo { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 96px; }
    .passo__contador { font-size: 25px; letter-spacing: 0.1em; text-transform: uppercase; color: ${v.secundaria}; margin-bottom: 30px; }
    .passo__icone {
      width: 136px; height: 136px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: ${v.fundoAlt}; color: ${v.destaque}; margin-bottom: 42px;
      box-shadow: inset 0 0 0 2px ${v.destaque};
    }
    .passo h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 54px; margin-bottom: 28px; }
    .passo__corpo { font-size: 32px; line-height: 1.45; max-width: 800px; }`);
}

// Parágrafo único, em destaque — pra citar um trecho real de
// politicas.html quase literal, sem precisar espremer num slide de
// lista. titulo é o "gancho" curto, corpo é o fato em si.
function slideParagrafo(v, titulo, corpo, logoUri) {
  return baseHtml(v, `
    <div class="flor"></div>
    ${marcaDaguaHtml(logoUri)}
    <main class="paragrafo">
      <h1>${escaparHtml(titulo)}</h1>
      <p>${escaparHtml(corpo)}</p>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    /* um parágrafo curto, sozinho e centralizado num canvas de 1350px,
       sobrava vazio em cima E embaixo (testado antes assim) — flex-end
       ancora o texto no terço de baixo (mesma ideia do layout 2 da
       capa), e a flor decorativa preenche o canto de cima, antes vazio */
    .flor {
      position: absolute; top: -90px; right: -140px; width: 480px; height: 480px;
      background-repeat: no-repeat; background-size: contain; transform: rotate(-8deg);
      background-image: ${v.flor}; opacity: 0.7;
    }
    .paragrafo {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      justify-content: flex-end; padding: 0 100px 220px;
    }
    .paragrafo h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-style: italic;
      font-size: 50px; color: ${v.destaque}; margin-bottom: 38px;
    }
    .paragrafo p { font-family: 'Fraunces', serif; font-size: 38px; line-height: 1.55; }`);
}

// Lista de frases curtas com marcador (bolinha terracota) — sem ícone
// por item: pros 3 cuidados de lavagem e os 4 passos de uma encomenda,
// nenhum ícone do kit (truck/gem/credit-card/package/shield-check)
// descreve bem cada linha, e forçar um ícone errado seria pior que não
// ter nenhum.
function slideListaSimples(v, titulo, itens, logoUri) {
  return baseHtml(v, `
    <div class="vaso"></div>
    ${marcaDaguaHtml(logoUri)}
    <main class="simples">
      <h1>${escaparHtml(titulo)}</h1>
      <ul>${itens.map((item) => `<li>${escaparHtml(item)}</li>`).join('')}</ul>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    /* mesmo ajuste de slideParagrafo: poucas linhas centralizadas num
       canvas de 1350px sobravam vazias em cima E embaixo — ancorado no
       terço de baixo + o vaso decorativo preenche o canto de cima */
    .vaso {
      position: absolute; top: -60px; right: -100px; width: 380px; height: 380px;
      background-repeat: no-repeat; background-size: contain; transform: rotate(8deg) scaleX(-1);
      background-image: ${v.vaso}; opacity: 0.7;
    }
    .simples {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      justify-content: flex-end; padding: 0 96px 220px;
    }
    .simples h1 { font-family: 'Fraunces', serif; font-weight: 600; font-style: italic; font-size: 56px; margin-bottom: 52px; }
    .simples ul { list-style: none; display: flex; flex-direction: column; gap: 32px; }
    .simples li { font-size: 34px; line-height: 1.4; padding-left: 48px; position: relative; }
    .simples li::before {
      content: ''; position: absolute; left: 0; top: 14px;
      width: 20px; height: 20px; border-radius: 50%; background: ${v.destaque};
    }`);
}

// Capa pra "Encomende a sua" (A3.4): a peça VENDIDA de exemplo (Pote
// Bruma Dourada, id 33) com o MESMO tratamento visual que ela já recebe
// no site — foto desbotada (.produto-card--vendida img: grayscale(0.7)
// + opacity(0.75), ver css/style.css) e um selo "Vendido" nas mesmas
// cores do .selo-peca--vendido de lá (fundo --cor-texto, texto --cor-
// fundo) — pra quem já viu o site reconhecer o mesmo "idioma" visual.
function slideCapaVendida(v, foto, logoUri) {
  return baseHtml(v, `
    <img class="foto foto--vendida" src="${foto}" alt="">
    <div class="selo-vendido">Vendido</div>
    <div class="faixa">
      ${marcaDaguaHtml(logoUri, 'marca-dagua--capa')}
      <h1 id="titulo">Esta peça já encontrou um lar</h1>
      <p class="sub-vendida">Mas você pode encomendar uma parecida ${svgCoracao(26, v.destaque)}</p>
    </div>`, `
    .foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; }
    .foto--vendida { filter: grayscale(0.7); opacity: 0.75; }
    .selo-vendido {
      position: absolute; top: 56px; left: 56px; z-index: 2;
      background: ${v.texto}; color: ${v.fundo};
      font-family: 'Jost', sans-serif; font-weight: 600; font-size: 30px; letter-spacing: 0.02em;
      padding: 20px 34px; border-radius: 999px; box-shadow: 0 6px 18px rgba(62, 46, 34, 0.22);
    }
    .faixa {
      position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 72px 52px; text-align: center;
      background-color: rgba(251, 246, 239, 0.96);
      background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px;
      border-top: 2px solid ${v.destaque};
    }
    .marca-dagua--capa { top: -166px; bottom: auto; right: 40px; }
    h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 54px; line-height: 1.12;
      max-height: calc(54px * 1.12 * 2 + 4px); margin-bottom: 20px;
    }
    .sub-vendida { font-size: 29px; color: ${v.destaque}; display: flex; align-items: center; justify-content: center; gap: 10px; }`);
}

// Chamada final: monograma, "Peça única" (coração em SVG, não emoji),
// um botão gummy "Link na bio" (mesmo desenho dos botões do site) e,
// no rodapé, a MESMA faixa de confiança da capa (pedido 2.3/2.5).
function slideChamada(v, logoUri) {
  return baseHtml(v, `
    <div class="flor"></div><div class="vaso"></div>
    ${marcaDaguaHtml(logoUri)}
    <main>
      <div class="selo-marca">AS</div>
      <h1>Peça única ${svgCoracao(84, '#FFF')}</h1>
      <p class="sub">Feita à mão, uma de cada vez</p>
      <div class="botao">Link na bio</div>
      <p class="arroba">@anasor.ceramica</p>
      <div class="divisor"></div>
      ${faixaConfiancaHtml()}
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    .flor, .vaso { position: absolute; background-repeat: no-repeat; background-size: contain; }
    .flor { width: 560px; height: 560px; top: -60px; right: -150px; transform: rotate(-14deg); background-image: ${v.flor}; opacity: 0.9; }
    .vaso { width: 360px; height: 360px; bottom: -30px; left: -70px; background-image: ${v.vaso}; opacity: 0.9; }
    main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 60px; }
    .selo-marca {
      width: 168px; height: 168px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: ${v.destaque}; color: ${v.fundo};
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: 84px;
      box-shadow: 0 0 0 10px ${v.fundo}, 0 0 0 12px ${v.destaque};
      margin-bottom: 56px;
    }
    h1 {
      font-family: 'Fraunces', serif; font-weight: 600; font-size: 104px; line-height: 1; letter-spacing: -0.015em;
      display: flex; align-items: center; gap: 24px;
    }
    .sub { margin-top: 20px; font-size: 36px; color: ${v.destaque}; }
    .botao {
      margin-top: 56px; padding: 28px 88px; border-radius: 999px;
      background: ${v.destaque}; color: #FFF; font-size: 44px; font-weight: 500;
      background-image: linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%);
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.28), 0 12px 0 ${v.destaqueEscuro};
    }
    .arroba { margin-top: 36px; font-size: 32px; color: ${v.secundaria}; }
    .divisor { width: 120px; height: 1px; background: rgba(62, 46, 34, 0.18); margin: 40px 0 36px; }`);
}

// ---- Renderização ----

async function renderizar(pagina, html, arquivo, largura = LARGURA, altura = ALTURA) {
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(async () => {
    await document.fonts.ready;
    // Nome longo: diminui a fonte até caber em 2 linhas, em vez de cortar.
    // A proporção linha/fonte é LIDA do CSS (não fixa em 1.08): a capa
    // normal usa line-height:1.08, a capa de Story usa 1.1 — travar um
    // valor só aqui desalinharia o maxHeight num dos dois formatos.
    const t = document.getElementById('titulo');
    if (t) {
      // v3: nº de linhas-alvo vem de data-max-linhas (layout 2/editorial,
      // bloco estreito, precisa de até 3; os outros continuam em 2, o
      // padrão quando o atributo não está presente) — antes da v3 o "2"
      // era fixo aqui, certo só pro layout único que existia.
      const maxLinhas = Number(t.dataset.maxLinhas) || 2;
      let tamanho = parseFloat(getComputedStyle(t).fontSize);
      const alturaLinhaPx = parseFloat(getComputedStyle(t).lineHeight);
      const proporcaoLinha = alturaLinhaPx / tamanho;
      while (t.scrollHeight > t.clientHeight + 2 && tamanho > 32) {
        tamanho -= 2;
        t.style.fontSize = `${tamanho}px`;
        t.style.maxHeight = `${tamanho * proporcaoLinha * maxLinhas + 4}px`;
      }
    }
  });
  await pagina.screenshot({ path: arquivo, clip: { x: 0, y: 0, width: largura, height: altura } });
}

// ---- v3: mock da grade do perfil (A2) ----
// Recorte 3:4 (largura:altura) que o Instagram usa nas CÉLULAS da grade
// do perfil: como a capa fonte é 4:5 (1080x1350, MAIS alta que 3:4 pra
// mesma largura), o recorte tira um pouco das LATERAIS (não de cima/
// baixo) pra estreitar de 4:5 pra 3:4 — por isso a célula aqui usa
// object-fit:cover numa caixa 3:4: o navegador faz exatamente esse
// corte sozinho (mantém a altura cheia, corta só a sobra horizontal).
async function gerarGradePerfil(pagina, capas) {
  const COL = 3;
  const CEL_LARGURA = 360;
  const CEL_ALTURA = Math.round(CEL_LARGURA * 4 / 3);
  const linhas = Math.ceil(capas.length / COL);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: ${CEL_LARGURA * COL}px; overflow: hidden; }
    body { display: grid; grid-template-columns: repeat(${COL}, 1fr); gap: 2px; background: #000; }
    .celula { width: ${CEL_LARGURA}px; height: ${CEL_ALTURA}px; overflow: hidden; }
    .celula img { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style></head><body>
    ${capas.map((c) => `<div class="celula"><img src="${c}" alt=""></div>`).join('')}
  </body></html>`;
  await renderizar(pagina, html, path.join(SAIDA, '_grade-perfil.png'), CEL_LARGURA * COL, CEL_ALTURA * linhas);
}

function montarMarkdown(n, produto, legenda, slides) {
  const nn = String(n).padStart(2, '0');
  const precoSite = formatarPreco(produto.preco);
  const avisoPreco = legenda && legenda.preco !== precoSite
    ? `\n> ⚠️ A legenda diz R$ ${legenda.preco}, mas o site está com R$ ${precoSite}. Ajuste antes de postar.\n`
    : '';
  const texto = legenda
    ? legenda.texto
    : '(Sem legenda em legendas.md para esta peça: escreva uma no mesmo tom antes de postar.)';
  return `# Post ${nn}: ${produto.nome}

Peça nº ${produto.id} de js/produtos.js · ${produto.subcategoria} · R$ ${precoSite} no site hoje
${legenda ? `Legenda nº ${legenda.numero} de legendas.md` : ''}
${avisoPreco}
**Antes de postar:** confira no site se a peça ainda está disponível.

## Ordem dos slides

${slides.map((s, i) => `${i + 1}. \`${s.arquivo}\`: ${s.descricao}\n   Texto alternativo (alt text): ${s.alt}`).join('\n')}

## Legenda

${texto}

## Hashtags

${legenda ? legenda.hashtags : ''}
`;
}

// Mesmo formato de montarMarkdown(), mas pra um carrossel de CONTEÚDO
// (sem produto/legenda de legendas.md por trás) — a legenda/hashtags já
// vêm prontas de quem chama, escritas no mesmo tom das de legendas.md.
function montarMarkdownConteudo(nn, titulo, legendaTexto, hashtags, slides) {
  return `# Post ${nn}: ${titulo} (conteúdo, não é peça)

Carrossel de conteúdo — não precisa checar disponibilidade/preço no site
antes de postar (nenhuma peça específica é vendida aqui).

## Ordem dos slides

${slides.map((s, i) => `${i + 1}. \`${s.arquivo}\`: ${s.descricao}\n   Texto alternativo (alt text): ${s.alt}`).join('\n')}

## Legenda

${legendaTexto}

## Hashtags

${hashtags}
`;
}

// ---- v3/A3: os 4 carrosséis de CONTEÚDO (não são de uma peça) ----
// Gerados DEPOIS dos 9 posts de peça, numeração contínua (post-10 a
// post-13) — mesma pasta de saída, mesmo padrão de nome de arquivo.
async function gerarCarrosseisConteudo(pagina, v, produtos, logoUri) {
  let proximoN = 10;

  // Helper local: mesma lógica de "salvar" do loop de peças (função
  // nomeada aqui — não dá pra reaproveitar a de dentro de main(), que
  // fecha sobre `nn`/`slides` daquele escopo).
  async function gerarCarrossel(titulo, montarSlides, legendaTexto, hashtags) {
    const n = proximoN++;
    const nn = String(n).padStart(2, '0');
    const slides = [];
    const salvar = async (html, sufixo, descricao, alt) => {
      const arquivo = `post-${nn}-${slides.length + 1}-${sufixo}.png`;
      await renderizar(pagina, html, path.join(SAIDA, arquivo));
      slides.push({ arquivo, descricao, alt });
    };
    await montarSlides(salvar);
    fs.writeFileSync(
      path.join(SAIDA, `post-${nn}.md`),
      montarMarkdownConteudo(nn, titulo, legendaTexto, hashtags, slides)
    );
    console.log(`post-${nn}: ${titulo} (conteúdo, ${slides.length} slides)`);
  }

  // --- A3.1: Como comprar — fatos de politicas.html #como-comprar e
  // #prazo-envio (frete grátis embutido no preço, Pix/crédito/débito via
  // Mercado Pago, envio em até 7 dias úteis). Crochê NÃO é citado aqui
  // de propósito (politicas.html fala em "Cerâmica e Crochê", mas
  // croche.html está "em breve" — citar uma categoria que ainda não
  // vende seria prometer algo que não existe hoje, ver DECISOES.md).
  await gerarCarrossel(
    'Como comprar',
    async (salvar) => {
      await salvar(slideCapaInformativa(v, 'credit-card', 'Guia rápido', 'Como comprar',
        '3 passos simples, do site até a sua casa', logoUri),
        'capa', 'capa do carrossel "Como comprar"', 'Como comprar na Anasor Sobreira');
      await salvar(slidePassoGrande(v, 1, 3, 'gem', 'Escolha sua peça',
        'Cada peça é única, modelada e pintada à mão — sem repetição.', logoUri),
        'passo', 'Passo 1: escolha sua peça', 'Passo 1: escolha sua peça, cada uma é única');
      await salvar(slidePassoGrande(v, 2, 3, 'credit-card', 'Pague com Pix, crédito ou débito',
        'Tudo processado com segurança pelo Mercado Pago.', logoUri),
        'passo', 'Passo 2: pagamento via Mercado Pago', 'Passo 2: pague com Pix, crédito ou débito via Mercado Pago');
      await salvar(slidePassoGrande(v, 3, 3, 'package', 'Receba com frete grátis',
        'Produzimos e embalamos com cuidado — envio em até 7 dias úteis.', logoUri),
        'passo', 'Passo 3: frete grátis e envio', 'Passo 3: receba com frete grátis, envio em até 7 dias úteis');
      await salvar(slideChamada(v, logoUri),
        'chamada', '"Peça única / Link na bio" + faixa de confiança', 'Peça única, feita à mão — @anasor.ceramica, link na bio');
    },
    `Como comprar uma peça da Anasor Sobreira 🛍️

Escolha a peça de cerâmica que mais combina com você — cada uma existe numa única unidade, feita e pintada à mão.

Pague com Pix, crédito ou débito, com segurança, pelo Mercado Pago. Frete grátis pra todo o Brasil, já embutido no preço.

A gente produz e embala com cuidado antes de enviar: até 7 dias úteis, pelos Correios. Link na bio 🤎`,
    '#comocomprar #ceramicaartesanal #compresegura #mercadopago #fretegratis #feitoamao'
  );

  // --- A3.2: Cuidados com a peça — fatos de politicas.html #cuidados e
  // da FAQ (mesmo texto já usado na legenda nº4 de legendas.md: água
  // morna + sabão neutro, evitar louça, evitar mudança brusca de
  // temperatura; variações não são defeito).
  await gerarCarrossel(
    'Cuidados com a peça',
    async (salvar) => {
      await salvar(slideCapaInformativa(v, 'droplet', 'Guia rápido', 'Cuidados com a peça',
        'Como lavar e por que pequenas variações são normais', logoUri),
        'capa', 'capa do carrossel "Cuidados com a peça"', 'Cuidados com sua peça de cerâmica Anasor Sobreira');
      await salvar(slideListaSimples(v, 'Como lavar', [
        'Água morna e sabão neutro',
        'Evite a lava-louças',
        'Evite mudanças bruscas de temperatura',
      ], logoUri),
        'lista', 'Como lavar: água morna, sabão neutro, sem lava-louças, sem mudança brusca de temperatura',
        'Como lavar: água morna e sabão neutro, evite lava-louças e mudanças bruscas de temperatura');
      await salvar(slideParagrafo(v, 'As variações são a assinatura',
        'Cada peça de cerâmica é única e pode apresentar pequenas variações de cor, textura e formato em relação às fotos — isso é parte da autenticidade do trabalho manual.', logoUri),
        'paragrafo', 'Pequenas variações de cor/textura/formato são normais e fazem parte da autenticidade',
        'Pequenas variações de cor, textura e formato em relação às fotos são normais e fazem parte da autenticidade do trabalho manual');
      await salvar(slideParagrafo(v, 'Não é defeito, é processo',
        'Cada peça é modelada e pintada à mão, então pequenas variações entre uma peça e outra fazem parte do processo artesanal.', logoUri),
        'paragrafo', 'Variações entre peças fazem parte do processo artesanal, não são defeito',
        'Pequenas variações entre uma peça e outra fazem parte do processo artesanal, não são defeito');
      await salvar(slideChamada(v, logoUri),
        'chamada', '"Peça única / Link na bio" + faixa de confiança', 'Peça única, feita à mão — @anasor.ceramica, link na bio');
    },
    `Cuidados com a sua peça de cerâmica 🧼

Sua peça foi feita à mão, e alguns cuidados simples fazem ela durar muitos anos:

• Lave à mão, com água morna e sabão neutro
• Evite a lava-louças
• Evite mudanças bruscas de temperatura

Pequenas variações de cor e textura não são defeito: são a marca do trabalho manual.

Salve este post para não esquecer. Mais dicas no link na bio 🤎`,
    '#cuidadoscomaceramica #ceramicaartesanal #dicasdecasa #feitoamao #slowliving'
  );

  // --- A3.3: Peça única: o que significa — estoque 1 (CLAUDE.md, regra
  // de negócio), "vira portfólio, não volta pra vitrine" (mesma regra),
  // e os trechos de politicas.html #cuidados/#trocas-devolucoes sobre
  // variação natural e ausência de troca por peça "idêntica".
  await gerarCarrossel(
    'Peça única: o que significa',
    async (salvar) => {
      await salvar(slideCapaInformativa(v, 'gem', 'Por dentro do ateliê', 'O que significa “peça única”',
        'Por que cada peça existe numa única unidade', logoUri),
        'capa', 'capa do carrossel "Peça única: o que significa"', 'O que significa "peça única" na Anasor Sobreira');
      await salvar(slideParagrafo(v, 'Estoque sempre 1',
        'Cada peça de cerâmica no site existe numa única unidade. Quando ela vende, não tem reposição — ela vira portfólio e não volta pra vitrine.', logoUri),
        'paragrafo', 'Cada peça existe em estoque único (1 unidade), sem reposição',
        'Cada peça de cerâmica existe em uma única unidade — sem reposição quando vende');
      await salvar(slideParagrafo(v, 'As variações são a assinatura',
        'Cada peça de cerâmica é única e pode apresentar pequenas variações de cor, textura e formato em relação às fotos — isso é parte da autenticidade do trabalho manual.', logoUri),
        'paragrafo', 'Pequenas variações fazem parte da autenticidade do trabalho manual',
        'Pequenas variações de cor, textura e formato fazem parte da autenticidade do trabalho manual');
      await salvar(slideParagrafo(v, 'Por isso não existe uma troca “idêntica”',
        'Como cada peça é única e feita à mão, não trabalhamos com troca por uma peça idêntica — não existe estoque de reposição igual.', logoUri),
        'paragrafo', 'Não há troca por peça idêntica: não existe estoque de reposição igual',
        'Não trabalhamos com troca por peça idêntica, porque não existe estoque de reposição igual');
      await salvar(slideChamada(v, logoUri),
        'chamada', '"Peça única / Link na bio" + faixa de confiança', 'Peça única, feita à mão — @anasor.ceramica, link na bio');
    },
    `O que significa "peça única" aqui no ateliê 🏺

Cada peça de cerâmica do site existe numa única unidade. Quando vende, não tem reposição — ela vira portfólio, não volta pra vitrine.

É por isso que pequenas variações de cor, textura e formato em relação às fotos são normais: fazem parte da autenticidade do trabalho manual, não são defeito.

E é por isso também que não existe troca por uma peça "idêntica" — mas se você se apaixonou por uma que já foi vendida, dá pra encomendar uma parecida. Link na bio 🤎`,
    '#pecaunica #ceramicaartesanal #feitoamao #arteautoral #compredopequeno'
  );

  // --- A3.4: Encomende a sua — Pote Decorativo Bruma Dourada (id 33,
  // disponivel:false) como EXEMPLO real de peça vendida. Mesmo tom da
  // legenda nº6 de legendas.md ("Encomenda: viu e já tinha sido
  // vendida?") e os 4 passos da legenda nº19 ("Encomenda: como
  // funciona") — SEM prazo nem preço fixo (pedido explícito: "a gente
  // combina" é o máximo que se promete, igual linkEncomendaWhatsApp()
  // em js/main.js).
  const exemplo = produtos.find((p) => p.id === 33);
  if (!exemplo) {
    console.warn('A3.4 "Encomende a sua": produto id 33 (Pote Bruma Dourada) não encontrado em produtos.js — carrossel pulado.');
  } else {
    const fotoExemplo = path.join(RAIZ, exemplo.imagem);
    if (!fs.existsSync(fotoExemplo)) {
      console.warn(`A3.4 "Encomende a sua": foto de "${exemplo.nome}" não encontrada em ${fotoExemplo} — carrossel pulado.`);
    } else {
      await gerarCarrossel(
        'Encomende a sua',
        async (salvar) => {
          await salvar(slideCapaVendida(v, dataUri(fotoExemplo), logoUri),
            'capa', `capa com "${exemplo.nome}" (vendida, foto desbotada) e selo "Vendido"`,
            `${exemplo.nome}, peça vendida — exemplo de peça que já encontrou um lar`);
          await salvar(slideParagrafo(v, 'Aconteceu de novo',
            'Acontece bastante: alguém se apaixona por uma peça que já encontrou outra casa. Como cada peça é única, ela não volta pra vitrine. Mas dá pra encomendar uma parecida — não vai ser idêntica, vai ser outra peça única, feita pra você.', logoUri),
            'paragrafo', 'Explicação: peça vendida não volta, mas dá pra encomendar uma parecida',
            'Peça vendida não volta à vitrine, mas é possível encomendar uma parecida, única, feita para você');
          await salvar(slideListaSimples(v, 'Como funciona', [
            'Você me chama no WhatsApp pelo link na bio',
            'Conta a ideia ou mostra a peça que você amou',
            'A gente combina os detalhes, o prazo e o valor',
            'Eu faço a sua peça à mão, do começo ao fim',
          ], logoUri),
            'lista', 'Como funciona uma encomenda: WhatsApp, ideia, combinar detalhes, fazer à mão',
            'Como funciona uma encomenda: chame no WhatsApp, conte a ideia, combine prazo e valor, a peça é feita à mão');
          await salvar(slideChamada(v, logoUri),
            'chamada', '"Peça única / Link na bio" + faixa de confiança', 'Peça única, feita à mão — @anasor.ceramica, link na bio');
        },
        `Essa já encontrou um lar 🤎

[Exemplo: ${exemplo.nome}, já vendida]

Acontece bastante: alguém se apaixona por uma peça que já encontrou outra casa. Como cada peça é única, ela não volta para a vitrine.

Mas dá para encomendar uma parecida. Não vai ser idêntica (nada aqui é), vai ser outra peça única, feita para você.

Detalhes, prazo e valor a gente combina pelo WhatsApp. Link na bio 🤎`,
        '#encomenda #ceramicapersonalizada #pecaunica #feitoamao #ceramicaartesanal #presenteexclusivo'
      );
    }
  }
}

async function main() {
  const produtos = carregarProdutos();
  const legendas = carregarLegendas();
  const v = lerVariaveisCss();
  const logoJpgUri = dataUri(path.join(RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));

  // Começa de pasta limpa: arte de uma rodada anterior (peça já vendida,
  // slide a mais) não pode ficar misturada com a nova e ir parar no feed.
  // A versão v1 já foi movida manualmente para _v1\ antes desta rodada
  // (ver README.md) — aqui só limpamos o que ESTE script gera, nunca a
  // pasta _v1\ nem nada fora do padrão post-NN*/stories\post-NN*.
  for (const arquivo of fs.existsSync(SAIDA) ? fs.readdirSync(SAIDA) : []) {
    if (/^post-\d\d/.test(arquivo)) fs.rmSync(path.join(SAIDA, arquivo));
  }
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.mkdirSync(SAIDA_STORIES, { recursive: true });
  for (const arquivo of fs.existsSync(SAIDA_STORIES) ? fs.readdirSync(SAIDA_STORIES) : []) {
    if (/^post-\d\d/.test(arquivo)) fs.rmSync(path.join(SAIDA_STORIES, arquivo));
  }

  const navegador = await chromium.launch();
  const capasGeradas = []; // v3: caminhos das 9 capas, pra montar a grade do perfil no fim
  try {
    const pagina = await navegador.newPage();
    const logoUri = await removerFundoLogo(pagina, logoJpgUri);

    for (const [indice, { id }] of PECAS.entries()) {
      const n = indice + 1;
      const nn = String(n).padStart(2, '0');
      const produto = produtos.find((p) => p.id === id);
      // Regra da loja: peça vendida ou oculta não vira post de venda
      if (!produto || produto.disponivel === false || produto.oculto) {
        console.warn(`post-${nn}: peça ${id} indisponível ou oculta, pulei. Troque-a na lista PECAS.`);
        continue;
      }
      const fotos = [produto.imagem, ...(produto.imagensExtras || [])]
        .map((f) => path.join(RAIZ, f))
        .filter((f) => fs.existsSync(f));
      // Sem a foto principal no disco não há capa: avisa e segue com as outras
      if (!fotos.length) {
        console.warn(`post-${nn}: nenhuma foto de "${produto.nome}" encontrada em img/, pulei.`);
        continue;
      }
      const nome = nomeCurto(produto.nome);
      const recorte = RECORTE_CAPA[id] || '50% 50%';
      const layout = LAYOUT_CAPA_POR_POSICAO[indice] || 1;
      const slides = [];
      const salvar = async (html, sufixo, descricao, alt) => {
        const arquivo = `post-${nn}-${slides.length + 1}-${sufixo}.png`;
        await renderizar(pagina, html, path.join(SAIDA, arquivo));
        slides.push({ arquivo, descricao, alt });
      };

      await salvar(
        slideCapaPorLayout(layout, v, dataUri(fotos[0]), nome, recorte, produto, logoUri),
        'capa', `capa (layout ${layout}) com a foto principal, selo e nome da peça`,
        `${produto.nome}, peça de cerâmica artesanal da Anasor Sobreira`
      );
      const fotosExtras = fotos.slice(1, 1 + MAX_FOTOS_EXTRAS);
      for (const [i, foto] of fotosExtras.entries()) {
        const legendaFoto = i === 0 ? 'Detalhe' : null;
        await salvar(
          slideFoto(v, dataUri(foto), logoUri, legendaFoto),
          'foto', `foto extra (${path.basename(foto)})`,
          `Detalhe de ${nome}, peça de cerâmica artesanal`
        );
      }
      await salvar(
        slideConfianca(v, logoUri),
        'porque', '"Por que comprar com a Anasor Sobreira" — frete, pagamento, envio, trocas',
        'Por que comprar com a Anasor Sobreira: frete grátis para todo o Brasil, Pix/crédito/débito via Mercado Pago, envio em até 7 dias úteis, 7 dias para se arrepender da compra'
      );
      await salvar(
        slideChamada(v, logoUri),
        'chamada', '"Peça única / Link na bio" + faixa de confiança',
        'Peça única, feita à mão, uma de cada vez — @anasor.ceramica, link na bio'
      );

      // Story da capa (1080x1920): mesma peça, formato vertical cheio
      await renderizar(
        pagina,
        slideCapaStory(v, dataUri(fotos[0]), nome, recorte, logoUri),
        path.join(SAIDA_STORIES, `post-${nn}-story-capa.png`),
        LARGURA, ALTURA_STORY
      );

      // Nome exato (completo ou a parte antes do travessão): prefixo solto
      // poderia casar a legenda de outra peça de nome parecido.
      const legenda = legendas.find((l) => l.nome === produto.nome || l.nome === nomeCurto(produto.nome));
      fs.writeFileSync(path.join(SAIDA, `post-${nn}.md`), montarMarkdown(n, produto, legenda, slides));
      capasGeradas.push(path.join(SAIDA, slides[0].arquivo)); // slides[0] é sempre a capa
      console.log(`post-${nn}: ${produto.nome} (${slides.length} slides + story${legenda ? `, legenda nº ${legenda.numero}` : ', SEM legenda'}, layout ${layout})`);
    }

    // A2: mock da grade do perfil com as capas de verdade, pra avaliar
    // harmonia visual (cores/layouts alternando) antes de postar.
    await gerarGradePerfil(pagina, capasGeradas.map((arq) => dataUri(arq)));
    console.log(`grade do perfil: ${path.join(SAIDA, '_grade-perfil.png')}`);

    // A3: os 4 carrosséis de conteúdo (não são de peça específica).
    await gerarCarrosseisConteudo(pagina, v, produtos, logoUri);
  } finally {
    // Fecha o Chromium mesmo se algum slide falhar no meio
    await navegador.close();
  }
  console.log(`\nPronto: ${SAIDA}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
