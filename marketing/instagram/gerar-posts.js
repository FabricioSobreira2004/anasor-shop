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
function faixaConfiancaHtml() {
  return `<ul class="confianca">
    <li>${svgIcone('truck', 30)}<span>Frete grátis para todo o Brasil</span></li>
    <li>${svgIcone('gem', 30)}<span>Peça única, feita à mão</span></li>
    <li>${svgIcone('shield-check', 30)}<span>Compra segura</span></li>
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

function marcaDaguaHtml(logoUri, classeExtra = '') {
  return `<img class="marca-dagua ${classeExtra}" src="${logoUri}" alt="">`;
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
    .confianca {
      list-style: none; display: flex; align-items: flex-start; justify-content: center;
      gap: 28px;
    }
    .confianca li {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      flex: 1 1 0; max-width: 300px; text-align: center;
    }
    .confianca span { font-size: 21px; line-height: 1.3; color: ${v.texto}; white-space: nowrap; }
    .confianca svg { color: ${v.destaque}; flex-shrink: 0; }
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
      let tamanho = parseFloat(getComputedStyle(t).fontSize);
      const alturaLinhaPx = parseFloat(getComputedStyle(t).lineHeight);
      const proporcaoLinha = alturaLinhaPx / tamanho;
      while (t.scrollHeight > t.clientHeight + 2 && tamanho > 38) {
        tamanho -= 2;
        t.style.fontSize = `${tamanho}px`;
        t.style.maxHeight = `${tamanho * proporcaoLinha * 2 + 4}px`;
      }
    }
  });
  await pagina.screenshot({ path: arquivo, clip: { x: 0, y: 0, width: largura, height: altura } });
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
      const slides = [];
      const salvar = async (html, sufixo, descricao, alt) => {
        const arquivo = `post-${nn}-${slides.length + 1}-${sufixo}.png`;
        await renderizar(pagina, html, path.join(SAIDA, arquivo));
        slides.push({ arquivo, descricao, alt });
      };

      await salvar(
        slideCapa(v, dataUri(fotos[0]), nome, recorte, produto, logoUri),
        'capa', 'capa com a foto principal, selo e nome da peça',
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
      console.log(`post-${nn}: ${produto.nome} (${slides.length} slides + story${legenda ? `, legenda nº ${legenda.numero}` : ', SEM legenda'})`);
    }
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
