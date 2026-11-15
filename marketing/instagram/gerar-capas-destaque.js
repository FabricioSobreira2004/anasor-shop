#!/usr/bin/env node
// ============================================================
// Capas dos destaques do Instagram — v3 (pedido explícito do Fabrício,
// modo autônomo, 2026-11-15; ver destaques.md e DECISOES.md Rodada 15).
//
// A v1 (emoji cru sobre círculo bege) e a v2 (ícone de linha fino, sem
// moldura, fundo liso) foram reprovadas: "sem borda, sem símbolo, simples
// demais". v3 dá a cada destaque uma moldura circular 3D (anel duplo
// terracota+ouro com bisel/brilho e sombra interna, como cerâmica
// esmaltada) — a MESMA receita de sombras em camadas do redesign v4 dos
// posts (gerar-posts.js: .rosto-anasor/.confianca__medalhao) — pra também
// combinar com o padrão novo dos posts, não só parecer "bonito à parte".
//
//   cd marketing/instagram
//   node gerar-capas-destaque.js
//
// Saída: marketing/instagram/destaques/ (DENTRO do repositório, por
// pedido explícito desta rodada — ao contrário de instagram-posts/, que
// vai para site-mae/). Como são PNGs gerados, 100% reproduzíveis a partir
// deste script, ficam fora do git (.gitignore), igual a instagram-posts/.
// Cada destaque sai em 1080x1920 (Story — é o formato que o Instagram
// recebe ao criar um destaque) e 1080x1080 (quadrado, mais fácil de
// comparar lado a lado); + um mock da fileira do perfil em 390px (largura
// real de tela de celular) para validar legibilidade no tamanho de
// exibição real (~60-80px de diâmetro).
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..', '..');
const SAIDA = path.resolve(__dirname, 'destaques');
const LARGURA = 1080;
const ALTURA_STORY = 1920;
const ALTURA_QUADRADA = 1080;

// Ouro da marca: MESMO hex do selo "Mais Vendido" / medalhões do redesign
// v4 dos posts (ver gerar-posts.js, constante DOURADO) — duplicado aqui
// (não importado) porque cada script de marketing/instagram é standalone
// (mesmo padrão já usado pelos outros arquivos desta pasta).
const DOURADO = '#D9B06A';

// ---- Cores/texturas da marca: lidas de css/style.css, fonte única do
// site (mesma técnica de gerar-posts.js/gerar-capas-destaque.js v2) ----
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
    grao: pegar('textura-grao'),
    // "AS" bem suave (3,5% de opacidade) para o fundo FORA do círculo —
    // é o padrão pedido ("fundo creme liso com o padrão AS bem suave").
    // O v4 dos posts usa a versão forte (10%) porque lá o padrão cobre
    // uma arte inteira; aqui ele só preenche a moldura do perfil, por
    // isso a versão fraca original do site, não a forte do redesign.
    monogramaFraco: pegar('marca-monograma-fraca'),
  };
}

// As fotos/a logo entram como data URI: o HTML é montado em memória e o
// Chromium bloqueia file:// a partir de uma página sem origem (mesmo
// motivo documentado em gerar-posts.js).
function dataUri(arquivo) {
  const ext = path.extname(arquivo).slice(1).toLowerCase().replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(arquivo).toString('base64')}`;
}

// ---- Rosto da Anasor (Ateliê) — MESMO recorte/função de gerar-posts.js
// (rostoAnasorHtml/ROSTO_ANASOR_RECORTE), duplicado aqui pelo mesmo motivo
// (scripts standalone). Se a foto-fonte for trocada, remedir nos DOIS
// lugares — ver comentário original em gerar-posts.js.
const ROSTO_ANASOR_RECORTE = { x: 280, y: 290, lado: 560 };
function rostoAnasorHtml(fotoUri, diametro) {
  const escala = diametro / ROSTO_ANASOR_RECORTE.lado;
  const larguraOriginal = 1195 * escala;
  const alturaOriginal = 896 * escala;
  const esquerda = -ROSTO_ANASOR_RECORTE.x * escala;
  const topo = -ROSTO_ANASOR_RECORTE.y * escala;
  return `<div class="rosto" style="width:${diametro}px;height:${diametro}px;">
    <img src="${fotoUri}" alt="Anasor Sobreira" style="width:${larguraOriginal}px;height:${alturaOriginal}px;left:${esquerda}px;top:${topo}px;">
  </div>`;
}

// ---- Ícones (traço único, mesma espessura/estilo Lucide do resto do
// site — ver politicas.html e gerar-posts.js) ----
// "truck" é o MESMO path de gerar-posts.js (Lucide "truck"), duplicado
// pelo mesmo motivo de sempre (scripts standalone). Os outros 4 são
// desenho próprio (vaso, roda de oleiro, pincel, gotas) no mesmo espírito
// — viewBox 100x100, traço único grosso — porque não têm um equivalente
// direto e fiel no set Lucide já usado no site.
const TRACO = 'fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"';
const ICONES_100 = {
  // Vaso de cerâmica (silhueta "artesanal", sem o brilho/sparkle da v2 —
  // aqui some de propósito: sparkle é a linguagem visual do selo
  // "Novidade" em outro lugar do sistema, repeti-la aqui confundiria).
  // v3.1: a linha de brilho da barriga (opacity 0.55) some no mockup de
  // 390px e não ajuda em nada a identificar "vaso" — tirada; sobra só a
  // silhueta + a linha da boca, que É o que faz ler como vaso/pote.
  vaso: `
    <path ${TRACO} d="M38 28 Q38 20 50 20 Q62 20 62 28 L65 54 Q68 70 68 80 Q68 93 50 93 Q32 93 32 80 Q32 70 35 54 Z"/>
    <path ${TRACO} d="M39 28 L61 28"/>
  `,
  // v3.1: 3 tentativas anteriores falharam — qualquer coisa alta em cima
  // da elipse lia como chapéu, e o círculo+bolinha visto de cima lia
  // como olho/alvo (ver mockup das duas rodadas passadas). O problema
  // era a SILHUETA total subir acima da largura do disco; esta versão
  // mantém tudo raso, dentro do contorno largo e achatado do disco (o
  // "bolo" de argila é baixo, não uma torre) + riscos de giro simétricos
  // dos dois lados — menos ambíguo: só "disco achatado girando".
  'roda-de-oleiro': `
    <ellipse cx="50" cy="58" rx="36" ry="15" ${TRACO}/>
    <ellipse cx="50" cy="52" rx="15" ry="7" fill="currentColor" stroke="none"/>
    <path ${TRACO} d="M8 50 Q2 58 8 66" opacity="0.6"/>
    <path ${TRACO} d="M92 50 Q98 58 92 66" opacity="0.6"/>
  `,
  // v3.1: a v1 (cabo + 2 linhas finas formando a ponta + bolinha solta)
  // lia como "termômetro"/"fósforo aceso", não pincel — a ponta em
  // TRAÇO fino não tinha massa suficiente pra ler como cerdas. Esta
  // versão preenche a ponta (cunha SÓLIDA, não só contorno) — é o que dá
  // o "peso" de cerdas de pincel — + 1 gota de tinta, também sólida.
  pincel: `
    <path ${TRACO} d="M78 14 L48 44"/>
    <path fill="currentColor" stroke="none" d="M46 42 L28 60 L38 69 L54 51 Z"/>
    <circle cx="21" cy="70" r="5" fill="currentColor" stroke="none"/>
  `,
  // Gotas sobre mãos em concha — "cuidados com a peça" (mesmo desenho da
  // v2, já cobria bem o pedido "gota/coração").
  gotas: `
    <path ${TRACO} d="M22 66 Q22 84 42 84 Q53 84 57 75"/>
    <path ${TRACO} d="M78 66 Q78 84 58 84"/>
    <path ${TRACO} d="M50 24 Q63 42 63 53 Q63 64 50 64 Q37 64 37 53 Q37 42 50 24 Z"/>
  `,
};
function svgIcone100(nome, tamanho, cor) {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 100 100" style="color:${cor}">${ICONES_100[nome]}</svg>`;
}
// Caminhão: Lucide "truck", viewBox 24, igual ao usado no selo "Frete
// grátis" dos posts (gerar-posts.js, ICONES.truck) — mesmo ícone, mesma
// peça de informação ("frete grátis"), em escala maior.
const ICONE_CAMINHAO = '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>';
function svgCaminhao(tamanho, cor) {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONE_CAMINHAO}</svg>`;
}

// ---- Medidas da moldura (ver destaques.md para o detalhe de cada uma)
// Tudo dentro de CIRCULO_TOTAL (788px) fica dentro do círculo de ~800px
// pedido, com folga; fora dele é só fundo creme + "AS" bem suave.
// Vêm ANTES do raminho de propósito: raminhoHtml() precisa de NUCLEO/
// CIRCULO_TOTAL já calculados pra desenhar o arco certo.
const NUCLEO = 700;      // disco creme com a textura/ícone/texto
const ANEL_RESPIRO = 8;  // faixa creme entre o núcleo e o anel terracota
const ANEL_TERRACOTA = 28; // até aqui = anel terracota com 20px de espessura
const ANEL_OURO = 36;      // até aqui = fio dourado com 8px de espessura
const CIRCULO_TOTAL = NUCLEO + ANEL_OURO * 2; // 772px — diâmetro total visível da moldura
// v3.1: era 300 (43% do núcleo) — no mockup de 390px (ícone real de
// ~72px no perfil) ficava pequeno demais pra reconhecer a silhueta.
// 380 (54%) deixa o ícone dominar o círculo, sobrando só o essencial de
// moldura+texto — é a troca certa, já que o TEXTO não vai ler em ~70px
// de jeito nenhum (letra ficaria com ~2px de altura); o ícone sim.
const SLOT_ICONE = 380; // caixa do ícone/foto — IGUAL nos 7, é o que faz a fileira parecer conjunto

// ---- Raminho decorativo contornando parte do anel ----
// Desenho próprio e fino (NÃO a --marca-flor do site: aquele SVG já vem
// com cor/opacidade gravadas dentro do próprio data URI, não dá pra
// recolorir/reaproveitar num traço mais visível sobre o anel dourado).
// 1ª tentativa (curva livre à mão) lia como anzol/alfinete, não como
// flor — esta versão usa trigonometria pra desenhar um ARCO de verdade
// sobre o raio do anel (contorna o anel de fato, não flutua ao lado dele)
// com 3 folhas (elipses tangentes ao arco) e uma flor simples na ponta.
// Um só desenho, na MESMA posição/ângulo nos 7 destaques — é o que
// mantém a fileira parecendo um conjunto, em vez de 7 flores diferentes
// competindo com o ícone central.
const RAIO_RAMINHO = (NUCLEO / 2 + CIRCULO_TOTAL / 2) / 2; // meio da espessura do anel terracota+ouro
const ANGULO_INICIO = 10;  // graus (0° = direita, cresce no sentido horário)
const ANGULO_FIM = 80;     // ~canto inferior direito do anel
function pontoNoAnel(raio, grau) {
  const rad = (grau * Math.PI) / 180;
  return { x: CIRCULO_TOTAL / 2 + raio * Math.cos(rad), y: CIRCULO_TOTAL / 2 + raio * Math.sin(rad) };
}
function raminhoHtml() {
  const p1 = pontoNoAnel(RAIO_RAMINHO, ANGULO_INICIO);
  const p2 = pontoNoAnel(RAIO_RAMINHO, ANGULO_FIM);
  const folhas = [25, 45, 65].map((grau) => {
    const p = pontoNoAnel(RAIO_RAMINHO + 14, grau);
    return `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="15" ry="6" transform="rotate(${grau + 90} ${p.x.toFixed(1)} ${p.y.toFixed(1)})"/>`;
  }).join('');
  const flor = pontoNoAnel(RAIO_RAMINHO + 6, ANGULO_FIM);
  return `<svg class="raminho" viewBox="0 0 ${CIRCULO_TOTAL} ${CIRCULO_TOTAL}" width="${CIRCULO_TOTAL}" height="${CIRCULO_TOTAL}"
    fill="none" stroke="${DOURADO}" stroke-width="2.4" stroke-linecap="round">
    <path d="M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${RAIO_RAMINHO} ${RAIO_RAMINHO} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}"/>
    ${folhas}
    <circle cx="${flor.x.toFixed(1)}" cy="${flor.y.toFixed(1)}" r="9"/>
    <circle cx="${flor.x.toFixed(1)}" cy="${flor.y.toFixed(1)}" r="3" fill="${DOURADO}" stroke="none"/>
  </svg>`;
}

// ---- Os 7 destaques (ícone/foto + 1-2 palavras) ----
// "Comprar?" vira um "?" grande em Fraunces em vez de um ícone de linha:
// opção explicitamente aberta no pedido ("pode ser só um '?' grande se
// ler melhor") — testado em conjunto com uma sacola e um ícone de
// interrogação em círculo (Lucide "circle-help"), os dois liam como
// "sacola" ou "duas molduras concêntricas" de longe; o "?" sozinho, no
// mesmo peso visual dos outros ícones, foi o único que ficou inequívoco
// reduzido a ~70px (ver _mockup-perfil-390.png).
const DESTAQUES = [
  { nome: 'pecas', titulo: 'Peças', tipo: 'icone', icone: (cor) => svgIcone100('vaso', 290, cor) },
  { nome: 'comprar', titulo: 'Comprar?', tipo: 'glifo', glifo: '?' },
  { nome: 'frete', titulo: 'Frete grátis', tipo: 'icone', icone: (cor) => svgCaminhao(280, cor) },
  { nome: 'encomende', titulo: 'Encomende', tipo: 'icone', icone: (cor) => svgIcone100('pincel', 290, cor) },
  { nome: 'atelie', titulo: 'Ateliê', tipo: 'foto' },
  { nome: 'bastidores', titulo: 'Bastidores', tipo: 'icone', icone: (cor) => svgIcone100('roda-de-oleiro', 290, cor) },
  { nome: 'cuidados', titulo: 'Cuidados', tipo: 'icone', icone: (cor) => svgIcone100('gotas', 290, cor) },
];

function montarHtml(destaque, v, rostoUri, altura) {
  const centroY = altura / 2;
  const corIcone = v.destaque;
  const miolo = destaque.tipo === 'foto'
    ? `<div class="slot slot--foto">${rostoAnasorHtml(rostoUri, SLOT_ICONE)}</div>`
    : destaque.tipo === 'glifo'
      ? `<div class="slot slot--glifo" style="color:${corIcone}">${destaque.glifo}</div>`
      : `<div class="slot slot--icone" style="color:${corIcone}">${destaque.icone(corIcone)}</div>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Jost:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${LARGURA}px; height: ${altura}px; overflow: hidden; }
  body {
    position: relative; font-family: 'Jost', sans-serif;
    background-color: ${v.fundo};
    /* Fora da moldura: só o padrão "AS" bem suave sobre o creme liso —
       pedido explícito ("fundo creme liso com o padrão AS bem suave"). */
    background-image: ${v.monogramaFraco}, ${v.grao};
    background-size: 240px 240px, 140px 140px;
  }
  .moldura {
    position: absolute; left: 50%; top: ${centroY}px; transform: translate(-50%, -50%);
    width: ${NUCLEO}px; height: ${NUCLEO}px; border-radius: 50%;
    background-color: ${v.fundo};
    background-image: ${v.grao};
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px;
    /* Moldura circular 3D "cerâmica esmaltada", pedido explícito:
       — respiro creme (ANEL_RESPIRO) separa o conteúdo do anel, pra ele
         não "encostar" na borda colorida;
       — anel terracota (ANEL_TERRACOTA) + fio dourado (ANEL_OURO), os
         dois em box-shadow (não border): permite empilhar vários anéis
         concêntricos com um raio cada, mesma técnica de .rosto-anasor em
         gerar-posts.js;
       — os dois insets (brilho no topo, sombra na base) são o
         bisel/brilho + "sombra interna" pedidos: luz batendo de cima
         como um esmalte vitrificado, sombra acumulada embaixo;
       — a sombra de contato final (0 30px 60px) é o que separa a
         moldura do fundo creme, sem ela ela ficaria "colada" no fundo. */
    box-shadow:
      0 0 0 ${ANEL_RESPIRO}px ${v.fundo},
      0 0 0 ${ANEL_TERRACOTA}px ${v.destaque},
      0 0 0 ${ANEL_OURO}px ${DOURADO},
      inset 0 16px 32px rgba(255, 255, 255, 0.45),
      inset 0 -20px 40px rgba(62, 46, 34, 0.22),
      0 30px 60px rgba(62, 46, 34, 0.35);
  }
  .raminho {
    /* O SVG já nasce com o tamanho/centro de CIRCULO_TOTAL (788px) — o
       mesmo círculo do anel inteiro (ver pontoNoAnel/RAIO_RAMINHO) — por
       isso o deslocamento de -ANEL_OURO (44px) em cima/esquerda: alinha o
       CENTRO do SVG com o centro de .moldura (700px), sem o que o arco
       calculado em coordenadas absolutas (ex.: pontoNoAnel) sairia do
       lugar certo. Sempre o mesmo ângulo nos 7 destaques, por consistência. */
    position: absolute; top: -${ANEL_OURO}px; left: -${ANEL_OURO}px;
    width: ${CIRCULO_TOTAL}px; height: ${CIRCULO_TOTAL}px;
    filter: drop-shadow(0 2px 3px rgba(62, 46, 34, 0.25));
  }
  .slot {
    width: ${SLOT_ICONE}px; height: ${SLOT_ICONE}px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    /* "Puck" bem sutil sob o ícone/foto — mesma receita de relevo gummy
       dos medalhões do redesign v4 (brilho inset + sombra inset + degrau
       sólido), só que discreta: o anel já é o elemento "bold" da peça,
       isto aqui é só um toque de profundidade, não uma 2ª moldura. */
    box-shadow:
      inset 3px 3px 6px rgba(255, 255, 255, 0.5),
      inset -4px -5px 10px rgba(62, 46, 34, 0.12),
      0 6px 0 rgba(62, 46, 34, 0.08),
      0 14px 26px rgba(62, 46, 34, 0.16);
  }
  .slot--foto { overflow: hidden; box-shadow: 0 0 0 5px ${v.destaque}, 0 10px 22px rgba(62, 46, 34, 0.3); }
  .rosto { position: relative; border-radius: 50%; overflow: hidden; }
  .rosto img { position: absolute; display: block; }
  .slot--glifo {
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 290px; line-height: 1;
  }
  .slot--icone svg { display: block; }
  .titulo {
    font-family: 'Fraunces', serif; font-weight: 600; font-size: 78px; line-height: 1;
    color: ${v.texto}; text-align: center; white-space: nowrap;
  }
</style></head>
<body>
  <div class="moldura">
    ${raminhoHtml()}
    ${miolo}
    <div class="titulo">${destaque.titulo}</div>
  </div>
</body></html>`;
}

async function renderizar(pagina, html, arquivo, altura) {
  await pagina.setViewportSize({ width: LARGURA, height: altura });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: arquivo, clip: { x: 0, y: 0, width: LARGURA, height: altura } });
}

// ---- Mock da fileira de destaques do perfil, em largura real de
// celular (390px, pedido explícito) ----
// Reproduz como o Instagram mostra o perfil: círculos pequenos (~72px,
// dentro da faixa "~60-80px" pedida) em fileira horizontal com o nome do
// destaque embaixo, em cinza pequeno — é o teste de legibilidade real,
// não a arte em tela cheia. Mostra o começo da fileira cortado pela
// largura (como a rolagem real), não as 7 espremidas pra caber.
async function montarMockPerfil(pagina, destaquesComImagem) {
  const DIAMETRO = 72;
  const GAP = 24;
  const LARGURA_MOCK = 390;
  const ALTURA_MOCK = 150;
  const itens = destaquesComImagem.map(({ titulo, quadradoUri }) => `
    <div class="item">
      <div class="circulo"><img src="${quadradoUri}"></div>
      <span>${titulo}</span>
    </div>`).join('');
  const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${LARGURA_MOCK}px; height: ${ALTURA_MOCK}px; overflow: hidden; background: #FFFFFF; }
  .fileira { display: flex; gap: ${GAP}px; padding: 18px 16px 0; overflow: hidden; }
  .item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; width: ${DIAMETRO}px; }
  .circulo {
    width: ${DIAMETRO}px; height: ${DIAMETRO}px; border-radius: 50%; overflow: hidden;
    box-shadow: 0 0 0 1.5px #DBDBDB;
  }
  .circulo img { width: 100%; height: 100%; object-fit: cover; }
  span {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 11px; color: #262626;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: ${DIAMETRO + 10}px;
  }
</style></head><body><div class="fileira">${itens}</div></body></html>`;
  await pagina.setViewportSize({ width: LARGURA_MOCK, height: ALTURA_MOCK });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: path.join(SAIDA, '_mockup-perfil-390.png'), clip: { x: 0, y: 0, width: LARGURA_MOCK, height: ALTURA_MOCK } });
}

async function main() {
  fs.mkdirSync(SAIDA, { recursive: true });
  // Pasta sempre regenerada do zero a partir deste script — nenhuma capa
  // é editada à mão, então não há risco de perder trabalho ao limpar.
  for (const arquivo of fs.readdirSync(SAIDA)) fs.rmSync(path.join(SAIDA, arquivo));

  const v = lerVariaveisCss();
  const rostoUri = dataUri(path.join(RAIZ, 'img', 'institucional', 'quem-somos.jpg'));

  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage();
    const geradas = [];

    for (const destaque of DESTAQUES) {
      const arquivoStory = path.join(SAIDA, `capa-${destaque.nome}-1080x1920.png`);
      const arquivoQuadrado = path.join(SAIDA, `capa-${destaque.nome}-1080x1080.png`);
      await renderizar(pagina, montarHtml(destaque, v, rostoUri, ALTURA_STORY), arquivoStory, ALTURA_STORY);
      await renderizar(pagina, montarHtml(destaque, v, rostoUri, ALTURA_QUADRADA), arquivoQuadrado, ALTURA_QUADRADA);
      geradas.push({ titulo: destaque.titulo, quadradoUri: dataUri(arquivoQuadrado) });
      console.log(`✅ ${destaque.nome}: ${destaque.titulo} (1080x1920 + 1080x1080)`);
    }

    await montarMockPerfil(pagina, geradas);
    console.log('✅ _mockup-perfil-390.png');
  } finally {
    await navegador.close();
  }
  console.log(`\nPronto: ${SAIDA}`);
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
