// ============================================================
//  VERSIONAMENTO DE CACHE DOS ARQUIVOS (?v=N)
// ============================================================
// Todas as tags <link rel="stylesheet" href="css/..."> e
// <script src="js/..."> das páginas HTML terminam com "?v=N" (hoje N=29).
//
// POR QUÊ: o navegador guarda CSS/JS em cache com validade longa. Ao
// editar um desses arquivos durante o desenvolvimento, o navegador
// (e, pior, o de quem já visitou o site) pode continuar servindo a
// versão ANTIGA. Mudar a URL — mesmo que só o "?v=" no fim — faz o
// navegador enxergar um recurso "novo" e baixar de novo.
//
// COMO USAR: a cada mudança RELEVANTE em qualquer arquivo de css/ ou
// js/, incremente o número em TODAS as páginas (?v=2 -> ?v=3 -> ...).
// É manual de propósito, por enquanto: um passo simples e explícito.
// No futuro, quando houver uma etapa de "build" (ex.: Vite), esse
// número passa a ser gerado sozinho (hash do conteúdo do arquivo) e
// esta anotação sai daqui.
//
// (As URLs externas — Google Fonts — NÃO recebem "?v=": elas já têm
// os próprios parâmetros de versão e são cacheadas pela CDN do Google.)
// ============================================================


// ============================================================
//  MODO DEV — sinaliza texto/legenda PROVISÓRIOS na própria página
// ============================================================
// Alguns trechos do site (o texto do "Quem Somos", as legendas da
// galeria do ateliê) foram escritos por nós como RASCUNHO — ainda não
// são o relato definitivo da Anasor. Pra ninguém confundir rascunho
// com conteúdo aprovado, esses trechos ganham um aviso visual (borda
// tracejada + uma notinha, ver .conteudo-provisorio/.dev-aviso em
// style.css) — mas SÓ enquanto o site está em desenvolvimento: um
// cliente de verdade, no site publicado, não deve ver "texto
// provisório" escrito na tela.
//
// Como este projeto não tem build nem variável de ambiente (é HTML/
// CSS/JS puro), "estamos em desenvolvimento" é detectado pelo
// HOSTNAME: localhost/127.0.0.1 (como este projeto é testado) ou
// vazio (arquivo aberto direto, file://). Num domínio de verdade
// (ex.: anasorsobreira.com.br, ou qualquer hospedagem), o hostname
// não bate com nenhum desses e MODO_DEV vira false sozinho — ninguém
// precisa lembrar de "tirar o aviso antes de publicar".
const MODO_DEV = ['localhost', '127.0.0.1', ''].includes(location.hostname);
if (MODO_DEV) {
  document.documentElement.classList.add('modo-dev');
}

// Número do WhatsApp no formato que o link "wa.me" exige: só dígitos,
// com código do país (55) + DDD (21) + número — o mesmo (21) 98722-2679
// que aparece no rodapé. MOVIDO pra aqui (main.js, carregado em TODA
// página) porque antes só existia duplicado dentro de js/produto.js;
// agora que o form de contato (mais abaixo, nesta mesma Home) e
// js/croche.js também precisam dele, ter 1 cópia só evita o risco de
// uma ficar desatualizada se o número mudar um dia.
const WHATSAPP_NUMERO = '5521987222679';


// ============================================
//  MENU HAMBÚRGUER (mobile)
//  Abre e fecha a lista de links quando se toca no botão de 3 barras
// ============================================
// COMPORTAMENTO ESPERADO (o que foi corrigido aqui):
//   - abrir só a lista de links — NÃO uma tela cheia que tampa o
//     banner (o CSS cuida do tamanho: .nav-links.active tem
//     max-height + rolagem interna e, no celular, o submenu de
//     subcategorias fica escondido dentro do hambúrguer);
//   - fechar de todas as formas naturais: tocando de novo no
//     botão, tocando num link, tocando FORA do menu, ou apertando Esc;
//   - fechar sozinho se a tela crescer pro tamanho de desktop
//     (senão o menu "aberto" ficaria preso num estado que só existe
//     no mobile).
// Antes só existia o toggle no botão e o fechar-ao-clicar-num-link
// (e esse último nem pegava os links do submenu de Cerâmica, que são
// criados depois, em montarDropdownCeramica()).
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  // fonte única de verdade do estado -> as 3 coisas (classe do menu,
  // classe do botão "X", aria-expanded) nunca saem de sincronia
  function definirMenu(aberto) {
    navLinks.classList.toggle('active', aberto);
    menuToggle.classList.toggle('active', aberto);
    menuToggle.setAttribute('aria-expanded', String(aberto));
    // ao ABRIR o menu, garante o header visível: o menu mobile abre
    // "absolute" logo abaixo do header, então um header escondido
    // (auto-hide, ver bloco abaixo) levaria o menu junto pra fora da
    // tela.
    if (aberto) {
      document
        .querySelector('header')
        ?.classList.remove('header--oculto');
    }
  }
  const menuAberto = () => navLinks.classList.contains('active');
  const fecharMenu = () => definirMenu(false);

  // 1) botão hambúrguer: alterna abrir/fechar
  menuToggle.addEventListener('click', () => definirMenu(!menuAberto()));

  // 2) clique em qualquer link DENTRO do menu -> fecha.
  //    Delegado no .nav-links (um listener só) em vez de um por <a>:
  //    assim também pega os links do submenu de subcategorias, que
  //    só são criados mais tarde por montarDropdownCeramica().
  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) fecharMenu();
  });

  // 3) clique FORA do menu (e fora do próprio botão) -> fecha.
  //    Só registra o trabalho de verdade quando o menu está aberto.
  document.addEventListener('click', (e) => {
    if (!menuAberto()) return;
    const dentro = e.target.closest('.nav-links') || e.target.closest('.menu-toggle');
    if (!dentro) fecharMenu();
  });

  // 4) tecla Esc -> fecha (padrão de qualquer coisa "sobreposta";
  //    o mini-carrinho já faz igual mais abaixo neste arquivo)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuAberto()) fecharMenu();
  });

  // 5) passou pra largura de desktop com o menu aberto -> fecha.
  //    Em >768px o CSS volta a mostrar .nav-links como barra
  //    horizontal; deixar a classe .active pendurada não quebra
  //    nada visível, mas some com ela pra o estado ficar limpo.
  const mqDesktopMenu = window.matchMedia('(min-width: 769px)');
  mqDesktopMenu.addEventListener('change', (e) => {
    if (e.matches) fecharMenu();
  });
}

// ============================================================
//  HEADER AUTO-HIDE AO ROLAR  (só no mobile ≤768px)
// ============================================================
// IDEIA: no celular a tela é curta e o header (logo + carrinho + menu
// + busca) ocupa uma faixa fixa o tempo todo. Aqui ele:
//   - some (translateY(-100%), via classe .header--oculto no CSS) quando
//     a pessoa rola pra BAIXO (está "avançando na leitura");
//   - reaparece NA HORA ao rolar pra CIMA um tiquinho (pra o menu/
//     carrinho estarem sempre a um gesto de distância);
//   - fica sempre visível no TOPO da página (scrollY 0) e com o menu
//     hambúrguer aberto.
// SÓ no mobile: no desktop nunca tocamos na classe, então o header
// segue sticky e sempre visível. A barra de anúncio (frete grátis) não
// entra nisso — ela já rola junto com a página (position: static no
// mobile), comportamento definido antes.
//
// POR QUE NÃO EMPURRA O CONTEÚDO: o header é position:sticky (ocupa
// lugar no fluxo). Mexer só no transform o "desliza" pra fora da vista
// sem alterar o espaço que ele reserva -> zero "pulo" de layout.
(function headerAutoHide() {
  const header = document.querySelector('header');
  if (!header) return;

  const mqMobile = window.matchMedia('(max-width: 768px)');
  const MARGEM = 6; // px de folga: ignora microtremores de scroll/trackpad
  let ultimoY = window.scrollY;

  function aoRolar() {
    // desktop: assegura o header visível e não faz mais nada
    if (!mqMobile.matches) {
      header.classList.remove('header--oculto');
      ultimoY = window.scrollY;
      return;
    }

    const y = Math.max(0, window.scrollY);
    const menuAberto = navLinks && navLinks.classList.contains('active');

    if (y <= 0 || menuAberto) {
      // topo da página ou menu aberto -> sempre mostra
      header.classList.remove('header--oculto');
    } else if (y > ultimoY + MARGEM && y > header.offsetHeight) {
      // rolando pra BAIXO e já passou da altura do próprio header
      header.classList.add('header--oculto');
    } else if (y < ultimoY - MARGEM) {
      // rolando pra CIMA -> reaparece imediatamente
      header.classList.remove('header--oculto');
    }
    ultimoY = y;
  }

  // { passive: true } = promete não chamar preventDefault -> o
  // navegador não precisa esperar este handler pra rolar (scroll fluido)
  window.addEventListener('scroll', aoRolar, { passive: true });

  // girou o celular / redimensionou: reavalia (e limpa a classe se
  // tiver virado "desktop")
  mqMobile.addEventListener('change', aoRolar);
})();

// ============================================================
//  BARRA DE BUSCA RECOLHÍVEL (só mobile) — item 2
// ============================================================
// RELATO: no celular, a barra "Buscar peça..." ficava fixa logo abaixo
// do cabeçalho e cobria o conteúdo (ex.: o título "Cerâmica no Seu Café
// da Tarde") enquanto a pessoa rolava — ela sempre ocupava a 2ª linha
// do header, mesmo longe do topo.
//
// REGRA: a busca só aparece com a página a menos de 40px do topo. Ao
// rolar pra BAIXO *ou* pra CIMA (saindo dessa faixa) ela recolhe; volta
// ao retornar ao topo. O cabeçalho (logo/Carrinho/menu) continua
// visível — só a 2ª linha (a busca) some, deixando o header mais
// compacto (ver header.busca-recolhida, style.css).
//
// POR QUE IntersectionObserver + SENTINELA (#topo-sentinela, 1º filho
// do <body>) EM VEZ DE UM LISTENER DE SCROLL/MATH MANUAL: é o mecanismo
// mais robusto pedido — o navegador decide quando a interseção muda
// (sem reler window.scrollY a cada frame, sem risco de "esquecer" de
// chamar em algum caminho de scroll) e dá de graça o "rodar fora da
// thread principal" em navegadores que otimizam isso. rootMargin
// desloca o limite de interseção: com "-40px" no topo, a sentinela
// (que mede 0px de altura, encostada no topo do documento) só conta
// como "visível" quando a rolagem ainda não passou de 40px.
(function recolherBuscaAoRolar() {
  const formBusca = document.querySelector('.busca');
  const sentinela = document.querySelector('#topo-sentinela');
  // produto.html/políticas/checkout não têm busca no header — nada a
  // fazer nessas páginas (ver auditoria: "aplicar onde houver a barra")
  if (!formBusca || !sentinela) return;

  const header = document.querySelector('header');
  const botaoLupa = document.querySelector('.busca-toggle');
  const campoBusca = formBusca.querySelector('input');
  const mqMobile = window.matchMedia('(max-width: 768px)');

  function aplicar(pertoDoTopo) {
    // desktop: a busca é sempre visível (o CSS já ignora esta classe
    // fora do @media mobile, mas também não a escrevemos lá de propósito)
    if (!mqMobile.matches) {
      header?.classList.remove('busca-recolhida');
      return;
    }
    header?.classList.toggle('busca-recolhida', !pertoDoTopo);
  }

  // SEM rootMargin: a sentinela já está posicionada (CSS) exatamente
  // na marca dos 40px do documento — combinar isso com um rootMargin
  // negativo (duas formas de "encolher" o mesmo limiar) foi tentado e
  // deu inconsistente (um alvo de 1px some do cálculo de interseção
  // quando o root encolhido fica menor que a posição do alvo, e
  // isIntersecting trava em false mesmo no topo). Um ponto fixo +
  // root padrão é mais direto e mais previsível entre navegadores.
  const observador = new IntersectionObserver(
    ([entrada]) => aplicar(entrada.isIntersecting),
    { threshold: 0 }
  );
  observador.observe(sentinela);

  // girou/redimensionou pra desktop com a busca recolhida -> garante
  // visível (mesma cautela do headerAutoHide, acima)
  mqMobile.addEventListener('change', (e) => {
    if (!e.matches) header?.classList.remove('busca-recolhida');
  });

  // ÍCONE DE LUPA: rola pro topo (reaparece a busca, via observer acima)
  // e foca o campo. Fallback simples e explicitamente aceito pelo
  // pedido no lugar de "expandir a barra no lugar", mais robusto
  // (funciona em QUALQUER posição de scroll, sem precisar simular a
  // barra sobrepondo o conteúdo numa posição arbitrária).
  botaoLupa?.addEventListener('click', () => {
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
    // o foco espera o scroll/transição decantarem — focar cedo demais
    // abriria o teclado virtual no meio da rolagem/animação
    setTimeout(() => campoBusca?.focus(), semMovimento ? 50 : 350);
  });
})();

// ============================================================
//  BARRA DE ANÚNCIO — 3 mensagens que se alternam com fade
// ============================================================
// Por que NÃO um "marquee" (texto rolando de lado)? Rolagem lateral
// contínua é cansativa de ler, dá problema de acessibilidade
// (movimento) e tem cara datada. Aqui trocamos entre mensagens
// curtas com uma transição de opacidade (fade), que é discreta.
//
// Como funciona a troca:
//   1. adiciona a classe .is-trocando -> o CSS leva a opacity a 0 (fade-out)
//   2. espera o fade-out terminar (mesmos 400ms do "transition" no CSS)
//   3. troca o texto e remove a classe -> opacity volta a 1 (fade-in)
// setInterval repete o ciclo a cada 4 segundos.
//
// O "if" existe porque esta barra só está na Home: nas outras
// páginas o elemento não existe e o código simplesmente não roda.
const barraTexto = document.querySelector('#barra-anuncio-texto');

if (barraTexto) {
  // "em compras acima de R$ 200" SAIU (decisão do dono, Etapa 1): o
  // frete agora é grátis para QUALQUER compra, em todo o Brasil — o
  // custo já está embutido no preço das peças (ver js/produtos.js e o
  // relatório desta rodada), não existe mais um limiar.
  const MENSAGENS = [
    '🚚 Frete Grátis para todo o Brasil',
    '🔒 Pagamento 100% Seguro',
    '✋ Peças Únicas, Feitas à Mão no Ateliê',
  ];
  let indiceMensagem = 0;

  // mostra a primeira mensagem já de cara (sem esperar os 4s)
  barraTexto.textContent = MENSAGENS[0];

  setInterval(() => {
    barraTexto.classList.add('is-trocando'); // fade-out

    setTimeout(() => {
      // "% MENSAGENS.length" faz o índice voltar a 0 depois da última
      // mensagem (0 -> 1 -> 2 -> 0 -> ...), sem estourar o array.
      indiceMensagem = (indiceMensagem + 1) % MENSAGENS.length;
      barraTexto.textContent = MENSAGENS[indiceMensagem];
      barraTexto.classList.remove('is-trocando'); // fade-in
    }, 400);
  }, 4000);
}

// ============================================================
//  VITRINE DE PRODUTOS — RENDERIZAÇÃO DINÂMICA
// ============================================================
//
//  POR QUE MONTAR OS CARDS COM JAVASCRIPT E NÃO ESCREVER
//  CADA UM À MÃO NO HTML?
//  ---------------------------------------------------------
//   • Manutenção: o HTML de um card (imagem + título + preço +
//     botão) se repete igualzinho para toda peça. Escrito à mão,
//     são ~6 linhas x 8 produtos = 48 linhas quase idênticas.
//     Se um dia mudar o layout do card, seria preciso editar os 8 —
//     e não esquecer nenhum. Aqui o molde do card existe UMA vez
//     só, na função criarCardProduto(). Muda ali, muda em todos.
//   • Sem divergência de dados: o preço/nome no card vem sempre do
//     array "produtos" (js/produtos.js).
//   • Escala: 8 hoje, 40 amanhã. O laço abaixo não muda — ele
//     percorre quantos produtos existirem.
//   • Reaproveitamento: a mesma lista e o mesmo molde de card servem
//     para ceramica.html, croche.html e resultados de busca.
//
//  O "custo" é que o conteúdo aparece só depois do JavaScript
//  rodar — aceitável para uma vitrine de ateliê.
// ============================================================

// Formata um número (179) no padrão de moeda brasileiro ("R$ 179,00").
// Guardamos o preço como número em produtos.js (dá pra somar); a
// formatação com "R$" e vírgula é feita só na hora de mostrar na tela.
function formatarPreco(preco) {
  return preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// ------------------------------------------------------------------
//  PROMOÇÃO ("de/por" + selo "X% OFF")
// ------------------------------------------------------------------
// Um produto está EM PROMOÇÃO quando tem o campo opcional
// "precoOriginal" (ver js/produtos.js) E esse valor é maior que o
// "preco" cobrado. A checagem do "> preco" é cinto e suspensório:
// evita mostrar "-0% OFF" ou um preço riscado igual ao de baixo se
// alguém preencher os dois campos com o mesmo número por engano.
function estaEmPromocao(produto) {
  return typeof produto.precoOriginal === 'number'
    && produto.precoOriginal > produto.preco
    // peça vendida não tem "de/por"; abaixo de 5% o riscado e o selo
    // somem juntos (um "de" quase igual ao "por" só confunde)
    && !estaVendida(produto)
    && descontoPercentual(produto) >= DESCONTO_MINIMO_SELO;
}

const DESCONTO_MINIMO_SELO = 5;

// ------------------------------------------------------------------
//  PEÇA VENDIDA (disponivel: false)
// ------------------------------------------------------------------
// Regra da loja: a peça vendida nunca sai do site. Ela vira portfólio
// (foto desbotada + "Encomendar peça parecida") e vai para o fim das
// listas, para não ocupar o lugar de quem ainda pode ser comprada.
function estaVendida(produto) {
  return produto.disponivel === false;
}

// sort é estável: entre as disponíveis (e entre as vendidas) a ordem
// original de cada lista é preservada.
function vendidasNoFim(lista) {
  return [...lista].sort((a, b) => estaVendida(a) - estaVendida(b));
}

// Link de WhatsApp para encomendar uma peça parecida. Mora aqui (e não
// em produto.js) porque o card vendido usa o mesmo link e a mesma
// mensagem em todas as páginas. O link aponta para a página da peça,
// para a Anasor ver de qual se trata.
function linkEncomendaWhatsApp(produto, { indisponivel = false } = {}) {
  const urlPagina = new URL(`produto.html?id=${produto.id}`, window.location.href).href;
  const msg = indisponivel
    ? `Olá, Anasor! Vi a peça "${produto.nome}" no site, mas essa peça já foi vendida — gostaria de encomendar uma parecida. Podemos conversar sobre valores e prazo? ${urlPagina}`
    : `Olá, Anasor! Vi a peça "${produto.nome}" no site e gostaria de encomendar uma peça única parecida. Podemos conversar sobre valores e prazo? ${urlPagina}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;
}

// ------------------------------------------------------------------
//  SELOS DA PEÇA (campo "selo" em produtos.js)
// ------------------------------------------------------------------
// Um selo só por peça, para a foto não virar mural de etiquetas. A
// ordem abaixo é a prioridade: "vendido" ganha de tudo porque muda o
// que o cliente pode fazer com a peça.
const SELOS_PECA = {
  vendido: 'Vendido',
  'mais-vendido': 'Mais Vendido',
  assinada: 'Peça Assinada',
  queridinho: 'Queridinha do Ateliê',
  novidade: 'Novidade',
};

function seloDaPeca(produto) {
  const selos = new Set([].concat(produto.selo || []));
  if (estaVendida(produto)) selos.add('vendido');
  return Object.keys(SELOS_PECA).find((chave) => selos.has(chave)) || null;
}

function renderSeloPeca(produto, classeExtra = '') {
  const chave = seloDaPeca(produto);
  if (!chave) return '';
  return `<span class="selo-peca selo-peca--${chave} ${classeExtra}">${SELOS_PECA[chave]}</span>`;
}

// Porcentagem de desconto, ARREDONDADA e como número inteiro (25, não
// 25.05). É calculada na hora, a partir dos dois preços — nunca vem
// escrita em produtos.js — pra nunca ficar dessincronizada se um dos
// valores mudar. Ex.: 200 -> 149,90  =>  1 - 149.90/200 = 0.2505 => 25.
function descontoPercentual(produto) {
  return Math.round((1 - produto.preco / produto.precoOriginal) * 100);
}

// Monta o bloco de preço reaproveitado pelo card (main.js) e pela
// página da peça (produto.js) — assim o "de/por" tem UMA formatação
// só. "contexto" muda só as classes extras: no card o preço final
// também é o gatilho visual do selo; na página ele é o preço grande.
// - SEM promoção: volta ao <p class="preco"> simples de sempre.
// - COM promoção: <s> com o valor cheio (riscado, lido por leitores
//   de tela como "R$ 200,00") + o valor com desconto em destaque.
//   O selo "X% OFF" fica só no CARD (parâmetro comSelo), como pedido.
function renderBlocoPreco(produto, { classeExtra = '', comSelo = false } = {}) {
  // Vendida: o valor fica só como referência, discreto e sem "de/por"
  if (estaVendida(produto)) {
    return `<p class="preco preco--vendida ${classeExtra}">${formatarPreco(produto.preco)}</p>`;
  }

  if (!estaEmPromocao(produto)) {
    return `<p class="preco ${classeExtra}">${formatarPreco(produto.preco)}</p>`;
  }

  // Texto todo numa cor só: o número em dourado sobre o terracota não
  // tinha contraste AA. "Lançamento" diz de onde vem o desconto (o "de"
  // é o preço praticado antes do corte de outubro).
  const selo = comSelo
    ? `<span class="preco-selo-off">Lançamento -${descontoPercentual(produto)}%</span>`
    : '';

  return `
    <p class="preco preco--promo ${classeExtra}">
      <s class="preco__antigo">${formatarPreco(produto.precoOriginal)}</s>
      <span class="preco__atual">${formatarPreco(produto.preco)}</span>
      ${selo}
    </p>
  `;
}

// Selo "Peça única — quando vender, não haverá outra igual." MOVIDO
// pra cá (morava só em js/produto.js): agora TAMBÉM é usado pela
// seção "Peça em Destaque" da Home (ver mais abaixo) — mesmo caso já
// resolvido antes com .foto-emoldurada (style.css) e renderBlocoPreco
// (aqui em cima): um componente que passa a servir 2 páginas migra
// pro arquivo compartilhado, em vez de ganhar uma 2ª cópia.
// role="note": é um comentário/apoio ao conteúdo principal, não um
// alerta — leitores de tela anunciam sem urgência. O 🔥 é decorativo.
// O CSS (.selo-escassez, agora em style.css) dá o tom "mais forte,
// ainda elegante": fundo levemente destacado, fonte um pouco maior
// que o corpo, e um pulso lento e contínuo (glow) — que some pra quem
// pediu "reduzir movimento" no sistema.
function renderSeloEscassez() {
  return `
    <p class="selo-escassez" role="note">
      <span class="selo-escassez__icone" aria-hidden="true">&#128293;</span>
      <span><strong>Peça única</strong> &mdash; quando vender, não haverá outra igual.</span>
    </p>
  `;
}

// ============================================================
//  GALERIA DE FOTOS (reutilizável) — trocar a foto grande
// ============================================================
// MOVIDA de js/produto.js (era "ativarGaleria()", sem parâmetros) e
// GENERALIZADA: agora recebe o CONTAINER e a lista de IMAGENS, em vez
// de assumir um contexto fixo. Hoje só produto.html usa (miniaturas
// clicáveis) — a "Peça em Destaque" da Home TINHA setas aqui antes,
// mas virou o giro 360° (ativarGiro360(), logo abaixo), um jeito de
// navegar totalmente diferente (arrastar, não clicar), que por isso
// ganhou função PRÓPRIA em vez de mais um "if" aqui dentro.
function ativarGaleriaDeFotos(container, imagens) {
  const principalWrap = container.querySelector('.galeria__principal-wrap');
  const principal = container.querySelector('.galeria__principal');
  const miniaturas = container.querySelector('.galeria__miniaturas');
  if (!principal || !miniaturas) return; // peça com só 1 foto: nada a fazer

  const setaAnterior = container.querySelector('.galeria__seta--anterior');
  const setaProxima = container.querySelector('.galeria__seta--proxima');
  const dotsEl = container.querySelector('.galeria__dots');
  const dots = dotsEl ? [...dotsEl.querySelectorAll('.galeria__dot')] : [];

  let indiceAtual = 0;

  // FONTE ÚNICA DE VERDADE: troca a foto grande E sincroniza os TRÊS
  // controles (miniatura, dot) que podem tê-la disparado — pedido
  // explícito ("ao clicar na seta ou na bolinha, deve... sincronizar
  // com a miniatura correspondente"). Antes só o clique na miniatura
  // existia, e fazia isso "na mão" (2 linhas soltas no listener); virou
  // esta função pra setas/dots/miniatura/swipe chamarem a MESMA lógica
  // em vez de cada controle reescrever seu pedacinho por conta própria
  // (o jeito clássico de 2 controles ficarem "quase" sincronizados e
  // divergirem depois de uma mudança futura).
  function irParaIndice(indice) {
    indiceAtual = ((indice % imagens.length) + imagens.length) % imagens.length;
    // fórmula "+ length antes do %" — mesmo motivo já documentado em
    // trocarFrame()/irParaFrame() (ativarGiro360, logo abaixo): em JS,
    // -1 % N dá -1, não N-1; somar length primeiro corrige os dois sentidos.
    principal.src = imagens[indiceAtual];

    const thumbAtiva = miniaturas.querySelector('.is-ativa');
    if (thumbAtiva) thumbAtiva.classList.remove('is-ativa');
    miniaturas.children[indiceAtual]?.classList.add('is-ativa');

    const dotAtivo = dotsEl?.querySelector('.is-ativo');
    if (dotAtivo) dotAtivo.classList.remove('is-ativo');
    dots[indiceAtual]?.classList.add('is-ativo');
  }

  // DELEGAÇÃO DE EVENTO: um único listener no contêiner das
  // miniaturas, em vez de um por botão. O índice vem da POSIÇÃO do
  // botão entre os irmãos — a mesma ordem em que "imagens" foi
  // montada (imagem principal + imagensExtras), então os dois sempre
  // batem.
  miniaturas.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.galeria__thumb');
    if (!botao) return;
    irParaIndice(Array.from(miniaturas.children).indexOf(botao));
  });

  // SETAS (pedido item 1) — só existem no HTML quando há mais de 1
  // foto (mesma condição das miniaturas), então "setaAnterior"/
  // "setaProxima" podem vir null; os "?." abaixo protegem contra isso
  // sem precisar de mais um "if" cercando os dois addEventListener.
  setaAnterior?.addEventListener('click', () => irParaIndice(indiceAtual - 1));
  setaProxima?.addEventListener('click', () => irParaIndice(indiceAtual + 1));

  // DOTS (pedido item 1) — cada bolinha só sabe a própria POSIÇÃO
  // entre as irmãs (não guarda o índice num data-attribute à parte:
  // a ORDEM já é a fonte da verdade, igual às miniaturas).
  dots.forEach((dot, i) => dot.addEventListener('click', () => irParaIndice(i)));

  // SWIPE em touch/mobile (pedido item 1) — MESMA técnica do carrossel
  // do banner (bannerCarrossel, mais abaixo neste arquivo): guarda só
  // a posição X/Y onde o dedo TOCOU e compara com onde SOLTOU; não
  // redesenha nada "seguindo o dedo" durante o arraste. Escutado no
  // WRAP da foto principal (não no <div class="galeria"> inteiro, que
  // também contém as miniaturas/dots) — um swipe deve reagir à foto
  // grande, não a QUALQUER toque na coluna da galeria.
  if (principalWrap) {
    let toqueInicioX = 0;
    let toqueInicioY = 0;

    principalWrap.addEventListener(
      'touchstart',
      (evento) => {
        toqueInicioX = evento.touches[0].clientX;
        toqueInicioY = evento.touches[0].clientY;
      },
      { passive: true } // não bloqueia o scroll vertical da página
    );

    principalWrap.addEventListener(
      'touchend',
      (evento) => {
        const toqueFimX = evento.changedTouches[0].clientX;
        const toqueFimY = evento.changedTouches[0].clientY;
        const distanciaX = toqueFimX - toqueInicioX;
        const distanciaY = toqueFimY - toqueInicioY;

        // MESMO limiar (50px) e MESMA checagem "|X| > |Y|" do banner —
        // sem isso, rolar a página verticalmente com o dedo em cima da
        // foto (comportamento normal) poderia ser lido como swipe e
        // trocar de foto à toa.
        if (Math.abs(distanciaX) < 50 || Math.abs(distanciaX) < Math.abs(distanciaY)) {
          return;
        }

        // arrastar pra ESQUERDA = avança (mesma direção "passar o
        // dedo num álbum" do banner); pra DIREITA = volta.
        irParaIndice(distanciaX < 0 ? indiceAtual + 1 : indiceAtual - 1);
      },
      { passive: true }
    );
  }
}

// ============================================================
//  GIRO 360° (arrastar/deslizar pra girar) — só na "Peça em
//  Destaque" da Home
// ============================================================
// Ideia: as mesmas fotos de "outros ângulos" que já existiam
// (imagensExtras, em produtos.js) viram, aqui, os QUADROS de uma
// rotação — arrastar/deslizar HORIZONTALMENTE sobre a foto troca de
// quadro, como se estivesse girando a peça na mão.
//
// COMO O ARRASTE VIRA UM ÍNDICE DE QUADRO (a parte pedida pra
// comentar):
//   1. Cada evento de movimento (mousemove/touchmove) só sabe a
//      posição X ATUAL do ponteiro/dedo — não "quantos quadros
//      passar". Por isso guardamos xReferencia (a posição X do
//      último evento) e, a cada novo evento, calculamos delta = x
//      atual - xReferencia: o quanto o ponteiro andou DESDE A ÚLTIMA
//      VEZ (não desde o início do arraste).
//   2. Esse delta (que pode ser 1px, 3px, -5px...) é somado num
//      acumulador ("acumulado"). PIXELS_POR_FRAME_GIRO360 define
//      quantos pixels arrastados valem 1 quadro — enquanto o
//      acumulado não chega lá, nada muda de tela (arraste "devagar"
//      não gira nada ainda, só vai "enchendo" o acumulador).
//   3. Quando o acumulado ULTRAPASSA o limiar (pra qualquer lado), um
//      "while" (não um "if") avança/volta um quadro E DESCONTA o
//      limiar do acumulado, repetindo enquanto ainda sobrar — assim
//      um arraste rápido, que ande 80px num único evento, gira vários
//      quadros de uma vez em vez de "travar" em só 1.
//
// LOOP: trocarFrame() sempre soma "+ imagens.length" antes do "%" —
// em JavaScript, -1 % N dá -1 (não N-1 como se poderia esperar), e
// sem esse ajuste o loop pra TRÁS (arrastar pra esquerda no 1º
// quadro) quebraria. Pra FRENTE o "%" sozinho já basta, mas a mesma
// fórmula funciona nos dois sentidos, então é só uma conta só.
const CHAVE_DICA_GIRO360 = 'anasor-dica-giro360-visto';
const PIXELS_POR_FRAME_GIRO360 = 18; // menor = giro mais "sensível" (mais rápido pro mesmo arraste)

function ativarGiro360(container, imagens) {
  const frame = container.querySelector('.giro360__frame');
  if (!frame || imagens.length < 2) return; // 1 foto só: nada a girar

  const dica = container.querySelector('.giro360__dica');
  let arrastando = false;
  let indiceAtual = 0;
  let xReferencia = 0;
  let acumulado = 0; // "sobra" de arraste que ainda não completou 1 quadro inteiro

  function trocarFrame(passo) {
    indiceAtual = (indiceAtual + passo + imagens.length) % imagens.length;
    frame.src = imagens[indiceAtual];
  }

  // Pula DIRETO pra um índice (usado pelas miniaturas clicáveis do
  // "mini-álbum" — ver montarProdutoDestaque). Precisa MEXER no mesmo
  // "indiceAtual" que o arraste usa (não só trocar frame.src por fora)
  // — senão, depois de clicar numa miniatura, o próximo arraste
  // continuaria contando a partir do índice antigo e "pularia" vários
  // quadros de uma vez, de um jeito confuso. Por isso esta função vive
  // AQUI DENTRO (tem acesso ao "indiceAtual" fechado no escopo), em
  // vez de reaproveitar ativarGaleriaDeFotos() (que existe pra outro
  // caso: uma galeria PURAMENTE por clique, sem estado de arraste pra
  // manter sincronizado).
  function irParaFrame(indice) {
    indiceAtual = ((indice % imagens.length) + imagens.length) % imagens.length;
    frame.src = imagens[indiceAtual];
  }

  // MINIATURAS: cada botão .produto-destaque__miniatura leva
  // data-indice-imagem (o índice dela dentro do array "imagens" — ver
  // o HTML montado em montarProdutoDestaque). Delegado no container
  // (1 listener só) em vez de 1 por miniatura — mesmo padrão usado
  // no resto do site (menu mobile, mini-carrinho...).
  container.addEventListener('click', (evento) => {
    const miniatura = evento.target.closest('.produto-destaque__miniatura');
    if (!miniatura) return;
    irParaFrame(Number(miniatura.dataset.indiceImagem));
    esconderDica(); // clicar já conta como "a pessoa entendeu que a foto muda" — some com a dica de arrastar
  });

  // some na 1ª interação (mousedown/touchstart já contam — não é
  // preciso esperar o arraste de fato começar a mover). localStorage
  // guarda a preferência entre visitas, com try/catch de segurança
  // (pode falhar em navegação privada/cookies bloqueados — nesse
  // caso a dica só reaparece a cada carregamento, sem quebrar nada).
  function esconderDica() {
    if (!dica || dica.classList.contains('is-oculta')) return;
    dica.classList.add('is-oculta');
    try {
      localStorage.setItem(CHAVE_DICA_GIRO360, '1');
    } catch (e) {
      /* sem localStorage: a dica não "lembra" entre visitas — aceitável */
    }
  }

  function iniciarArraste(x) {
    arrastando = true;
    xReferencia = x;
    acumulado = 0;
    frame.classList.add('is-arrastando'); // CSS troca cursor:grab por grabbing
    esconderDica();
  }

  function moverArraste(x) {
    if (!arrastando) return;
    const delta = x - xReferencia;
    xReferencia = x;
    acumulado += delta;

    while (acumulado >= PIXELS_POR_FRAME_GIRO360) {
      trocarFrame(1); // arrastar pra DIREITA = avança nas fotos
      acumulado -= PIXELS_POR_FRAME_GIRO360;
    }
    while (acumulado <= -PIXELS_POR_FRAME_GIRO360) {
      trocarFrame(-1); // arrastar pra ESQUERDA = volta
      acumulado += PIXELS_POR_FRAME_GIRO360;
    }
  }

  function finalizarArraste() {
    arrastando = false;
    frame.classList.remove('is-arrastando');
  }

  // --- MOUSE (desktop) ---
  frame.addEventListener('mousedown', (e) => {
    e.preventDefault(); // sem isto o navegador tenta um "arrastar imagem" nativo (drag-and-drop), que atrapalharia o giro
    iniciarArraste(e.clientX);
  });
  // mousemove/mouseup ficam no WINDOW, não só na <img>: se o arraste
  // for rápido o bastante pro cursor "escapar" da foto no meio do
  // gesto, o giro continua (e o mouseup em qualquer lugar da página
  // ainda encerra o arraste) — sem isso, soltar fora da imagem
  // deixaria "arrastando" travado em true.
  window.addEventListener('mousemove', (e) => moverArraste(e.clientX));
  window.addEventListener('mouseup', finalizarArraste);

  // --- TOQUE (mobile) ---
  // touchstart: { passive:true } (não precisamos bloquear nada ainda,
  // só registrar o início). touchmove: { passive:false }, porque
  // aqui SIM chamamos preventDefault() — reforço pro touch-action:none
  // do CSS (.giro360__frame), que já avisa o navegador "eu cuido do
  // toque aqui": juntos, garantem que arrastar sobre a foto gire o
  // objeto em vez de rolar a página.
  frame.addEventListener(
    'touchstart',
    (e) => iniciarArraste(e.touches[0].clientX),
    { passive: true }
  );
  frame.addEventListener(
    'touchmove',
    (e) => {
      if (!arrastando) return;
      e.preventDefault();
      moverArraste(e.touches[0].clientX);
    },
    { passive: false }
  );
  frame.addEventListener('touchend', finalizarArraste);
  frame.addEventListener('touchcancel', finalizarArraste);
}

// Recebe UM objeto de produto e devolve o HTML de um card (como texto).
// É o "molde" único do card — o único lugar que descreve como um
// produto vira elemento na tela. Home, ceramica.html e (futuras)
// buscas usam esta mesma função; nenhuma delas reescreve o card.
//
// ESTRUTURA DO CARD:
//   .produto-card ............ div externa; guarda os data-* que o
//                              carrinho lê (data-id/nome/preco/imagem).
//                              data-preco é SEMPRE o "preco" cobrado
//                              (o valor JÁ com desconto, quando há
//                              promoção) — o "precoOriginal" nunca vai
//                              pro carrinho, é só pra exibir o riscado.
//                              data-imagem grava a foto JUNTO com o
//                              item no carrinho (ver adicionarAoCarrinho),
//                              em vez de o mini-carrinho ter que
//                              redescobri-la depois buscando o id no
//                              catálogo — essa busca posterior era o
//                              ponto frágil por trás do bug de fotos
//                              sumindo no mini-carrinho.
//     |- a.produto-card__link  parte clicável que leva ao detalhe
//     |    |- img              da peça: produto.html?id=<id>
//     |    |- h3
//     |    \- p.preco          (renderBlocoPreco): só o preço, OU o
//     |                        "de/por" riscado + selo "X% OFF" se a
//     |                        peça tiver "precoOriginal" em produtos.js
//     |- button.btn-comprar ....... adiciona ao carrinho, só isso
//     \- button.btn-comprar-agora . adiciona AO CARRINHO + já abre o
//          mini-carrinho (ver o listener de clique mais abaixo) —
//          "compra rápida", já que não existe checkout de verdade
//          ainda (o próprio mini-carrinho avisa disso no rodapé dele)
//
// Por que os <button> ficam FORA do <a>? Porque o HTML não permite um
// elemento interativo (button) dentro de outro (a) — o navegador
// "conserta" isso de um jeito imprevisível. Então a área clicável
// que navega é o <a>, e os botões são irmãos dele.
//
// Por que passar o id na URL (?id=X)? Porque o id é o identificador
// único e estável de cada objeto em produtos.js. A página de destino
// lê esse id e descobre qual peça carregar.
//
// loading="lazy" na <img>: um card de produto quase sempre está
// abaixo da dobra (precisa rolar pra ver). O navegador só baixa
// essas imagens quando elas se aproximam da tela -> a página abre
// mais rápido e gasta menos dados de quem não rola até lá.
function criarCardProduto(produto) {
  const vendida = estaVendida(produto);

  // Vendida: um botão só, para encomendar. É <a> (não <button>), então
  // o listener do carrinho, que escuta button.btn-comprar, nunca pega.
  const acoesHTML = vendida
    ? `<a class="btn-comprar btn-encomendar" href="${linkEncomendaWhatsApp(produto, { indisponivel: true })}"
          target="_blank" rel="noopener noreferrer"
          aria-label="Encomendar uma peça parecida com ${produto.nome} pelo WhatsApp">Encomendar peça parecida 🤎</a>`
    : `<button class="btn-comprar">${estaNoCarrinho(produto.id) ? TEXTO_NO_CARRINHO : 'Adicionar ao Carrinho'}</button>
      <button class="btn-comprar-agora">Comprar Agora</button>`;

  return `
    <div class="produto-card reveal ${vendida ? 'produto-card--vendida' : ''}"
         data-id="${produto.id}"
         data-nome="${produto.nome}"
         data-preco="${produto.preco}"
         data-imagem="${produto.imagem}">
      <a class="produto-card__link" href="produto.html?id=${produto.id}">
        ${renderSeloPeca(produto, 'selo-peca--card')}
        <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
        <h3>${produto.nome}</h3>
        ${renderBlocoPreco(produto, { comSelo: true })}
      </a>
      ${acoesHTML}
    </div>
  `;
}

const TEXTO_NO_CARRINHO = 'No carrinho ✓';

// Vitrine de portfólio das peças vendidas (fim de ceramica.html e das
// subcategorias): mostra o que o ateliê já fez e puxa encomenda.
function renderSecaoVendidas(vendidas) {
  if (vendidas.length === 0) return '';
  return `
    <section class="ja-tem-lar" aria-labelledby="ja-tem-lar-titulo">
      <h2 id="ja-tem-lar-titulo">Já encontraram um lar 🤎</h2>
      <p class="ja-tem-lar__texto">Cada peça é única. Gostou de alguma? Encomende a sua, do seu jeitinho.</p>
      <div class="produtos-grid">${vendidas.map(criarCardProduto).join('')}</div>
    </section>`;
}

// try/catch: o card pode ser montado antes de o carrinho existir no
// localStorage (ou com ele corrompido), e isso não pode quebrar a vitrine.
function estaNoCarrinho(id) {
  try {
    return lerCarrinho().some((item) => String(item.id) === String(id));
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------
//  DE ONDE VÊM OS PRODUTOS (hoje: array local; amanhã: API)
// ------------------------------------------------------------------
// ⚠️  TEMPOR.RIO — SÓ PARA DESENVOLVIMENTO
// Os produtos vêm de um array local (js/produtos.js), então carregá-los
// é INSTANTÂNEO e o "loading skeleton" nem apareceria. Este atraso
// artificial existe só pra dar pra VER o skeleton agora.
// >>> Quando houver um backend de verdade, APAGUE esta constante e
//     troque o corpo de carregarProdutos() por um fetch() real. <<<
const DELAY_DEV_MS = 450;

// Devolve uma Promise com a lista de produtos. Envolvemos o array
// numa Promise + setTimeout pra SIMULAR a latência de rede que um
// fetch() teria. No futuro, o corpo vira simplesmente:
//     return fetch('/api/produtos').then((r) => r.json());
// e o resto do código (que já usa await) continua funcionando igual.
function carregarProdutos() {
  return new Promise((resolve) => {
    // produtosVisiveis() (js/produtos.js): grades, ceramica.html e a
    // busca leem desta lista, então peça "oculto: true" nunca entra.
    setTimeout(() => resolve(produtosVisiveis()), DELAY_DEV_MS);
  });
}

// ------------------------------------------------------------
//  LOADING SKELETON
// ------------------------------------------------------------
// Um card "fantasma" com a MESMA casca (.produto-card) e os mesmos
// tamanhos do card real, só que com blocos cinza que pulsam (a
// animação está no CSS). Serve pra:
//   - o usuário perceber que algo está CARREGANDO (não é tela vazia);
//   - o layout não "pular" quando os cards reais chegam (o esqueleto
//     já ocupa o espaço certo -> evita layout shift / CLS).
// aria-hidden: não é conteúdo real, leitores de tela devem ignorar.
function criarCardSkeleton() {
  return `
    <div class="produto-card produto-card--skeleton" aria-hidden="true">
      <div class="skeleton skeleton--img"></div>
      <div class="skeleton skeleton--linha"></div>
      <div class="skeleton skeleton--linha skeleton--curta"></div>
      <div class="skeleton skeleton--botao"></div>
      <div class="skeleton skeleton--botao"></div>
    </div>
  `;
  // 2 barras de botão agora (era 1): o card real ganhou um 2o botão
  // ("Comprar Agora"), então o esqueleto reserva a MESMA altura —
  // senão os cards reais chegariam mais altos que o esqueleto que
  // eles substituem, e a página "pularia" (CLS) bem na hora do troca.
}

function criarSkeletons(quantidade) {
  // Array.from({length:n}, fn) cria um array de n itens chamando fn
  // pra cada um; .join('') junta o HTML.
  return Array.from({ length: quantidade }, criarCardSkeleton).join('');
}

// ============================================================================
//  BUSCA + FILTROS + ORDENAÇÃO  (lógica central, um lugar só)
// ============================================================================
//
// POR QUE UMA FUNÇÃO ÚNICA (filtrarProdutos)?
//   index.html e ceramica.html precisam da MESMA lógica de "pega a
//   lista e devolve só o que combina com os critérios ativos". Se
//   cada página tivesse a sua cópia, uma correção teria que ser feita
//   em dois lugares — e uma delas seria esquecida. Centralizando, é
//   um lugar só pra ler, testar e dar manutenção.
//
// A função é "burra" de propósito: recebe uma lista + critérios, não
// sabe de qual página veio nem mexe no DOM. Isso a torna fácil de
// reaproveitar e de testar isoladamente.

// Estado atual dos critérios. A busca vale nas duas páginas; a faixa
// de preço e a ordem só existem em ceramica.html.
const criterios = {
  busca: '',
  faixaPreco: 'todas',   // 'todas' | 'ate-180' | '180-220' | 'acima-220'
  ordem: 'relevancia',   // 'relevancia' | 'preco-asc' | 'preco-desc' | 'nome-az'
};

// Cache da lista completa, preenchida quando carregarProdutos() resolve.
// As buscas/filtros trabalham em cima DESTE array (não recarregam
// tudo a cada tecla).
let todosProdutos = [];

// Normaliza texto pra comparação de busca:
//   - toLowerCase(): "Calla" e "calla" viram a mesma coisa;
//   - normalize('NFD'): separa a letra do acento (ex.: "á" -> "a" + "´");
//   - replace(...): apaga esses acentos soltos (faixa Unicode U+0300 a U+036F).
// Resultado: "cafe" acha "Café", "calla" acha "Calla". Aplicamos nos
// DOIS lados (termo digitado E nome do produto) pra comparar
// "igual com igual".
function normalizarTexto(txt) {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Transforma um texto num "slug" seguro pra URL:
//   "Pratos Artísticos"  ->  "pratos-artisticos"
// normalizarTexto() já deixa minúsculo e sem acento; aqui só
// trocamos tudo que não é letra/número por hífen e limpamos as
// pontas. Usado pra montar/ler ceramica.html?sub=<slug>.
function slugificar(txt) {
  return normalizarTexto(txt)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================
//  SUBCATEGORIAS DE CERÂMICA — dados COMPARTILHADOS
// ============================================================
// Usado por: montarDropdownCeramica() (abaixo), js/ceramica.js (visão
// geral da categoria) e montarColecoesHome() (mais abaixo, a grade
// "Explore Nossas Coleções" da Home, item 3). UM lugar só que lê
// produtos.js — nenhuma lista de nomes nem contagem escrita à mão em
// lugar nenhum: tudo nasce dos dados.
//
// subcategoriasCeramica(): só os NOMES, na ordem em que aparecem em
// produtos.js (new Set tira duplicatas preservando a 1ª ocorrência).
function subcategoriasCeramica() {
  return [
    ...new Set(
      // produtosVisiveis(): peça oculta não pode criar bloco/card de
      // subcategoria nem entrar nas contagens "N peças disponíveis"
      produtosVisiveis()
        .filter((p) => p.categoria === 'ceramica')
        .map((p) => p.subcategoria)
    ),
  ];
}

// dadosCardsSubcategoriaCeramica(): para cada subcategoria, os dados
// que um CARD precisa pra se montar (nome, até 5 fotos distintas pra
// revezar, contagem já formatada, link pra listagem filtrada) — sem
// decidir HTML/CSS nenhum, isso fica por conta de quem chama (cada
// página tem seu próprio layout de card).
function dadosCardsSubcategoriaCeramica() {
  return subcategoriasCeramica().map((sub) => {
    // vendidasNoFim: as fotos de capa da coleção priorizam peças à venda
    const daSub = vendidasNoFim(produtosVisiveis().filter((p) => p.subcategoria === sub));
    // até 5 fotos DISTINTAS da subcategoria (Set tira duplicatas, caso
    // duas peças usem a mesma imagem) — viram os quadros que se
    // revezam no círculo, ver iniciarRotacaoFotos() mais abaixo
    const fotos = [...new Set(daSub.map((p) => p.imagem))].slice(0, 5);
    // O rótulo promete "disponíveis": só conta o que dá para comprar
    const qtd = daSub.filter((p) => !estaVendida(p)).length;
    const rotuloQtd = `${qtd} ${qtd === 1 ? 'peça disponível' : 'peças disponíveis'}`;
    return { sub, fotos, qtd, rotuloQtd, href: `ceramica.html?sub=${slugificar(sub)}` };
  });
}

// Monta o HTML das <img> empilhadas de um card (a 1ª nasce .is-ativa —
// sem isso, sem CSS/antes do JS rodar, o círculo ficaria vazio). alt
// cheio só na 1ª; as demais são decorativas até entrarem em cena (alt
// vazio evita repetir o nome da subcategoria várias vezes pra quem usa
// leitor de tela). Compartilhado pelos 2 lugares que desenham essas
// fotos (ceramica.js e montarColecoesHome, mais abaixo).
function fotosSubcategoriaHTML(fotos, nomeSub) {
  return fotos
    .map(
      (src, i) => `
      <img src="${src}" alt="${i === 0 ? nomeSub : ''}" loading="lazy"
           class="${i === 0 ? 'is-ativa' : ''}">`
    )
    .join('');
}

// ============================================================
//  ROTAÇÃO DE FOTOS DOS CARDS DE SUBCATEGORIA (fade cruzado)
// ============================================================
// Cada card reveza entre algumas peças de verdade daquela
// subcategoria (dá mais vida à visão geral/à grade da Home, antecipa
// a variedade do catálogo antes da pessoa clicar). O crossfade em si é
// só CSS (transition de opacity nas <img> empilhadas via
// position:absolute, ver .subcategoria-card__foto em style.css); aqui
// o JS só decide QUANDO trocar qual delas tem a classe .is-ativa.
// GENÉRICO de propósito (procura .subcategoria-card__foto em TODA a
// página): funciona igual em ceramica.html (visão geral) e na Home
// (montarColecoesHome reaproveita a MESMA classe), sem precisar saber
// qual página é.
//
// REGRAS: troca a cada 3,5s; PAUSA com o mouse em cima (não atrapalha
// quem tá lendo o nome/contagem) e volta ao sair; subcategoria com 1
// produto só não entra no loop (a única <img> já nasce .is-ativa,
// fixa); respeita "reduzir movimento".
function iniciarRotacaoFotos() {
  const semMovimento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (semMovimento) return; // fica parado na 1ª foto (já é a que está visível)

  const INTERVALO_MS = 3500;

  document.querySelectorAll('.subcategoria-card__foto').forEach((moldura) => {
    // guarda pra não ligar 2 intervalos na MESMA moldura se esta
    // função for chamada de novo (ex.: Home recria a grade numa busca
    // futura) — moldura.dataset sobrevive a innerHTML de um ANCESTRAL,
    // só não ao da própria moldura (que não é recriada sem necessidade)
    if (moldura.dataset.rotacaoLigada) return;

    const fotos = moldura.querySelectorAll('img');
    if (fotos.length < 2) return; // 1 peça só nessa subcategoria -> nada pra revezar
    moldura.dataset.rotacaoLigada = '1';

    let indiceAtivo = 0;
    let timer = null;

    function trocar() {
      // a esteira da Home remonta os cards ao cruzar o breakpoint: card
      // que saiu do DOM desliga o próprio intervalo (senão ficaria
      // trocando foto de um elemento que ninguém vê, pra sempre)
      if (!moldura.isConnected) return pausar();
      fotos[indiceAtivo].classList.remove('is-ativa');
      indiceAtivo = (indiceAtivo + 1) % fotos.length;
      fotos[indiceAtivo].classList.add('is-ativa');
    }

    function comecar() {
      if (timer) return; // já rodando — evita 2 intervalos pro mesmo card
      timer = setInterval(trocar, INTERVALO_MS);
    }
    function pausar() {
      clearInterval(timer);
      timer = null;
    }

    comecar();

    // Pausa é só no MOUSE (pedido explícito: "evitar distração ao
    // ler") — no toque (mobile) não existe estado de "passar o mouse
    // por cima" persistente, então lá a rotação segue normalmente.
    moldura.addEventListener('mouseenter', pausar);
    moldura.addEventListener('mouseleave', comecar);
  });
}

// ============================================================
//  DROPDOWN DE SUBCATEGORIAS NO MENU ("Cerâmica")
// ============================================================
// O <li> "Cerâmica" do menu ganha um submenu com as subcategorias.
// A LISTA DE ITENS vem de subcategoriasCeramica() (acima) — NÃO
// escrita no HTML. Assim, se amanhã um produto novo trouxer
// subcategoria: "Canecas Artísticas", o item aparece no menu sozinho —
// sem tocar em HTML nem aqui.
// Roda em TODAS as páginas (o header é o mesmo em todas).
function montarDropdownCeramica() {
  // pega o link "Cerâmica" que está DENTRO do menu principal
  const linkCeramica = document.querySelector('.nav-links a[href="ceramica.html"]');
  if (!linkCeramica) return;

  const subs = subcategoriasCeramica();
  if (subs.length === 0) return;

  const li = linkCeramica.closest('li');
  li.classList.add('tem-dropdown');
  linkCeramica.setAttribute('aria-haspopup', 'true'); // avisa que há submenu

  const menu = document.createElement('ul');
  menu.className = 'dropdown';
  menu.innerHTML = subs
    .map(
      (sub) =>
        `<li><a href="ceramica.html?sub=${slugificar(sub)}">${sub}</a></li>`
    )
    .join('');
  li.appendChild(menu);
}

// ============================================================
//  BREADCRUMB — "Home > Cerâmica > ..."
// ============================================================
// Componente COMPARTILHADO: produto.html (js/produto.js) e
// ceramica.html (js/ceramica.js) montam o breadcrumb com esta
// mesma função — em vez de cada uma ter a sua. Vive no main.js
// (carregado nas duas) por isso.
//
// "trechos" = lista de { rotulo, href }. O ÚLTIMO trecho é a
// página ATUAL: entra sem link e com aria-current="page" (leitores
// de tela anunciam "página atual"). Os separadores ">" levam
// aria-hidden pra não serem lidos ("maior que") no meio dos nomes.
function renderBreadcrumb(elemento, trechos) {
  if (!elemento) return;

  elemento.innerHTML = trechos
    .map((trecho, i) => {
      const ehUltimo = i === trechos.length - 1;
      const item =
        ehUltimo || !trecho.href
          ? `<span aria-current="page">${trecho.rotulo}</span>`
          : `<a href="${trecho.href}">${trecho.rotulo}</a>`;
      // separador antes de todo trecho, menos o primeiro.
      // Trocamos o "&rsaquo;" por um ícone Lucide "chevron-right"
      // (SVG inline, mesmo estilo dos ícones dos selos): fica mais
      // nítido e alinhado com a linguagem visual do resto do site.
      // stroke-width 2.5 deixa o traço um pouco mais encorpado.
      const sep =
        i > 0
          ? `<span class="breadcrumb__sep" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>`
          : '';
      return sep + item;
    })
    .join('');

  elemento.hidden = false;
}

// Escapa caracteres perigosos antes de pôr texto do USUÁRIO dentro
// de innerHTML (o termo de busca). Sem isso, digitar algo como
// "<img onerror=...>" poderia injetar HTML/script na página (XSS). O
// nome do produto vem de produtos.js (confiável); o que o usuário
// digita, não.
function escaparHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// O CORAÇÃO DO RECURSO: recebe a lista completa (já filtrada por
// categoria) + os critérios; devolve a lista filtrada e ordenada.
function filtrarProdutos(lista, criterios) {
  // cópia rasa: sort() reordena o array NO LUGAR, e não queremos
  // bagunçar a ordem do array original (todosProdutos)
  let resultado = [...lista];

  // 1) BUSCA por nome (sem caixa, sem acento)
  const termo = normalizarTexto(criterios.busca.trim());
  if (termo) {
    resultado = resultado.filter((p) => normalizarTexto(p.nome).includes(termo));
  }

  // 2) FAIXA DE PREEÇO — limites (180 e 220) escolhidos pra dividir
  //    bem os preços reais de produtos.js (que vão de 169 a 239)
  if (criterios.faixaPreco === 'ate-180') {
    resultado = resultado.filter((p) => p.preco <= 180);
  } else if (criterios.faixaPreco === '180-220') {
    resultado = resultado.filter((p) => p.preco > 180 && p.preco <= 220);
  } else if (criterios.faixaPreco === 'acima-220') {
    resultado = resultado.filter((p) => p.preco > 220);
  }
  // 'todas' -> não filtra por preço

  // 3) ORDENAÇÃO
  if (criterios.ordem === 'preco-asc') {
    resultado.sort((a, b) => a.preco - b.preco);
  } else if (criterios.ordem === 'preco-desc') {
    resultado.sort((a, b) => b.preco - a.preco);
  } else if (criterios.ordem === 'nome-az') {
    // localeCompare('pt') ordena respeitando acentos e cedilha
    resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  }
  // 'relevancia' -> mantém a ordem que veio (a do array)

  // Depois de qualquer ordenação: vendidas sempre no fim (busca,
  // listagens e carrosséis passam todos por aqui)
  return vendidasNoFim(resultado);
}

// Parágrafo mostrado quando a busca/filtros não devolvem nenhuma peça.
// escaparHtml() no termo porque ele vai pra innerHTML.
function mensagemVazia() {
  const termo = criterios.busca.trim();
  const texto = termo
    ? `Nenhuma peça encontrada para "${escaparHtml(termo)}".`
    : 'Nenhuma peça encontrada com esses filtros.';
  // grid-column: 1 / -1 (no CSS) faz o parágrafo ocupar a largura
  // toda da grade, em vez de ficar espremido numa coluna só.
  return `<p class="vitrine-vazia">${texto}</p>`;
}

// Aplica os critérios ATUAIS e re-renderiza cada grade da página.
// É SÍNCRONNA (diferente de renderizarVitrines): os dados já estão
// em memória (todosProdutos), então filtrar/ordenar/desenhar é
// instantâneo — sem await, sem skeleton de novo.
function aplicarEExibir() {
  if (todosProdutos.length === 0) return; // dados ainda carregando: mantém o skeleton

  document.querySelectorAll('[data-grade-produtos]').forEach((grade) => {
    // GRADES "MANUAIS" (ex.: "Mais Tesouros do Ateliê" em produto.js,
    // que escolhe as peças por RELAÇÃO — mesma categoria, id diferente
    // do atual, no máximo N — não por categoria inteira) pulam este
    // laço: ele filtraria todosProdutos por categoria === o VALOR de
    // data-grade-produtos, que nessas grades não é uma categoria de
    // verdade (ex.: "relacionados") — daria 0 resultados e a seção
    // sumiria sozinha. Quem monta/atualiza o conteúdo dessas grades é
    // a própria página (ela chama montarSlidesCarrossel/
    // sincronizarDotsCarrossel diretamente); aqui só ignoramos.
    //
    // BUG CORRIGIDO: "if (grade.dataset.manual)" nunca funcionava de
    // verdade pra um atributo ESCRITO SEM VALOR no HTML (ex.:
    // "<div data-manual>", o jeito como esta e outras grades manuais
    // sempre foram escritas). Um atributo assim vira dataset.manual
    // === "" (string VAZIA) — e "" é falsy em JS, então o "if" nunca
    // disparava; esta função continuava filtrando e SOBRESCREVENDO
    // essas grades como se fossem automáticas. Passou despercebido até
    // agora porque #produtos-relacionados (produto.js) mora numa
    // página que nunca chama aplicarEExibir() — o bug só ficou visível
    // quando "Queridinhos do Ateliê" e "Cerâmica no Seu Café da Tarde"
    // (Home) viraram grades manuais também: min 450ms depois de
    // carregar (DELAY_DEV_MS), aplicarEExibir() rodava e apagava as
    // duas (filtrando por categoria "queridinhos"/"cafe-da-tarde", que
    // não bate com NENHUM produto -> grade.innerHTML = ''). A checagem
    // certa é pela PRESENÇA do atributo, não pelo valor dele.
    if ('manual' in grade.dataset) return;

    const cat = grade.dataset.gradeProdutos; // "ceramica" | "croche"
    const daCategoria = todosProdutos.filter((p) => {
      if (p.categoria !== cat) return false;
      // A peça de ID_PRODUTO_DESTAQUE (declarada mais abaixo neste
      // arquivo, na seção "Peça em Destaque") já ganha sua PRÓPRIA
      // seção de honra na Home ("Escolha do Ateliê") — sem este "if",
      // ela apareceria de novo aqui, duplicada, no carrossel logo
      // abaixo. Mas SÓ tira ela do carrossel SIMPLES (grade.dataset.
      // agruparPor ausente — é o caso da Home): ceramica.html usa a
      // MESMA função (grade com data-agrupar-por="subcategoria") pra
      // listar o catálogo INTEIRO por subcategoria — lá ela precisa
      // continuar aparecendo normalmente, senão a peça sumiria da
      // única página que lista todo o acervo de "Vasos Escultóricos".
      if (!grade.dataset.agruparPor && p.id === ID_PRODUTO_DESTAQUE) {
        return false;
      }
      return true;
    });
    const secao = grade.closest('section');

    // categoria sem NENHUMA peça no catálogo:
    if (daCategoria.length === 0) {
      grade.innerHTML = '';

      // CROCHÊ especificamente (achado da auditoria, item 2): em vez
      // de esconder a seção INTEIRA (como as outras categorias vazias
      // fariam, no "else" abaixo), mostra o aviso "em breve" dela
      // (#croche-em-breve, no HTML) — assim "Crochê Artesanal 🧶"
      // continua visível na Home, só sem fingir ter produtos. No dia
      // em que existir 1+ peça com categoria "croche" em produtos.js,
      // daCategoria.length para de ser 0 e este "if" nem roda mais —
      // a grade normal (código mais abaixo) assume sozinha, sem
      // precisar tocar aqui de novo.
      const avisoCroche = document.querySelector('#croche-em-breve');
      if (cat === 'croche' && avisoCroche) {
        if (secao) secao.hidden = false;
        avisoCroche.hidden = false;
      } else {
        if (secao) secao.hidden = true;
      }
      return;
    }
    if (secao) secao.hidden = false;
    // categoria passou a ter peça(s): garante que o aviso "em breve"
    // (se esta grade for a de crochê) não fique visível junto da
    // grade de produtos de verdade.
    const avisoCroche = document.querySelector('#croche-em-breve');
    if (cat === 'croche' && avisoCroche) avisoCroche.hidden = true;

    // aplica busca + faixa de preço + ordenação
    const visiveis = filtrarProdutos(daCategoria, criterios);

    // categoria TEM peças mas nenhuma passou nos filtros: mostra a
    // mensagem (e NÃO esconde a seção — o usuário precisa ver por quê)
    if (visiveis.length === 0) {
      grade.innerHTML = mensagemVazia();
      return;
    }

    // data-agrupar-por="subcategoria" (só em ceramica.html) -> a
    // vitrine sai dividida em blocos com subtítulo. Sem o atributo
    // (Home) -> cards agrupados em .carrossel-slide, um carrossel de
    // verdade tanto no mobile (2 cards/página) quanto no desktop
    // (4 cards/página, tratamento mais elaborado — ver CSS).
    grade.innerHTML = grade.dataset.agruparPor
      ? renderAgrupado(visiveis, grade.dataset.agruparPor)
      : montarSlidesCarrossel(visiveis, cardsPorSlideCarrossel());
  });

  // os cards recém-criados têm a classe .reveal -> registra eles
  // no observador pra animarem ao entrar na tela
  escanearReveal();

  // (re)constrói os dots do carrossel mobile conforme a quantidade de
  // slides que acabou de ser renderizada (a busca pode ter mudado o
  // total de peças visíveis)
  sincronizarDotsCarrossel();
}

// ============================================================================
//  CARROSSEL DE PRODUTOS (Home) — mobile E desktop
// ============================================================================
// Só a Home usa isto (as grades .produtos-grid com data-grade-produtos e
// SEM data-agrupar-por). A ideia, GENERALIZADA pros dois tamanhos de tela:
//   - agrupa os cards em wrappers .carrossel-slide, N por vez — N vem de
//     cardsPorSlideCarrossel() (2 no mobile, 4 no desktop);
//   - o CSS (ver style.css) faz .produtos-grid virar um trilho horizontal
//     com scroll-snap EM QUALQUER largura agora — só mudam os detalhes:
//     no mobile é uma barra esticada; no desktop, um cartão com setas
//     circulares flutuando ao lado (mais "de vitrine");
//   - o JS aqui embaixo conta os slides pra desenhar os dots, cria (só
//     no desktop, via CSS) as setas de navegação, e num único listener
//     de scroll mantém os dois em dia: dot ativo + setas habilitadas/
//     desabilitadas.
//   - cruzar o breakpoint 768/769px (ex.: redimensionando a janela) faz
//     o Home reagrupar os slides sozinho — ver o matchMedia lá embaixo.

// Quantos cards cabem numa "página" do carrossel, conforme a largura
// da tela — a MESMA lógica de breakpoint (769px) usada no resto do
// site (menu mobile, header auto-hide etc.), pra nunca dessincronizar
// do que o CSS realmente está exibindo.
function cardsPorSlideCarrossel() {
  return window.matchMedia('(min-width: 769px)').matches ? 4 : 2;
}

// Quebra a lista de produtos em "páginas" de "porSlide" e embrulha
// cada grupo. Generalizado (recebe porSlide) em vez de ter o "2" fixo
// de antes — é o que permite mobile e desktop usarem a MESMA função
// com quantidades diferentes. "criarCard" é quem desenha CADA card
// (padrão: card de produto) — a esteira de subcategorias da Home
// (montarColecoesHome) passa o card de coleção e reaproveita o MESMO
// carrossel (trilho, setas, dots, snap) em vez de ter um mecanismo só dela.
function montarSlidesCarrossel(lista, porSlide, criarCard = criarCardProduto) {
  let html = '';
  for (let i = 0; i < lista.length; i += porSlide) {
    const grupo = lista
      .slice(i, i + porSlide)
      .map((item) => criarCard(item))
      .join('');
    html += `<div class="carrossel-slide">${grupo}</div>`;
  }
  return html;
}

// Distância (px) entre o início de um slide e o do seguinte = largura
// do slide + gap. Medida no DOM (não suposta = largura do trilho)
// porque na esteira de subcategorias do mobile o slide é MENOR que o
// trilho, de propósito (a "espiadinha" do próximo card).
function passoSlideCarrossel(grade) {
  const slides = grade.querySelectorAll('.carrossel-slide');
  return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : grade.clientWidth;
}

// Cria (só na 1ª vez) o par de setas de navegação e o
// ".carrossel-viewport" que as ancora — ver o comentário grande sobre
// esse wrapper no CSS (style.css, bloco @media min-width:769px). No
// mobile as setas existem no DOM mas ficam com display:none (CSS) —
// mais simples que criar/destruir dependendo da largura da tela, e
// como são só 2 <button> pequenos o custo é irrelevante.
// IMPORTANTE: isto MOVE a "grade" no DOM (pra dentro do viewport novo)
// em vez de recriá-la — qualquer listener já ligado nela (o de scroll,
// mais abaixo) continua valendo depois do wrapping.
function garantirSetasCarrossel(grade) {
  let viewport = grade.parentElement;
  if (viewport.classList.contains('carrossel-viewport')) {
    return {
      viewport,
      setaAnterior: viewport.querySelector('.carrossel-seta--anterior'),
      setaProxima: viewport.querySelector('.carrossel-seta--proxima'),
    };
  }

  viewport = document.createElement('div');
  viewport.className = 'carrossel-viewport';
  grade.parentNode.insertBefore(viewport, grade);
  viewport.appendChild(grade);

  // chevron-left/right da Lucide — MESMOS paths já usados nas setas
  // do carrossel do banner (.banner-seta), pra manter o traço
  // consistente em todo o site.
  const criarSeta = (direcao, path, rotulo) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = `carrossel-seta carrossel-seta--${direcao}`;
    botao.setAttribute('aria-label', rotulo);
    botao.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${path}"/>
      </svg>`;
    return botao;
  };

  const setaAnterior = criarSeta('anterior', 'm15 18-6-6 6-6', 'Peças anteriores');
  const setaProxima = criarSeta('proxima', 'm9 18 6-6-6-6', 'Mais peças');

  viewport.insertBefore(setaAnterior, grade);
  viewport.appendChild(setaProxima);

  // Rola exatamente 1 "página" (o passo entre slides) por clique — a
  // MESMA unidade que o scroll-snap usa pra travar em cada slide,
  // então o clique sempre aterrissa certinho no vizinho.
  // scroll-behavior:smooth (CSS, item 4) faz o movimento ser suave;
  // aqui não precisa repetir isso, é propriedade do elemento que rola.
  setaAnterior.addEventListener('click', () => {
    grade.scrollBy({ left: -passoSlideCarrossel(grade), behavior: 'smooth' });
  });
  setaProxima.addEventListener('click', () => {
    grade.scrollBy({ left: passoSlideCarrossel(grade), behavior: 'smooth' });
  });

  return { viewport, setaAnterior, setaProxima };
}

// ============================================================
//  SNAP DE SEGURANÇA — TODOS os carrosséis horizontais com scroll-snap
// ============================================================
// ACHADO (reprodução com Playwright, iPhone 15 emulado, gestos de
// toque via CDP — Input.dispatchTouchEvent, não scrollTo/scrollBy):
// mesmo com o CSS de scroll-snap certo (scroll-snap-type:mandatory +
// scroll-snap-align + scroll-snap-stop:always), um toque curto que
// solta o dedo sem "arrastão" suficiente pode, dependendo do motor do
// navegador, deixar o trilho PARADO NO MEIO de duas unidades — o
// realinhamento que o scroll-snap deveria forçar simplesmente não
// dispara. Bate com o relato em vídeo (iPhone real, Safari): carrossel
// "solto", card cortado dos dois lados. A correção de CSS (touch-action
// + overscroll-behavior-x, ver .produtos-grid[data-grade-produtos] e
// .selecao-especial__grid em style.css) reduz bastante, mas depender
// só do CSS não dá uma GARANTIA — navegadores diferentes, versões
// diferentes.
//
// Por isso: depois que o scroll "assenta" (sem nenhum evento de scroll
// por 140ms — ou seja, o dedo já soltou e a inércia nativa já parou),
// este safety net RECONFERE a posição e, se estiver a mais de 2px de
// QUALQUER unidade (slide de produtos OU card grande), corrige sozinho
// com scrollTo suave. Resultado: o trilho SEMPRE termina alinhado,
// não importa o que o motor nativo decidiu fazer — a mesma função
// serve pro carrossel de produtos (sincronizarDotsCarrossel, abaixo) E
// pro carrossel de 2 cards de Edição Surpresa/Seleção Especial
// (montarIndicadorProdutos, mais abaixo no arquivo): um lugar só, não
// uma correção solta por seção.
//
// "unidades" é uma FUNÇÃO (não um array fixo) porque a lista de
// elementos pode ficar obsoleta: a busca/filtro reconstrói o
// innerHTML da grade de produtos a qualquer momento, e um array
// guardado na hora de ligar o listener apontaria pra elementos que já
// nem estão mais no DOM.
const TOLERANCIA_SNAP_PX = 2; // mesma tolerância pedida no teste de aceitação

function ativarSnapDeSeguranca(trilho, unidades) {
  if (!trilho) return;
  let timer = null;

  function corrigirSeNecessario() {
    const lista = unidades();
    if (!lista || lista.length === 0) return;

    const r = trilho.getBoundingClientRect();
    let alvoMaisPerto = null;
    let menorDistancia = Infinity;
    lista.forEach((u) => {
      const ur = u.getBoundingClientRect();
      // getBoundingClientRect já reflete a rolagem ATUAL do trilho —
      // "ur.left - r.left" sozinho é relativo a ESSE instante, não um
      // alvo absoluto de scrollLeft comparável depois. Somar
      // trilho.scrollLeft de volta devolve a coordenada absoluta.
      // Math.min(..., máximo): quando o slide é mais estreito que o
      // trilho (esteira com "espiadinha"), o início do ÚLTIMO slide
      // fica além do fim da rolagem — o navegador encaixa no fim, e
      // este alvo precisa ser o mesmo, senão a correção nunca "chega".
      const alvo = Math.min(ur.left - r.left + trilho.scrollLeft, trilho.scrollWidth - trilho.clientWidth);
      const distancia = Math.abs(trilho.scrollLeft - alvo);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        alvoMaisPerto = alvo;
      }
    });

    if (alvoMaisPerto !== null && menorDistancia > TOLERANCIA_SNAP_PX) {
      const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      trilho.scrollTo({ left: alvoMaisPerto, behavior: semMovimento ? 'auto' : 'smooth' });
    }
  }

  // passive:true: este listener só LÊ a posição, nunca interfere no
  // gesto nativo. 140ms sem nenhum outro evento de scroll = sinal de
  // que o trilho parou de vez (dedo solto, inércia zerada).
  trilho.addEventListener(
    'scroll',
    () => {
      clearTimeout(timer);
      timer = setTimeout(corrigirSeNecessario, 140);
    },
    { passive: true }
  );
}

// Para cada grade-carrossel da Home: garante o viewport + setas,
// garante um <div class="carrossel-dots"> com um ponto por slide, e
// liga (uma vez) o listener de scroll que mantém dot ativo + setas em
// dia.
function sincronizarDotsCarrossel() {
  const grades = document.querySelectorAll(
    '[data-grade-produtos]:not([data-agrupar-por])'
  );

  grades.forEach((grade) => {
    const { viewport, setaAnterior, setaProxima } = garantirSetasCarrossel(grade);
    const slides = grade.querySelectorAll('.carrossel-slide');
    const secao = grade.closest('section') || grade.parentElement;

    // pega (ou cria) o contêiner de dots. Procuro pela CLASSE dentro
    // da seção (não por nextElementSibling): depois que a grade entra
    // no .carrossel-viewport, o próximo irmão DELA passou a ser a
    // seta "próxima" — quem fica ao lado dos dots agora é o viewport
    // inteiro, não a grade.
    let dots = secao.querySelector('.carrossel-dots');
    if (!dots) {
      dots = document.createElement('div');
      dots.className = 'carrossel-dots';
      dots.setAttribute('aria-hidden', 'true'); // decorativo: o scroll/as setas são a navegação
      viewport.after(dots);
    }

    // 0 ou 1 slide -> não há o que paginar: some com dots E setas
    if (slides.length < 2) {
      dots.innerHTML = '';
      setaAnterior.hidden = true;
      setaProxima.hidden = true;
      return;
    }
    setaAnterior.hidden = false;
    setaProxima.hidden = false;

    // um ponto por slide; o primeiro já nasce ativo
    dots.innerHTML = Array.from(slides)
      .map(
        (_, i) =>
          `<span class="carrossel-dot${i === 0 ? ' is-ativo' : ''}"></span>`
      )
      .join('');

    // marca como ativo o dot correspondente ao slide mais "encaixado"
    // na tela (divide o quanto já rolou pelo passo entre slides e
    // arredonda) e habilita/desabilita as setas nas pontas — SEM loop
    // de propósito (ver comentário em .carrossel-seta:disabled no CSS).
    // Chegou ao fim do trilho = último slide, mesmo que a conta dê
    // menos (slide mais estreito que o trilho: o último nunca encosta
    // na borda esquerda, ver passoSlideCarrossel).
    function atualizarAtivo() {
      const total = grade.querySelectorAll('.carrossel-slide').length;
      const fim = grade.scrollWidth - grade.clientWidth;
      const indice = grade.scrollLeft >= fim - TOLERANCIA_SNAP_PX
        ? total - 1
        : Math.round(grade.scrollLeft / (passoSlideCarrossel(grade) || 1));
      // CORREÇÃO: os pontos são buscados AQUI, a cada scroll, e não
      // guardados de fora. O listener é ligado uma vez só (abaixo), mas
      // esta função é chamada de novo (ex.: aplicarEExibir() logo depois
      // da carga) e REFAZ o innerHTML dos dots — uma lista guardada na
      // 1ª chamada apontava pra pontos que já tinham saído da tela, e o
      // dot ativo ficava preso no primeiro em todos os carrosséis da Home.
      dots.querySelectorAll('.carrossel-dot').forEach((p, i) => p.classList.toggle('is-ativo', i === indice));
      setaAnterior.disabled = indice <= 0;
      setaProxima.disabled = indice >= total - 1;
    }

    // liga o listener só UMA vez por grade (aplicarEExibir roda de novo
    // a cada tecla digitada na busca — sem esta trava, empilharia
    // listeners). O innerHTML dos dots acima pode ser refeito à vontade;
    // o listener continua válido porque escuta a GRADE, não os pontos.
    if (!grade.dataset.carrosselLigado) {
      grade.addEventListener('scroll', atualizarAtivo, { passive: true });
      grade.dataset.carrosselLigado = '1';
      // ver o comentário grande em ativarSnapDeSeguranca(), acima
      ativarSnapDeSeguranca(grade, () => grade.querySelectorAll('.carrossel-slide'));
    }
    atualizarAtivo();

    // --- DICA "ARRASTE" (1ª vez, só mobile) ----------------------
    montarDicaDeslize(grade, dots);
  });
}

// Cruzar o breakpoint (ex.: redimensionar a janela do desktop pra
// largura de tablet/celular, ou girar o celular) muda quantos cards
// cabem por slide — reagrupa tudo chamando aplicarEExibir() de novo,
// que já filtra/ordena/desenha as grades e, no fim, chama
// sincronizarDotsCarrossel(). Fica FORA de qualquer função (roda uma
// vez só, na carga da página) — mesmo padrão do mqDesktopMenu logo no
// topo deste arquivo.
const mqCarrosselDesktop = window.matchMedia('(min-width: 769px)');
mqCarrosselDesktop.addEventListener('change', () => {
  aplicarEExibir();
});

// Mostra, UMA única vez, uma setinha "arraste" abaixo do carrossel —
// só faz sentido no mobile (o CSS esconde no desktop). Some na 1ª
// rolagem do carrossel OU depois de ~6s, e não volta a aparecer em
// visitas futuras (flag no localStorage). É puramente um reforço
// visual: aria-hidden, e o controle de verdade continua sendo o
// gesto de deslizar + os dots.
const CHAVE_DICA_CARROSSEL = 'anasor-dica-carrossel-visto';

function montarDicaDeslize(grade, dots) {
  // a dica só faz sentido no mobile (é onde o grid vira carrossel).
  // Gate no JS além do CSS: assim o desktop nem cria o elemento nem
  // grava a flag do localStorage (senão quem abre 1º no desktop
  // "queimaria" a dica pra quando abrisse no celular).
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  // já existe uma dica pra este carrossel? (aplicarEExibir roda de
  // novo a cada busca — não queremos criar várias)
  const secao = grade.closest('section') || grade.parentElement;
  if (secao.querySelector('.carrossel-hint')) return;

  // menos de 2 páginas: não há o que deslizar
  if (grade.querySelectorAll('.carrossel-slide').length < 2) return;

  // já viu numa visita anterior? (localStorage pode falhar em
  // navegação privada / cookies bloqueados -> try/catch)
  try {
    if (localStorage.getItem(CHAVE_DICA_CARROSSEL) === '1') return;
  } catch (e) {
    /* segue e mostra a dica mesmo assim */
  }

  const dica = document.createElement('div');
  dica.className = 'carrossel-hint';
  dica.setAttribute('aria-hidden', 'true');
  // texto curto + chevron-right da Lucide (SVG inline, como o resto
  // do site). O CSS anima só o <svg>.
  dica.innerHTML = `
    arraste
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  `;
  // fica entre os cards e os dots
  dots.before(dica);

  let jaSumiu = false;
  const esconder = () => {
    if (jaSumiu) return;
    jaSumiu = true;
    dica.classList.add('is-oculta');          // CSS faz o fade + colapso
    clearTimeout(timer);
    grade.removeEventListener('scroll', esconder);
    try {
      localStorage.setItem(CHAVE_DICA_CARROSSEL, '1');
    } catch (e) {
      /* sem localStorage: a dica não vai "lembrar" entre visitas —
         aceitável, o pedido permite reaparecer a cada carregamento */
    }
    // remove do DOM depois da transição (0.5s no CSS)
    setTimeout(() => dica.remove(), 600);
  };

  // some na 1ª rolagem do carrossel...
  grade.addEventListener('scroll', esconder, { passive: true });
  // ...ou sozinha depois de 6s, pra não ficar pra sempre em quem não
  // interage
  const timer = setTimeout(esconder, 6000);
}

// Renderiza os produtos DIVIDIDOS por um campo (ex.: "subcategoria").
// A LISTA DE GRUPOS E DESCOBERTA A PARTIR DOS DADOS — nao ha nomes
// de subcategoria escritos aqui. Assim, se amanha um produto novo
// trouxer subcategoria: "Canecas Artisticas", um bloco "Canecas
// Artisticas" aparece sozinho, sem tocar em HTML nem JS.
function renderAgrupado(lista, campo) {
  // new Set(...) guarda so valores UNICOS. Jogamos nele o array de
  // subcategorias (com repeticao) e espalhamos de volta com [...] —
  // sobra uma lista SEM duplicatas, NA ORDEM em que cada
  // subcategoria apareceu pela 1a vez em "lista" (que ja vem
  // filtrada e ordenada de filtrarProdutos()).
  const grupos = [...new Set(lista.map((p) => p[campo]))];

  return grupos
    .map((grupo) => {
      const cards = lista
        .filter((p) => p[campo] === grupo)
        .map(criarCardProduto)
        .join('');
      return `
        <h2 class="subcategoria-titulo">${grupo}</h2>
        <div class="produtos-grid">${cards}</div>
      `;
    })
    .join('');
}

// Preenche as vitrines na 1 carga: skeleton -> espera os dados ->
// guarda em todosProdutos -> aplica os critérios atuais.
// "async" porque no futuro vai esperar (await) uma resposta de API.
async function renderizarVitrines() {
  const grets = document.querySelectorAll('[data-grade-produtos]');
  if (grets.length === 0) return; // página sem vitrine (ex.: produto.html)

  // 1) SKELETON imediato
  grets.forEach((grade) => {
    // GRADES MANUAIS (data-manual — "Queridinhos do Ateliê" e
    // "Cerâmica no Seu Café da Tarde", povoadas por
    // montarVitrineCurada() logo no início do script, ANTES desta
    // função rodar) pulam o skeleton: BUG que existia aqui e foi
    // corrigido junto do de aplicarEExibir() (ver o comentário grande
    // lá, mais acima) — esta função ignorava data-manual da mesma
    // forma (checava a STRING do atributo, que é "" e portanto falsy
    // pra um atributo escrito sem valor no HTML), então mesmo as
    // grades já corretamente montadas por montarVitrineCurada()
    // tinham o conteúdo APAGADO e trocado por 6 esqueletos aqui, uma
    // fração de segundo depois — e nada as repovoava depois disso,
    // porque aplicarEExibir() (chamada só 450ms mais tarde) já as
    // ignora de propósito. Resultado: a grade ficava travada
    // mostrando skeleton pra sempre. A checagem certa é pela
    // PRESENÇA do atributo, não pelo valor dele.
    if ('manual' in grade.dataset) return;

    // Na Home, a própria grade É o .produtos-grid -> os skeletons
    // entram direto. Em ceramica.html a grade agrupa (não é grid),
    // então embrulhamos os skeletons num .produtos-grid pra eles
    // ficarem lado a lado durante o carregamento.
    grade.innerHTML = grade.dataset.agruparPor
      ? `<div class="produtos-grid">${criarSkeletons(6)}</div>`
      : criarSkeletons(6);
    const secao = grade.closest('section');
    if (secao) secao.hidden = false;
  });

  // 2) espera os dados (hoje: array + DELAY_DEV_MS; amanhã: fetch)
  todosProdutos = await carregarProdutos();

  // 3) desenha aplicando os critérios que já estiverem ativos
  //    (o usuário pode ter digitado na busca durante o carregamento)
  aplicarEExibir();
}

// ============================================================================
//  LIGAÇÃO DOS CONNTROLES: busca, faixa de preço, ordenação
// ============================================================================
// Cada controrole guarda seu valor em "criterios" e manda re-renderizar.
// Os "if (el)" existem porque nem todo controrole aparece em toda
// página: a busca está no header de index e ceramica; os <select>
// de faixa/ordem só existem em ceramica.html.
const inputBusca = document.querySelector('#busca');
if (inputBusca) {
  // o evento "input" dispara a CADDA tecla -> busca em tempo real.
  // (Com uma API de verdade, aqui entraga um "debounce" de ~300 ms
  //  pra não fazer uma requisição a cada tecla; com array local,
  //  filtrar na hora é instantâneo e mais simples.)
  inputBusca.addEventListener('input', (e) => {
    criterios.busca = e.target.value;
    aplicarEExibir();
  });

  // Enter dentro de um <input> num <form> recarregaria a página.
  // Como a busca já é "ao vivo", o submit não serve pra nada — bloqueamos.
  if (inputBusca.form) {
    inputBusca.form.addEventListener('submit', (e) => e.preventDefault());
  }
}

const selectPreco = document.querySelector('#filtro-preco');
if (selectPreco) {
  selectPreco.addEventListener('change', (e) => {
    criterios.faixaPreco = e.target.value;
    aplicarEExibir();
  });
}

const selectOrdem = document.querySelector('#ordenar');
if (selectOrdem) {
  selectOrdem.addEventListener('change', (e) => {
    criterios.ordem = e.target.value;
    aplicarEExibir();
  });
}

// ============================================
//  BASE DO CARRINHO (estrutura para o futuro)
//  Por enquanto os itens ficam salvos só no localStorage do navegador
//  e o número aparece ao lado do ícone do carrinho.
//  A integração real de pagamento (Mercado Pago / Stripe) vai precisar
//  de um back-end e entra numa etapa posterior — os data-* nos cards
//  e este formato de item já deixam o caminho pronto.
// ============================================
const CHAVE_CARRINHO = 'anasor-carrinho';

function lerCarrinho() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
  } catch {
    // se o localStorage estiver corrompido ou bloqueado, começa vazio
    return [];
  }
}

function salvarCarrinho(itens) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
  atualizarContadorCarrinho();
  // se o mini-carrinho estiver aberto, reflete a mudança na hora.
  // (miniCarrinho é criado mais abaixo neste arquivo; quando esta
  // função É CHAMADA, o script já rodou inteiro, então ele existe.)
  if (miniCarrinho && miniCarrinho.classList.contains('is-aberto')) {
    renderMiniCarrinho();
  }
  sincronizarBotoesCarrinho(itens);
}

// O "No carrinho ✓" é decidido quando o card nasce; tirar a peça no
// mini-carrinho tem que devolver o botão a "Adicionar" sem recarregar.
// O "Adicionado ✓" (feedback de 1,2s) fica de fora para não piscar.
function sincronizarBotoesCarrinho(itens) {
  const noCarrinho = new Set(itens.map((item) => String(item.id)));
  document.querySelectorAll('[data-id] > button.btn-comprar, .produto-detalhe__acoes button.btn-comprar').forEach((botao) => {
    if (botao.disabled) return;
    const id = botao.closest('[data-id]')?.dataset.id;
    if (!id) return;
    botao.textContent = noCarrinho.has(id) ? TEXTO_NO_CARRINHO : 'Adicionar ao Carrinho';
  });
}

function atualizarContadorCarrinho() {
  const total = lerCarrinho().reduce((soma, item) => soma + item.quantidade, 0);
  const link = document.querySelector('.nav-icons a');
  if (link) {
    link.textContent = total > 0 ? `🛒 Carrinho (${total})` : '🛒 Carrinho';
  }
}

// Adiciona ao carrinho o produto do card clicado.
//
// CORREÇÃO (bug: foto sumia no mini-carrinho): o item salvo aqui
// agora leva também "imagem" (lida de card.dataset.imagem — presente
// em TODOS os pontos de entrada: card da grade, seção "Peça em
// Destaque" da Home e a barra de compra flutuante de produto.html).
// Antes só id/nome/preço/quantidade eram salvos, e o mini-carrinho
// tentava redescobrir a foto depois, buscando o id no array
// "produtos" na hora de renderizar (ver renderMiniCarrinho, mais
// abaixo) — funcionava só enquanto o catálogo continuasse com aquele
// id, no mesmo formato; qualquer furo nessa cadeia (id não bater,
// produto reordenado/removido de produtos.js) deixava a foto vazia,
// caindo no placeholder. Gravar a imagem JUNTO com o item, direto no
// localStorage, remove essa dependência: o carrinho passa a guardar
// tudo que precisa pra se desenhar sozinho, sem religar no catálogo.
function adicionarAoCarrinho(card, botao) {
  const item = {
    id: card.dataset.id,
    nome: card.dataset.nome,
    preco: Number(card.dataset.preco),
    imagem: card.dataset.imagem || '',
    quantidade: 1,
  };

  const carrinho = lerCarrinho();
  // compara como texto: dataset.id sempre vem string do HTML
  const existente = carrinho.find((produto) => String(produto.id) === item.id);
  if (existente) {
    // Peça única (estoque 1, ver CLAUDE.md): tocar de novo em "comprar"
    // não soma — antes virava "2x" no carrinho de uma peça que só
    // existe uma (o backend também corrige, ver POST /api/checkout).
    existente.quantidade = 1;
    // Backfill: item salvo ANTES desta correção (sem "imagem" no
    // localStorage) ganha a foto agora, na primeira vez que a peça é
    // comprada de novo — sem isso, quem já tinha o item no carrinho
    // continuaria vendo o placeholder até esvaziar e recomeçar.
    if (!existente.imagem && item.imagem) existente.imagem = item.imagem;
  } else {
    carrinho.push(item);
  }
  salvarCarrinho(carrinho);

  // 1) feedback rápido NO PRÓPRIO BOTÃO (onde o olhar já está)
  const textoOriginal = botao.textContent;
  botao.textContent = 'Adicionado ✓';
  botao.disabled = true;
  setTimeout(() => {
    // "Adicionar" vira "No carrinho ✓": peça única não soma quantidade,
    // então o botão passa a contar o estado em vez de convidar de novo
    botao.textContent = botao.classList.contains('btn-comprar') ? TEXTO_NO_CARRINHO : textoOriginal;
    botao.disabled = false;
  }, 1200);

  // 2) feedback GLOBAL: toast com o nome da peça (some sozinho em ~3s)
  mostrarToast(`✓ ${item.nome} adicionado ao carrinho`);
}

// Peça vendida não entra no carrinho por nenhum caminho (card antigo
// em cache, barra, HTML editado): a checagem é pelo catálogo, não pelo
// botão. O servidor recusa de novo no checkout (defesa em profundidade).
function pecaVendidaPorId(id) {
  const produto = produtos.find((p) => String(p.id) === String(id));
  return Boolean(produto && estaVendida(produto));
}

// Carrinho salvo antes da venda: tira a peça e avisa, em vez de deixar
// o cliente descobrir só no pagamento.
function removerVendidasDoCarrinho() {
  const carrinho = lerCarrinho();
  const restantes = carrinho.filter((item) => !pecaVendidaPorId(item.id));
  const removidas = carrinho.length - restantes.length;
  if (removidas === 0) return;
  salvarCarrinho(restantes);
  mostrarToast(
    removidas === 1
      ? 'Uma peça do seu carrinho foi vendida e saiu dele 🤎'
      : `${removidas} peças do seu carrinho foram vendidas e saíram dele 🤎`
  );
}

// DELEGAÇÃO DE EVENTO: em vez de dar addEventListener em cada botão
// (que nem existe ainda quando este arquivo roda — os cards são
// criados por renderizarVitrines()), escutamos o clique no documento
// inteiro e verificamos se ele partiu de um ".btn-comprar" OU de um
// ".btn-comprar-agora". Assim funciona para qualquer card, inclusive
// os que forem adicionados depois.
// "button." na frente das duas classes (rodada de mobile/barra-compra):
// a barra flutuante de produto.html agora reaproveita a MESMA classe
// ".btn-comprar-agora" num <a href="wa.me/..."> pra peça indisponível
// (visual idêntico ao botão gummy de compra, sem duplicar CSS) — sem
// este prefixo, o <a> também cairia neste listener e adicionaria a
// peça (indisponível!) ao carrinho como efeito colateral do clique.
// Todo botão de compra DE VERDADE no site já é <button>, então este
// filtro não muda nenhum comportamento existente.
document.addEventListener('click', (evento) => {
  const botaoComprarAgora = evento.target.closest('button.btn-comprar-agora');
  const botao = botaoComprarAgora || evento.target.closest('button.btn-comprar');
  if (!botao) return;

  // Sobe do botão até o elemento que carrega os dados do produto
  // (data-id / data-nome / data-preco). Na Home e em ceramica.html
  // esse elemento é o .produto-card; na página de produto individual
  // é o .produto-detalhe. Como AMBOS têm data-id, procuramos por
  // [data-id] em vez de por uma classe específica — assim a mesma
  // lógica de carrinho serve pras duas telas, sem duplicar código.
  const card = botao.closest('[data-id]');
  if (!card) return;

  if (pecaVendidaPorId(card.dataset.id)) {
    mostrarToast('Esta peça já foi vendida. Que tal encomendar uma parecida? 🤎');
    return;
  }

  adicionarAoCarrinho(card, botao);

  // "Comprar Agora" faz mais uma coisa além de adicionar: já abre o
  // mini-carrinho na hora, dando a sensação de "compra rápida" — hoje
  // ainda não existe checkout de verdade (o próprio mini-carrinho
  // avisa isso no rodapé dele, em renderMiniCarrinho()), então abrir
  // o painel já com o item dentro é o mais perto disso que dá pra
  // oferecer por enquanto.
  if (botaoComprarAgora) {
    abrirMiniCarrinho();
  }
});

// ============================================================
//  BOTÃO "VOLTAR AO TOPO"
// ============================================================
// POR QUE CRIAR O BOTÃO AQUI, VIA JS, EM VEZ DE COLAR O HTML DELE
// EM CADA PÁGINA (index / ceramica / produto)?
//   - é EXATAMENTE o mesmo botão nas 3 páginas;
//   - não é conteúdo e não afeta SEO — é só um atalho de navegação;
//   - criado num lugar só, se um dia mudar o ícone ou o rótulo, muda
//     em todo o site de uma vez, sem risco de as 3 cópias divergirem.
//   Trade-off: sem JavaScript o botão não aparece — aceitável, porque
//   é um recurso de conveniência, não essencial.
// O main.js já é carregado nas 3 páginas, então este bloco roda em
// todas.

const botaoTopo = document.createElement('button');
botaoTopo.className = 'voltar-topo';
botaoTopo.type = 'button';
botaoTopo.setAttribute('aria-label', 'Voltar ao topo');
// seta pra cima — SVG inline no mesmo estilo de traço dos ícones dos
// selos (stroke currentColor, cantos arredondados)
botaoTopo.innerHTML =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
document.body.appendChild(botaoTopo);

// LIMIAR de 400px: só mostra o botão depois que o usuário rolou
// ~uma tela pra baixo. Menos que isso, ele apareceria/sumiria a cada
// rolagenzinha (efeito "piscando") e nem seria útil — o topo ainda
// está logo ali.
const LIMIAR_TOPO = 400;

function atualizarBotaoTopo() {
  // toggle(classe, condição): adiciona a classe se o booleano for
  // true, remove se for false. Quem faz o fade é o CSS (transition
  // de opacity/visibility em .voltar-topo).
  botaoTopo.classList.toggle('is-visivel', window.scrollY > LIMIAR_TOPO);
}

// { passive: true }: promete ao navegador que este listener NUNCA
// chama preventDefault(), então ele pode rolar a página sem esperar
// o JS terminar — rolagem mais fluida. Um toggle de classe é barato,
// não precisa de throttle.
window.addEventListener('scroll', atualizarBotaoTopo, { passive: true });
atualizarBotaoTopo(); // checa já no carregamento (ex.: refresh no meio da página)

botaoTopo.addEventListener('click', () => {
  // respeita "reduzir movimento" do sistema: nesse caso vai direto ao
  // topo, sem animação. (O scroll-behavior:smooth do CSS já é
  // condicionado a isso; aqui garantimos o mesmo no scroll via JS.)
  const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: semAnimacao ? 'auto' : 'smooth' });
});

// ============================================================
//  TOAST DE NOTIFICAÇÃO (feedback ao adicionar ao carrinho)
// ============================================================
// UM ÚNICO elemento de toast, criado aqui e reaproveitado sempre.
// Por que um só (e não criar/remover um por mensagem)?
//   - se o usuário adiciona vários itens em sequência rápida, a gente
//     só TROCA o texto e REINICIA o cronômetro de 3s — nunca aparecem
//     vários toasts empilhados;
//   - menos elementos criados/destruídos no DOM.
// Criado via JS (não colado no HTML de cada página) pelo mesmo motivo
// do botão "voltar ao topo": é o mesmo componente nas duas telas com
// vitrine, então mora num lugar só.
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');       // região "viva" p/ leitores de tela
toast.setAttribute('aria-live', 'polite');  // "polite" = anuncia sem interromper
document.body.appendChild(toast);

let toastTimer = null;
const TOAST_MS = 3000;

function mostrarToast(mensagem) {
  toast.textContent = mensagem;
  toast.classList.add('is-visivel'); // o CSS faz o slide + fade de entrada

  // Reinicia o cronômetro. Se outro produto entrar antes dos 3s, o
  // toast "se renova" (mesma caixa, texto novo, +3s) em vez de sumir
  // no meio ou empilhar.
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visivel'); // o CSS faz o fade de saída
  }, TOAST_MS);
}

// ============================================================
//  MINI-CARRINHO (painel lateral)
// ============================================================
// Ao clicar em "Carrinho" no header, em vez de navegar direto pra
// checkout.html, abre um painel deslizante pela direita com os itens
// do localStorage — "Finalizar Compra", no rodapé do painel, é quem
// de fato leva pra checkout.html (ver renderMiniCarrinho() abaixo).
// Criado via JS (não colado no HTML de cada página) pelo mesmo motivo
// do "voltar ao topo" e do toast: é o mesmo componente em todas as
// páginas -> mora num lugar só.
//
//   .mini-carrinho-overlay -> fundo escuro; clicar fecha
//   .mini-carrinho         -> o painel (role="dialog")
//       topo   (título + X)
//       lista  (miniatura, nome, preço x qtd, botão remover)
//       rodapé (total + "Finalizar Compra" -> checkout.html)

const miniOverlay = document.createElement('div');
miniOverlay.className = 'mini-carrinho-overlay';

const miniCarrinho = document.createElement('aside');
miniCarrinho.className = 'mini-carrinho';
miniCarrinho.setAttribute('role', 'dialog');
miniCarrinho.setAttribute('aria-modal', 'true');
miniCarrinho.setAttribute('aria-label', 'Seu carrinho');

document.body.append(miniOverlay, miniCarrinho);

// (Re)monta o conteúdo do painel a partir do localStorage.
function renderMiniCarrinho() {
  const itens = lerCarrinho();

  const linhas = itens
    .map((item) => {
      // A imagem agora VEM DO PRÓPRIO ITEM salvo no carrinho (ver
      // adicionarAoCarrinho, mais acima) — é a fonte principal, já
      // que reflete exatamente a foto que o cliente viu no momento da
      // compra. O find() no array "produtos" só entra como FALLBACK,
      // pra itens salvos no localStorage ANTES desta correção (que
      // não têm "imagem" no objeto); se o produto também tiver sumido
      // do catálogo nesse caso raro, a foto fica vazia mas o item
      // ainda aparece, pra poder ser removido.
      const foto =
        item.imagem || produtos.find((p) => String(p.id) === String(item.id))?.imagem || '';
      const subtotal = item.preco * item.quantidade;
      return `
        <li class="mini-item">
          <img class="mini-item__foto" src="${foto}" alt="" loading="lazy">
          <div class="mini-item__info">
            <p class="mini-item__nome">${item.nome}</p>
            <p class="mini-item__preco">
              ${item.quantidade} &times; ${formatarPreco(item.preco)}
              = <strong>${formatarPreco(subtotal)}</strong>
            </p>
          </div>
          <button class="mini-item__remover" type="button"
                  data-remover="${item.id}"
                  aria-label="Remover ${item.nome} do carrinho">&times;</button>
        </li>`;
    })
    .join('');

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);

  miniCarrinho.innerHTML = `
    <div class="mini-carrinho__topo">
      <h2>Seu Carrinho</h2>
      <button class="mini-carrinho__fechar" type="button" aria-label="Fechar carrinho">&times;</button>
    </div>

    ${
      itens.length === 0
        ? `<p class="mini-carrinho__vazio">Seu carrinho está vazio.</p>`
        : `<ul class="mini-carrinho__lista">${linhas}</ul>`
    }

    <div class="mini-carrinho__rodape">
      <p class="mini-carrinho__total">
        <span>Total</span>
        <strong>${formatarPreco(total)}</strong>
      </p>
      <button class="btn-finalizar" type="button" ${itens.length === 0 ? 'disabled' : ''}>
        Finalizar Compra
      </button>
      <p class="mini-carrinho__aviso">
        Na próxima tela você confere seus dados e revisa o pedido antes de pagar.
      </p>
    </div>
  `;
}

function abrirMiniCarrinho() {
  renderMiniCarrinho();
  miniOverlay.classList.add('is-aberto');
  miniCarrinho.classList.add('is-aberto');
  document.body.style.overflow = 'hidden'; // trava o scroll do fundo
  // manda o foco pro botão de fechar (bom pra quem usa teclado)
  miniCarrinho.querySelector('.mini-carrinho__fechar').focus();
}

function fecharMiniCarrinho() {
  miniOverlay.classList.remove('is-aberto');
  miniCarrinho.classList.remove('is-aberto');
  document.body.style.overflow = '';
}

// abre pelo link "Carrinho" do header, em vez de navegar
const linkCarrinho = document.querySelector('.nav-icons a');
if (linkCarrinho) {
  linkCarrinho.addEventListener('click', (evento) => {
    evento.preventDefault(); // NÃO vai pra carrinho.html
    abrirMiniCarrinho();
  });
}

// fechar: clique no overlay
miniOverlay.addEventListener('click', fecharMiniCarrinho);

// fechar: tecla Esc (só se estiver aberto)
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && miniCarrinho.classList.contains('is-aberto')) {
    fecharMiniCarrinho();
  }
});

// cliques DENTRO do painel: fechar (X), remover um item ou finalizar.
// Delegação porque o conteúdo é recriado a cada renderMiniCarrinho().
miniCarrinho.addEventListener('click', (evento) => {
  if (evento.target.closest('.mini-carrinho__fechar')) {
    fecharMiniCarrinho();
    return;
  }
  const btnRemover = evento.target.closest('[data-remover]');
  if (btnRemover) {
    const id = btnRemover.dataset.remover;
    const novo = lerCarrinho().filter((i) => String(i.id) !== String(id));
    salvarCarrinho(novo); // salva + atualiza contador + re-renderiza o painel
    return;
  }
  // "Finalizar Compra": leva pra checkout.html, que lê este MESMO
  // carrinho do localStorage (ver js/checkout.js). O botão só chega
  // aqui habilitado quando há pelo menos 1 item (ver renderMiniCarrinho).
  if (evento.target.closest('.btn-finalizar')) {
    window.location.href = 'checkout.html';
  }
});

// ============================================================
//  VALIDAÇÃO EM TEMPO REAL DO FORMULÁRIO DE CONTATO (só na Home)
// ============================================================
// "Ao vivo": reage no BLUR (sair do campo) e no INPUT (digitar).
// Por que blur pra MOSTRAR o erro e input só pra TIRAR?
//   - mostrar erro na 1a tecla é agressivo (a pessoa mal começou a
//     digitar o e-mail e já leva "e-mail inválido");
//   - blur = "terminei nesse campo", momento justo de cobrar;
//   - depois que o erro apareceu, sumir assim que o valor fica
//     válido dá retorno imediato de que consertou.
// O <form> tem "novalidate" no HTML -> as bolhas nativas do
// navegador ficam desligadas e usamos só as nossas mensagens.
// Fica aqui (com "if") em vez de num arquivo próprio porque é um
// bloco pequeno e o form só existe na index.html — mesmo padrão
// da barra de anúncio.
const formContato = document.querySelector('.contato-form');

if (formContato) {
  // cada campo: o input, o <span> de erro, a regra de validação e a
  // mensagem quando falha
  const campos = [
    {
      el: formContato.querySelector('[name="nome"]'),
      erroEl: formContato.querySelector('#erro-nome'),
      valida: (v) => v.trim().length > 0,
      msg: 'Digite seu nome.',
    },
    {
      el: formContato.querySelector('[name="email"]'),
      erroEl: formContato.querySelector('#erro-email'),
      // "algo@algo.algo": um ou mais caracteres que não são espaço
      // nem @, depois @, mais um pedaço, um ponto e um pedaço final.
      // Não cobre todo e-mail exótico (a validação de verdade é o
      // servidor conseguir enviar), mas barra os erros óbvios.
      valida: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: 'Digite um e-mail válido (ex.: nome@email.com).',
    },
    {
      el: formContato.querySelector('[name="mensagem"]'),
      erroEl: formContato.querySelector('#erro-mensagem'),
      // OPCIONAL: o form também funciona como cadastro de newsletter
      // (só nome + e-mail já registra a pessoa). Mensagem em branco é
      // válida -> sempre retorna true, nunca mostra erro nem trava o
      // botão "Enviar".
      valida: () => true,
      msg: '',
    },
  ];

  const botaoEnviar = formContato.querySelector('button[type="submit"]');

  // mostra (ou limpa) o erro de UM campo. "mostrar" = pode exibir o
  // erro; se false, só limpa (usado enquanto a pessoa ainda digita
  // sem nunca ter saído do campo).
  function validarCampo(campo, mostrar) {
    const ok = campo.valida(campo.el.value);
    campo.el.classList.toggle('invalido', !ok && mostrar);
    campo.erroEl.textContent = !ok && mostrar ? campo.msg : '';
    return ok;
  }

  // o form INTEIRO está válido? (liga/desliga o botão)
  function formValido() {
    return campos.every((c) => c.valida(c.el.value));
  }

  function atualizarBotao() {
    botaoEnviar.disabled = !formValido();
  }

  campos.forEach((campo) => {
    // saiu do campo -> mostra o erro se estiver inválido
    campo.el.addEventListener('blur', () => {
      validarCampo(campo, true);
      atualizarBotao();
    });
    // digitando -> se JÁ havia erro, re-checa (some sozinho quando
    // o valor fica válido). Sempre atualiza o estado do botão.
    campo.el.addEventListener('input', () => {
      if (campo.el.classList.contains('invalido')) {
        validarCampo(campo, true);
      }
      atualizarBotao();
    });
  });

  atualizarBotao(); // começa desabilitado (form vazio)

  formContato.addEventListener('submit', (evento) => {
    evento.preventDefault(); // não há back-end: nunca recarrega a página

    // revalida tudo mostrando erros (defesa caso o disabled seja burlado)
    const tudoOk = campos
      .map((campo) => validarCampo(campo, true))
      .every(Boolean);
    if (!tudoOk) return;

    // CORRIGIDO (bug real, achado na auditoria): antes este bloco só
    // mostrava um toast de "Mensagem enviada!"/"Cadastro feito!" e
    // reiniciava o form — SEM entregar a mensagem em lugar nenhum
    // (não há back-end nem mailto aqui, e o toast de sucesso era
    // simplesmente falso). Agora o "envio" de verdade é abrir o
    // WhatsApp da Anasor com a mensagem já escrita — mesmo canal que o
    // site já usa nos outros botões de WhatsApp (produto.js,
    // croche.html), só que aqui com nome/e-mail/recado embutidos no
    // texto, pra ela não precisar perguntar de novo quem está falando.
    const nome = campos[0].el.value.trim();
    const email = campos[1].el.value.trim();
    const mensagem = campos[2].el.value.trim();

    const textoWhats =
      `Olá! Me chamo ${nome} (${email}) e vim pelo site.` +
      (mensagem ? `\n\n${mensagem}` : '\n\nGostaria de receber novidades da Anasor Sobreira.');

    // encodeURIComponent: a mensagem pode ter espaços, acentos e
    // quebra de linha — nada disso é válido direto numa URL; a função
    // nativa do navegador escapa tudo isso no formato que a wa.me
    // exige (mesma técnica já usada em produto.js pro botão "Comprar
    // pelo WhatsApp").
    window.open(
      `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoWhats)}`,
      '_blank',
      'noopener'
    );

    mostrarToast('Abrindo o WhatsApp pra você enviar sua mensagem...');
    formContato.reset();
    campos.forEach((c) => {
      c.el.classList.remove('invalido');
      c.erroEl.textContent = '';
    });
    atualizarBotao();
  });
}

// ============================================================
//  SCROLL REVEAL — elementos surgem ao entrar na tela
// ============================================================
// Usa IntersectionObserver: uma API NATIVA que avisa quando um
// elemento entra (ou sai) de uma "área de observação" — por padrão,
// a janela visível. É melhor que ficar escutando o evento 'scroll'
// e calculando a posição de cada elemento a cada pixel rolado: o
// navegador faz isso de forma otimizada, sem travar a rolagem.
//
// FLUXO:
//   1. escanearReveal() acha os elementos com a classe .reveal que
//      ainda não foram tratados e manda o observador vigiar cada um.
//   2. quando um deles cruza ~10% pra dentro da tela, o callback
//      adiciona .is-revealed (o CSS faz o fade + slide) e chama
//      observador.unobserve(elemento) -> anima UMA VEZ só, nunca
//      repete (mesmo rolando pra cima e voltando).
//   3. quando a transição acaba, remove as classes de reveal pra
//      o elemento voltar ao transition normal dele (senão os 0.6s
//      do reveal ficariam "presos" no hover dos cards).

// o usuário pediu menos movimento no sistema operacional?
const reduzirMovimento = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// cria o observador só se der: precisa da API e de movimento liberado
const observadorReveal =
  'IntersectionObserver' in window && !reduzirMovimento
    ? new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return; // ainda não entrou na tela
            const el = entrada.target;
            el.classList.add('is-revealed');
            observadorReveal.unobserve(el); // <-- não observa mais: anima 1x

            // limpeza pós-animação: devolve o elemento ao normal
            el.addEventListener(
              'transitionend',
              () => {
                el.classList.remove('reveal', 'is-revealed', 'reveal--visto');
                el.style.transitionDelay = '';
              },
              { once: true }
            );
          });
        },
        {
          threshold: 0.1, // 10% do elemento visível já dispara
          rootMargin: '0px 0px -8% 0px', // "encurta" a base da tela em 8%:
          // o elemento revela um pouquinho DEPOIS de assomar, fica natural
        }
      )
    : null;

// Registra no observador todos os .reveal ainda não tratados.
// É chamada no início E de novo depois de qualquer render dinâmico
// (vitrine, filtros, ceramica.js, produto.js) pra pegar os cards
// recém-criados.
function escanearReveal() {
  document.querySelectorAll('.reveal:not(.reveal--visto)').forEach((el) => {
    el.classList.add('reveal--visto'); // marca pra não processar 2x

    // sem observador (API ausente ou "reduzir movimento"): só
    // garante o elemento visível — o CSS já não o esconde nesses
    // casos, isto aqui é cinto e suspensório.
    if (!observadorReveal) {
      el.classList.add('is-revealed');
      return;
    }

    // CASCATA: se o elemento tem "irmãos" .reveal (ex.: vários cards
    // na mesma grade), dá um atraso crescente conforme a posição,
    // pra surgirem um atrás do outro em vez de todos de uma vez.
    const irmaos = el.parentElement
      ? [...el.parentElement.children].filter((c) =>
          c.classList.contains('reveal')
        )
      : [];
    const posicao = irmaos.indexOf(el);
    if (posicao > 0) {
      // limita a 8 pra a última não demorar demais em grades grandes
      el.style.transitionDelay = `${Math.min(posicao, 8) * 70}ms`;
    }

    observadorReveal.observe(el);
  });
}

// ============================================================
//  CARROSSEL DO BANNER PRINCIPAL  (só existe na Home)
// ============================================================
// Fica AQUI (depois da seção "SCROLL REVEAL" acima) porque usa a
// constante "reduzirMovimento" definida ali — em vez de checar
// matchMedia() de novo aqui, reaproveitamos a mesma verificação,
// consistente com o resto do arquivo (parallax, logo comment...).
//
// bannersHero: fonte única da verdade de cada slide (foto + textos
// do cartão) — mesmo espírito do array "produtos" em produtos.js.
// Só o campo "alt" foi acrescentado aqui além do que foi pedido:
// texto alternativo da imagem é essencial de acessibilidade (a foto
// do banner NÃO é decorativa), então cada slide precisa do seu.
const bannersHero = [
  {
    imagem: 'img/banner-principal.jpeg',
    alt: 'Cerâmica Artesanal Anasor Sobreira',
    eyebrow: 'ATELIÊ ANASOR SOBREIRA',
    titulo: 'Cerâmica Artesanal:',
    tituloItalico: 'Beleza e Textura',
    subtitulo: 'Arte feita à mão para o seu dia a dia',
    categoriaContador: 'ceramica',
    linkBotaoPrincipal: 'ceramica.html',
    textoBotaoPrincipal: 'Ver Produtos',
  },
  {
    imagem: 'img/banner-croche.jpg',
    alt: 'Crochê Artesanal Anasor Sobreira',
    eyebrow: 'ATELIÊ ANASOR SOBREIRA',
    titulo: 'Crochê Artesanal:',
    tituloItalico: 'Aconchego Feito à Mão',
    subtitulo: 'Peças exclusivas para o seu lar',
    categoriaContador: 'croche',
    linkBotaoPrincipal: 'index.html#croche',
    textoBotaoPrincipal: 'Ver Produtos',
  },
];

// "bannerCarrossel" (não "bannerPrincipal", pra não colidir com a
// constante de mesmo nome que a seção de PARALLAX, logo abaixo,
// declara pra si mesma — as duas apontam pro MESMO elemento, cada
// bloco só guarda sua própria referência)
const bannerCarrossel = document.querySelector('.banner-principal');

if (bannerCarrossel) {
  const imgEl = document.querySelector('#banner-imagem');
  const textoEl = document.querySelector('#banner-texto');
  const eyebrowEl = document.querySelector('#banner-eyebrow');
  const tituloEl = document.querySelector('#banner-titulo');
  const subtituloEl = document.querySelector('#banner-subtitulo');
  const contadorEl = document.querySelector('#contador-pecas');
  const botaoPrincipalEl = document.querySelector('#banner-btn-principal');
  const indicadoresEl = document.querySelector('.banner-indicadores');
  const setaAnterior = bannerCarrossel.querySelector('.banner-seta--anterior');
  const setaProxima = bannerCarrossel.querySelector('.banner-seta--proxima');

  let slideAtual = 0;
  let timerCarrossel = null;
  const INTERVALO_MS = 6000;

  // 1 bolinha por slide — geradas a partir do TAMANHO de bannersHero
  // (não escritas à mão), então se um 3o slide for adicionado ali, a
  // bolinha extra aparece sozinha, sem tocar neste HTML/JS de novo.
  indicadoresEl.innerHTML = bannersHero
    .map(
      (_, i) =>
        `<button type="button" class="banner-indicador" aria-label="Ir para o slide ${i + 1}"></button>`
    )
    .join('');
  const indicadores = [...indicadoresEl.querySelectorAll('.banner-indicador')];

  // Contador FILTRADO pela categoria do slide — reaproveita a mesma
  // regra de plural/singular que o contador tinha antes (quando
  // ainda somava o catálogo inteiro). Categoria sem NENHUMA peça
  // ainda (ex.: "croche" hoje) cai no texto de aviso, em vez de
  // mostrar o esquisito "+0 peças exclusivas disponíveis".
  // Devolve HTML (não texto puro): SÓ o número fica em dourado
  // (<span class="num-ouro">), o resto da frase segue na cor normal.
  // É um dos 4 pontos do sistema de acento --cor-ouro. O "+" fica
  // junto do número no span (lê melhor "+8" todo dourado que só "8").
  // Sem número (categoria ainda sem peças) -> frase simples, sem span.
  function textoContadorPorCategoria(categoria) {
    // produtosVisiveis(): o contador não pode somar peça oculta
    const total = produtosVisiveis().filter((p) => p.categoria === categoria).length;
    if (total === 0) return 'Novidades chegando em breve';
    const unidade = total === 1 ? 'peça exclusiva disponível' : 'peças exclusivas disponíveis';
    return `<span class="num-ouro">+${total}</span> ${unidade}`;
  }

  // Preenche a <img> + o cartão de texto com os dados do slide "i".
  // comFade=false só é usado na 1a renderização (a página que acabou
  // de abrir não precisa "piscar" pra mostrar o slide inicial).
  function renderizarSlide(i, comFade) {
    const slide = bannersHero[i];

    const aplicar = () => {
      imgEl.src = slide.imagem;
      imgEl.alt = slide.alt;
      eyebrowEl.textContent = slide.eyebrow;
      tituloEl.innerHTML = `${slide.titulo} <span class="titulo-enfase">${slide.tituloItalico}</span>`;
      subtituloEl.textContent = slide.subtitulo;
      // innerHTML (não textContent): textoContadorPorCategoria devolve
      // um <span class="num-ouro"> ao redor do número. O conteúdo é
      // 100% gerado aqui (nada vem do usuário), então é seguro.
      contadorEl.innerHTML = textoContadorPorCategoria(slide.categoriaContador);
      botaoPrincipalEl.href = slide.linkBotaoPrincipal;
      botaoPrincipalEl.textContent = slide.textoBotaoPrincipal;

      indicadores.forEach((dot, idx) => {
        dot.classList.toggle('is-ativo', idx === i);
      });
    };

    // sem fade: aplica na hora (1a carga OU "reduzir movimento" ligado)
    if (!comFade || reduzirMovimento) {
      aplicar();
      return;
    }

    // COM fade: mesma técnica de 3 passos da barra de anúncio lá em
    // cima (.is-trocando tira a opacidade via CSS -> espera o
    // fade-out -> troca o conteúdo -> tira a classe -> fade-in), só
    // que aplicada em 2 elementos ao mesmo tempo (a foto E o cartão),
    // pra os dois trocarem JUNTOS, como pedido.
    imgEl.classList.add('is-trocando');
    textoEl.classList.add('is-trocando');
    setTimeout(() => {
      aplicar();
      imgEl.classList.remove('is-trocando');
      textoEl.classList.remove('is-trocando');
    }, 300);
  }

  function irParaSlide(i) {
    // "% bannersHero.length", com o "+ length" antes, faz o índice dar
    // a volta nos dois sentidos (slide -1 vira o último; slide "length"
    // vira o 0) — mesmo truque usado na barra de anúncio, adaptado pra
    // funcionar também com números negativos (JS: -1 % 3 = -1, não 2).
    slideAtual = (i + bannersHero.length) % bannersHero.length;
    renderizarSlide(slideAtual, true);
  }

  function proximoSlide() {
    irParaSlide(slideAtual + 1);
  }

  function slideAnterior() {
    irParaSlide(slideAtual - 1);
  }

  function iniciarAutoplay() {
    pararAutoplay(); // nunca deixa 2 intervalos rodando ao mesmo tempo
    if (reduzirMovimento) return; // quem pediu reduzir movimento não recebe troca automática
    timerCarrossel = setInterval(proximoSlide, INTERVALO_MS);
  }

  function pararAutoplay() {
    clearInterval(timerCarrossel);
    timerCarrossel = null;
  }

  // Qualquer interação MANUAL (seta ou bolinha) troca o slide E
  // REINICIA o cronômetro — sem isso, clicar bem antes da troca
  // automática faria o slide mudar de novo quase na sequência,
  // parecendo um bug de "trocou duas vezes".
  function interagirManualmente(acao) {
    acao();
    iniciarAutoplay();
  }

  setaProxima.addEventListener('click', () => interagirManualmente(proximoSlide));
  setaAnterior.addEventListener('click', () => interagirManualmente(slideAnterior));
  indicadores.forEach((dot, i) => {
    dot.addEventListener('click', () => interagirManualmente(() => irParaSlide(i)));
  });

  // pausa a troca automática com o mouse em cima do banner, retoma ao
  // tirar — comportamento clássico de carrossel: o usuário lendo o
  // cartão de texto não quer que a foto/o texto troquem debaixo dele
  bannerCarrossel.addEventListener('mouseenter', pararAutoplay);
  bannerCarrossel.addEventListener('mouseleave', iniciarAutoplay);

  // ============================================================
  //  SWIPE (arrastar com o dedo) — essencial no celular, onde as
  //  setas ficam escondidas (ver media query em style.css) e as
  //  bolinhas são o único controle manual visível.
  // ============================================================
  // Guardamos só a posição X onde o dedo TOCOU a tela; ao SOLTAR,
  // comparamos com a posição final. Não precisamos redesenhar nada
  // "seguindo o dedo" durante o arrasto (como apps nativos fazem) —
  // pra este carrossel, um gesto simples de "arrastou bastante pra
  // um lado -> troca de slide" já resolve, com bem menos código.
  let toqueInicioX = 0;
  let toqueInicioY = 0;

  bannerCarrossel.addEventListener(
    'touchstart',
    (evento) => {
      toqueInicioX = evento.touches[0].clientX;
      toqueInicioY = evento.touches[0].clientY;
    },
    { passive: true } // nunca chama preventDefault -> não atrapalha o scroll vertical
  );

  bannerCarrossel.addEventListener(
    'touchend',
    (evento) => {
      const toqueFimX = evento.changedTouches[0].clientX;
      const toqueFimY = evento.changedTouches[0].clientY;
      const distanciaX = toqueFimX - toqueInicioX;
      const distanciaY = toqueFimY - toqueInicioY;

      // LIMIAR de 50px: arrastos curtos (ou só um toque/tap) não
      // devem trocar de slide sem querer.
      // Comparar |X| > |Y| garante que é um gesto HORIZONTAL de
      // verdade — sem isso, rolar a página verticalmente com o dedo
      // bem em cima do banner (perfeitamente normal) poderia ser
      // interpretado como swipe e trocar o slide à toa.
      if (Math.abs(distanciaX) < 50 || Math.abs(distanciaX) < Math.abs(distanciaY)) {
        return;
      }

      // arrastou pra ESQUERDA (distância negativa) = "avança" o
      // carrossel, igual passar o dedo num álbum de fotos; arrastou
      // pra DIREITA = volta. Mesma reação de qualquer troca manual:
      // reinicia o cronômetro do autoplay (interagirManualmente).
      if (distanciaX < 0) {
        interagirManualmente(proximoSlide);
      } else {
        interagirManualmente(slideAnterior);
      }
    },
    { passive: true }
  );

  renderizarSlide(0, false); // slide inicial, sem fade
  iniciarAutoplay();
}

// ============================================================
//  PARALLAX SUTIL NO BANNER PRINCIPAL (só desktop)
// ============================================================
// "Parallax" = o fundo se move mais devagar que o resto ao rolar,
// dando sensação de profundidade. Fazemos com transform:translateY
// na <img> (não com background-attachment:fixed, que causa repaint
// pesado e o iOS ignora). transform é composto na GPU -> fluido.
//
// A <img> é 80px mais alta que o banner (CSS) e começa deslocada
// -40px: sobra ±40px de "folga" escondida pelo overflow:hidden. O
// JS move a imagem dentro desse limite conforme o scroll.
//
// PERFORMANCE:
//   - listener de scroll com { passive: true } (não bloqueia a rolagem);
//   - o cálculo roda dentro de requestAnimationFrame, no máximo 1x
//     por frame (flag "agendado"), nunca a cada evento de scroll;
//   - se o banner já saiu da tela, nem calcula.
const bannerPrincipal = document.querySelector('.banner-principal');
const bannerImg = bannerPrincipal ? bannerPrincipal.querySelector('img') : null;
const DESLOC_MAX = 40; // ± px de movimento da imagem
const mqDesktop = window.matchMedia('(min-width: 769px)');

let parallaxAgendado = false;

function atualizarParallax() {
  parallaxAgendado = false;
  if (!bannerImg) return;

  // desligado no mobile e com "reduzir movimento": zera e sai
  if (!mqDesktop.matches || reduzirMovimento) {
    bannerImg.style.transform = '';
    return;
  }

  const r = bannerPrincipal.getBoundingClientRect();
  // banner totalmente fora da tela? não faz nada
  if (r.bottom < 0 || r.top > window.innerHeight) return;

  // quão longe o CENTRO do banner está do CENTRO da tela:
  //  - negativo  -> banner acima do centro (já rolamos por ele)
  //  - zero      -> banner bem no meio da tela
  //  - positivo  -> banner abaixo do centro (ainda vamos chegar nele)
  const centroBanner = r.top + r.height / 2;
  const centroTela = window.innerHeight / 2;
  const distancia = centroBanner - centroTela;

  // transforma essa distância numa fração de -1 a 1 e multiplica
  // pelo deslocamento máximo -> a imagem "atrasa" em relação ao scroll
  const fracao = distancia / (window.innerHeight / 2 + r.height / 2);
  const y = Math.max(-1, Math.min(1, fracao)) * DESLOC_MAX;
  bannerImg.style.transform = `translateY(${y.toFixed(1)}px)`;
}

function agendarParallax() {
  if (!parallaxAgendado) {
    parallaxAgendado = true;
    requestAnimationFrame(atualizarParallax);
  }
}

if (bannerImg) {
  window.addEventListener('scroll', agendarParallax, { passive: true });
  window.addEventListener('resize', agendarParallax, { passive: true });
  atualizarParallax(); // posição inicial (caso a página abra já rolada)
}

// ============================================================
//  VITRINES CURADAS DA HOME (Queridinhos do Ateliê / Cerâmica no Seu
//  Café da Tarde) — lista FIXA de ids, na ORDEM dada, em vez do filtro
//  automático "toda a categoria" que aplicarEExibir() usa nas grades
//  comuns (ver comentário dela, mais acima).
// ============================================================
// POR QUE NÃO REAPROVEITAR aplicarEExibir() AQUI: aquela função
// decide o conteúdo de uma grade filtrando TODOS os produtos por
// categoria — é o jeito certo pra "todo o catálogo de cerâmica", mas
// não tem como expressar "só estas 12 peças específicas, nesta ordem"
// nem "sem repetir peça que já apareceu em outra seção da Home".
// Por isso as duas grades abaixo levam o atributo data-manual no HTML
// (index.html) — o MESMO mecanismo que #produtos-relacionados usa em
// produto.html pra dizer "aplicarEExibir(), me ignora, eu me monto
// sozinha" — e são povoadas por montarVitrineCurada(), logo abaixo.
//
// Pedido explícito: reduzir "Queridinhos do Ateliê" de (praticamente)
// o catálogo inteiro pra 12 peças, e a nova "Cerâmica no Seu Café da
// Tarde" nasce com uma lista própria de 6 — as DUAS listas são
// escolhidas à mão (não geradas por regra), então IDs fixos aqui é o
// jeito mais direto de expressar isso, sem inventar um campo novo tipo
// "produto.destaqueHome" em produtos.js só pra estas duas seções.
const IDS_QUERIDINHOS_ATELIE = [
  1, // Prato Decorativo Melodia da Primavera
  5, // Prato Decorativo Pavão Real
  7, // Vaso Escultórico Copos-de-Leite em Flor
  8, // Vaso Escultórico Manto de Folhas
  25, // Vaso Escultórico Refúgio de Pétalas
  13, // Travessa Decorativa Asas do Paraíso
  36, // Kit 4 Casinhas de Fada Luminária
  15, // Prato Decorativo Brisa de Palmeira
  21, // Vaso Jarra Flor de Campo
  33, // Pote Decorativo Bruma Dourada
  12, // Prato Decorativo Serenata a Dois
  // 12ª peça (critério livre, pedido explícito): nenhuma caneca
  // aparecia ainda em "Queridinhos" — as outras 8 já foram pra
  // "Cerâmica no Seu Café da Tarde", "✦ Edição Surpresa" ou "Seleção
  // Especial. Esta entra pra representar a subcategoria "Canecas
  // Artísticas" aqui também, como peça de destaque solo (não é kit
  // nem faz parte de nenhuma outra seção curada).
  30, // Caneca Artística Pássaro no Galho Florido
];

const IDS_CAFE_DA_TARDE = [
  17, // Kit Jogo de Chá Pétala — Bule, Leiteira e 3 Xícaras
  32, // Kit 3 Xícaras de Café Terra Escura
  31, // Caneca Artística Rosas Champagne
  22, // Kit Jarra e 2 Copos Textura Casca
  24, // Boleira Jardim de Morangos
  26, // Caneca Artística Passarinhos do Amor
];

// ------------------------------------------------------------------
//  HOME SEM PEÇA REPETIDA
// ------------------------------------------------------------------
// Cada seção da Home reserva as peças que mostra; peça já reservada por
// uma seção anterior não volta em outra, mesmo que alguém a coloque em
// duas curadorias. A chave por seção deixa a mesma seção ser remontada
// (troca de breakpoint) sem disputar as peças consigo mesma.
const pecasPorSecaoHome = new Map();

function reservarPecasHome(secao, pecas) {
  const usadasEmOutras = new Set();
  pecasPorSecaoHome.forEach((ids, outra) => {
    if (outra !== secao) ids.forEach((id) => usadasEmOutras.add(id));
  });
  const livres = pecas.filter((p) => !usadasEmOutras.has(p.id));
  pecasPorSecaoHome.set(secao, livres.map((p) => p.id));
  return livres;
}

// Seção que acabou escondida devolve as peças: senão elas sumiriam
// das seções seguintes sem aparecer em lugar nenhum.
function liberarPecasHome(secao) {
  pecasPorSecaoHome.delete(secao);
}

// Monta uma grade-carrossel a partir de uma lista de IDS, NA ORDEM
// dada (diferente de filter(), que preservaria a ordem de produtos.js,
// não a da curadoria) — por isso o .map(id => produtos.find(...))
// abaixo, e não um .filter(). .filter(Boolean) descarta ids que não
// existirem mais no catálogo (peça removida um dia) sem quebrar a
// seção inteira — mesma robustez de montarProdutoDestaque/
// montarSelecaoEspecial, um pouco acima/abaixo neste arquivo.
function montarVitrineCurada(grade, ids) {
  if (!grade) return;
  // produtosVisiveis(): mesmo que um id oculto entre na curadoria por
  // engano, ele é ignorado como se não existisse
  const visiveis = produtosVisiveis();
  const pecas = vendidasNoFim(reservarPecasHome(
    grade.dataset.gradeProdutos,
    ids.map((id) => visiveis.find((p) => p.id === id)).filter(Boolean)
  ));
  if (pecas.length === 0) {
    const secao = grade.closest('section');
    if (secao) secao.hidden = true;
    return;
  }
  grade.innerHTML = montarSlidesCarrossel(pecas, cardsPorSlideCarrossel());
  escanearReveal();
  sincronizarDotsCarrossel();
}

const gradeQueridinhos = document.querySelector('[data-grade-produtos="queridinhos"]');
montarVitrineCurada(gradeQueridinhos, IDS_QUERIDINHOS_ATELIE);

const gradeCafeDaTarde = document.querySelector('[data-grade-produtos="cafe-da-tarde"]');
montarVitrineCurada(gradeCafeDaTarde, IDS_CAFE_DA_TARDE);

// re-agrupa em slides de 2/4 ao cruzar o breakpoint 768/769px — MESMO
// motivo/mecanismo do listener equivalente em montarRelacionados()
// (produto.js): cardsPorSlideCarrossel() muda de valor, e só re-chamar
// a montagem refaz os slides no tamanho certo (idempotente, MESMAS
// peças). aplicarEExibir() já faz isso sozinha pras grades automáticas
// — estas duas são "manuais" (data-manual), então cuidam do próprio
// reagrupamento.
window.matchMedia('(min-width: 769px)').addEventListener('change', () => {
  montarVitrineCurada(gradeQueridinhos, IDS_QUERIDINHOS_ATELIE);
  montarVitrineCurada(gradeCafeDaTarde, IDS_CAFE_DA_TARDE);
  // a esteira de subcategorias também é "manual" (2 x 4 cards por slide)
  montarColecoesHome();
});

// ============================================================
//  "EXPLORE NOSSAS COLEÇÕES" — grade de subcategorias (Home, item 3)
// ============================================================
// Antes só havia os 2 círculos grandes (Cerâmica/Crochê, acima, no
// próprio HTML). Esta função acrescenta, logo abaixo, 1 card por
// SUBCATEGORIA de cerâmica — reaproveita dadosCardsSubcategoriaCeramica()
// e fotosSubcategoriaHTML() (acima, compartilhadas com js/ceramica.js):
// nenhuma lista de nomes/contagem escrita à mão aqui, e nenhuma lógica
// de "quais fotos usar"/"quantas peças tem" duplicada.
//
// Crochê FICA DE FORA de propósito: ainda não tem subcategorias reais
// (é "em breve", ver #croche-em-breve) — o card grande "Crochê" já
// cobre esse acesso.
//
// .colecao-card reaproveita a MESMA classe .subcategoria-card__foto da
// foto circular (ceramica.html) — iniciarRotacaoFotos() (acima) já
// funciona em cima dela sem precisar saber que roda na Home agora.
// MINI ESTEIRA: a grade de 8 cards ocupava muita altura (4 linhas no
// celular). Agora os cards vão em slides do MESMO carrossel dos
// produtos da Home (montarSlidesCarrossel + sincronizarDotsCarrossel:
// trilho com scroll-snap, setas, dots e snap de segurança) — 4 por vez
// no desktop, 2 no celular com a "espiadinha" do próximo (só CSS, ver
// .colecoes-grid em style.css). A grade é data-manual, então
// aplicarEExibir()/renderizarVitrines() não mexem nela.
function colecaoCardHTML({ sub, fotos, rotuloQtd, href }) {
  return `
      <a href="${href}" class="colecao-card reveal">
        <div class="colecao-card__anel">
          <div class="subcategoria-card__foto">${fotosSubcategoriaHTML(fotos, sub)}</div>
        </div>
        <h3 class="colecao-card__nome">${sub}</h3>
        <p class="colecao-card__qtd">${rotuloQtd}</p>
      </a>`;
}

function montarColecoesHome() {
  const grade = document.querySelector('#colecoes-grid');
  if (!grade) return; // só a Home tem esta grade

  grade.innerHTML = montarSlidesCarrossel(
    dadosCardsSubcategoriaCeramica(),
    cardsPorSlideCarrossel(),
    colecaoCardHTML
  );
  escanearReveal();
  iniciarRotacaoFotos();
  ativarTiltColecoes();
  sincronizarDotsCarrossel();
}
montarColecoesHome();

// ============================================================
//  TILT 3D NO HOVER (desktop com mouse de verdade — item 3)
// ============================================================
// Inclinação suave seguindo o cursor, só quando hover:hover AND
// pointer:fine (mouse/trackpad de verdade — NUNCA em toque: um
// "tilt" preso no dedo depois de tocar e soltar ficaria estranho, e
// touch não tem "mousemove" contínuo de qualquer forma). Escreve o
// ângulo em 2 custom properties (--tilt-x/--tilt-y) que o CSS usa no
// transform do card (ver .colecao-card, style.css) — JS só calcula o
// número, a animação/transição em si é CSS.
function ativarTiltColecoes() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const INCLINACAO_MAX_GRAUS = 8;
  document.querySelectorAll('.colecao-card').forEach((card) => {
    function aoMoverMouse(e) {
      const r = card.getBoundingClientRect();
      // posição do mouse DENTRO do card, de -0.5 (borda esquerda/topo)
      // a +0.5 (borda direita/base) — 0 é o centro exato
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      // eixo invertido de propósito: mouse na METADE DE CIMA do card
      // deve inclinar o TOPO "pra longe" (rotateX negativo), não a
      // base — por isso -py, não +py
      card.style.setProperty('--tilt-x', `${(-py * INCLINACAO_MAX_GRAUS).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(px * INCLINACAO_MAX_GRAUS).toFixed(2)}deg`);
    }
    function aoSairMouse() {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }
    card.addEventListener('mousemove', aoMoverMouse);
    card.addEventListener('mouseleave', aoSairMouse);
  });
}

// ============================================================
//  PEÇA EM DESTAQUE (Home) — "vitrine de honra" de UM produto só
// ============================================================
// Seção exclusiva de UMA peça, num cartão de fundo escuro — pensada
// pra dar um "respiro editorial" logo depois da vitrine normal
// (Queridinhos do Ateliê), destacando uma peça específica com mais
// espaço/contexto do que um card de grade permite.
//
// QUAL PEÇA APARECE AQUI: só esta constante controla isso. Pra trocar
// a peça em destaque no futuro, troque SÓ o número abaixo — o resto
// da função lê nome/descrição/preço/fotos direto de produtos.js, então
// nada mais precisa mudar (nem aqui, nem no HTML).
const ID_PRODUTO_DESTAQUE = 6; // 6 = "Vaso Escultórico Silhueta e Poesia"

// #produto-destaque começa "hidden" e VAZIA no index.html (mesmo
// padrão de #produtos-relacionados em produto.html) — só existe
// nessa página, daí o "if" (o resto do site carrega este main.js
// também, sem essa seção no HTML).
const secaoDestaque = document.querySelector('#produto-destaque');
if (secaoDestaque) {
  montarProdutoDestaque(secaoDestaque);
}

// ============================================================
//  SELEÇÃO ESPECIAL (Home) — 2 peças, logo após "Escolha do Ateliê"
// ============================================================
// IDs fixos aqui (não uma constante-e-comentário isolada como
// ID_PRODUTO_DESTAQUE) porque são DUAS peças, escolhidas junto do
// texto persuasivo de cada CARD — trocar a peça também significa
// reescrever o texto dela (ver montarSelecaoEspecial, mais abaixo),
// então não faz sentido fingir que é só "trocar um número".
const IDS_SELECAO_ESPECIAL = [14, 16]; // 14 = Travessa Bruma Azul, 16 = Prato Renda Portuguesa

// TEXTO PERSUASIVO de cada card — copy de VENDA (não o campo
// "descricao" de produtos.js, que é o texto neutro/completo da
// página da peça), com um GATILHO MENTAL DIFERENTE por card, como
// pedido: urgência/exclusividade na travessa (peça única, "a próxima
// já será outra"), apelo emocional/valorização do ambiente no prato
// (o efeito da peça no cômodo, não a peça em si). Precisa estar AQUI
// EM CIMA (perto de IDS_SELECAO_ESPECIAL, não junto da função
// montarSelecaoEspecial() que a usa, mais abaixo no arquivo): essa
// função é CHAMADA logo abaixo, ainda synchronous e cedo no arquivo —
// um "const" só declarado depois dela ainda estaria fora de alcance
// (temporal dead zone) no momento exato da chamada.
//
// REDESENHADO (achado da auditoria, item 6): "frase" (um parágrafo
// inteiro, cinza, sem hierarquia nenhuma) virou "tagline" (1 linha
// curta, em destaque) + "beneficios" (2 bullets curtos, cada um com
// seu ícone Lucide) — MESMO gatilho mental de antes por card, só
// quebrado em pedaços menores e mais fáceis de escanear visualmente.
// Os ícones são SVGs inline (só o conteúdo de dentro de <svg>, que
// carrosselCardHTML/montarSelecaoEspecial — ver mais abaixo — encaixa
// no <svg viewBox="0 0 24 24"...> compartilhado, mesmo padrão de
// atributos já usado nos outros ícones do site): "clock" e "check"
// (travessa) e "heart" e o MESMO "hand" já usado no selo "Feito à
// Mão" dos Selos de Confiança (prato) — reaproveitando desenhos que
// já existem no site em vez de inventar novos.
const COPY_SELECAO_ESPECIAL = {
  14: {
    // Travessa Decorativa Bruma Azul — gatilho: urgência/exclusividade
    tagline: 'Nenhuma sai igual à outra do forno.',
    beneficios: [
      {
        icone: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        texto: 'Quando esta vender, não haverá outra igual.',
      },
      {
        icone:
          '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="m7 15-1.8-1.8a2 2 0 0 0-2.8 2.8L6 20c1.5 1.5 3 2 5 2h2a8 8 0 0 0 8-8V7a2 2 0 0 0-4 0v5"/>',
        texto: 'Pintada à mão — o tom de azul nunca se repete.',
      },
    ],
  },
  16: {
    // Prato Decorativo Renda Portuguesa — gatilho: apelo emocional / valorização do ambiente
    tagline: 'Do tipo que muda o clima do cômodo.',
    beneficios: [
      {
        icone:
          '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z"/>',
        texto: 'Puxa elogio antes de perguntarem de onde veio.',
      },
      {
        icone: '<path d="M20 6 9 17l-5-5"/>',
        texto: 'Traço fino em renda, pintado à mão, peça a peça.',
      },
    ],
  },
};

const secaoSelecaoEspecial = document.querySelector('#selecao-especial');
if (secaoSelecaoEspecial) {
  montarSelecaoEspecial(secaoSelecaoEspecial);
}

function montarProdutoDestaque(secao) {
  // "produtos" (produtos.js) é um array já pronto, sem async — ao
  // contrário da vitrine principal, esta seção não precisa do
  // "carregarProdutos()" (que só existe pra SIMULAR uma latência de
  // rede pro skeleton aparecer). Uma peça de destaque fixa não ganha
  // nada esperando: mostra assim que a página abre.
  // produtosVisiveis(): o destaque nunca pode ser uma peça oculta
  const produto = produtosVisiveis().find((p) => p.id === ID_PRODUTO_DESTAQUE);
  // ID trocado errado ou peça removida do catálogo: a seção continua
  // "hidden" (valor que já veio do HTML) — some sem quebrar a página.
  // Vendida também: um destaque com "Comprar" de peça que não existe
  // mais confundiria; ela segue visível nas vitrines, desbotada.
  if (!produto || estaVendida(produto)) return;
  if (reservarPecasHome('destaque', [produto]).length === 0) return;

  // Lista de fotos = principal + extras, MESMA ideia de montarDetalhe
  // (produto.js): a principal entra como 1º item da galeria.
  const imagens = [produto.imagem, ...(produto.imagensExtras || [])];

  // GALERIA: GIRO 360° (arrastar/deslizar), NÃO a galeria de
  // miniaturas/setas da página de produto — ver ativarGiro360() logo
  // abaixo pra lógica do arraste. É EXCLUSIVA desta seção de
  // propósito ("vitrine de honra" pede algo mais interativo/vistoso
  // que a ficha técnica da página de peça); produto.html continua
  // usando ativarGaleriaDeFotos() (miniaturas), sem nenhuma mudança.
  // "draggable=false" na <img>: sem isso o navegador tenta iniciar um
  // arraste NATIVO de imagem (o "fantasma" que se pode soltar numa
  // aba/pasta) assim que o mousedown vira um movimento — atrapalharia
  // o giro. A dica ("Arraste para girar") só entra se houver mais de
  // 1 foto — com 1 só, não há o que girar.
  //
  // .foto-emoldurada: MESMA moldura de sempre — o CSS (style.css)
  // troca as cores dela pra funcionar sobre o fundo escuro só dentro
  // de .produto-destaque (ver comentário lá).
  //
  // PREÇO + SELO: renderBlocoPreco() e renderSeloEscassez() são as
  // MESMAS funções que a página de produto usa — o "de/por" e o selo
  // "Peça única" saem idênticos aqui, sem reescrever nada. O CSS
  // troca só as CORES deles (não o formato) pro fundo escuro.
  //
  // BOTÕES: .btn-comprar / .btn-comprar-agora são as MESMAS classes
  // dos cards — o listener delegado (mais acima, "document.addEventListener('click', ...)")
  // já os reconhece sozinho, bastando a SEÇÃO (data-id/nome/preco,
  // logo abaixo) ser o ancestral [data-id] mais próximo. Zero JS novo
  // pra "Adicionar ao Carrinho"/"Comprar Agora" funcionarem aqui.
  // MINIATURA do "mini-álbum" (pedido item 1): SEMPRE imagens[1] — a
  // 1ª foto de imagensExtras, ou seja, a 2ª foto do produto no total
  // (imagens[0] é a principal). NÃO fixei o caminho de arquivo de
  // propósito (não é "a foto do vaso com as margaridas" escrito à
  // mão): assim, se ID_PRODUTO_DESTAQUE mudar pra outra peça no
  // futuro (comentário logo acima explica esse mecanismo), a
  // miniatura continua funcionando sozinha, mostrando a 2ª foto QUE
  // ELA TIVER — nenhum código extra pra trocar. Só entra se existir
  // mais de 1 foto (mesma condição que já protege a dica de arraste).
  const temMiniatura = imagens.length > 1;

  secao.innerHTML = `
    <div class="produto-destaque__grid">
      <div class="produto-destaque__galeria">
        <!-- MINI-ÁLBUM (pedido item 1): a foto principal (giro 360°,
             arrastável) ao lado de UMA miniatura clicável da 2ª foto
             do produto — "2 fotos lado a lado" E "miniatura que troca
             a principal" ao mesmo tempo, as duas opções que o pedido
             sugeriu, sem precisar escolher só uma. A miniatura É um
             <button> (foco de teclado, leitor de tela anuncia como
             botão) que chama irParaFrame() dentro de ativarGiro360()
             — REAPROVEITA o mesmo estado (indiceAtual) do arraste, em
             vez de ativarGaleriaDeFotos() (a galeria de miniaturas de
             produto.html): aquela função tem seu PRÓPRIO jeito de
             saber "qual foto está em exibição" (não conversa com o
             índice do giro 360°) — usar as duas juntas aqui deixaria
             arrastar e clicar dessincronizados entre si. Ver o
             comentário completo em ativarGiro360(), logo acima neste
             arquivo. -->
        <div class="produto-destaque__fotos">
          <!-- .produto-destaque__foto-principal-wrap: ancora a dica
               "Arraste para girar" (position:absolute) SÓ na foto
               grande — não dava pra deixar a dica direto dentro de
               .produto-destaque__fotos (o pai comum dela e da
               miniatura): centralizada (top/left:50%) contra a LINHA
               inteira (foto + miniatura lado a lado), a dica ficaria
               puxada pro meio das DUAS fotos juntas, em vez de em
               cima da foto que de fato se arrasta. -->
          <div class="produto-destaque__foto-principal-wrap">
            <img class="giro360__frame foto-emoldurada produto-destaque__foto-principal" src="${produto.imagem}" alt="${produto.nome}" loading="lazy" draggable="false">
            ${
              imagens.length > 1
                ? `
            <div class="giro360__dica" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2"/>
                <path d="m15.194 13.707 3.814 1.86-1.86 3.814"/>
                <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4"/>
              </svg>
              <span>Arraste para girar</span>
            </div>`
                : ''
            }
          </div>
          ${
            temMiniatura
              ? `
          <button type="button" class="produto-destaque__miniatura" data-indice-imagem="1" aria-label="Ver outro ângulo de ${produto.nome}">
            <img src="${imagens[1]}" alt="" loading="lazy">
          </button>`
              : ''
          }
        </div>
      </div>
      <div class="produto-destaque__info">
        <p class="produto-destaque__etiqueta">&#10022; Escolha do Ateliê</p>
        <h2 class="produto-destaque__titulo">${produto.nome}</h2>
        <p class="produto-destaque__descricao">${produto.descricao}</p>
        ${renderBlocoPreco(produto, { classeExtra: 'produto-destaque__preco' })}
        <!-- BADGES: selo-escassez ("Peça única", já existia) + um
             chip NOVO "Feito à Mão" ao lado (pedido: "considere
             destacar também... se fizer sentido sem poluir"). Optei
             por um CHIP pequeno, não um 2º bloco igual ao de cima —
             dois avisos do mesmo tamanho um embaixo do outro
             pesariam mais do que ajudariam nesta seção (que já tem
             etiqueta + título + descrição + preço); lado a lado, o
             chip reforça sem competir. -->
        <div class="produto-destaque__badges">
          ${renderSeloEscassez()}
          <span class="produto-destaque__chip">Feito à Mão</span>
        </div>
        <div class="produto-destaque__acoes">
          <button class="btn-comprar" type="button">Adicionar ao Carrinho</button>
          <button class="btn-comprar-agora" type="button">Comprar Agora</button>
        </div>
      </div>
    </div>
  `;

  // dados que o carrinho lê do ancestral [data-id] mais próximo dos
  // botões — aqui é a PRÓPRIA seção (mesmo esquema de produto.js:
  // .produto-detalhe / .produto-card / .barra-compra, todos com o
  // quarteto id/nome/preco/imagem no elemento que os envolve).
  // "imagem" foi ADICIONADA aqui: sem ela, "Comprar Agora"/"Adicionar
  // ao Carrinho" nesta seção salvavam o item no localStorage sem foto
  // — o mini-carrinho só reencontrava a foto se conseguisse religar o
  // id no catálogo depois (ver o comentário completo em
  // adicionarAoCarrinho e renderMiniCarrinho, js/main.js).
  secao.dataset.id = produto.id;
  secao.dataset.nome = produto.nome;
  secao.dataset.preco = produto.preco;
  secao.dataset.imagem = produto.imagem;
  secao.hidden = false;

  ativarGiro360(secao, imagens);

  // a seção inteira já nasceu com a classe .reveal (index.html) — só
  // precisa ser registrada no observador AGORA que tem conteúdo de
  // verdade dentro (sem isto, .reveal:not(.reveal--visto) só seria
  // escaneada pela chamada genérica lá embaixo, e funcionaria igual,
  // mas chamar aqui deixa explícito que ESTA função é responsável
  // por revelar o que acabou de montar — mesmo padrão de
  // montarRelacionados em produto.js).
  escanearReveal();
}

// ============================================================
//  SELEÇÃO ESPECIAL (Home) — 2 peças, formato PRÓPRIO
// ============================================================
// Pedido explícito: "mais destaque que o carrossel Queridinhos do
// Ateliê, mas um formato PRÓPRIO — não uma cópia do hero do Vaso".
// Por isso NÃO chama ativarGiro360() (sem arrastar/girar aqui — fica
// exclusivo da "Escolha do Ateliê") e usa moldura/etiqueta
// REAPROVEITADAS (.foto-emoldurada e a classe de brilho dourado da
// etiqueta — ver os seletores estendidos em style.css) só a peça
// central — o bloco de texto sobre "papel de pergaminho" — é
// realmente nova, com CSS própria (.selecao-especial__pergaminho).
//
// TEXTO PERSUASIVO POR CARD: fica em COPY_SELECAO_ESPECIAL, um objeto
// À PARTE (não em produtos.js — aquele campo "descricao" é o texto
// NEUTRO/completo da página da peça; isto aqui é copy de VENDA, mais
// curto, com gatilho mental diferente em cada card). Declarado LÁ NO
// TOPO do arquivo, junto de IDS_SELECAO_ESPECIAL — não aqui: esta
// função é CHAMADA (mais acima, logo depois de IDS_SELECAO_ESPECIAL)
// antes do JavaScript "descer" até este ponto do arquivo, então um
// "const" definido só aqui embaixo ainda estaria fora de alcance
// (temporal dead zone) no momento da chamada — diferente de uma
// "function" (hoisted, pode morar em qualquer lugar do arquivo).
// ============================================================
//  CARROSSEL DE CARD — compartilhado entre "Seleção Especial" e
//  "✦ Edição Surpresa" (achado da auditoria, item 7: "reaproveite o
//  componente de carrossel já existente... sem duplicar CSS/JS")
// ============================================================
// Carrossel pequeno (dots + setas) VIVENDO DENTRO DE 1 CARD — não é
// nem ativarGaleriaDeFotos() (produto.js/produto.html, que também
// mexe em miniaturas) nem o carrossel do banner da Home (troca o
// <section> inteiro): é o padrão que "Seleção Especial" já usava
// sozinho, generalizado aqui pra também servir "Edição Surpresa"
// (que precisa de um VÍDEO como 1 dos slides — algo que a versão
// antiga, exclusiva de "Seleção Especial", não previa).
//
// Cada slide é { tipo: 'imagem', src } ou { tipo: 'video', videoUrl,
// poster }. carrosselCardHTML() gera o MARCADO (chamado de dentro do
// template de cada card, antes dele ir pro DOM); ativarCarrosselCard()
// liga o COMPORTAMENTO (chamado depois, com o card já no DOM).
// Separados assim porque o HTML de cada card tem MUITO mais coisa
// (pergaminho, selo, preço...) além do carrossel — a função de
// montagem de cada seção continua dona do template INTEIRO, só
// pedindo este pedaço aqui pra ela.
function carrosselCardHTML(slides, nomeProduto, overlayHTML = '') {
  // overlayHTML: gancho opcional pra quem chama injetar algo DENTRO
  // do .carrossel-card__foto-wrap (ex.: a dica "Observe o fundo da
  // caneca" de Edição Surpresa, que precisa de position:absolute
  // ancorado no tamanho EXATO da foto/vídeo, não do card inteiro —
  // por isso não dá pra só concatenar depois, como um irmão do
  // wrap). Vazio por padrão: Seleção Especial não usa.
  const temVarias = slides.length > 1;
  const primeiroSlide = slides[0];
  const videoSlide = slides.find((s) => s.tipo === 'video');
  // imagem que o <img> mostra ao nascer: a do 1º slide, se ele for
  // foto; senão (1º slide é o vídeo), a 1ª foto que existir na lista —
  // o <img> precisa de ALGUM src válido mesmo começando "hidden"
  // (card com vídeo como slide inicial).
  const imagemInicial =
    primeiroSlide.tipo === 'imagem'
      ? primeiroSlide.src
      : slides.find((s) => s.tipo === 'imagem')?.src || '';

  // SETAS: MESMOS paths de chevron já usados em .galeria__seta
  // (produto.html) — reaproveitando o desenho, não reinventando um
  // ícone novo.
  const setasHTML = temVarias
    ? `
      <button type="button" class="carrossel-card__seta carrossel-card__seta--anterior" aria-label="Slide anterior de ${nomeProduto}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button type="button" class="carrossel-card__seta carrossel-card__seta--proxima" aria-label="Próximo slide de ${nomeProduto}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>`
    : '';

  const dotsHTML = temVarias
    ? `<div class="carrossel-card__dots" role="tablist" aria-label="Selecionar slide de ${nomeProduto}">
          ${slides
            .map(
              (_, i) => `
            <button type="button" class="carrossel-card__dot ${i === 0 ? 'is-ativo' : ''}" aria-label="Ver slide ${i + 1} de ${slides.length}"></button>`
            )
            .join('')}
        </div>`
    : '';

  // O <img> SEMPRE existe, mesmo quando o slide inicial é o vídeo —
  // é ele quem mostra as FOTOS do produto sempre que o slide ativo
  // não for o vídeo. "hidden" no HTML de nascença (não só via JS)
  // evita um pisca de 1 frame com os dois elementos visíveis ao
  // mesmo tempo antes do JS rodar.
  const imgHTML = `<img class="foto-emoldurada carrossel-card__foto" src="${imagemInicial}" alt="${nomeProduto}" loading="lazy" ${primeiroSlide.tipo === 'video' ? 'hidden' : ''}>`;

  // muted+playsinline+loop: vídeo É um efeito ambiente (tipo GIF), não
  // um player — ver comentário grande de montarEdicaoSurpresa() pra
  // o histórico completo dessa decisão. hidden de nascença se o 1º
  // slide NÃO for o vídeo (mesmo motivo do <img> acima).
  const videoHTML = videoSlide
    ? `<video
          class="foto-emoldurada carrossel-card__foto carrossel-card__foto--video"
          src="${videoSlide.videoUrl}"
          poster="${videoSlide.poster}"
          muted
          loop
          playsinline
          preload="metadata"
          aria-label="Vídeo de ${nomeProduto}"
          ${primeiroSlide.tipo === 'video' ? '' : 'hidden'}>
        </video>`
    : '';

  return `
    <div class="carrossel-card__foto-wrap">
      ${imgHTML}
      ${videoHTML}
      ${overlayHTML}
      ${setasHTML}
    </div>
    ${dotsHTML}
  `;
}

// Liga dots+setas de UM card já no DOM. "aoMudarSlide(indice, slide,
// card)" é opcional — Edição Surpresa usa pra saber quando o slide de
// vídeo entra/sai de cena (pra decidir play/pause junto com a
// visibilidade do card na tela); Seleção Especial, sem vídeo nenhum,
// simplesmente não passa esse callback.
function ativarCarrosselCard(card, slides, { aoMudarSlide } = {}) {
  const foto = card.querySelector('.carrossel-card__foto:not(.carrossel-card__foto--video)');
  const video = card.querySelector('.carrossel-card__foto--video');
  const dots = [...card.querySelectorAll('.carrossel-card__dot')];
  const setaAnterior = card.querySelector('.carrossel-card__seta--anterior');
  const setaProxima = card.querySelector('.carrossel-card__seta--proxima');

  let indiceAtual = 0;
  function irParaIndice(indice) {
    // "+ length antes do %": mesma fórmula já documentada em
    // irParaIndice() (ativarGaleriaDeFotos, main.js) — em JS, -1 % N
    // dá -1 (não N-1), somar length primeiro corrige o loop nos dois
    // sentidos (clicar "anterior" no 1º slide deve ir pro ÚLTIMO).
    indiceAtual = ((indice % slides.length) + slides.length) % slides.length;
    const slide = slides[indiceAtual];

    if (slide.tipo === 'video') {
      if (video) video.hidden = false;
      if (foto) foto.hidden = true;
    } else {
      if (video) video.hidden = true;
      if (foto) {
        foto.hidden = false;
        foto.src = slide.src;
      }
    }

    dots.forEach((d) => d.classList.remove('is-ativo'));
    dots[indiceAtual]?.classList.add('is-ativo');
    aoMudarSlide?.(indiceAtual, slide, card);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => irParaIndice(i)));
  setaAnterior?.addEventListener('click', () => irParaIndice(indiceAtual - 1));
  setaProxima?.addEventListener('click', () => irParaIndice(indiceAtual + 1));

  // dispara 1x já no início: garante que quem passou "aoMudarSlide"
  // saiba qual é o slide ativo de largada, mesmo sem nenhum clique
  // ainda ter acontecido (ex.: Edição Surpresa decidir se o vídeo
  // deve tentar tocar assim que a seção entra na tela).
  irParaIndice(0);
}

// ============================================================
//  INDICADOR DE PRODUTO (mobile) — Seleção Especial / Edição Surpresa
// ============================================================
// Relato com prints (iPhone 15): os ÚNICOS pontinhos visíveis no
// carrossel de 2 cards eram os do carrossel de FOTOS de cada card
// (.carrossel-card__dot, ativado por ativarCarrosselCard acima) — por
// isso ninguém percebia que havia um 2º PRODUTO ao lado, achando que
// os pontinhos contavam fotos da mesma peça. Esta função monta um
// indicador PRÓPRIO (contador "1 / 2" + traços + dica "Deslize") logo
// abaixo da grade, que conta CARDS, não fotos — chamada por
// montarSelecaoEspecial/montarEdicaoSurpresa depois do grid estar no
// DOM. "cards" já vem filtrado (>= 2, ver os dois chamadores) — com 1
// card só não haveria o que indicar, por isso o "if" de saída.
function montarIndicadorProdutos(grid, cards) {
  if (cards.length < 2) return;

  const indicador = document.createElement('div');
  indicador.className = 'produto-indicador';
  // aria-hidden: puramente decorativo/redundante pra leitor de tela —
  // o DOM já lista os 2 <article> na ordem real, e os dots também são
  // <button> navegáveis por teclado (não dependem do indicador visual
  // pra funcionar).
  indicador.setAttribute('aria-hidden', 'true');
  indicador.innerHTML = `
    <span class="produto-indicador__contador">1 / ${cards.length}</span>
    <div class="produto-indicador__dots">
      ${cards
        .map(
          (_, i) =>
            `<button type="button" class="produto-indicador__dot ${i === 0 ? 'is-ativo' : ''}" tabindex="-1"></button>`
        )
        .join('')}
    </div>
    <span class="produto-indicador__dica">Deslize &rarr;</span>
  `;
  grid.after(indicador);

  const contador = indicador.querySelector('.produto-indicador__contador');
  const dots = [...indicador.querySelectorAll('.produto-indicador__dot')];
  const dica = indicador.querySelector('.produto-indicador__dica');

  // Índice do card mais "centrado" no viewport do trilho —
  // getBoundingClientRect() pros dois lados (card E trilho), nunca
  // offsetLeft/scrollLeft misturados: CORREÇÃO (achado do
  // code-review) — offsetLeft é relativo ao offsetParent do card (sem
  // nenhum ancestral com position:relative/absolute entre o card e
  // <body>, isso é o PRÓPRIO <body>), enquanto scrollLeft é relativo à
  // origem de rolagem do TRILHO; comparar os dois direto soma um viés
  // constante (a posição do trilho na página) à distância calculada.
  // getBoundingClientRect() devolve coordenadas de TELA pros dois —
  // sempre comparáveis entre si, não importa quantos ancestrais
  // posicionados existam no meio nem como o trilho rolou.
  function indiceMaisCentral() {
    const retTrilho = grid.getBoundingClientRect();
    const centroViewport = retTrilho.left + retTrilho.width / 2;
    let indice = 0;
    let menorDistancia = Infinity;
    cards.forEach((card, i) => {
      const retCard = card.getBoundingClientRect();
      const centroCard = retCard.left + retCard.width / 2;
      const distancia = Math.abs(centroCard - centroViewport);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indice = i;
      }
    });
    return indice;
  }

  function atualizar() {
    const indice = indiceMaisCentral();
    contador.textContent = `${indice + 1} / ${cards.length}`;
    dots.forEach((d, i) => d.classList.toggle('is-ativo', i === indice));
  }

  // "Deslize ->" só faz sentido ANTES de alguém descobrir que o
  // trilho arrasta — some no 1º scroll (gesto de arraste) ou no 1º
  // toque num dot, o que vier primeiro. Sem localStorage de propósito
  // (diferente de CHAVE_DICA_CARROSSEL/montarDicaDeslize, acima): é
  // uma dica pequena, por seção, sem custo em "lembrar entre visitas"
  // — reaparecer numa visita futura não incomoda do jeito que a dica
  // maior do carrossel de produtos normais incomodaria.
  let dicaEscondida = false;
  function esconderDica() {
    if (dicaEscondida) return;
    dicaEscondida = true;
    dica.classList.add('is-oculta');
  }

  // "pronta" vira true só depois de 2 frames (CORREÇÃO, achado ao
  // testar com Playwright): o PRÓPRIO navegador pode disparar um
  // "scroll" automático no trilho assim que ele monta, ajustando a
  // posição em sub-pixel pra satisfazer o scroll-snap exatamente —
  // mesmo com o padding-inline calculado certinho (CSS, corrigido
  // pelo code-review: "100%" do trilho, não "100vw" da tela), um
  // arredondamento de fração de pixel ainda pode sobrar. Sem esta
  // trava, esse ajuste (nunca um gesto do visitante) já escondia a
  // dica antes de qualquer toque na tela. 2x requestAnimationFrame
  // garante que esse possível ajuste do layout inicial já aconteceu
  // antes de começarmos a reagir a "scroll" como sinal de interação
  // real.
  let prontoParaEsconderNoScroll = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      prontoParaEsconderNoScroll = true;
    });
  });

  // passive:true (não faz preventDefault) — este listener só LÊ a
  // posição do scroll, nunca interfere no gesto nativo do navegador.
  grid.addEventListener(
    'scroll',
    () => {
      atualizar();
      if (prontoParaEsconderNoScroll) esconderDica();
    },
    { passive: true }
  );

  // touchstart: esconde no exato momento em que o dedo toca o
  // trilho, mesmo antes de qualquer "scroll" de fato acontecer (dedo
  // parado, ainda decidindo a direção do arraste) — sinal de
  // interação mais imediato que esperar o scroll disparar.
  grid.addEventListener('touchstart', esconderDica, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      // scrollTo({left}) espera uma coordenada no sistema de rolagem
      // do PRÓPRIO trilho (mesmo espaço de scrollLeft) — diferente de
      // indiceMaisCentral() (que só LÊ, em coordenadas de tela), aqui
      // precisamos ESCREVER uma posição de rolagem; por isso partimos
      // do scrollLeft atual e somamos a diferença entre os centros em
      // tela (getBoundingClientRect), em vez de usar offsetLeft (mesmo
      // bug de coordenadas que o code-review achou em
      // indiceMaisCentral — ver o comentário lá).
      const card = cards[i];
      const retTrilho = grid.getBoundingClientRect();
      const retCard = card.getBoundingClientRect();
      const centroTrilho = retTrilho.left + retTrilho.width / 2;
      const centroCard = retCard.left + retCard.width / 2;
      grid.scrollTo({ left: grid.scrollLeft + (centroCard - centroTrilho), behavior: 'smooth' });
      esconderDica();
    });
  });

  atualizar();

  // ver o comentário grande em ativarSnapDeSeguranca(), acima — mesma
  // garantia de "sempre termina alinhado" que o carrossel de produtos
  // normais, aqui pros 2 cards grandes
  ativarSnapDeSeguranca(grid, () => cards);
}

function montarSelecaoEspecial(secao) {
  // Mesma ideia de robustez de montarProdutoDestaque(): se algum dos
  // 2 ids sumir do catálogo um dia, a peça em falta é IGNORADA (não
  // quebra a seção); se sobrarem MENOS de 2, a seção inteira some
  // (hidden) — 1 card solo não é "Seleção Especial", perderia o
  // sentido de comparação lado a lado que o layout em grade pede.
  // Vendida fica de fora (seção de vitrine com botão de compra) e
  // reservarPecasHome evita repetir peça de outra seção da Home
  const pecas = reservarPecasHome('selecao-especial', IDS_SELECAO_ESPECIAL
    // produtosVisiveis(): id oculto na curadoria é ignorado
    .map((id) => produtosVisiveis().find((p) => p.id === id))
    .filter((p) => p && !estaVendida(p)));
  if (pecas.length < 2) {
    liberarPecasHome('selecao-especial');
    return;
  }

  const cardsHTML = pecas
    .map((produto) => {
      const copy = COPY_SELECAO_ESPECIAL[produto.id];
      // Fotos já cadastradas (imagem principal + imagensExtras) viram
      // os slides do carrossel — nenhuma foto nova precisou ser
      // adicionada, nenhum slide de vídeo aqui (reservado pra Edição
      // Surpresa, a única seção com vídeo nas 2 peças).
      const slides = [produto.imagem, ...(produto.imagensExtras || [])].map((src) => ({
        tipo: 'imagem',
        src,
      }));
      // REDESIGN (achado da auditoria, item 6): o "tabelão de
      // parágrafo cinza" virou tagline curta (Fraunces itálico,
      // reaproveitando .carrossel-card__foto-wrap... não, ver
      // .selecao-especial__tagline) + 2 benefícios curtos com ícone —
      // ambos vindos de COPY_SELECAO_ESPECIAL (editado junto desta
      // função; ver comentário lá no topo do arquivo). comSelo:true é
      // NOVO aqui: antes o selo "% OFF" nunca aparecia nesta seção,
      // mesmo quando a peça estava em promoção (ex.: id 16) — pedido
      // explícito: "preço em destaque com o selo de desconto quando
      // houver".
      return `
        <article class="selecao-especial__card" data-id="${produto.id}" data-nome="${produto.nome}" data-preco="${produto.preco}" data-imagem="${produto.imagem}">
          ${carrosselCardHTML(slides, produto.nome)}
          <div class="selecao-especial__pergaminho">
            <h3 class="selecao-especial__titulo-peca">${produto.nome}</h3>
            <p class="selecao-especial__tagline">${copy.tagline}</p>
            <ul class="selecao-especial__beneficios">
              ${copy.beneficios
                .map(
                  (b) => `
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b.icone}</svg>
                  <span>${b.texto}</span>
                </li>`
                )
                .join('')}
            </ul>
            ${renderBlocoPreco(produto, { classeExtra: 'selecao-especial__preco', comSelo: true })}
            <button class="btn-comprar-agora" type="button">Comprar Agora</button>
          </div>
        </article>`;
    })
    .join('');

  secao.innerHTML = `
    <p class="produto-destaque__etiqueta selecao-especial__etiqueta">&#10022; Seleção Especial</p>
    <h2 class="selecao-especial__titulo">Peças que também merecem um lugar em casa</h2>
    <div class="selecao-especial__grid">${cardsHTML}</div>
  `;

  secao.hidden = false;

  pecas.forEach((produto) => {
    const slides = [produto.imagem, ...(produto.imagensExtras || [])].map((src) => ({
      tipo: 'imagem',
      src,
    }));
    const card = secao.querySelector(`.selecao-especial__card[data-id="${produto.id}"]`);
    ativarCarrosselCard(card, slides);
  });

  // indicador "1 / 2" (mobile) — ver montarIndicadorProdutos() acima
  // pro motivo completo (achado: pontinhos de FOTO eram o único sinal
  // de que havia um 2º produto).
  montarIndicadorProdutos(
    secao.querySelector('.selecao-especial__grid'),
    [...secao.querySelectorAll('.selecao-especial__card')]
  );

  // a seção já nasce com .reveal no HTML (index.html) — registra
  // agora que tem conteúdo de verdade, mesmo padrão de
  // montarProdutoDestaque() logo acima.
  escanearReveal();
}

// ============================================================
//  ✦ EDIÇÃO SURPRESA (Home) — as 2 canecas "Surpresa" do catálogo
// ============================================================
// Seção PREMIUM exclusiva pras únicas 2 peças do tipo "caneca
// surpresa" (bichinho escondido no fundo, só aparece quando a bebida
// baixa) — Cachorrinho e Gatinho. Fica entre "Cerâmica no Seu Café da
// Tarde" e "Seleção Especial": as DUAS já saíram de "Queridinhos do
// Ateliê" de propósito (pedido explícito) pra não repetir peça, e
// ganham aqui um tratamento mais elaborado que um card comum de
// grade justamente por serem só duas em todo o catálogo.
//
// IDs fixos (não um critério tipo "subcategoria === Canecas
// Artísticas"): só estas DUAS peças têm o efeito "surpresa" de
// verdade — as outras canecas da mesma subcategoria são decorativas
// comuns, não pertencem aqui mesmo sendo "Canecas Artísticas" também.
const IDS_EDICAO_SURPRESA = [19, 20]; // 19 = Cachorrinho, 20 = Gatinho

// GATILHO DE CURIOSIDADE (retrabalhado): a versão anterior mostrava
// uma FOTO estática borrada, revelada por hover/toque. Trocado pelo
// VÍDEO real de cada peça (o mesmo já usado na página de produto,
// produto.videoUrl) — mostra o líquido baixando e o bichinho
// aparecendo de verdade, o "efeito" que de fato vende a peça, em vez
// de simular a curiosidade com um blur artificial. Os DOIS cards
// (Cachorrinho e Gatinho) agora seguem o MESMO formato: nenhum dos
// dois depende mais de interação manual pra revelar nada — o vídeo já
// toca sozinho (ver IntersectionObserver mais abaixo). SEM controls
// de propósito: não é um player pro usuário operar, é um efeito
// ambiente em loop, tipo GIF — controles nativos por cima só
// atrapalhariam essa leitura.
// Monta a lista de slides de 1 peça: o vídeo (se existir) SEMPRE
// primeiro — mantém o comportamento de sempre ("abre já mostrando o
// efeito") — seguido de TODAS as fotos do produto (achado da
// auditoria, item 7: "carrossel... usando todas as fotos do produto e
// o vídeo como um dos slides, se existir"). Peça sem vídeo cadastrado
// (não deveria acontecer com as 2 IDs fixas de hoje, mas protege o
// futuro se uma delas perder o campo) vira um carrossel só de fotos,
// sem quebrar o card.
function slidesEdicaoSurpresa(produto) {
  // SEM vídeo (fallback — não deveria acontecer com as 2 IDs fixas de
  // hoje): produto.imagem entra como 1ª foto normal do carrossel.
  if (!produto.videoUrl) {
    return [produto.imagem, ...(produto.imagensExtras || [])].map((src) => ({
      tipo: 'imagem',
      src,
    }));
  }
  // COM vídeo: produto.imagem já aparece como POSTER do slide de
  // vídeo (1º slide) — repeti-la de novo como uma 2ª foto logo a
  // seguir mostraria a mesma imagem 2x seguidas (o poster parado, só
  // trocando de <video> pra <img>, sem diferença visível nenhuma).
  // Só imagensExtras vira foto de verdade aqui.
  return [
    { tipo: 'video', videoUrl: produto.videoUrl, poster: produto.imagem },
    ...(produto.imagensExtras || []).map((src) => ({ tipo: 'imagem', src })),
  ];
}

function montarEdicaoSurpresa(secao) {
  // Mesmas regras da Seleção Especial: sem vendida e sem repetir peça
  const pecas = reservarPecasHome('edicao-surpresa', IDS_EDICAO_SURPRESA
    // produtosVisiveis(): id oculto na curadoria é ignorado
    .map((id) => produtosVisiveis().find((p) => p.id === id))
    .filter((p) => p && !estaVendida(p)));
  if (pecas.length < 2) {
    liberarPecasHome('edicao-surpresa');
    return;
  }

  const cardsHTML = pecas
    .map((produto) => {
      const slides = slidesEdicaoSurpresa(produto);
      // A dica "Observe o fundo da caneca" só faz sentido sobre o
      // VÍDEO (é ele que mostra o bichinho sendo revelado) — hidden
      // de nascença quando o 1º slide não é o vídeo (fallback sem
      // produto.videoUrl); ativarCarrosselCard() (chamada mais
      // abaixo, já com o card no DOM) liga/desliga isso sozinho a
      // cada troca de slide, via o 3º argumento "aoMudarSlide".
      const dicaHTML = `
        <p class="edicao-surpresa__dica" aria-hidden="true" ${slides[0].tipo !== 'video' ? 'hidden' : ''}>
          <span aria-hidden="true">&#128064;</span>
          Observe o fundo da caneca
        </p>`;
      return `
        <article class="edicao-surpresa__card" data-id="${produto.id}" data-nome="${produto.nome}" data-preco="${produto.preco}" data-imagem="${produto.imagem}">
          ${carrosselCardHTML(slides, produto.nome, dicaHTML)}
          <p class="edicao-surpresa__selo">Edição Limitada &mdash; só 2 no mundo</p>
          <h3 class="edicao-surpresa__titulo-peca">${produto.nome}</h3>
          ${renderBlocoPreco(produto, { classeExtra: 'edicao-surpresa__preco' })}
          <button class="btn-comprar-agora" type="button">Comprar Agora</button>
        </article>`;
    })
    .join('');

  secao.innerHTML = `
    <p class="produto-destaque__etiqueta">&#10022; Edição Surpresa</p>
    <h2 class="edicao-surpresa__titulo">A graça só aparece pra quem chega até o fim</h2>
    <p class="edicao-surpresa__subtitulo">Um bichinho de cerâmica dorme no fundo de cada caneca — e só se revela quando a bebida baixa. No catálogo inteiro, só existem estes 2 modelos.</p>
    <div class="edicao-surpresa__grid">${cardsHTML}</div>
  `;

  secao.hidden = false;

  // ---- CARROSSEL + AUTOPLAY DO VÍDEO (achado da auditoria, item 7)
  // ----
  // Antes existia 1 IntersectionObserver pra SEÇÃO INTEIRA, assumindo
  // "só existe 1 mídia por card, e é sempre o vídeo". Agora que cada
  // card é um carrossel (o vídeo é só 1 dos slides, trocável), o
  // vídeo só pode tocar quando as DUAS coisas forem verdade ao mesmo
  // tempo: o CARD está visível na tela E o slide ATIVO agora é o do
  // vídeo ("pausa ao sair dele" vale tanto pra sair da TELA quanto
  // pra sair do SLIDE, pedido explícito). Por isso o observer virou
  // POR CARD (não mais 1 só pra todos os vídeos), e a troca de slide
  // (aoMudarSlide, dentro de ativarCarrosselCard) também decide
  // play/pause, não só o scroll. MESMO respeito de sempre a
  // "prefers-reduced-motion" (reduzirMovimento, calculado mais acima
  // no arquivo): quem pediu menos movimento no sistema não recebe
  // autoplay nenhum, só o poster/frame parado, em NENHUM slide.
  pecas.forEach((produto) => {
    const slides = slidesEdicaoSurpresa(produto);
    const card = secao.querySelector(`.edicao-surpresa__card[data-id="${produto.id}"]`);
    const video = card.querySelector('.carrossel-card__foto--video');
    const dica = card.querySelector('.edicao-surpresa__dica');

    let cardVisivel = false;

    function atualizarVideo() {
      if (!video) return;
      // "!video.hidden" = o slide ativo AGORA é o do vídeo (ver
      // ativarCarrosselCard: ele é quem liga/desliga esse "hidden" a
      // cada troca). Checar o atributo em vez de guardar um 2º estado
      // à parte evita os dois alguma hora dessincronizarem.
      const slideDoVideoAtivo = !video.hidden;
      if (slideDoVideoAtivo && cardVisivel && !reduzirMovimento) {
        // .play() devolve uma Promise que pode REJEITAR (política de
        // autoplay do navegador, aba em segundo plano etc.) —
        // .catch(() => {}) evita um erro não tratado no console por
        // causa de algo que não é bug nosso; o poster continua
        // aparecendo nesse caso, a peça nunca fica "quebrada" pro
        // usuário, só sem o loop automático.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    ativarCarrosselCard(card, slides, {
      aoMudarSlide(_indice, slide) {
        if (dica) dica.hidden = slide.tipo !== 'video';
        atualizarVideo();
      },
    });

    if ('IntersectionObserver' in window) {
      const observadorCard = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            cardVisivel = entrada.isIntersecting;
            atualizarVideo();
          });
        },
        { threshold: 0.4 }
      );
      observadorCard.observe(card);
    } else {
      // Fallback sem IntersectionObserver (navegador muito antigo):
      // assume "sempre visível" — sem controle de entrar/sair da
      // tela, mas ainda respeita qual slide está ativo. Mesma postura
      // de outros fallbacks do site (ex.: barra-compra flutuante)
      // quando a API não existe.
      cardVisivel = true;
      atualizarVideo();
    }
  });

  // indicador "1 / 2" (mobile) — mesmo componente/motivo de
  // montarSelecaoEspecial (ver montarIndicadorProdutos(), acima).
  montarIndicadorProdutos(
    secao.querySelector('.edicao-surpresa__grid'),
    [...secao.querySelectorAll('.edicao-surpresa__card')]
  );

  escanearReveal();
}

const secaoEdicaoSurpresa = document.querySelector('#edicao-surpresa');
if (secaoEdicaoSurpresa) {
  montarEdicaoSurpresa(secaoEdicaoSurpresa);
}

// ============================================================
//  GALERIA "CONHEÇA NOSSO ATELIÊ" (dentro de #quem-somos, Home)
// ============================================================
// Fotos reais do espaço físico do ateliê (extraídas de um .zip
// enviado à parte — 3 fotos "de cena" + 1 colagem que já vinha com 7
// fotos menores prontas dentro dela, recortada em arquivos separados
// via script). DAS 10 fotos que sobraram desse processo, 3 eram
// repetições do MESMO objeto (o mesmo jarro/vaso fotografado de novo,
// ou um recorte quase idêntico a outro) — reaproveitar as 3 numa
// galeria EDITORIAL (uma foto grande por vez, virando protagonista da
// própria linha) ficaria repetitivo, então essas 3 foram descartadas
// aqui; sobraram 7 cenas realmente distintas.
//
// Pra trocar/adicionar uma foto no futuro, mexe SÓ neste array (o
// HTML, em index.html, nasce vazio e é preenchido daqui). Cada item:
//   src     -> caminho em img/atelie/ (nomes limpos: atelie-01.jpg...).
//   alt     -> texto alternativo de verdade (não "foto 1", "foto 2"),
//              importante aqui porque estas fotos SÃO o conteúdo.
//   legenda -> a frase ao lado da foto (ver renderização abaixo).
//              IMPORTANTE: são interpretações NOSSAS do que cada foto
//              mostra, escritas pra este layout — NÃO é relato da
//              Anasor. Por isso cada uma nasce marcada como sugestão
//              (a marcação — border tracejada + selo — só aparece em
//              MODO_DEV, ver o bloco lá em cima e .dev-aviso/
//              .conteudo-provisorio em style.css).
const fotosAtelie = [
  {
    src: 'img/atelie/atelie-01.jpg',
    alt: 'Estante de madeira no ateliê com canecas, pratinhos e um jarro de cerâmica esmaltada',
    legenda: 'A estante onde as peças recém-esmaltadas esperam a vez de ir ao forno — cada prateleira guarda um pouco da rotina do ateliê.',
  },
  {
    src: 'img/atelie/atelie-02.jpg',
    alt: 'Cantinho do ateliê com prateleiras cheias de peças de cerâmica sobre azulejo com estampa floral',
    legenda: 'Um cantinho do ateliê entre uma queima e outra: a mesa de trabalho vira, por um tempo, uma pequena vitrine.',
  },
  {
    src: 'img/atelie/atelie-03.jpg',
    alt: 'Mesa do ateliê com pratos decorativos, vasos e arranjos de flores entre as peças',
    legenda: 'Pratos, vasos e bandejinhas dividem espaço na mesa — o ateliê também é onde novas composições são testadas antes de ganhar o catálogo.',
  },
  {
    src: 'img/atelie/atelie-04.jpg',
    alt: 'Vaso rosa em formato orgânico com flor de cerâmica aplicada, ao lado de potes em formato de casinha',
    legenda: 'O vaso rosa em formato orgânico, ainda fresco da modelagem, ao lado dos potes em formato de casinha — uma das séries mais queridas do ateliê.',
  },
  {
    src: 'img/atelie/atelie-05.jpg',
    alt: 'Pratos decorativos em azul e branco e prato pintado com pássaros sobre a mesa de madeira',
    legenda: 'Pratos pintados à mão, um a um: o azul e branco convive com os pássaros e flores que também assinam o trabalho da Anasor.',
  },
  {
    src: 'img/atelie/atelie-06.jpg',
    alt: 'Armário de madeira com portas de vidro guardando miniaturas de cerâmica pintadas à mão',
    legenda: 'O armário onde ficam guardadas as peças em miniatura — um cantinho de curiosidades dentro do próprio ateliê.',
  },
  // Foto "atelie-07.jpg" (contas de madeira, bandejinhas com
  // peixinhos pintados e um vaso ainda por batizar) removida a
  // pedido — sem substituição prevista por enquanto. Como o layout
  // é uma LISTA de linhas (uma <div class="atelie-linha"> por foto,
  // empilhadas, não um grid de células fixas — ver renderização
  // abaixo), tirar o último item aqui já é suficiente: não sobra
  // nenhum espaço vazio nem quebra o zigue-zague das linhas restantes.
];

// Monta a galeria dentro de #atelie-galeria (index.html). Guardado
// atrás de "if (galeria)" — só a Home tem essa div, e este main.js é
// carregado em toda página.
const atelieGaleria = document.querySelector('#atelie-galeria');
if (atelieGaleria) {
  // LAYOUT EDITORIAL ("reportagem de revista"): uma <div class=
  // "atelie-linha"> por foto, cada uma com a FOTO (moldura
  // .foto-emoldurada, a mesma do resto do site) e o bloco de TEXTO
  // lado a lado. O ZIGUE-ZAGUE (linha 1 = foto|texto, linha 2 =
  // texto|foto, ...) é feito TODO no CSS via ".atelie-linha:nth-child
  // (even) { flex-direction: row-reverse }" — aqui no JS a ordem no
  // HTML é SEMPRE a mesma (foto primeiro, depois texto); só a
  // apresentação visual inverte a cada linha par. Isso mantém a
  // ordem de LEITURA (importante pra quem usa leitor de tela) sempre
  // "foto, depois a legenda dela", em qualquer linha.
  atelieGaleria.innerHTML = fotosAtelie
    .map(
      (foto) => `
      <div class="atelie-linha reveal">
        <div class="atelie-linha__foto">
          <img class="foto-emoldurada" src="${foto.src}" alt="${foto.alt}" loading="lazy">
        </div>
        <div class="atelie-linha__texto conteudo-provisorio">
          <span class="dev-aviso">Legenda sugerida — a confirmar com a Anasor</span>
          <p class="atelie-linha__legenda">${foto.legenda}</p>
        </div>
      </div>`
    )
    .join('');

  // as linhas recém-criadas têm .reveal -> registra no observador
  // (a CASCATA de atraso entre elas é automática: escanearReveal já
  // escalona pela posição entre os IRMÃOS .reveal do mesmo pai — ver
  // a função lá embaixo — então não precisa nenhum código extra aqui
  // só pra isso).
  escanearReveal();
}

// ============================================
//  INICIALIZAÇÃO (roda uma vez, ao abrir a página)
// ============================================
renderizarVitrines();         // monta a vitrine; quando os cards ficam
                              // prontos, o próprio aplicarEExibir() (lá
                              // dentro) chama escanearReveal() pra eles
escanearReveal();             // elementos .reveal que JÁ estão no HTML
                              // (títulos de seção, cards de categoria,
                              // "Quem Somos", "Fale com a gente")
// try/catch: se o navegador recusar gravar (armazenamento cheio ou
// bloqueado), o resto da inicialização da página não pode parar aqui
try {
  removerVendidasDoCarrinho(); // antes do contador, para ele já sair certo
} catch (erro) {
  console.warn('Não foi possível limpar o carrinho salvo:', erro);
}
atualizarContadorCarrinho();  // mostra o total caso já haja itens salvos
montarDropdownCeramica();     // monta o submenu de subcategorias no header
