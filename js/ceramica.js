// ============================================================
//  PAGINA DE CERAMICA  (ceramica.html) — 2 modos
// ============================================================
//
//  POR QUE UM PARAMETRO DE URL (?sub=...) EM VEZ DE UM .html
//  POR SUBCATEGORIA?
//  --------------------------------------------------------
//   - 1 arquivo da manutencao pra 2, 20 ou 200 subcategorias.
//   - O conteudo (nomes, fotos, subcategorias) ja mora em
//     produtos.js. Criar "pratos-artisticos.html",
//     "vasos-esculturicos.html"... seria copiar HTML e, a cada
//     subcategoria nova, lembrar de criar mais um arquivo (e o
//     link do menu, e o card da visao geral...). Facil esquecer,
//     facil as copias divergirem.
//   - Com ?sub=, e so adicionar produtos em produtos.js com a
//     subcategoria certa: o dropdown do menu, o card na visao
//     geral e a listagem filtrada aparecem sozinhos.
//   E o MESMO padrao de produto.html?id=X.
//
//  DOIS MODOS (decididos pela URL):
//   - SEM ?sub  -> VISAO GERAL: um card por subcategoria
//                  (imagem + nome), no estilo dos cards de
//                  categoria da Home.
//   - COM ?sub= -> LISTAGEM: so os produtos daquela subcategoria,
//                  com <h1> do nome e os filtros de preco/ordem.
//
//  Este arquivo carrega DEPOIS do main.js, entao reaproveita dele:
//  produtos, slugificar(), normalizarTexto(), carregarProdutos(),
//  filtrarProdutos(), criarCardProduto(), criarSkeletons(),
//  mensagemVazia() e o objeto "criterios".
// ============================================================

// ---- lê o parametro da URL ----
// window.location.search = tudo a partir do "?" (ex.: "?sub=pratos-artisticos")
const paramsCer = new URLSearchParams(window.location.search);
const subPedida = paramsCer.get('sub'); // "pratos-artisticos" ou null

// ---- elementos da pagina ----
const tituloEl = document.querySelector('#ceramica-titulo');
const breadcrumbEl = document.querySelector('#breadcrumb');
const filtrosEl = document.querySelector('#ceramica-filtros');
const conteudoEl = document.querySelector('#ceramica-conteudo');

// subcategoriasCeramica() agora mora em js/main.js (compartilhada com
// o dropdown do menu e com a grade "Explore Nossas Coleções" da Home —
// ver dadosCardsSubcategoriaCeramica() lá). Carrega ANTES deste
// arquivo, então já está disponível aqui.

// Acha o NOME real da subcategoria a partir do slug da URL
// (ex.: "pratos-artisticos" -> "Pratos Artisticos"), ou undefined
// se o slug nao corresponder a nenhuma.
function nomeDaSub(slug) {
  return subcategoriasCeramica().find((s) => slugificar(s) === slug);
}

// ============================================================
//  MODO 1 — VISAO GERAL (sem ?sub)
// ============================================================
// Um card por subcategoria. A "capa" de cada card e a foto da
// PRIMEIRA peca daquela subcategoria (assim tambem e automatico:
// nao precisa cadastrar imagem de subcategoria em lugar nenhum).
function renderVisaoGeral() {
  tituloEl.textContent = 'Cerâmica';
  document.title = 'Cerâmica | Anasor Sobreira';
  filtrosEl.hidden = true; // nao ha lista de produtos pra filtrar aqui

  // breadcrump: "Home > Cerâmica" (Cerâmica e a pagina atual aqui,
  // entao vai sem href). Mesma funcao que produto.html usa.
  renderBreadcrumb(breadcrumbEl, [
    { rotulo: 'Home', href: 'index.html' },
    { rotulo: 'Cerâmica' },
  ]);

  // dadosCardsSubcategoriaCeramica() + fotosSubcategoriaHTML() moram em
  // js/main.js, compartilhadas com montarColecoesHome() (a grade
  // "Explore Nossas Coleções" da Home) — mesma fonte de dados, nenhuma
  // lista/contagem duplicada entre as duas páginas.
  const cards = dadosCardsSubcategoriaCeramica()
    .map(({ sub, fotos, rotuloQtd, href }) => `
        <a href="${href}" class="subcategoria-card reveal">
          <div class="subcategoria-card__foto">${fotosSubcategoriaHTML(fotos, sub)}</div>
          <div class="subcategoria-card__info">
            <!-- h2, não h3: a página só tem um <h1> ("Cerâmica") antes
                 destes cards — usar h3 pulava o nível 2 (achado da
                 auditoria de acessibilidade), hierarquia errada pra
                 quem navega por heading no leitor de tela. Visual não
                 muda: o tamanho/peso vem do seletor CSS
                 .subcategoria-card__info h2 (ver style.css), não da
                 tag em si. -->
            <h2>${sub}</h2>
            <p>${rotuloQtd}</p>
          </div>
        </a>`)
    .join('');

  // .categoria-cards e so o LAYOUT flex (centraliza + quebra linha);
  // o visual do card e o .subcategoria-card (cantos normais de 16px,
  // agora com a FOTO CIRCULAR centralizada no topo — ver CSS — e o
  // nome/contagem abaixo; continua sem usar --raio-organico pelo
  // mesmo motivo de sempre: nomes mais longos, tipo "Pratos
  // Artísticos", ficariam apertados naquela forma estreita/assimétrica).
  conteudoEl.innerHTML = `<div class="categoria-cards">${cards}</div>`;

  // os cards acima nasceram com a classe .reveal -> registra eles
  // no IntersectionObserver do main.js pra animarem ao entrar na tela
  escanearReveal();

  // liga o revezamento de fotos de cada card — iniciarRotacaoFotos()
  // agora mora em js/main.js (compartilhada com a grade da Home,
  // montarColecoesHome()); já carregou antes deste arquivo.
  iniciarRotacaoFotos();
}

// ============================================================
//  MODO 2 — LISTAGEM DE UMA SUBCATEGORIA (?sub=...)
// ============================================================
let produtosDaSub = []; // cache das pecas da subcategoria aberta

async function renderListagem(nomeSub) {
  tituloEl.textContent = nomeSub;
  document.title = `${nomeSub} | Anasor Sobreira`;
  filtrosEl.hidden = false;

  // breadcrumb: "Home > Cerâmica > <Nome da Subcategoria>".
  // Aqui "Cerâmica" É link (leva de volta pra visao geral); a
  // subcategoria e a pagina atual (ultimo trecho, sem href).
  renderBreadcrumb(breadcrumbEl, [
    { rotulo: 'Home', href: 'index.html' },
    { rotulo: 'Cerâmica', href: 'ceramica.html' },
    { rotulo: nomeSub },
  ]);

  // skeleton enquanto "carrega" (mesmo esquema da Home)
  conteudoEl.innerHTML = `<div class="produtos-grid">${criarSkeletons(6)}</div>`;

  // hoje: array local + atraso de dev; amanha: fetch de uma API
  const todos = await carregarProdutos();
  produtosDaSub = todos.filter((p) => p.subcategoria === nomeSub);

  aplicarFiltrosListagem();
}

// Aplica busca + faixa de preco + ordem (os MESMOS "criterios" do
// main.js) so na subcategoria aberta, e desenha.
function aplicarFiltrosListagem() {
  if (produtosDaSub.length === 0) return; // ainda carregando

  const visiveis = filtrarProdutos(produtosDaSub, criterios);
  conteudoEl.innerHTML =
    visiveis.length === 0
      ? mensagemVazia()
      : `<div class="produtos-grid">${visiveis.map(criarCardProduto).join('')}</div>`;

  // criarCardProduto() já traz a classe .reveal nos cards; registra
  // eles no observador (main.js) pra animarem ao rolar
  escanearReveal();
}

// ============================================================
//  LIGACAO DOS FILTROS
// ============================================================
// Le os 3 controles (#busca no header, #filtro-preco e #ordenar)
// pro objeto "criterios" e re-renderiza a listagem. Fazemos a
// leitura aqui (em vez de confiar na ordem dos listeners do
// main.js) pra nao depender de quem roda primeiro.
function sincronizarCriterios() {
  const b = document.querySelector('#busca');
  const fp = document.querySelector('#filtro-preco');
  const o = document.querySelector('#ordenar');
  if (b) criterios.busca = b.value;
  if (fp) criterios.faixaPreco = fp.value;
  if (o) criterios.ordem = o.value;
}

['#busca', '#filtro-preco', '#ordenar'].forEach((seletor) => {
  const el = document.querySelector(seletor);
  if (!el) return;
  const evento = el.tagName === 'INPUT' ? 'input' : 'change';
  el.addEventListener(evento, () => {
    sincronizarCriterios();
    // so mexe na tela quando estamos no modo LISTAGEM; na visao
    // geral os filtros estao escondidos e isto nao faz nada.
    if (subPedida) aplicarFiltrosListagem();
  });
});

// ============================================================
//  DECIDE O MODO
// ============================================================
const nomeSub = subPedida ? nomeDaSub(subPedida) : null;

if (subPedida && nomeSub) {
  // ?sub= valido -> listagem daquela subcategoria
  renderListagem(nomeSub);
} else {
  // sem ?sub, OU ?sub= com valor que nao existe -> visao geral
  renderVisaoGeral();
}
