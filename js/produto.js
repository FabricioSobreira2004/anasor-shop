// ============================================================
//  PÁGINA DE PRODUTO INDIVIDUAL  (produto.html)
// ============================================================
//
//  COMO UMA PÁGINA SÓ MOSTRA PRODUTOS DIFERENTES?
//  ---------------------------------------------------------
//  Existe apenas UM arquivo produto.html. O que ele exibe
//  depende da URL:
//        produto.html?id=1   -> mostra a peça de id 1
//        produto.html?id=6   -> mostra a peça de id 6
//  A parte depois do "?" chama-se "query string". Em vez de
//  cortar essa string na mão, o navegador oferece a classe
//  URLSearchParams, feita exatamente pra isso:
//
//        const params = new URLSearchParams(window.location.search);
//        params.get("id");   // devolve "1" (sempre TEXTO)
//
//  POR QUE ASSIM, E NÃO UM HTML FIXO POR PRODUTO?
//   • 1 arquivo dá manutenção pra 8, 80 ou 800 peças.
//   • O conteúdo já mora em produtos.js (fonte única da verdade).
//     Aqui a gente só localiza o objeto certo e preenche a tela.
//   • Os cards (criarCardProduto, em main.js) já apontam pra
//     produto.html?id=<id> — este arquivo fecha o ciclo.
// ============================================================


// ---------- 1) LER O id DA URL ----------
// window.location.search é tudo a partir do "?" (ex.: "?id=6").
// Number("6") vira 6 porque em produtos.js o campo id é número.
// Sem "?id=" na URL, get("id") devolve null e Number(null) vira 0 —
// nenhum produto tem id 0, então cai no caminho de "não encontrado".
const params = new URLSearchParams(window.location.search);
const idProcurado = Number(params.get('id'));


// ---------- 2) ENCONTRAR O PRODUTO ----------
// "produtos" é o array global de produtos.js (carregado antes deste
// arquivo). find() devolve o primeiro item que casar, ou undefined.
const produto = produtos.find((p) => p.id === idProcurado);

// ---------- ESTADO DO SELETOR DE QUANTIDADE (só Anjos de Luz) ----------
// "permiteQuantidade" (ver produtos.js) é a ÚNICA exceção de "peça
// única, 1 por pedido" do catálogo. O seletor +/- vive dentro de
// montarDetalhe(); a barra de compra flutuante (montarBarraCompraFlutuante,
// mais abaixo) é um elemento SEPARADO, criado depois — as duas
// precisam concordar em QUAL quantidade vai pro carrinho quando a
// pessoa clica em "Adicionar"/"Comprar Agora" em qualquer uma delas.
// "elementosComQuantidade" guarda todo elemento com [data-id] desta
// página (o container principal e, se existir, a barra flutuante);
// sincronizarQuantidade() escreve o MESMO valor no dataset dos dois de
// uma vez, então o clique em qualquer botão de compra lê o valor certo
// (ver adicionarAoCarrinho, js/main.js, que lê card.dataset.quantidade).
let quantidadeEscolhida = 1;
const elementosComQuantidade = [];
function sincronizarQuantidade(novaQuantidade) {
  quantidadeEscolhida = novaQuantidade;
  elementosComQuantidade.forEach((el) => {
    el.dataset.quantidade = String(novaQuantidade);
  });
}


// ---------- 3) REFERÊNCIAS AOS BLOCOS DA PÁGINA ----------
const breadcrumb = document.querySelector('#breadcrumb');
const container = document.querySelector('#produto-detalhe');
const erro = document.querySelector('#produto-nao-encontrado');
const relacionadosSecao = document.querySelector('#produtos-relacionados');


// ---------- CONFIG COMPARTILHADA ----------
// WHATSAPP_NUMERO (usada mais abaixo, no botão de comprar por
// WhatsApp) NÃO é declarada aqui: morava aqui antes, mas virou uma
// constante ÚNICA em js/main.js (carregado ANTES deste arquivo em
// produto.html — mesmo "escopo global de scripts clássicos" já usado
// no resto do site). Declarar de novo aqui daria
// "Identifier 'WHATSAPP_NUMERO' has already been declared" (os dois
// arquivos compartilham o mesmo escopo de top-level no navegador).

// linkEncomendaWhatsApp() mora em js/main.js: o card de peça vendida
// (todas as páginas) usa o mesmo link e a mesma mensagem.

// Como o breadcrumb deve linkar cada categoria: as duas já têm
// página própria agora (croche.html foi criada — antes apontava pra
// uma seção da Home, index.html#croche).
const CATEGORIAS = {
  ceramica: { rotulo: 'Cerâmica', href: 'ceramica.html' },
  croche: { rotulo: 'Crochê', href: 'croche.html' },
};


// ---------- SELOS DE CONFIANÇA ----------
// São os MESMOS 4 selos da Home (seção .selos-confianca em index.html):
// mesmos ícones (Lucide, SVG inline), mesmos textos, mesma linguagem
// visual de "card" (classes .selo / .selo__icone-fundo / .selo__icone /
// .selo__texto, definidas em style.css). Aqui eles são montados por JS
// porque a página de produto inteira é montada por JS — mas o HTML
// gerado é idêntico ao da Home, então nada de CSS novo pro card em si
// (só um contêiner .produto-selos com um grid mais compacto, já que
// aqui eles moram DENTRO da coluna de informações, não numa seção
// larga). Os "d" dos <path> foram copiados 1:1 da index.html.
const SELOS_CONFIANCA = [
  {
    rotulo: 'Frete Grátis',
    // ícone "truck"
    paths:
      '<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><path d="M15 18H9"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  },
  {
    rotulo: 'Pagamento Seguro',
    // ícone "lock"
    paths:
      '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  {
    rotulo: 'Feito à Mão',
    // ícone "hand" (mão)
    paths:
      '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="m7 15-1.8-1.8a2 2 0 0 0-2.8 2.8L6 20c1.5 1.5 3 2 5 2h2a8 8 0 0 0 8-8V7a2 2 0 0 0-4 0v5"/>',
  },
  {
    rotulo: 'Suporte via WhatsApp',
    // ícone "message-circle"
    paths: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  },
];

// Monta a fileira de selos. Cada card leva a classe .reveal (entra com
// o MESMO fade+slide dos outros elementos do site — "reaproveitando o
// sistema de reveal", como pedido) e um data-index, que a função
// animarSelosConfianca() usa pra escalonar o "pulinho" dos ícones.
function renderSelosConfianca() {
  const cards = SELOS_CONFIANCA.map(
    (selo, i) => `
    <div class="selo reveal" data-selo-index="${i}">
      <div class="selo__icone-fundo">
        <svg class="selo__icone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">${selo.paths}</svg>
      </div>
      <p class="selo__texto">${selo.rotulo}</p>
    </div>`
  ).join('');

  return `<div class="produto-selos" aria-label="Nossas garantias">${cards}</div>`;
}


// ---------- SELO DE ESCASSEZ (baseado em FATO, não em fake urgency) ----------
// A versão antiga deste bloco era um textinho discreto que falava do
// PREÇO ("oferta por tempo limitado", "últimas peças nesse valor") e só
// aparecia nas peças em promoção. Trocamos por um selo mais visual e,
// principalmente, HONESTO: ele comunica um fato que vale pra TODAS as
// peças — cada uma é modelada e pintada à mão, uma a uma, então o
// estoque é sempre 1. Quando aquela peça vende, não há reposição
// idêntica. Isso é escassez de verdade; não precisa inventar contagem
// regressiva nem "só hoje!!!".
//
// POR QUE APARECE EM TODA PEÇA (e não só nas em promoção)?
//   Porque a unicidade não depende de ter desconto — é da natureza do
//   trabalho da Anasor. Amarrar o selo à promoção daria a impressão
//   errada de que só as peças com desconto "acabam".
//
// POR QUE PODE CONVIVER COM O SELO "Peça Única — Feita à Mão"?
//   São recados diferentes: aquele (logo acima do título) fala de COMO
//   a peça é feita; este fala da CONSEQUÊNCIA de deixar pra depois. O
//   pedido explicitamente permitiu os dois juntos.
//
// renderSeloEscassez() MUDOU DE ENDEREÇO: agora mora em js/main.js
// (junto de renderBlocoPreco, que este arquivo já reaproveitava) —
// a seção "Peça em Destaque" da Home também usa este selo, e main.js
// é o único arquivo carregado nas duas páginas. O CSS dele
// (.selo-escassez) fez a mesma mudança, pra style.css.


// ---------- FAIXA "DO BARRO À LUZ" (só páginas de Anjo de Luz) ----------
// 5 fotos do processo real (barro cru -> forno -> biscoito -> esmaltado
// -> embalagem), SEM o rosto da Anasor (regra do pedido — fotos
// recortadas/trocadas por ângulos sem rosto). Full-width: quebra as 2
// colunas do grid (.produto-detalhe) com grid-column:1/-1 (ver
// produto.css) — por isso é montada como filho DIRETO de #produto-
// detalhe (ver montarDetalhe), não dentro de .produto-detalhe__info.
const ETAPAS_BARRO_A_LUZ = [
  { foto: 'img/anjos/do-barro-a-luz-1-barro.webp', legenda: 'Modelado à mão, no barro' },
  { foto: 'img/anjos/do-barro-a-luz-2-forno.webp', legenda: 'Uma noite no forno a gás' },
  { foto: 'img/anjos/do-barro-a-luz-3-biscoito.webp', legenda: 'Sai do forno, biscoitado' },
  { foto: 'img/anjos/do-barro-a-luz-4-esmaltado.webp', legenda: 'Esmaltado em branco, com o terço dourado' },
  { foto: 'img/anjos/do-barro-a-luz-5-embalagem.webp', legenda: 'Embalado com laço e cartão, pronto pra presentear' },
];
function barraDoBarroALuzHTML() {
  const figuras = ETAPAS_BARRO_A_LUZ.map(
    ({ foto, legenda }, i) => `
      <figure class="barro-a-luz__passo reveal">
        <img src="${foto}" alt="${legenda}" loading="lazy">
        <figcaption>${i + 1}. ${legenda}</figcaption>
      </figure>`
  ).join('');
  return `
    <div class="produto-detalhe__barro-a-luz">
      <h2 class="barro-a-luz__titulo reveal">Do barro à luz</h2>
      <div class="barro-a-luz__grade">${figuras}</div>
    </div>`;
}


// ---------- 4) DECIDIR O QUE MOSTRAR ----------
if (!produto) {
  // id ausente ou inexistente: revela só a mensagem de aviso.
  // Breadcrumb, detalhe e relacionados continuam com o "hidden"
  // que veio do HTML.
  erro.hidden = false;
} else {
  document.title = `${produto.nome} | Anasor Sobreira`;

  // META DESCRIPTION DINÂMICA (achado da auditoria, item 10): o
  // <head> já traz uma versão genérica (ver produto.html) — aqui ela
  // vira ESPECÍFICA da peça aberta, útil pro RESULTADO DE BUSCA do
  // Google (o Googlebot executa JS ao indexar). replace(/<[^>]+>/g,
  // ''): tira as tags <span class='realce'> da descrição (escrita
  // pra render HTML na página, não pra virar texto puro de meta tag)
  // — só o texto. slice(0,160): tamanho usual de meta description
  // antes do buscador cortar com "...".
  //
  // NÃO mexe nas tags "og:*" (Open Graph, usadas pelo preview do
  // WhatsApp/Facebook/Twitter): bots de preview de link NÃO executam
  // JavaScript, só leem o HTML estático que o servidor devolve — uma
  // mudança feita aqui, depois da página já carregada, nunca chegaria
  // a tempo pra eles. O og:image genérico do ateliê (ver
  // produto.html) é o que todo link de produto compartilhado vai
  // mostrar; deixar "correto, porém genérico" é melhor que fingir uma
  // personalização que não funcionaria na prática.
  const descricaoLimpa = produto.descricao.replace(/<[^>]+>/g, '').slice(0, 160);
  document.querySelector('meta[name="description"]')?.setAttribute('content', descricaoLimpa);

  // Peça oculta (ex.: a de teste) só existe pelo link direto: o
  // "noindex" pede aos buscadores (o Googlebot executa JS) que não a
  // coloquem nos resultados — senão um cliente poderia achá-la no
  // Google mesmo sem ela aparecer em nenhuma vitrine do site.
  if (produto.oculto) {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex';
    document.head.appendChild(metaRobots);
  }

  // MARCA D'ÁGUA ÚNICA DA PÁGINA (ver .produto-marca-* / main::before em
  // produto.css). Diferente das outras páginas, que LADRILHAM um motivo
  // no fundo, aqui é UMA silhueta grande só. Qual silhueta depende da
  // categoria da peça: vaso pra "ceramica", flor pra "croche" — as
  // MESMAS duas marcas (--marca-vaso / --marca-flor) já usadas no site,
  // na mesma opacidade sutil (0.1, embutida no próprio SVG). A escolha
  // é feita aqui (no JS, que é quem sabe a categoria) via uma classe no
  // <body>; o posicionamento e o tamanho ficam no CSS.
  document.body.classList.add(
    produto.categoria === 'croche' ? 'produto-marca-flor' : 'produto-marca-vaso'
  );

  montarBreadcrumb(produto);
  montarDetalhe(produto);
  montarRelacionados(produto);
  // SEMPRE monta a barra (rodada de mobile: peça indisponível não some
  // mais — vira "Encomendar peça parecida", ver montarBarraCompraFlutuante).
  montarBarraCompraFlutuante(produto);
  animarSelosConfianca();
}


// ============================================================
//  BREADCRUMB  —  Home > Categoria > Nome da peça
// ============================================================
function montarBreadcrumb(produto) {
  // Só monta a LISTA de trechos; quem desenha é renderBreadcrumb()
  // (main.js), a MESMA função que ceramica.html usa. O último
  // trecho (a peça) vai sem href -> vira a "página atual".
  const cat = CATEGORIAS[produto.categoria];
  // Categoria sem página própria (ex.: "teste", da peça de teste
  // oculta) não tem pra onde linkar: pula o trecho do meio em vez de
  // quebrar a página inteira lendo "rotulo" de undefined.
  renderBreadcrumb(breadcrumb, [
    { rotulo: 'Home', href: 'index.html' },
    ...(cat ? [{ rotulo: cat.rotulo, href: cat.href }] : []),
    { rotulo: produto.nome },
  ]);
}


// ============================================================
//  DETALHE DA PEÇA  (galeria + selo + infos + ações + detalhes)
// ============================================================
function montarDetalhe(produto) {
  // Lista completa de fotos = principal + extras. A principal entra
  // como PRIMEIRO item pra também virar miniatura (dá pra voltar
  // pra ela depois de clicar em outra). O "|| []" protege caso um
  // produto não tenha o campo imagensExtras.
  const imagens = [produto.imagem, ...(produto.imagensExtras || [])];

  // Mensagem pré-preenchida do WhatsApp. encodeURIComponent()
  // transforma espaços, acentos e aspas em código seguro pra URL
  // (espaço -> %20, "ç" -> %C3%A7 ...); sem isso o link quebra.
  const msgWhats = encodeURIComponent(
    `Olá! Tenho interesse na peça "${produto.nome}" (${formatarPreco(
      produto.preco
    )}). Poderia me tirar algumas dúvidas?`
  );
  const linkWhats = `https://wa.me/${WHATSAPP_NUMERO}?text=${msgWhats}`;

  // ---------- "ENCOMENDE SUA PEÇA ÚNICA" (ideia da mãe da Anasor) ----------
  // Cada peça do catálogo é única (estoque sempre 1, ver comentário de
  // "disponivel" em produtos.js) — quem gosta de um modelo que já
  // vendeu, ou quer algo parecido, precisa de um caminho claro pra
  // pedir uma encomenda direto com a Anasor. "produtoDisponivel" só é
  // false quando o campo existir E for exatamente false — produto SEM
  // o campo (hoje, o catálogo inteiro) continua tratado como
  // disponível, sem nenhuma mudança de comportamento.
  const produtoDisponivel = produto.disponivel !== false;
  const linkEncomenda = linkEncomendaWhatsApp(produto);
  const linkEncomendaIndisponivel = linkEncomendaWhatsApp(produto, { indisponivel: true });

  // ANJOS DE LUZ (permiteQuantidade, ver produtos.js): única exceção de
  // "peça única" do catálogo. "esgotada" é um motivo A MAIS pra não
  // poder comprar, diferente de "vendida" — o estoque é temporário
  // (volta numa fornada nova), então tem CTA e texto próprios.
  // "podeComprar" é o gate único que decide se mostra preço/seletor/
  // botão de compra — junta os dois motivos sem espalhar "||" por toda
  // a função.
  const anjoDeLuz = produto.grupoAtacado === 'anjos-de-luz';
  const esgotada = estaEsgotada(produto);
  const podeComprar = produtoDisponivel && !esgotada;
  sincronizarQuantidade(1); // reinicia o seletor sempre que a peça muda

  // Bloco HTML do convite — MUDA de visual conforme a disponibilidade:
  // disponível = discreto, .btn-fantasma (contorno), abaixo dos botões
  // de compra, pra não competir com "Adicionar ao Carrinho";
  // indisponível = vira o DESTAQUE principal (.btn-principal, o mesmo
  // botão "cheio" que seria da compra), já que não há mais nada pra
  // comprar nesta página. aria-label no link entrega o contexto
  // completo (nome da peça) pra quem usa leitor de tela, mesmo o
  // texto visível do botão sendo genérico ("pelo WhatsApp").
  const encomendaHTML = !produtoDisponivel
    // Vendida: o bloco vira a ação principal da página, logo abaixo da
    // descrição (ver template). Botão gummy grande, sem prazo nem preço.
    ? `
      <div class="produto-encomenda produto-encomenda--indisponivel">
        <p class="produto-encomenda__status">Esta peça já encontrou um lar 🤎</p>
        <p class="produto-encomenda__texto">
          Gostou? Faça a sua encomenda do jeitinho que você quer.
        </p>
        <a
          class="btn-comprar-agora produto-encomenda__btn produto-encomenda__btn--grande"
          href="${linkEncomendaIndisponivel}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Encomendar uma peça como ${produto.nome} pelo WhatsApp">
          Encomendar uma peça assim
        </a>
      </div>`
    // Esgotada (estoque zerado, só Anjos de Luz): estoque TEMPORÁRIO —
    // a fornada nova repõe — por isso o recado e o link mudam (convite
    // de quantidade, não "peça parecida").
    : esgotada
    ? `
      <div class="produto-encomenda produto-encomenda--indisponivel">
        <p class="produto-encomenda__status">Esta fornada esgotou 🤎</p>
        <p class="produto-encomenda__texto">
          Em breve tem fornada nova. Quer encomendar em quantidade, para
          batizado ou Primeira Eucaristia? Fale com a Anasor.
        </p>
        <a
          class="btn-comprar-agora produto-encomenda__btn produto-encomenda__btn--grande"
          href="${linkEncomendaQuantidadeWhatsApp(produto)}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Encomendar ${produto.nome} pelo WhatsApp">
          Encomende o seu
        </a>
      </div>`
    : `
      <div class="produto-encomenda">
        <p class="produto-encomenda__texto">
          Cada peça é feita à mão e é única. Gostou deste modelo?
          A Anasor pode fazer uma peça parecida só para você.
        </p>
        <a
          class="btn-fantasma produto-encomenda__btn"
          href="${linkEncomenda}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir orçamento de uma peça parecida com ${produto.nome} pelo WhatsApp">
          Pedir orçamento pelo WhatsApp
        </a>
      </div>`;

  // "A definir" é o placeholder que fica em produtos.js até a Anasor
  // medir a peça/escrever os cuidados. AJUSTADO (Etapa 4, pedido
  // explícito — "Em breve" mostrando nas 44 peças do catálogo inteiro
  // passava a impressão de site incompleto):
  //   - DIMENSÕES "a definir": a linha inteira some (ver dimensoesHTML,
  //     mais abaixo) — não tem texto genérico que ajude quem está
  //     decidindo a compra sem a medida real.
  //   - CUIDADOS "a definir": mostra o texto PADRÃO de cuidados (o
  //     mesmo já usado em politicas.html, seção "Cuidados com a
  //     Peça"), por categoria — ao contrário de dimensão, cuidado
  //     genérico de cerâmica/crochê é verdadeiro pra QUALQUER peça da
  //     categoria, então não precisa esperar a Anasor escrever um
  //     texto específico pra cada uma.
  const ehIndefinido = (valor) => {
    const v = String(valor ?? '').trim().toLowerCase();
    return v === '' || v === 'a definir';
  };

  const CUIDADOS_PADRAO = {
    ceramica:
      'Lave à mão, com água morna e sabão neutro, evitando mudanças bruscas de temperatura. Pequenas variações de cor, textura e formato em relação às fotos são normais — fazem parte da autenticidade do trabalho manual.',
    croche: 'Lave à mão e seque à sombra, para preservar as fibras.',
  };

  // Dimensões: linha inteira SOME quando indefinida (string vazia:
  // nenhum <dt>/<dd> "Dimensões" no DOM) — ao contrário de Cuidados,
  // não existe um texto genérico verdadeiro pra QUALQUER peça (cada
  // peça tem um tamanho diferente), então mostrar "Em breve" só
  // lembrava quem está comprando que falta informação, sem ajudar.
  const dimensoesHTML = ehIndefinido(produto.dimensoes)
    ? ''
    : `
          <div class="detalhes-peca__linha">
            <dt>Dimensões</dt>
            <dd>${produto.dimensoes}</dd>
          </div>`;

  // Matéria-prima: campo OPCIONAL (só algumas peças têm). Mesma regra
  // das Dimensões — sem texto real, a linha nem entra no DOM, porque
  // não existe matéria-prima "genérica" verdadeira pra toda peça.
  const materiaPrimaHTML = ehIndefinido(produto.materiaPrima)
    ? ''
    : `
          <div class="detalhes-peca__linha">
            <dt>Matéria-prima</dt>
            <dd>${produto.materiaPrima}</dd>
          </div>`;

  // Cuidados: indefinido -> texto PADRÃO da categoria (sempre
  // verdadeiro, não precisa esperar a Anasor escrever um texto
  // específico pra esta peça); "|| .ceramica": fallback defensivo se
  // um dia existir uma categoria nova sem entrada em CUIDADOS_PADRAO
  // ainda (hoje as únicas são "ceramica"/"croche", as 2 cobertas).
  const textoCuidados = ehIndefinido(produto.cuidados)
    ? CUIDADOS_PADRAO[produto.categoria] || CUIDADOS_PADRAO.ceramica
    : produto.cuidados;

  container.innerHTML = `
    <div class="produto-detalhe__midia">
      <div class="galeria">
        <!-- foto grande (eager: é a 1ª coisa visível), setas, dots e
             miniaturas: o mesmo molde da Home, ver galeriaHTML (main.js) -->
        ${galeriaHTML(imagens, produto.nome, { eager: true, molduraFixa: anjoDeLuz, foco: produto.focoPrincipal })}

        <!-- VÍDEO DA PEÇA (campo opcional produto.videoUrl). DECISÃO DE
             DESIGN: em vez de misturar o vídeo como mais um "slide"
             navegável dentro da galeria de fotos acima, ele ganha um
             bloco PRÓPRIO, logo abaixo dela. O motivo é técnico: a
             galeria de fotos troca a mídia trocando apenas o "src" de
             um <img> fixo (ver irParaIndice, em ativarGaleriaDeFotos,
             js/main.js) — todo item ali PRECISA ser uma imagem. Encaixar
             um vídeo como slide exigiria trocar o próprio elemento
             (<img> <-> <video>) a cada navegação, e ainda tratar o caso
             de o usuário navegar pra OUTRA foto com o vídeo tocando (o
             áudio seguiria rolando fora de tela). Um bloco separado evita
             essa complexidade inteira e usa a tag <video> nativa do
             navegador (controles prontos, sem biblioteca externa) — o
             mesmo espírito "zero dependência" já usado no resto do site.
             poster = a foto principal, pra não haver quadro preto antes
             do play.

             CORREÇÃO DE BUG (vídeo quebrado/inclicável ao rolar a
             página): este bloco morava FORA de <div class="galeria">,
             como IRMÃO dela dentro de .produto-detalhe__midia. No
             desktop, .galeria é position:sticky (ela "acompanha" a
             rolagem, presa a top:6rem, enquanto viaja pela altura toda
             da coluna de texto ao lado — bem mais alta). O bloco de
             vídeo, por não ser sticky, ficava PARADO na posição normal
             do fluxo do documento — então, ao rolar a página, a galeria
             (sticky) deslizava por cima do espaço onde o vídeo estava
             "parado", cobrindo-o visualmente e interceptando os
             cliques (o elemento sticky, por vir antes no DOM/pilha de
             empilhamento, ficava por cima e roubava os cliques que
             deveriam ir para o <video>). A correção é estrutural: o
             vídeo passou a ser o ÚLTIMO FILHO de .galeria, então ele
             faz parte do MESMO bloco sticky — rola junto com as fotos
             como uma unidade só, sempre logo abaixo delas, sem nunca
             ser sobreposto. -->
        ${
          produto.videoUrl
          ? `<div class="produto-video">
              <p class="produto-video__legenda">Veja a peça em vídeo</p>
              <video
                class="produto-video__player foto-emoldurada"
                src="${produto.videoUrl}"
                poster="${produto.imagem}"
                muted
                controls
                preload="metadata"
                playsinline>
                Seu navegador não suporta vídeo em HTML5.
              </video>
            </div>`
          : ''
      }
      </div>
      <!-- ^ fecha .galeria — o vídeo (acima) agora é filho dela, não
           mais irmão fora dela (ver comentário da correção de bug). -->
    </div>

    <div class="produto-detalhe__info">
      <!-- SELO "PEÇA ÚNICA": badge com ícone de mão (✋). Anjos de Luz
           (permiteQuantidade) são a ÚNICA exceção de "peça única" do
           catálogo — "Peça Única" seria falso bem ao lado do seletor
           de quantidade, por isso o texto muda pra eles. -->
      <p class="selo-unica">
        <span class="selo-unica__icone" aria-hidden="true">&#9995;</span>
        ${anjoDeLuz ? 'Feito à Mão, um a um' : 'Peça Única &mdash; Feita à Mão'}
      </p>

      <!-- Selo da peça (Vendido, Peça Assinada...) ao lado do título,
           o mesmo que aparece na foto do card -->
      <div class="produto-detalhe__titulo-linha">
        <h1>${produto.nome}</h1>
        ${renderSeloPeca(produto, 'selo-peca--titulo')}
      </div>

      <!-- Texto de autenticidade. Tom inspirado na própria loja da
           Anasor (lírico, "moldada à mão com carinho"), somado ao
           aviso — comum em lojas artesanais — de que variações são
           esperadas e não são defeito. -->
      <p class="produto-detalhe__nuance">
        ${anjoDeLuz
          ? `Modelado à mão no ateliê, um a um. Por ser artesanal, pode
             trazer pequenas variações de cor, textura e formato em
             relação às fotos &mdash; cada diferença dessas é marca do
             feito à mão, não um defeito.`
          : `Peça única, modelada e pintada à mão no ateliê. Por ser
             artesanal, pode trazer pequenas variações de cor, textura e
             formato em relação às fotos &mdash; cada diferença dessas é
             marca do feito à mão, não um defeito, e é o que torna a sua
             peça a única igual a ela no mundo.`}
      </p>

      <p class="produto-detalhe__descricao">${produto.descricao}</p>

      <!-- Vendida OU esgotada: o convite para encomendar sobe para logo
           depois da descrição, porque é a única ação possível com esta
           peça (ver podeComprar, mais acima). -->
      ${podeComprar ? '' : encomendaHTML}

      <!-- MINI-VITRINE: 2-3 fotos extras da peça (outros ângulos),
           logo abaixo do texto, cada uma na moldura de quadro
           (.foto-emoldurada). Reaproveita as imagens que já existem em
           img/produtos/angulos-extras/ (campo imagensExtras). O "|| []"
           protege peças sem fotos extras; slice(0,3) limita a 3. alt=""
           porque a galeria principal acima já descreve a peça — aqui
           são reforço visual, não conteúdo novo. -->
      ${
        (produto.imagensExtras || []).length
          ? `<div class="descricao-galeria">
              ${produto.imagensExtras
                .slice(0, 3)
                .map(
                  (src) =>
                    `<img class="foto-emoldurada" src="${src}" alt="" loading="lazy">`
                )
                .join('')}
            </div>`
          : ''
      }

      <!-- PREÇO: Anjo de Luz usa renderPrecoQuantidade() (as DUAS
           faixas, unidade + atacado) em vez do "de/por" comum — o
           preço dele depende de quantos estão no carrinho, nunca é um
           valor fixo (ver precoUnitario, produtos.js). Os outros
           produtos continuam com renderBlocoPreco() de sempre. -->
      ${podeComprar ? (anjoDeLuz ? renderPrecoQuantidade(produto, { classeExtra: 'produto-detalhe__preco' }) : renderBlocoPreco(produto, { classeExtra: 'produto-detalhe__preco' })) : ''}
      ${podeComprar ? (anjoDeLuz ? renderSeloFeitoAMao() : renderSeloEscassez()) : ''}

      <!-- AÇÕES: cada peça comum é única (estoque sempre 1), sem
           seletor de quantidade. Anjo de Luz é a ÚNICA exceção
           (permiteQuantidade) — ganha o seletor +/-, travado entre 1 e
           o estoque do modelo (produto.estoque), e o botão fixo de
           encomenda em quantidade (batizado/Primeira Eucaristia), que
           o pedido pede sempre visível nesta página. "Adicionar ao
           Carrinho" só aparece quando podeComprar (nem vendida, nem
           esgotada) — do contrário o bloco "Encomende"
           (encomendaHTML, mais acima/abaixo) vira a ação principal. -->
      ${podeComprar ? `
      <div class="produto-detalhe__acoes">
        ${anjoDeLuz ? `
        <div class="seletor-quantidade" role="group" aria-label="Quantidade de ${produto.nome}">
          <button type="button" class="seletor-quantidade__passo" data-passo="-1" aria-label="Diminuir quantidade">&minus;</button>
          <span class="seletor-quantidade__valor" data-quantidade-valor>1</span>
          <button type="button" class="seletor-quantidade__passo" data-passo="1" aria-label="Aumentar quantidade">&plus;</button>
        </div>
        <p class="seletor-quantidade__aviso" data-quantidade-aviso hidden></p>` : ''}

        <button class="btn-comprar">${estaNoCarrinho(produto.id) ? TEXTO_NO_CARRINHO : 'Adicionar ao Carrinho'}</button>

        <!-- Botão WhatsApp: target="_blank" abre em nova aba;
             rel="noopener" impede que a nova aba acesse esta via
             window.opener (boa prática de segurança). -->
        <a class="btn-whatsapp" href="${linkWhats}" target="_blank" rel="noopener">
          <span aria-hidden="true">&#128172;</span>
          Tirar dúvidas sobre esta peça
        </a>

        ${anjoDeLuz ? `
        <a class="btn-fantasma produto-encomenda__btn" href="${linkEncomendaQuantidadeWhatsApp(produto)}"
           target="_blank" rel="noopener noreferrer"
           aria-label="Encomendar ${produto.nome} em quantidade pelo WhatsApp">
          Encomendar em quantidade (batizado, Primeira Eucaristia, lembranças)
        </a>` : ''}
      </div>` : ''}

      <!-- "ENCOMENDE SUA PEÇA ÚNICA" (ideia da mãe da Anasor, pedido
           explícito): na peça disponível fica aqui; na vendida já
           apareceu logo depois da descrição. -->
      ${podeComprar ? encomendaHTML : ''}

      <!-- SELOS DE CONFIANÇA: logo ABAIXO do botão de compra (pedido) —
           é onde o "posso confiar nessa compra?" bate mais forte. HTML
           montado por renderSelosConfianca(), igual ao da Home. -->
      ${renderSelosConfianca()}

      <!-- DETALHES DA PEÇA: dimensoes/materiaPrima/cuidados vêm de produtos.js. <dl>
           (lista de descrição) é a tag semântica certa pra pares
           "rótulo / valor". O <h2> fica FORA do <dl> porque <dl> só
           aceita <dt>, <dd> e <div> como filhos. dimensoesHTML/
           textoCuidados (calculados acima, antes deste template) —
           ver o comentário completo lá: Dimensões pode sumir
           inteira, Cuidados sempre mostra algo (texto real ou o
           padrão da categoria). -->
      <div class="detalhes-peca">
        <h2 class="detalhes-peca__titulo">Detalhes da Peça</h2>
        <dl>${dimensoesHTML}${materiaPrimaHTML}
          <div class="detalhes-peca__linha">
            <dt>Cuidados</dt>
            <dd>${textoCuidados}</dd>
          </div>
        </dl>

        <!-- Link discreto pra Políticas — pedido explícito: "próximo às
             informações de cuidados/dimensões". Fica DENTRO de
             .detalhes-peca (não solto na página) porque é exatamente
             aqui que a dúvida "e se eu precisar trocar?" nasce — logo
             depois de ler como cuidar da peça. Mesma classe
             ".checkout-link-politicas" do link equivalente em
             checkout.html (CSS compartilhado, style.css — texto
             pequeno, --cor-secundaria, sem chamar mais atenção que o
             preço/botão de compra acima). href aponta pra
             "#trocas-devolucoes" (achado do code-review, Etapa 4): o
             texto do link já é "Consulte nossa Política de Trocas" —
             agora que politicas.html tem esse id dedicado, cair
             direto nele poupa a pessoa de procurar a seção certa
             sozinha, igual ao link equivalente em checkout.html. -->
        <a href="politicas.html#trocas-devolucoes" class="checkout-link-politicas">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Consulte nossa Política de Trocas
        </a>
      </div>
    </div>

    ${anjoDeLuz ? barraDoBarroALuzHTML() : ''}
  `;

  // Dados que o carrinho (main.js) lê do ancestral [data-id] do
  // botão "Adicionar ao Carrinho". Mesmo esquema dos cards da Home —
  // "imagem" incluída pro item salvo no carrinho já levar a foto
  // (correção do bug de foto sumindo no mini-carrinho; ver o
  // comentário completo em adicionarAoCarrinho, js/main.js).
  container.dataset.id = produto.id;
  container.dataset.nome = produto.nome;
  container.dataset.preco = produto.preco;
  container.dataset.imagem = produto.imagem;

  container.hidden = false;

  // Só depois do HTML estar na página dá pra ligar os cliques da
  // galeria. ativarGaleriaDeFotos() MUDOU DE ENDEREÇO: virou
  // ativarGaleriaDeFotos(container, imagens) em js/main.js (mesmo
  // motivo do renderSeloEscassez logo abaixo) — assim ela fica no
  // arquivo carregado nas duas páginas, pronta pra qualquer galeria
  // de miniaturas futura sem duplicar a lógica de "trocar a foto
  // grande". A "Escolha do Ateliê" da Home usa esta mesma função:
  // mudar aqui muda as duas galerias. "imagens" já foi montado lá em
  // cima (principal + imagensExtras).
  ativarGaleriaDeFotos(container, imagens);

  // ---------- SELETOR DE QUANTIDADE (só Anjo de Luz, ver anjoDeLuz) ----------
  // Registra "container" em elementosComQuantidade (declarado no topo do
  // arquivo) pra adicionarAoCarrinho (main.js) ler a quantidade certa
  // do data-id mais próximo do botão clicado — tanto faz se o clique
  // veio do bloco de ações daqui ou da barra flutuante (mais abaixo),
  // as duas compartilham "quantidadeEscolhida".
  if (anjoDeLuz && podeComprar) {
    elementosComQuantidade.push(container);
    container.dataset.quantidade = '1';

    const valorEl = container.querySelector('[data-quantidade-valor]');
    const avisoEl = container.querySelector('[data-quantidade-aviso]');
    const btnMenos = container.querySelector('.seletor-quantidade__passo[data-passo="-1"]');
    const btnMais = container.querySelector('.seletor-quantidade__passo[data-passo="1"]');
    const limite = Number(produto.maxPorPedido) || 1;

    // Aviso só aparece ao ESBARRAR no teto (nunca "restam X" solto na
    // tela, ver regra do pedido) — e aí sim mostra o número real,
    // porque virou uma informação FUNCIONAL ("por que o botão + travou
    // aqui?"), não uma urgência fabricada.
    function atualizarSeletor() {
      valorEl.textContent = String(quantidadeEscolhida);
      btnMenos.disabled = quantidadeEscolhida <= 1;
      btnMais.disabled = quantidadeEscolhida >= limite;
      if (quantidadeEscolhida >= limite) {
        avisoEl.hidden = false;
        avisoEl.innerHTML =
          `Temos ${limite} unidades deste modelo prontas; para mais que isso, é por encomenda. ` +
          `<a href="${linkEncomendaQuantidadeWhatsApp(produto, limite)}" target="_blank" rel="noopener noreferrer">Encomendar em quantidade</a>`;
      } else {
        avisoEl.hidden = true;
        avisoEl.textContent = '';
      }
    }

    btnMenos.addEventListener('click', () => {
      sincronizarQuantidade(Math.max(1, quantidadeEscolhida - 1));
      atualizarSeletor();
    });
    btnMais.addEventListener('click', () => {
      sincronizarQuantidade(Math.min(limite, quantidadeEscolhida + 1));
      atualizarSeletor();
    });

    atualizarSeletor();
  }
}


// ============================================================
//  PRODUTOS RELACIONADOS — carrossel "premium", igual ao da Home
// ============================================================
// Hash FNV-1a do par (peça aberta, candidata). Desempata a afinidade
// de um jeito que muda de uma página para outra, mas é sempre o mesmo
// na mesma página: nada pisca nem muda ao recarregar.
function hashPar(idAberta, idCandidata) {
  let h = 2166136261;
  for (const c of `${idAberta}:${idCandidata}`) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Upsell por afinidade: mesma subcategoria (+3) vem antes de mesma
// categoria (+1), e preço parecido (±35%, +1) desempata dentro de cada
// grupo. Como a subcategoria sempre implica a categoria, ela soma 4 e
// nunca perde para uma peça só da mesma categoria (máximo 2): a lista
// já sai "subcategoria, depois categoria, depois o resto".
// Vendidas ficam fora: aqui a ideia é sugerir o que dá para comprar.
// Limite como parâmetro (e não const de módulo): montarRelacionados()
// roda no topo deste arquivo, antes de uma const declarada aqui existir.
// 7 + o card "Ver todos" = 8 cards: 2 slides cheios no desktop (4 por
// slide) e 4 no celular (2 por slide), sem slide com buraco no fim.
function escolherRelacionados(produto, catalogo = produtosVisiveis(), limite = 7) {
  const pontos = (p) =>
    (p.subcategoria === produto.subcategoria ? 3 : 0)
    + (p.categoria === produto.categoria ? 1 : 0)
    + (Math.abs(p.preco - produto.preco) <= produto.preco * 0.35 ? 1 : 0);
  return catalogo
    .filter((p) => p.id !== produto.id && !estaVendida(p))
    .map((p) => ({ p, pontos: pontos(p), desempate: hashPar(produto.id, p.id) }))
    .sort((a, b) => b.pontos - a.pontos || a.desempate - b.desempate)
    .slice(0, limite)
    .map(({ p }) => p);
}

// "Ver todos os pratos artísticos" / "Ver todas as canecas artísticas":
// o artigo segue o gênero da 1ª palavra da subcategoria (plural em -as).
// Peça sem subcategoria (o crochê ainda não tem): cai para "peças".
function rotuloVerTodos(sub = 'peças') {
  const feminino = /as$/i.test(sub.split(' ')[0]);
  return `Ver ${feminino ? 'todas as' : 'todos os'} ${sub.toLowerCase()}`;
}

function linkDaSubcategoria(produto) {
  if (produto.categoria !== 'ceramica') return 'croche.html';
  return produto.subcategoria ? `ceramica.html?sub=${slugificar(produto.subcategoria)}` : 'ceramica.html';
}

function montarRelacionados(produto) {
  const relacionados = escolherRelacionados(produto);

  // Categoria com poucas peças pode não sobrar nenhuma: deixa a
  // seção escondida.
  if (relacionados.length === 0) return;

  const hrefSub = linkDaSubcategoria(produto);
  const verTodos = rotuloVerTodos(produto.subcategoria);
  // Último "card" do carrossel leva à subcategoria inteira: quem chegou
  // ao fim das sugestões ainda quer ver mais do mesmo tipo
  const cardVerTodos = `
    <a class="produto-card produto-card--ver-todos reveal" href="${hrefSub}">
      <span class="produto-card--ver-todos__texto">${verTodos}</span>
    </a>`;
  const criarCard = (item) => (item === null ? cardVerTodos : criarCardProduto(item));

  // data-grade-produtos + data-manual: o PRIMEIRO atributo é o que
  // main.js usa pra reconhecer "esta é uma grade-carrossel" (mesmo
  // seletor do CSS do carrossel premium, style.css) — sem ele, nada
  // do tratamento de desktop (setas, dots refinados) se aplicaria
  // aqui, e teríamos que duplicar todo aquele CSS/JS só pra esta
  // seção. O SEGUNDO (data-manual) avisa aplicarEExibir() (main.js)
  // pra NÃO tentar preencher esta grade sozinha: ali o preenchimento
  // é "por categoria inteira"; aqui é "por RELAÇÃO" (mesma categoria,
  // id diferente, no máximo 4) — uma lógica que só esta função sabe
  // fazer. Sem data-manual, a primeira busca ou redimensionamento de
  // janela em QUALQUER página apagaria essas peças (ver o guard em
  // aplicarEExibir, main.js).
  //
  // montarSlidesCarrossel + cardsPorSlideCarrossel: as MESMAS funções
  // que agrupam os cards da Home em slides de 2 (mobile) ou 4
  // (desktop) — nenhuma lógica nova, só reaproveitada aqui.
  //
  // TÍTULO "Mais Tesouros do Ateliê" com um ícone "sparkles" da Lucide.
  // O SVG vem COLADO inline (mesma escolha do resto do site — ver os
  // selos de confiança na index.html): zero requisição, zero JS de
  // biblioteca, e o stroke="currentColor" faz o ícone herdar a cor do
  // CSS. O <span class="tesouros-titulo"> agrupa ícone + texto num
  // inline-flex pra eles ficarem centralizados juntos (o <h2> da
  // .queridinhos é text-align:center e tem a linhinha decorativa no
  // ::after — nada disso quebra com o span dentro). A animação de
  // brilho/pulso do ícone está em produto.css (.tesouros-titulo__icone).
  relacionadosSecao.innerHTML = `
    <h2 class="reveal">
      <span class="tesouros-titulo">
        <svg class="tesouros-titulo__icone" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
        </svg>
        ${produto.subcategoria ? `Mais ${produto.subcategoria} do Ateliê` : 'Mais Tesouros do Ateliê'}
      </span>
    </h2>
    <p class="relacionados__ver-todos reveal"><a href="${hrefSub}">${verTodos}</a></p>
    <div class="produtos-grid" data-grade-produtos="relacionados" data-manual>
      ${montarSlidesCarrossel([...relacionados, null], cardsPorSlideCarrossel(), criarCard)}
    </div>
  `;
  relacionadosSecao.hidden = false;

  // o <h2> e os cards (criarCardProduto já traz .reveal) foram
  // criados agora -> registra no observador do main.js pra
  // animarem ao entrar na tela. Sem esta chamada, os cards
  // ficariam presos em opacity:0 (o main.js só escaneia no início).
  escanearReveal();

  // monta/atualiza as setas + os dots deste carrossel (mesma função
  // da Home). Idempotente: pode ser chamada de novo (ver o listener
  // de breakpoint logo abaixo) sem duplicar nada.
  sincronizarDotsCarrossel();
}

// Cruzar o breakpoint 768/769px muda quantos cards cabem por slide
// (cardsPorSlideCarrossel(), main.js) — na Home isso é resolvido pelo
// mqCarrosselDesktop de main.js chamando aplicarEExibir() de novo,
// mas aquela função agora IGNORA grades data-manual (ver o guard nela
// — é exatamente esta grade). Então esta página cuida do seu próprio
// reagrupamento: re-chamar montarRelacionados(produto) refaz a lista
// (idempotente, os MESMOS 4 relacionados) já agrupada no tamanho de
// slide atual. Só é registrado se a peça existir (o if/else lá
// embaixo só chama montarRelacionados quando "produto" é válido).
if (produto) {
  window.matchMedia('(min-width: 769px)').addEventListener('change', () => {
    montarRelacionados(produto);
  });
}


// ============================================================
//  ANIMAÇÃO DOS SELOS DE CONFIANÇA — "pulinho" dos ícones ao rolar
// ============================================================
// O pedido foi: "animação sutil EM JAVASCRIPT nesses ícones (leve
// bounce/pulso ao entrar na tela via scroll reveal, reaproveitando o
// sistema de reveal já existente — classe .reveal)".
//
// COMO ISSO CONVERSA COM O REVEAL QUE JÁ EXISTE:
//   - o CARD inteiro (.selo) já tem .reveal -> ganha o fade+slide
//     padrão do site (o observador de main.js cuida disso);
//   - AQUI a gente adiciona um SEGUNDO efeito, só pros ÍCONES: um
//     "bounce" curto. Ele precisa de um observador PRÓPRIO porque o
//     de main.js: (a) é fechado (não expõe callback), e (b) LIMPA as
//     classes .reveal/.is-revealed quando a transição acaba — se o
//     bounce dependesse delas, sumiria no meio. Com uma classe
//     dedicada (.selo--visivel) o efeito fica sob nosso controle.
//   - o escalonamento (um ícone depois do outro) vem do data-selo-index
//     que renderSelosConfianca() gravou em cada card -> vira
//     animation-delay no CSS.
//
// prefers-reduced-motion: NÃO criamos o observador; os ícones ficam
// parados (o CSS .selo--visivel também zera a animação nesse caso, é
// cinto e suspensório). Sem IntersectionObserver (navegador antigo):
// marca todos como visíveis na hora — sem bounce, mas sem sumiço.
function animarSelosConfianca() {
  // garante que os .reveal dos selos (montados dentro de montarDetalhe)
  // entrem no observador de reveal do main.js mesmo se montarRelacionados
  // tiver saído cedo (peça sem relacionados) e não o tiver chamado.
  escanearReveal();

  const selos = document.querySelectorAll('.produto-selos .selo');
  if (!selos.length) return;

  const semMovimento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (!('IntersectionObserver' in window) || semMovimento) {
    selos.forEach((selo) => selo.classList.add('selo--visivel'));
    return;
  }

  const obs = new IntersectionObserver(
    (entradas, observador) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('selo--visivel'); // dispara o bounce (CSS)
        observador.unobserve(entrada.target); // anima 1x só
      });
    },
    // 35% do card visível: o bounce acontece quando o selo já "assomou"
    // de verdade, não no primeiro pixel.
    { threshold: 0.35 }
  );
  selos.forEach((selo) => obs.observe(selo));
}


// ============================================================
//  "COMPRAR AGORA" FLUTUANTE
//  (cartão no canto no desktop · barra no rodapé no mobile)
// ============================================================
// PROBLEMA QUE RESOLVE: a pessoa rola a página da peça pra ler
// descrição/detalhes e o botão de compra fica lá em cima, fora de
// vista. Este elemento traz a ação de volta pro alcance do polegar/
// mouse o tempo todo, sem precisar rolar pra cima.
//
// DUAS FORMAS, MESMO ELEMENTO (decidido no CSS, por media query):
//   - DESKTOP (> 768px): um CARTÃO discreto no canto inferior direito
//     — miniatura da foto + nome + preço + botão — com fundo
//     --cor-card, cantos arredondados e sombra suave. Uma barra
//     esticada de ponta a ponta chamaria atenção demais numa tela
//     larga onde sobra espaço.
//   - MOBILE (<= 768px): a barra fixa esticada na base da tela, que
//     aproveita melhor a largura estreita e o polegar já mira ali.
//   O JS monta UM só HTML (com a miniatura); .barra-compra em
//   produto.css é "mobile-first" (barra) e um @media (min-width:769px)
//   vira cartão. A miniatura fica escondida no mobile (barra estreita).
//
// COMO FUNCIONA:
//   - criado via JS (não no HTML) porque só existe quando há um
//     produto válido — mesma lógica do "voltar ao topo"/toast do
//     main.js, que também nascem via JS;
//   - começa escondida (fora da tela, opacity 0). Ela só desliza pra
//     cima com fade (transição no CSS: .barra-compra / .is-visivel)
//     quando AS DUAS condições valem juntas: (A) o usuário já rolou
//     pra além da imagem principal E (B) o botão de compra REAL saiu
//     da tela. O "porquê de serem duas" está detalhado no bloco de
//     comentário dentro da função (resumo: só A falha no desktop
//     sticky, só B falha no mobile — onde a barra apareceria no load);
//   - o botão dentro dela é um <button class="btn-comprar-agora">, a
//     MESMA classe dos cards: o listener DELEGADO do main.js
//     (document.addEventListener('click', ...)) já cuida dele —
//     adiciona ao carrinho e abre o mini-carrinho. Pra esse listener
//     achar os dados da peça, a própria barra leva data-id / data-nome
//     / data-preco (ele faz botao.closest('[data-id]')).
//
// NÃO SOBREPOR outros elementos fixos: enquanto a barra está visível,
// adicionamos a classe .tem-barra-compra no <body>. O produto.css usa
// essa classe pra empurrar pra cima o botão "voltar ao topo" e o
// toast (ambos ancorados no rodapé da tela), pra nada ficar escondido
// atrás da barra.
function montarBarraCompraFlutuante(produto) {
  // Esgotada (estoque zerado, só Anjo de Luz) entra no MESMO ramo
  // "indisponível" da barra — ela já sabia trocar o botão por um link
  // de WhatsApp; só o texto do botão/preço muda conforme o motivo.
  const vendida = produto.disponivel === false;
  const esgotada = estaEsgotada(produto);
  const disponivel = !vendida && !esgotada;

  const barra = document.createElement('div');
  // modificador ".barra-compra--indisponivel": só muda o botão (ver
  // abaixo) — o resto da barra (miniatura, nome, preço) é igual nos
  // dois casos, então não precisou de nenhum CSS novo pra esta classe,
  // ela só marca o estado pra quem for ler o HTML/depurar no futuro.
  barra.className = disponivel ? 'barra-compra' : 'barra-compra barra-compra--indisponivel';
  // dados que o carrinho (main.js) lê do ancestral [data-id] do botão
  // ("imagem" incluída pelo mesmo motivo do container principal, logo
  // acima nesta função — correção do bug de foto sumindo no mini-carrinho)
  barra.dataset.id = produto.id;
  barra.dataset.nome = produto.nome;
  barra.dataset.preco = produto.preco;
  barra.dataset.imagem = produto.imagem;

  // Preço compacto: se estiver em promoção, mostra o valor cheio
  // riscado + o atual; senão, só o preço. Reaproveita a mesma ideia
  // do renderBlocoPreco, mas aqui é uma versão enxuta pra caber na
  // barra estreita (sem selo, textos menores — ver .barra-compra__preco).
  // Vendida/esgotada: nada de preço na barra, só o estado da peça.
  const precoHTML = vendida
    ? '<strong>Peça vendida</strong>'
    : esgotada
    ? '<strong>Esgotado</strong>'
    : estaEmPromocao(produto)
    ? `<s>${formatarPreco(produto.precoOriginal)}</s>
       <strong>${formatarPreco(produto.preco)}</strong>`
    : `<strong>${formatarPreco(produto.preco)}</strong>`;

  // BOTÃO PRINCIPAL da barra — MUDA conforme a disponibilidade:
  //   disponível   -> <button class="btn-comprar-agora"> de verdade:
  //                   o listener delegado (main.js) adiciona ao
  //                   carrinho E abre o mini-carrinho, igual a
  //                   qualquer outro "Comprar Agora" do site.
  //   indisponível -> <a class="btn-comprar-agora" href="wa.me/...">:
  //                   MESMA classe (reaproveita o visual "gomoso" 3D
  //                   inteiro, sem duplicar CSS), mas é um <a>, não um
  //                   <button> — o listener delegado de main.js só
  //                   reage a "button.btn-comprar-agora" exatamente
  //                   pra este link NÃO disparar "adicionar ao
  //                   carrinho" como efeito colateral do clique (ver
  //                   comentário grande no listener, main.js). O clique
  //                   em si só faz o <a> navegar (nova aba) pro
  //                   WhatsApp, como qualquer link.
  //   "🤎" no rótulo: mesmo emoji-assinatura já usado em outros
  //   títulos do site (ex.: "Cerâmica no Seu Café da Tarde 🤎") — aqui
  //   reforça a chamada principal da barra sem precisar de um ícone
  //   SVG novo.
  const botaoHTML = disponivel
    ? `<button class="btn-comprar-agora" type="button" aria-label="Comprar ${produto.nome} agora">Comprar Agora 🤎</button>`
    : esgotada
    ? `<a class="btn-comprar-agora" href="${linkEncomendaQuantidadeWhatsApp(produto)}" target="_blank" rel="noopener noreferrer" aria-label="Encomendar ${produto.nome} pelo WhatsApp">Encomende o seu</a>`
    : `<a class="btn-comprar-agora" href="${linkEncomendaWhatsApp(produto, { indisponivel: true })}" target="_blank" rel="noopener noreferrer" aria-label="Encomendar uma peça parecida com ${produto.nome} pelo WhatsApp">Encomendar peça parecida</a>`;

  // BOTÃO COMPACTO "adicionar ao carrinho" — AVALIADO e DESCARTADO
  // (pedido deixava explicitamente condicional: "se couber sem
  // poluir"). Medido com Playwright (iPhone 15, 393px): a barra já
  // reserva espaço pra miniatura (46px) + o CTA principal, que
  // precisa ficar INTEIRO pra mostrar "Comprar Agora 🤎" sem cortar
  // (pedido explícito de não truncar o CTA) — sobrava só ~38px pra
  // nome+preço, a ponto do nome virar 1-2 letras + "...". Um 3º
  // elemento (botão extra) espremeria ainda mais esse espaço — mais
  // perto de "poluir" do que de ajudar. Mantido FORA da barra mobile;
  // nada impede adicionar depois se o layout mudar.

  // A miniatura usa a MESMA foto principal do produto (mesma URL ->
  // o navegador reaproveita do cache, não baixa de novo). alt="" +
  // aria-hidden: é decorativa (o nome ao lado já identifica a peça),
  // então não precisa ser anunciada por leitor de tela. Aparece no
  // mobile TAMBÉM agora (antes só no cartão do desktop — pedido
  // explícito desta rodada: "chamada mais visível e bonita", a foto
  // ajuda a reconhecer a peça de relance). loading="lazy"
  // (achado da auditoria, item 9): a barra só aparece depois de rolar
  // a página — consistente com o resto do site, nenhuma <img> fica
  // sem o atributo.
  barra.innerHTML = `
    <img class="barra-compra__thumb" src="${produto.imagem}" alt="" aria-hidden="true" loading="lazy">
    <div class="barra-compra__info">
      <span class="barra-compra__nome">${produto.nome}</span>
      <span class="barra-compra__preco">${precoHTML}</span>
    </div>
    ${botaoHTML}
  `;
  document.body.appendChild(barra);

  // Anjo de Luz comprável por aqui: a barra entra na MESMA lista
  // (elementosComQuantidade, topo do arquivo) que o seletor +/- da
  // página usa — assim "Comprar Agora" nesta barra também leva a
  // quantidade escolhida lá em cima, não sempre 1.
  if (produto.grupoAtacado === 'anjos-de-luz' && disponivel) {
    elementosComQuantidade.push(barra);
    barra.dataset.quantidade = String(quantidadeEscolhida);
  }

  // --- Mostrar/esconder conforme a rolagem ---
  // A barra só aparece quando AS DUAS coisas são verdade ao mesmo tempo:
  //
  //   (A) o usuário já ROLOU pra além da imagem principal
  //       -> é o "depois que rola um pouco a página (ex: passa da
  //          imagem principal)" do pedido; e
  //   (B) o botão de compra REAL ("Adicionar ao Carrinho", dentro de
  //       .produto-detalhe__acoes) NÃO está mais visível na tela
  //       -> enquanto ele está à vista, a barra flutuante seria
  //          redundante (dois botões de compra na mesma tela).
  //
  // POR QUE PRECISA DAS DUAS (e não só de B)?
  //   No CELULAR a página é uma coluna só e bem alta: a imagem ocupa
  //   ~70vh e o bloco de ações nasce MUITO abaixo da dobra. Só com a
  //   regra B, o observador já acha o botão real "fora da tela" no
  //   instante em que a página carrega (scrollY = 0) e a barra
  //   apareceria de cara, sem o usuário ter rolado nada — o oposto do
  //   pedido. A condição A ("passou da imagem") corrige isso.
  //
  // POR QUE PRECISA DE B (e não só de A)?
  //   No DESKTOP a galeria é sticky (position: sticky; top: 6rem — ver
  //   produto.css): a foto fica "presa" no topo enquanto a coluna de
  //   texto rola, então a condição A sozinha só viraria verdade lá no
  //   finzinho da página. B faz a barra surgir no momento natural:
  //   assim que o "Adicionar ao Carrinho" sai de vista.

  const imagemPrincipal = document.querySelector('.galeria__principal');
  // Peça vendida não tem bloco de ações: a referência passa a ser o
  // convite de encomenda, que ocupa o mesmo papel na página
  const botaoReal = document.querySelector('.produto-detalhe__acoes')
    || document.querySelector('.produto-encomenda--indisponivel');

  // LIMIAR de rolagem da condição (A): ~60% da altura renderizada da
  // imagem principal (com um piso de 160px pra peças com foto baixa).
  // "Passou de 60% da imagem" ≈ "já rolou um pouco / passou da imagem",
  // sem depender de a imagem ter saído 100% da tela (o que no desktop
  // sticky quase nunca acontece cedo).
  const alturaImagem = imagemPrincipal
    ? imagemPrincipal.getBoundingClientRect().height
    : 320;
  const LIMIAR_ROLAGEM = Math.max(160, Math.round(alturaImagem * 0.6));

  // Estado da condição (B). Começa "false" (botão real à vista) e é
  // atualizado pelo IntersectionObserver abaixo. No fallback sem
  // observer, ele é derivado direto da rolagem.
  let botaoRealForaDaTela = false;

  // Condição (C): a barra some enquanto os cards de "Mais ... do Ateliê"
  // ou o rodapé estão na tela. No desktop o cartão do canto cobria o
  // botão do último card; ali cada card já tem a própria compra.
  const zonasSemBarra = new Set();
  if ('IntersectionObserver' in window) {
    const observadorZonas = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? zonasSemBarra.add(e.target) : zonasSemBarra.delete(e.target)));
      atualizarBarra();
    });
    [relacionadosSecao, document.querySelector('footer')].filter(Boolean)
      .forEach((zona) => observadorZonas.observe(zona));
  }

  // Fonte única que liga/desliga a barra a partir das três condições.
  function atualizarBarra() {
    const jaPassouImagem = window.scrollY > LIMIAR_ROLAGEM;
    const deveMostrar = jaPassouImagem && botaoRealForaDaTela && zonasSemBarra.size === 0;
    barra.classList.toggle('is-visivel', deveMostrar);
    // .tem-barra-compra no <body> = o produto.css sobe o "voltar ao
    // topo" e o toast pra não ficarem escondidos atrás da barra.
    document.body.classList.toggle('tem-barra-compra', deveMostrar);
  }

  // Fallback (navegador sem IntersectionObserver, ou página sem o bloco
  // de ações): sem como saber se o botão real está na tela, tratamos a
  // condição (B) como "já rolou o suficiente" — ou seja, a barra passa
  // a depender só do limiar de rolagem. { passive:true } = promete não
  // chamar preventDefault, então a rolagem continua fluida.
  if (!('IntersectionObserver' in window) || !botaoReal) {
    window.addEventListener(
      'scroll',
      () => {
        botaoRealForaDaTela = window.scrollY > LIMIAR_ROLAGEM;
        atualizarBarra();
      },
      { passive: true }
    );
    atualizarBarra();
    return;
  }

  // Condição (B): observa o bloco de ações. isIntersecting = ele (ou
  // parte dele) ainda está na tela. rootMargin negativo no topo: só
  // conta como "fora" quando já subiu uns 40px além da borda de cima
  // — evita a barra piscar bem no limite exato do scroll.
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        botaoRealForaDaTela = !entrada.isIntersecting;
      });
      atualizarBarra();
    },
    { threshold: 0, rootMargin: '-40px 0px 0px 0px' }
  );
  observador.observe(botaoReal);

  // Condição (A): o observador acima só dispara quando o BLOCO DE AÇÕES
  // cruza a borda da tela; a rolagem "comum" (que muda o scrollY sem
  // esse cruzamento) precisa de um listener próprio pra reavaliar o
  // limiar. Sem isto, ao voltar ao topo a barra não sumiria.
  window.addEventListener('scroll', atualizarBarra, { passive: true });
  atualizarBarra();
}
