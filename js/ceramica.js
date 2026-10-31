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

// contagem "N peças disponíveis" da listagem (criada uma vez só)
const contagemEl = document.createElement('p');
contagemEl.className = 'sub-contagem';
contagemEl.setAttribute('aria-live', 'polite');
contagemEl.hidden = true;
conteudoEl.before(contagemEl);

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
  // O "hidden" daqui nunca valeu (.filtros tem display próprio): os
  // filtros sempre apareceram nesta página sem fazer nada. Agora eles
  // filtram e ordenam as subcategorias (ver dadosVisaoGeral).
  filtrosEl.hidden = false;

  // breadcrump: "Home > Cerâmica" (Cerâmica e a pagina atual aqui,
  // entao vai sem href). Mesma funcao que produto.html usa.
  renderBreadcrumb(breadcrumbEl, [
    { rotulo: 'Home', href: 'index.html' },
    { rotulo: 'Cerâmica' },
  ]);

  // o navegador restaura o <select> ao voltar pra página: lê antes de desenhar
  sincronizarCriterios();
  desenharVisaoGeral();
}

// Separado de renderVisaoGeral pra os filtros remontarem só o conteúdo.
function desenharVisaoGeral() {
  const cards = dadosVisaoGeral();
  // Mesmo carrossel das listagens (vitrineHTML, abaixo) com o card de
  // subcategoria no lugar do de produto; "colecoes-grid" traz a
  // espiadinha do próximo card no celular, igual à esteira da Home.
  // HTML novo = trilho novo: filtrar/ordenar volta ao 1º slide.
  const vitrine = cards.length
    ? vitrineHTML(cards, 'carrossel', 'Subcategorias de cerâmica', {
        criarCard: subcategoriaCardHTML,
        classeGrade: 'colecoes-grid',
      })
    : mensagemVazia();

  // No fim da visão geral, as vendidas de todas as subcategorias
  // (portfólio: não passam pelo filtro de preço, como antes)
  const vendidas = produtosVisiveis().filter((p) => p.categoria === 'ceramica' && estaVendida(p));
  conteudoEl.innerHTML = vitrine + renderSecaoVendidas(vendidas);

  sincronizarDotsCarrossel();
  // os cards acima nasceram com a classe .reveal -> registra eles
  // no IntersectionObserver do main.js pra animarem ao entrar na tela
  escanearReveal();

  // liga o revezamento de fotos de cada card — iniciarRotacaoFotos()
  // agora mora em js/main.js (compartilhada com a grade da Home,
  // montarColecoesHome()); já carregou antes deste arquivo.
  iniciarRotacaoFotos();
}

// Os cards da visão geral com a faixa de preço e a ordem aplicadas.
// A faixa conta só as peças À VENDA dentro dela (o rótulo promete
// "disponíveis") e esconde a subcategoria que ficar sem nenhuma; a
// ordem por preço usa a peça mais barata (ou mais cara) de cada uma.
// Com "Todas" + "Padrão" sai exatamente a lista de sempre.
function dadosVisaoGeral() {
  const comFaixa = criterios.faixaPreco !== 'todas';
  // busca fica de fora: a do header não filtra esta página
  const filtro = { ...criterios, busca: '', ordem: 'relevancia' };
  const cards = dadosCardsSubcategoriaCeramica()
    .map((card) => {
      const precos = filtrarProdutos(
        produtosVisiveis().filter((p) => p.subcategoria === card.sub && !estaVendida(p)),
        filtro
      ).map((p) => p.preco);
      return comFaixa ? { ...card, precos, rotuloQtd: rotuloPecasDisponiveis(precos.length) } : { ...card, precos };
    })
    .filter((card) => !comFaixa || card.precos.length > 0);

  // subcategoria sem peça à venda: Math.min/max de [] dá ±Infinity e ela vai pro fim
  if (criterios.ordem === 'preco-asc') cards.sort((a, b) => Math.min(...a.precos) - Math.min(...b.precos));
  else if (criterios.ordem === 'preco-desc') cards.sort((a, b) => Math.max(...b.precos) - Math.max(...a.precos));
  else if (criterios.ordem === 'nome-az') cards.sort((a, b) => a.sub.localeCompare(b.sub, 'pt'));
  return cards;
}

// Card de uma subcategoria (foto circular giratória + nome + contagem).
// dadosCardsSubcategoriaCeramica() + fotosSubcategoriaHTML() moram em
// js/main.js, compartilhadas com montarColecoesHome() (a esteira
// "Explore Nossas Coleções" da Home) — mesma fonte de dados, nenhuma
// lista/contagem duplicada entre as duas páginas.
function subcategoriaCardHTML({ sub, fotos, rotuloQtd, href }) {
  return `
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
        </a>`;
}

// ============================================================
//  MODO 2 — LISTAGEM DE UMA SUBCATEGORIA (?sub=...)
// ============================================================
let produtosDaSub = []; // cache das pecas da subcategoria aberta
let comAlternador = false; // "Carrossel | Grade" nesta subcategoria?

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
  // pelo tamanho da subcategoria, não do filtro: senão o alternador
  // sumiria (e o layout trocaria) no meio de uma busca
  comAlternador = produtosDaSub.filter((p) => !estaVendida(p)).length >= MINIMO_ALTERNADOR;

  aplicarFiltrosListagem();
}

// Aplica busca + faixa de preco + ordem (os MESMOS "criterios" do
// main.js) so na subcategoria aberta, e desenha.
function aplicarFiltrosListagem() {
  if (produtosDaSub.length === 0) return; // ainda carregando

  const visiveis = filtrarProdutos(produtosDaSub, criterios);
  // À venda no carrossel principal; vendidas num carrossel próprio no
  // fim, como portfólio (a busca e os filtros valem para os dois)
  const aVenda = visiveis.filter((p) => !estaVendida(p));
  const vendidas = visiveis.filter(estaVendida);
  const modo = comAlternador ? modoVitrine : 'carrossel';

  // A contagem mora FORA do conteúdo recriado: um aria-live novo a cada
  // filtro não seria anunciado. Sem peça à venda ela some ("0 peças"
  // acima das vendidas pareceria erro).
  contagemEl.textContent = aVenda.length ? rotuloPecasDisponiveis(aVenda.length) : '';
  contagemEl.hidden = aVenda.length === 0;

  conteudoEl.innerHTML =
    visiveis.length === 0
      ? mensagemVazia()
      : (comAlternador ? alternadorHTML(modo) : '')
        + (aVenda.length ? vitrineHTML(aVenda, modo, 'Peças à venda') : '')
        + (vendidas.length ? renderSecaoVendidas(vendidas, vitrineHTML(vendidas, 'carrossel', 'Peças já vendidas')) : '');

  // HTML novo = trilho novo, que nasce no início: filtrar/ordenar
  // sempre volta para o 1º slide. Setas, dots e snap são os da Home.
  sincronizarDotsCarrossel();
  escanearReveal();
}

// Mesmo carrossel da Home ("Queridinhos"): data-manual tira a grade do
// aplicarEExibir() do main.js, que só sabe montar grades por categoria.
// Com uma página só (1 a 4 peças no desktop, 1 a 2 no celular) a classe
// --poucas centraliza os cards na largura normal, sem esticar.
// criarCard/classeGrade deixam a visão geral usar o MESMO trilho com
// cards de subcategoria, em vez de um 2º carrossel só dela.
function vitrineHTML(lista, modo, rotulo, { criarCard = criarCardProduto, classeGrade = '' } = {}) {
  if (modo === 'grade') {
    return `<div class="sub-vitrine sub-vitrine--grade" role="region" aria-label="${rotulo}">
      <div class="produtos-grid">${lista.map(criarCard).join('')}</div></div>`;
  }
  const porSlide = cardsPorSlideCarrossel();
  const poucas = lista.length <= porSlide;
  return `<div class="sub-vitrine${poucas ? ' sub-vitrine--poucas' : ''}" role="region" aria-label="${rotulo}" style="--cards: ${Math.min(lista.length, porSlide)}">
    <div class="produtos-grid ${classeGrade}" data-grade-produtos="subcategoria" data-manual>${montarSlidesCarrossel(lista, porSlide, criarCard)}</div></div>`;
}

// Subcategoria grande (ex.: Canecas) ganha "Carrossel | Grade"
const MINIMO_ALTERNADOR = 8;
const CHAVE_MODO_VITRINE = 'anasor-modo-vitrine';
let modoVitrine = 'carrossel';
try {
  if (localStorage.getItem(CHAVE_MODO_VITRINE) === 'grade') modoVitrine = 'grade';
} catch (e) {
  /* sem localStorage: começa sempre no carrossel, o padrão */
}

function alternadorHTML(modo) {
  const botao = (valor, rotulo) =>
    `<button type="button" class="sub-alternador__opcao" data-modo="${valor}" aria-pressed="${modo === valor}">${rotulo}</button>`;
  return `<div class="sub-alternador" role="group" aria-label="Ver peças em">${botao('carrossel', 'Carrossel')}${botao('grade', 'Grade')}</div>`;
}

// delegado: o alternador é recriado a cada filtro
conteudoEl.addEventListener('click', (evento) => {
  const opcao = evento.target.closest('.sub-alternador__opcao');
  if (!opcao || opcao.dataset.modo === modoVitrine) return;
  modoVitrine = opcao.dataset.modo;
  try {
    localStorage.setItem(CHAVE_MODO_VITRINE, modoVitrine);
  } catch (e) {
    /* a escolha vale só nesta visita */
  }
  aplicarFiltrosListagem();
  conteudoEl.querySelector(`.sub-alternador__opcao[data-modo="${modoVitrine}"]`)?.focus();
});

// cruzar 768/769px muda quantos cards cabem por slide (2 x 4): remonta
// (mesma MediaQueryList do carrossel da Home, main.js)
mqCarrosselDesktop.addEventListener('change', () => {
  if (nomeSub) aplicarFiltrosListagem();
  else desenharVisaoGeral();
});

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
  const ehBusca = el.tagName === 'INPUT';
  let espera = null;
  el.addEventListener(ehBusca ? 'input' : 'change', () => {
    sincronizarCriterios();
    // na visão geral, só preço e ordem mexem nos cards (a busca do
    // header segue com o comportamento dela)
    if (!nomeSub) {
      if (!ehBusca) desenharVisaoGeral();
      return;
    }
    // na busca, remonta o carrossel quando a digitação pausa, não a
    // cada tecla (cada remontagem recria trilho, setas e dots)
    clearTimeout(espera);
    if (ehBusca) espera = setTimeout(aplicarFiltrosListagem, 150);
    else aplicarFiltrosListagem();
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
