// ============================================================
// Gera as artes dos 9 primeiros posts do Instagram (@anasor.ceramica)
// em marketing/instagram/posts/: PNGs 1080x1350 (formato 4:5 do feed)
// e um post-NN.md por peça, com legenda, hashtags e ordem dos slides.
//
// Como rodar (uma vez por PC, depois só o último comando):
//   cd marketing/instagram
//   npm install
//   npx playwright install chromium
//   node gerar-posts.js
//
// A pasta posts/ fica fora do git: tudo nela sai deste script, então
// qualquer PC regenera as mesmas artes a partir do repositório.
// Precisa de internet só para baixar as fontes (Fraunces e Jost) do
// Google Fonts; sem internet as artes saem com fonte de reserva.
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..', '..');
const SAIDA = path.join(__dirname, 'posts');
const LARGURA = 1080;
const ALTURA = 1350;

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

// Fotos extras por carrossel: com capa e chamada, fecha em até 5 slides
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
// as artes usarem exatamente os mesmos SVGs do site.
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

// As fotos entram como data URI: o HTML é montado em memória e o
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

// ---- Modelos dos slides ----

function baseHtml(v, corpo, cssExtra) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400..700;9..144,1,400..700&family=Jost:wght@400;500&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${LARGURA}px; height: ${ALTURA}px; overflow: hidden; }
  body {
    position: relative;
    font-family: 'Jost', sans-serif;
    color: ${v.texto};
    background-color: ${v.fundo};
    background-image: ${v.grao};
  }
  .emoji { font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; }
  ${cssExtra}
</style></head><body>${corpo}</body></html>`;
}

// Capa: foto principal em tela cheia (cover = recorte proporcional, sem
// esticar) e uma faixa creme com o nome. Sem preço, que pode mudar.
function slideCapa(v, foto, nome, recorte) {
  return baseHtml(v, `
    <img class="foto" src="${foto}" alt="">
    <div class="faixa">
      <h1 id="titulo">${escaparHtml(nome)}</h1>
      <p>Peça única, feita à mão <span class="emoji">🤎</span></p>
    </div>`, `
    .foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: ${recorte}; }
    .faixa {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 44px 72px 52px;
      text-align: center;
      /* creme quase opaco + monograma fraco: a faixa conversa com o site
         sem esconder a foto atrás de um bloco pesado */
      background-color: rgba(251, 246, 239, 0.94);
      background-image: ${v.monograma}, ${v.grao};
      background-size: 220px, 140px;
      border-top: 2px solid ${v.destaque};
    }
    h1 {
      font-family: 'Fraunces', serif; font-weight: 600;
      font-size: 72px; line-height: 1.08; letter-spacing: -0.01em;
      max-height: calc(72px * 1.08 * 2 + 4px);
    }
    .faixa p { margin-top: 14px; font-size: 32px; color: ${v.destaque}; }`);
}

// Foto extra: a imagem inteira (contain), sem texto, só um passe-partout
// branco fino com filete terracota sobre o fundo creme do site.
function slideFoto(v, foto) {
  return baseHtml(v, `<div class="moldura"><img src="${foto}" alt=""></div>`, `
    body {
      display: flex; align-items: center; justify-content: center;
      background-image: ${v.monograma}, ${v.grao};
      background-size: 220px, 140px;
    }
    .moldura {
      padding: 12px; background: #FFF;
      box-shadow: 0 0 0 1.5px ${v.destaque}, 0 18px 40px rgba(62, 46, 34, 0.18);
    }
    img { display: block; max-width: ${LARGURA - 180}px; max-height: ${ALTURA - 170}px; }`);
}

// Chamada final: monograma, "Peça única 🤎" e um botão gummy "Link na bio",
// o mesmo desenho dos botões do site e da página /links.
function slideChamada(v) {
  return baseHtml(v, `
    <div class="flor"></div><div class="vaso"></div>
    <main>
      <div class="selo">AS</div>
      <h1>Peça única <span class="emoji">🤎</span></h1>
      <p class="sub">Feita à mão, uma de cada vez</p>
      <div class="botao">Link na bio</div>
      <p class="arroba">@anasor.ceramica</p>
    </main>`, `
    body { background-image: ${v.monograma}, ${v.grao}; background-size: 220px, 140px; }
    .flor, .vaso { position: absolute; background-repeat: no-repeat; background-size: contain; }
    .flor { width: 560px; height: 560px; top: -60px; right: -150px; transform: rotate(-14deg); background-image: ${v.flor}; opacity: 0.9; }
    .vaso { width: 360px; height: 360px; bottom: -30px; left: -70px; background-image: ${v.vaso}; opacity: 0.9; }
    main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .selo {
      width: 168px; height: 168px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: ${v.destaque}; color: ${v.fundo};
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: 84px;
      box-shadow: 0 0 0 10px ${v.fundo}, 0 0 0 12px ${v.destaque};
      margin-bottom: 64px;
    }
    h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 112px; line-height: 1; letter-spacing: -0.015em; }
    .sub { margin-top: 22px; font-size: 38px; color: ${v.destaque}; }
    .botao {
      margin-top: 72px; padding: 30px 92px; border-radius: 999px;
      background: ${v.destaque}; color: #FFF; font-size: 46px; font-weight: 500;
      background-image: linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%);
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.28), 0 12px 0 ${v.destaqueEscuro};
    }
    .arroba { margin-top: 60px; font-size: 34px; color: ${v.secundaria}; }`);
}

// ---- Renderização ----

async function renderizar(pagina, html, arquivo) {
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(async () => {
    await document.fonts.ready;
    // Nome longo: diminui a fonte até caber em 2 linhas, em vez de cortar
    const t = document.getElementById('titulo');
    if (t) {
      let tamanho = 72;
      while (t.scrollHeight > t.clientHeight + 2 && tamanho > 40) {
        tamanho -= 2;
        t.style.fontSize = `${tamanho}px`;
        t.style.maxHeight = `${tamanho * 1.08 * 2 + 4}px`;
      }
    }
  });
  await pagina.screenshot({ path: arquivo, clip: { x: 0, y: 0, width: LARGURA, height: ALTURA } });
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

${slides.map((s, i) => `${i + 1}. \`${s.arquivo}\`: ${s.descricao}`).join('\n')}

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
  // Começa de pasta limpa: arte de uma rodada anterior (peça já vendida,
  // slide a mais) não pode ficar misturada com a nova e ir parar no feed.
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });

  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } });

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
      const slides = [];
      const salvar = async (html, sufixo, descricao) => {
        const arquivo = `post-${nn}-${slides.length + 1}-${sufixo}.png`;
        await renderizar(pagina, html, path.join(SAIDA, arquivo));
        slides.push({ arquivo, descricao });
      };

      await salvar(slideCapa(v, dataUri(fotos[0]), nomeCurto(produto.nome), RECORTE_CAPA[id] || '50% 50%'), 'capa', 'capa com a foto principal e o nome da peça');
      for (const foto of fotos.slice(1, 1 + MAX_FOTOS_EXTRAS)) {
        await salvar(slideFoto(v, dataUri(foto)), 'foto', `foto extra (${path.basename(foto)})`);
      }
      await salvar(slideChamada(v), 'chamada', '"Peça única 🤎 / Link na bio"');

      // Nome exato (completo ou a parte antes do travessão): prefixo solto
      // poderia casar a legenda de outra peça de nome parecido.
      const legenda = legendas.find((l) => l.nome === produto.nome || l.nome === nomeCurto(produto.nome));
      fs.writeFileSync(path.join(SAIDA, `post-${nn}.md`), montarMarkdown(n, produto, legenda, slides));
      console.log(`post-${nn}: ${produto.nome} (${slides.length} slides${legenda ? `, legenda nº ${legenda.numero}` : ', SEM legenda'})`);
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
