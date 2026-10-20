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

// ---------- "ENCOMENDE SUA PEÇA ÚNICA" — link de WhatsApp ----------
// Usado em 2 lugares desta página: o bloco .produto-encomenda (dentro
// de montarDetalhe) e a barra flutuante "Comprar Agora" no mobile
// (montarBarraCompraFlutuante, mais abaixo) — uma função só, pra não
// duplicar a mensagem/URL nos dois lugares.
// indisponivel:true troca a mensagem pra reconhecer que a peça já
// vendeu (mesma ideia de pedido, só o texto muda).
function linkEncomendaWhatsApp(produto, { indisponivel = false } = {}) {
  // URL da PRÓPRIA página (já inclui "?id=..."): usamos a URL de
  // verdade do navegador, não montamos "produto.html?id=" na mão, pra
  // nunca desalinhar se o domínio/caminho mudar.
  const urlPagina = window.location.href;
  const msg = indisponivel
    ? `Olá, Anasor! Vi a peça "${produto.nome}" no site, mas essa peça já foi vendida — gostaria de encomendar uma parecida. Podemos conversar sobre valores e prazo? ${urlPagina}`
    : `Olá, Anasor! Vi a peça "${produto.nome}" no site e gostaria de encomendar uma peça única parecida. Podemos conversar sobre valores e prazo? ${urlPagina}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;
}

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
  renderBreadcrumb(breadcrumb, [
    { rotulo: 'Home', href: 'index.html' },
    { rotulo: cat.rotulo, href: cat.href },
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

  // Miniaturas: cada uma é um <button> (controle de verdade, com
  // foco por teclado). data-src guarda qual imagem ela carrega na
  // foto grande ao ser clicada. A primeira já nasce "is-ativa".
  const miniaturasHTML = imagens
    .map(
      (src, i) => `
        <button
          class="galeria__thumb ${i === 0 ? 'is-ativa' : ''}"
          type="button"
          data-src="${src}"
          aria-label="Ver foto ${i + 1} de ${imagens.length}">
          <img src="${src}" alt="" loading="lazy">
        </button>`
    )
    .join('');

  // Bolinhas (dots) — pedido item 1, "iguais ao estilo já usado nos
  // outros carrosséis do site" (ex.: .banner-indicador, do carrossel
  // do banner da Home). Cada uma só guarda a POSIÇÃO (não data-src
  // como as miniaturas): ativarGaleriaDeFotos() (main.js) descobre o
  // índice pela ordem entre irmãos, mesmo esquema já usado ali pras
  // miniaturas — um jeito só de indexar em toda a galeria.
  const dotsHTML = imagens
    .map(
      (_, i) => `
        <button
          type="button"
          class="galeria__dot ${i === 0 ? 'is-ativo' : ''}"
          aria-label="Ver foto ${i + 1} de ${imagens.length}">
        </button>`
    )
    .join('');

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

  // Bloco HTML do convite — MUDA de visual conforme a disponibilidade:
  // disponível = discreto, .btn-fantasma (contorno), abaixo dos botões
  // de compra, pra não competir com "Adicionar ao Carrinho";
  // indisponível = vira o DESTAQUE principal (.btn-principal, o mesmo
  // botão "cheio" que seria da compra), já que não há mais nada pra
  // comprar nesta página. aria-label no link entrega o contexto
  // completo (nome da peça) pra quem usa leitor de tela, mesmo o
  // texto visível do botão sendo genérico ("pelo WhatsApp").
  const encomendaHTML = produtoDisponivel
    ? `
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
      </div>`
    : `
      <div class="produto-encomenda produto-encomenda--indisponivel">
        <p class="produto-encomenda__status">Esta peça já encontrou um lar.</p>
        <p class="produto-encomenda__texto">
          Mas você pode pedir uma parecida, feita especialmente para você.
        </p>
        <a
          class="btn-principal produto-encomenda__btn"
          href="${linkEncomendaIndisponivel}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Encomendar uma peça parecida com ${produto.nome} pelo WhatsApp">
          Encomendar peça parecida
        </a>
      </div>`;

  // "A definir" é o placeholder que fica em produtos.js até a Anasor
  // medir a peça e escrever os cuidados. Mostrar "A definir" cru não
  // ajuda quem está decidindo a compra — então, nesse caso, trocamos
  // por um convite pra tirar a dúvida no WhatsApp, no MESMO número/URL
  // do botão "Tirar dúvidas sobre esta peça" acima (linkWhats). Quando
  // o campo já estiver preenchido, o valor real aparece sem mudança.
  // A comparação é feita em minúsculas e sem espaços nas pontas pra
  // pegar "A definir", "a definir", " A definir " etc.
  const valorDetalhe = (valor) =>
    String(valor).trim().toLowerCase() === 'a definir'
      ? `Em breve &mdash; dúvidas? <a href="${linkWhats}" target="_blank" rel="noopener">Fale conosco no WhatsApp</a>`
      : valor;

  container.innerHTML = `
    <div class="produto-detalhe__midia">
      <div class="galeria">
        <!-- .galeria__principal-wrap: existe SÓ pra ancorar as setas
             (position:absolute precisa de um ancestral position:
             relative do tamanho EXATO da foto — não do <div class=
             "galeria"> inteiro, que também abriga miniaturas/dots
             abaixo; sem este wrapper próprio, as setas ficariam
             centralizadas na altura de TUDO, não da foto). -->
        <div class="galeria__principal-wrap">
          <!-- imagem grande = a primeira coisa visível ao abrir a página,
               então SEM loading="lazy" (carrega já). As miniaturas (acima,
               no map) são lazy: o usuário pode nem clicar nelas.
               .foto-emoldurada = a "moldura de quadro" (css/style.css),
               a MESMA classe usada na foto do "Quem Somos". -->
          <img class="galeria__principal foto-emoldurada" src="${produto.imagem}" alt="${produto.nome}" loading="eager">
          ${
            imagens.length > 1
              ? `
          <!-- SETAS (pedido item 1): MESMOS paths de seta (chevron)
               já usados no carrossel de produtos (.carrossel-seta) e
               no banner (.banner-seta) — reaproveitando o desenho, não
               reinventando um ícone novo. A cor/formato do botão em si
               vem de .galeria__seta (css/produto.css), estilo próprio
               MAS na mesma linguagem visual (círculo, sombra) dos
               outros dois. -->
          <button type="button" class="galeria__seta galeria__seta--anterior" aria-label="Foto anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button type="button" class="galeria__seta galeria__seta--proxima" aria-label="Próxima foto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>`
              : ''
          }
        </div>
        ${
          imagens.length > 1
            ? `<div class="galeria__dots" role="tablist" aria-label="Selecionar foto">${dotsHTML}</div>`
            : ''
        }
        ${
          imagens.length > 1
            ? `<div class="galeria__miniaturas">${miniaturasHTML}</div>`
            : ''
        }

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
      <!-- SELO "PEÇA ÚNICA": badge com ícone de mão (✋). -->
      <p class="selo-unica">
        <span class="selo-unica__icone" aria-hidden="true">&#9995;</span>
        Peça Única &mdash; Feita à Mão
      </p>

      <h1>${produto.nome}</h1>

      <!-- Texto de autenticidade. Tom inspirado na própria loja da
           Anasor (lírico, "moldada à mão com carinho"), somado ao
           aviso — comum em lojas artesanais — de que variações são
           esperadas e não são defeito. -->
      <p class="produto-detalhe__nuance">
        Peça única, modelada e pintada à mão no ateliê. Por ser
        artesanal, pode trazer pequenas variações de cor, textura e
        formato em relação às fotos &mdash; cada diferença dessas é
        marca do feito à mão, não um defeito, e é o que torna a sua
        peça a única igual a ela no mundo.
      </p>

      <p class="produto-detalhe__descricao">${produto.descricao}</p>

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

      <!-- PREÇO: reaproveita renderBlocoPreco() do main.js — a MESMA
           função que monta o "de/por" nos cards — pra a formatação do
           preço promocional (riscado + valor com desconto) existir num
           lugar só. comSelo:false: o selo "X% OFF" é coisa do card
           (grade), aqui na página da peça o "de/por" já basta. -->
      ${renderBlocoPreco(produto, { classeExtra: 'produto-detalhe__preco' })}
      ${renderSeloEscassez()}

      <!-- AÇÕES: sem seletor de quantidade de propósito — cada peça é
           única, o estoque é sempre 1. "Adicionar ao Carrinho" só
           aparece pra peça DISPONÍVEL — peça vendida (disponivel:
           false) não tem o que comprar, então o botão some e o bloco
           "Encomende sua peça única" (logo abaixo) vira a ação
           principal da página (ver encomendaHTML, mais acima). -->
      <div class="produto-detalhe__acoes">
        ${produtoDisponivel ? `<button class="btn-comprar">Adicionar ao Carrinho</button>` : ''}

        <!-- Botão WhatsApp: target="_blank" abre em nova aba;
             rel="noopener" impede que a nova aba acesse esta via
             window.opener (boa prática de segurança). -->
        <a class="btn-whatsapp" href="${linkWhats}" target="_blank" rel="noopener">
          <span aria-hidden="true">&#128172;</span>
          Tirar dúvidas sobre esta peça
        </a>
      </div>

      <!-- "ENCOMENDE SUA PEÇA ÚNICA" (ideia da mãe da Anasor, pedido
           explícito): em toda peça, disponível ou não — ver
           encomendaHTML, montado mais acima com o texto/estilo certo
           pra cada caso. -->
      ${encomendaHTML}

      <!-- SELOS DE CONFIANÇA: logo ABAIXO do botão de compra (pedido) —
           é onde o "posso confiar nessa compra?" bate mais forte. HTML
           montado por renderSelosConfianca(), igual ao da Home. -->
      ${renderSelosConfianca()}

      <!-- DETALHES DA PEÇA: dimensoes/cuidados vêm de produtos.js
           ("A definir" por enquanto). <dl> (lista de descrição) é a
           tag semântica certa pra pares "rótulo / valor". O <h2>
           fica FORA do <dl> porque <dl> só aceita <dt>, <dd> e <div>
           como filhos. -->
      <div class="detalhes-peca">
        <h2 class="detalhes-peca__titulo">Detalhes da Peça</h2>
        <dl>
          <div class="detalhes-peca__linha">
            <dt>Dimensões</dt>
            <dd>${valorDetalhe(produto.dimensoes)}</dd>
          </div>
          <div class="detalhes-peca__linha">
            <dt>Cuidados</dt>
            <dd>${valorDetalhe(produto.cuidados)}</dd>
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
             preço/botão de compra acima). -->
        <a href="politicas.html" class="checkout-link-politicas">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Consulte nossa Política de Trocas
        </a>
      </div>
    </div>
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
  // grande". (A seção "Peça em Destaque" da Home NÃO usa mais esta
  // função — tem a sua própria, ativarGiro360(), pra arrastar/girar;
  // ver main.js.) "imagens" já foi montado lá em cima (principal +
  // imagensExtras).
  ativarGaleriaDeFotos(container, imagens);
}


// ============================================================
//  PRODUTOS RELACIONADOS — carrossel "premium", igual ao da Home
// ============================================================
function montarRelacionados(produto) {
  // filter(): mesma categoria E id diferente do atual.
  // slice(0, 4): no máximo 4 — ERA 3 antes de existir o carrossel
  // desktop aqui. Trocado pra 4 porque cardsPorSlideCarrossel()
  // mostra 4 por slide no desktop (ver main.js): com 3 peças, a
  // última coluna do grid de 4 ficaria vazia (um "buraco" visual à
  // direita); com 4, o slide único do desktop fecha certinho. No
  // mobile (2 por slide) 4 peças viram 2 páginas — carrossel de
  // verdade também lá, sem gap nenhum.
  const relacionados = produtos
    .filter((p) => p.categoria === produto.categoria && p.id !== produto.id)
    .slice(0, 4);

  // Categoria com poucas peças pode não sobrar nenhuma: deixa a
  // seção escondida.
  if (relacionados.length === 0) return;

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
        Mais Tesouros do Ateliê
      </span>
    </h2>
    <div class="produtos-grid" data-grade-produtos="relacionados" data-manual>
      ${montarSlidesCarrossel(relacionados, cardsPorSlideCarrossel())}
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
  const disponivel = produto.disponivel !== false;

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
  const precoHTML = estaEmPromocao(produto)
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
  const botaoReal = document.querySelector('.produto-detalhe__acoes');

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

  // Fonte única que liga/desliga a barra a partir das duas condições.
  function atualizarBarra() {
    const jaPassouImagem = window.scrollY > LIMIAR_ROLAGEM;
    const deveMostrar = jaPassouImagem && botaoRealForaDaTela;
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
