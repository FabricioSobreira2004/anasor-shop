// ============================================================
//  CATÁLOGO DE PRODUTOS — Anasor Sobreira
// ============================================================
//
//  Para marcar uma peça como vendida: disponivel: false. Nunca apague.
//  (A peça vendida vira portfólio e gera encomenda; ver "disponivel".)
//
//  POR QUE UM ARRAY DE OBJETOS?
//  ---------------------------------------------------------
//  Um "array" é uma lista ordenada. Cada item dessa lista é um
//  "objeto" — um conjunto de pares "chave: valor" que descreve
//  UM produto (nome, preço, imagem...).
//
//  Guardar os produtos assim (dados) separados da forma como
//  eles aparecem na tela (HTML) tem várias vantagens:
//
//   1. Fonte única da verdade: o preço/nome de cada peça mora
//      em UM lugar só. Mudou aqui, muda em todas as páginas que
//      leem esta lista (home, ceramica.html, produto.html...).
//   2. Menos repetição: não é preciso escrever o mesmo bloco de
//      HTML para cada card. O JavaScript percorre a lista e monta
//      os cards sozinho (ver js/main.js).
//   3. Escala fácil: para adicionar uma peça nova, basta copiar
//      um objeto abaixo e trocar os valores. Zero mudança em
//      HTML ou CSS.
//   4. Dá pra filtrar e ordenar: "só os de cerâmica", "3 da mesma
//      categoria", "os mais caros primeiro" — tudo isso são
//      operações simples sobre um array.
//
//  POR QUE CADA CAMPO EXISTE?
//  ---------------------------------------------------------
//   id            -> identificador único e estável de cada peça.
//                    O carrinho usa pra somar quantidades; a
//                    página individual usa na URL: produto.html?id=3.
//   nome          -> título que aparece no card, no <h1> da página
//                    da peça, no <title> da aba e na mensagem do
//                    WhatsApp.
//   descricao     -> texto de venda (2-3 frases). Aparece na página
//                    individual e ajuda no SEO.
//   preco         -> NÚMERO, não texto. Guardar 179 (e não
//                    "R$ 179,00") permite fazer conta (subtotal,
//                    frete, desconto). A formatação "R$ 179,00" é
//                    feita só na hora de exibir (formatarPreco()).
//                    É SEMPRE o valor cobrado de verdade: o carrinho,
//                    o mini-carrinho e a mensagem do WhatsApp leem
//                    ESTE campo. Quando há promoção, "preco" é o
//                    valor JÁ com desconto (o "de/por" mostra o
//                    "por").
//   precoOriginal -> OPCIONAL. Só existe nas peças em promoção. É o
//                    preço "cheio", de ANTES do desconto — o número
//                    que aparece riscado no card e na página da peça.
//                    Fica FORA do carrinho de propósito: serve só
//                    pra exibição do "de R$ X por R$ Y". Precisa ser
//                    um preço que a peça teve DE VERDADE (hoje: o
//                    praticado antes do corte de 20/10); sem preço
//                    anterior real, não use o campo. A partir
//                    dele e de "preco", o main.js calcula sozinho a
//                    porcentagem do selo "Lançamento -X%" (não guardamos a
//                    porcentagem aqui pra ela nunca ficar
//                    dessincronizada dos dois valores). Peça sem
//                    este campo = peça sem promoção: nada muda na
//                    exibição dela.
//   categoria     -> "ceramica" | "croche". Agrupa as peças: a home
//                    joga cada uma na vitrine certa, ceramica.html
//                    filtra por isto, e a página individual usa pra
//                    montar o breadcrumb e os "produtos relacionados".
//   subcategoria   -> grupo dentro da categoria (ex.: "Pratos
//                    Artísticos", "Vasos Escultóricos"). A ceramica.html
//                    usa pra ORGANIZAR a vitrine em blocos com subtítulo.
//                    O JS DESCOBRE as subcategorias sozinho (não há
//                    lista fixa) — inventar uma subcategoria nova aqui
//                    faz surgir um bloco novo na página, sem tocar em
//                    HTML nem JS.
//   imagem        -> caminho da FOTO PRINCIPAL, a partir da raiz do
//                    site.
//   focoPrincipal -> OPCIONAL, texto (valor CSS de object-position,
//                    ex.: "center 30%"). Só tem efeito na moldura 4:5
//                    com object-fit:cover (classe .galeria__principal
//                    --4x5, ver galeriaHTML em main.js) — hoje só os
//                    Anjos de Luz usam essa moldura; sem o campo, o
//                    padrão é "center 40%" (um pouco acima do meio).
//   imagensExtras -> ARRAY com os caminhos das outras fotos da MESMA
//                    peça (outros ângulos), que ficam em
//                    img/produtos/angulos-extras/. A página individual
//                    usa pra montar a galeria de miniaturas clicáveis.
//                    É array porque cada peça tem uma quantidade
//                    diferente de fotos extras (de 5 a 11).
//                    Os arquivos foram renomeados para
//                    "<mesmo-slug-da-principal>-2.jpg", "-3.jpg"...
//                    então dá pra saber a que peça cada foto pertence
//                    só pelo nome.
//   dimensoes     -> medidas da peça (texto livre). "A definir" é
//                    placeholder — a Anasor mede e preenche depois.
//   cuidados      -> como limpar/conservar a peça (texto livre).
//                    Também "A definir" por enquanto.
//   materiaPrima  -> OPCIONAL, texto. De que a peça é feita (massa,
//                    queima, vidrado...), nas palavras da Anasor.
//                    Aparece como bloco "Matéria-prima" em "Detalhes da
//                    Peça" SÓ quando existe e tem texto — peça sem o
//                    campo não mostra nada (nem "Em breve"): a Anasor
//                    vai preenchendo peça por peça, e um placeholder
//                    em 40 peças pareceria site incompleto.
//   disponivel    -> OPCIONAL, boolean. Cada peça é única (estoque 1);
//                    quando UMA vende, a Anasor marca o objeto dela
//                    com "disponivel: false" (em vez de apagar/esconder
//                    a peça) — produto.js troca o botão de compra pelo
//                    bloco "Encomende uma peça parecida". Peça SEM este
//                    campo é tratada como disponível (o padrão) — por
//                    isso nenhum dos produtos abaixo precisa declará-lo.
//                    EXCEÇÃO de "peça única = 1 unidade": os itens com
//                    "permiteQuantidade" (ver logo abaixo) — hoje, só os
//                    Anjos de Luz — têm preço por quantidade e estoque
//                    próprio, em vez de "disponivel: false".
//   permiteQuantidade -> OPCIONAL, boolean. true libera o seletor de
//                    quantidade (+/-) na página da peça — sem ele,
//                    TODA peça trava em 1 (estoque 1, regra padrão).
//                    Vem sempre acompanhado de "estoque" e, quando há
//                    preço de atacado, de "grupoAtacado"/"minAtacado"/
//                    "precoAtacado". Ver precoUnitario(), mais abaixo
//                    neste arquivo — é a função única que decide o
//                    preço de 1 unidade, usada pelo front E pelo
//                    backend (POST /api/checkout).
//   estoque       -> quantas unidades EXISTEM HOJE deste modelo
//                    (só em peças com permiteQuantidade). Controlado à
//                    MÃO pela Anasor (não há banco de dados) via
//                    "node backend/scripts/estoque.js <id> <novo>".
//                    Acima disso é só por encomenda — nunca mostre
//                    este número na tela (sem "restam X!"), ele só
//                    limita a compra e aciona o convite de encomenda.
//   maxPorPedido  -> quantas unidades do MESMO modelo um pedido pode
//                    levar — hoje sempre igual a "estoque".
//   grupoAtacado  -> "etiqueta" que soma quantidade ENTRE modelos
//                    diferentes pro desconto de atacado (os 3 Anjos de
//                    Luz somam juntos, mesmo sendo produtos distintos).
//   minAtacado    -> quantidade do GRUPO (somada) que liga o atacado.
//   precoAtacado  -> preço por unidade com o atacado ligado.
//   selo          -> OPCIONAL. Texto ou lista. O card mostra UM selo
//                    só, pela prioridade abaixo (SELOS_PECA, main.js).
//                    Cada um exige um FATO; sem o fato, sem selo:
//                      (vendido)            automático: disponivel: false
//                      (esgotado)           automático: estoque zerado (permiteQuantidade)
//                      "mais-vendido"       vendas reais confirmadas (hoje: nenhuma)
//                      "assinada"           a peça tem a assinatura da artesã
//                      "lembranca-batizado" só os Anjos de Luz (lembrancinha de Batizado/1ª Eucaristia)
//                      "edicao-limitada"    só as 2 canecas Surpresa (19 e 20)
//                      "queridinho"         escolha da Anasor
//                      "novidade"           peça recém-chegada ao catálogo
//                      "kit"                conjunto de peças vendidas juntas
//                      "pintada-a-mao"      a descrição diz pintada/pintado à mão
//                      "modelada-a-mao"     a descrição diz modelada/modelado à mão
//                      (com-video)          automático: a peça tem videoUrl
//                    Liste todos os fatos verdadeiros da peça: se um
//                    deixar de valer (ex.: "novidade"), o próximo aparece.
//   oculto        -> OPCIONAL, boolean. "oculto: true" tira a peça de
//                    TODAS as listagens (carrosséis e grades da Home,
//                    ceramica.html e suas contagens/subcategorias,
//                    busca, relacionados, curadorias e GET /api/produtos)
//                    mas ela continua abrindo pelo link direto
//                    produto.html?id=X e passando pelo carrinho/checkout
//                    normalmente. Serve pra peças de TESTE (ex.: validar
//                    o pagamento real com um valor baixo) sem que um
//                    cliente esbarre nelas. Quem decide o que aparece é
//                    UMA função só, produtosVisiveis() (fim deste
//                    arquivo) — toda listagem passa por ela, então não
//                    há "if (p.oculto)" espalhado pelo código.
//
//  CATEGORIAS VÁLIDAS: "ceramica" | "croche"
//  Ainda não há fotos das peças de crochê. Quando houver, basta
//  acrescentar objetos com categoria: "croche" — todo o código
//  (home, vitrine, breadcrumb, relacionados) já está preparado.
// ============================================================

const produtos = [
  {
    id: 1,
    nome: "Prato Decorativo Melodia da Primavera",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê. Sobre um fundo marfim acetinado, um pássaro amarelo pousa num ramo de roseiras silvestres cor-de-rosa — as pinceladas ficam soltas, quase de aquarela, e a <span class='realce'>borda em terracota natural</span>, sem esmalte, dá o contraste rústico. Fica bem pendurado na parede, apoiado num aparador ou compondo a mesa posta. É daqueles <span class='realce--ouro'>presentes</span> que a pessoa guarda por anos, porque não existe outro igual.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["queridinho", "pintada-a-mao"],
    imagem: "img/produtos/prato-melodia-da-primavera.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-melodia-da-primavera-2.jpg",
      "img/produtos/angulos-extras/prato-melodia-da-primavera-3.jpg",
      "img/produtos/angulos-extras/prato-melodia-da-primavera-4.jpg",
      "img/produtos/angulos-extras/prato-melodia-da-primavera-5.jpg",
      "img/produtos/angulos-extras/prato-melodia-da-primavera-6.jpg",
      "img/produtos/angulos-extras/prato-melodia-da-primavera-7.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 2,
    nome: "Prato Buquê de Calla Rubra",
    descricao:
      "Prato decorativo grande em cerâmica, <span class='realce'>modelado e pintado à mão</span>. No centro, um buquê de copos-de-leite em vermelho e terracota se abre sobre folhagem dourada e um <span class='realce'>fundo azul-e-branco marmorizado</span>, rematado por borda branca e pela assinatura da artesã. Pelo tamanho e pelo contraste de cores, é uma <span class='realce'>peça de conversa</span>: pede lugar de destaque num aparador, numa estante alta ou na parede da sala de jantar. Bonito de dar e de receber.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["assinada", "pintada-a-mao", "modelada-a-mao"],
    imagem: "img/produtos/prato-buque-de-calla-rubra.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-2.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-3.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-4.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-5.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-6.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-7.jpg",
      "img/produtos/angulos-extras/prato-buque-de-calla-rubra-8.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 3,
    nome: "Prato Decorativo Cerejeira Coral",
    descricao:
      "Prato decorativo em cerâmica com pintura <span class='realce'>à mão em traço fino</span>: flores coral de estames delicados e folhas verde-oliva, em <span class='realce'>estilo aquarela sobre esmalte creme</span>. A borda natural em terracota e a assinatura da artesã fecham a peça. É leve e discreto — combina com paredes claras, prateleiras de livros e mesas de canto — e faz um <span class='realce--ouro'>presente</span> delicado pra quem gosta de ter flores por perto o ano inteiro.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: "assinada",
    imagem: "img/produtos/prato-cerejeira-coral.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-cerejeira-coral-2.jpg",
      "img/produtos/angulos-extras/prato-cerejeira-coral-3.jpg",
      "img/produtos/angulos-extras/prato-cerejeira-coral-4.jpg",
      "img/produtos/angulos-extras/prato-cerejeira-coral-5.jpg",
      "img/produtos/angulos-extras/prato-cerejeira-coral-6.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 4,
    nome: "Prato Decorativo Girassóis ao Sol",
    descricao:
      "Prato decorativo em cerâmica <span class='realce'>pintado à mão</span>, com girassóis de miolo ferrugem e folhas verde-oliva sobre um <span class='realce'>fundo azul-céu mesclado</span>. É a peça mais quente e luminosa da série — acende um canto apagado da casa na hora. Use na parede como quadro, de apoio numa cômoda ou como <span class='realce'>fruteira decorativa</span> no centro da mesa. Um bom <span class='realce--ouro'>presente</span> pra quem ama a estética de campo.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: "pintada-a-mao",
    imagem: "img/produtos/prato-girassois-ao-sol.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-girassois-ao-sol-2.jpg",
      "img/produtos/angulos-extras/prato-girassois-ao-sol-3.jpg",
      "img/produtos/angulos-extras/prato-girassois-ao-sol-4.jpg",
      "img/produtos/angulos-extras/prato-girassois-ao-sol-5.jpg",
      "img/produtos/angulos-extras/prato-girassois-ao-sol-6.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 5,
    nome: "Prato Decorativo Pavão Real",
    descricao:
      "Prato decorativo em cerâmica com pintura <span class='realce'>à mão</span> de um pavão azul de perfil — penacho erguido e o leque de plumas abrindo em <span class='realce--ouro'>\"olhos\" verdes e dourados</span>, sobre um fundo cinza-pérola aquarelado. Assinada pela artesã, é a <span class='realce'>peça mais sofisticada</span> do ateliê. Pede parede de destaque, um cavalete de mesa ou uma estante bem composta. Presente de peso pra uma data que merece.",
    // SEM promoção de propósito: o Pavão Real fica FORA da campanha
    // dos pratos decorativos. Sem "precoOriginal", o card e a página
    // dele mostram só o preço normal, sem "de/por" e sem selo de %.
    preco: 174.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["assinada", "queridinho"],
    imagem: "img/produtos/prato-pavao-real.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-pavao-real-2.jpg",
      "img/produtos/angulos-extras/prato-pavao-real-3.jpg",
      "img/produtos/angulos-extras/prato-pavao-real-4.jpg",
      "img/produtos/angulos-extras/prato-pavao-real-5.jpg",
      "img/produtos/angulos-extras/prato-pavao-real-6.jpg",
      "img/produtos/angulos-extras/prato-pavao-real-7.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 6,
    nome: "Vaso Escultórico Silhueta e Poesia",
    descricao:
      "Vaso escultórico em cerâmica <span class='realce'>modelado à mão</span>, no formato de uma silhueta feminina de braços cruzados sobre base evasê. É feito em <span class='realce--ouro'>massa cerâmica preta, queimada em alta temperatura</span>, sob um vidrado transparente brilhoso — o tom escuro é da própria massa, e o brilho acompanha a luz do ambiente. É <span class='realce'>peça de autor</span>: funciona com um galho seco dentro ou sozinha, como escultura, numa mesa lateral, no hall ou na estante da sala.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 199.9,
    preco: 179.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: "modelada-a-mao",
    imagem: "img/produtos/vaso-escultorico-silhueta-e-poesia.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-2.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-3.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-4.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-5.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-6.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-7.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-8.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-9.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-10.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-11.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-poesia-12.jpg",
    ],
    // Medidas e matéria-prima informadas pela Anasor (fonte da verdade);
    // a descrição acima foi ajustada pra não contradizê-las.
    dimensoes: "Altura: 23 cm · Largura na parte de cima: 37 cm · Largura na saia: 46 cm",
    materiaPrima: "Massa cerâmica preta, queimada em alta temperatura, com vidrado transparente brilhoso.",
    cuidados: "A definir",
  },
  {
    id: 7,
    nome: "Vaso Escultórico Copos-de-Leite em Flor",
    descricao:
      "Vaso escultórico em cerâmica <span class='realce'>feito à mão</span>, de corpo cilíndrico em esmaltes mel e verde-oliva. Da borda saem <span class='realce'>copos-de-leite brancos modelados em alto-relevo</span>, com folhas que abraçam a peça — a flor faz parte do vaso, não é pintura. É um <span class='realce'>centro de mesa</span> que já vem florido: bonito com flores frescas, com secas ou vazio. Presente marcante para quem gosta de florir a casa.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 189.9,
    preco: 169.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: "queridinho",
    imagem: "img/produtos/vaso-escultorico-copos-de-leite-em-flor.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-escultorico-copos-de-leite-em-flor-2.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-copos-de-leite-em-flor-3.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-copos-de-leite-em-flor-4.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-copos-de-leite-em-flor-5.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-copos-de-leite-em-flor-6.jpg",
    ],
    // Medidas e matéria-prima informadas pela Anasor (fonte da verdade);
    // a descrição acima não fala de massa nem de medida.
    dimensoes: "Altura: 30 cm · Largura: 59 cm",
    materiaPrima: "Massa cerâmica bege.",
    cuidados: "A definir",
  },
  {
    id: 8,
    nome: "Vaso Escultórico Manto de Folhas",
    descricao:
      "Vaso escultórico em cerâmica <span class='realce'>modelado à mão</span>, formado por duas grandes folhas curvadas que se envolvem para criar o recipiente. O acabamento é um <span class='realce--ouro'>bronze escuro metálico</span>, que reluz de perto e recolhe a luz no escuro. Orgânico e escultural, é <span class='realce'>decoração autoral</span> para a mesa de entrada, um nicho ou a estante. Sua casa pede uma peça como esta na decoração: o vaso se destaca tanto com um arranjo quanto sozinho.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 179.9,
    preco: 159.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: ["queridinho", "modelada-a-mao"],
    imagem: "img/produtos/vaso-escultorico-manto-de-folhas.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-2.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-3.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-4.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-5.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-6.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-7.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-manto-de-folhas-8.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // ==============================================================
  //  LEVA NOVA — 8 peças identificadas nas fotos da pasta "site mãe"
  //  (baixadas do WhatsApp Web, sem numeração contínua: n1...n112,
  //  m102, novafoto). Nomes/preços/enquadramento em subcategoria
  //  todos revisados e aprovados antes de entrar aqui — ver o
  //  processo completo (agrupamento por peça física, nomes,
  //  descrições, preços com justificativa) na conversa que gerou
  //  este bloco. ids 9-16 (o próximo livre depois do Manto de
  //  Folhas, id 8) — por isso o exemplo comentado de crochê, logo
  //  abaixo, teve o "id: 9" dele atualizado pra não colidir.
  // ==============================================================
  {
    id: 9,
    nome: "Prato Decorativo Flor de Pessegueiro",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê — nasceu de uma tarde observando o pessegueiro do quintal abrir os primeiros botões depois do inverno. Sobre um fundo marfim acetinado, um ramo carregado de flores <span class='realce'>rosa-salmão em botão e flor aberta</span> se espalha em pinceladas soltas, quase de aquarela, com folhas verde-oliva pontuando o desenho. A borda em terracota natural, sem esmalte, fecha a peça com o contraste rústico que assina o ateliê. Fica bem pendurado na parede, apoiado num aparador ou compondo a mesa posta — um <span class='realce--ouro'>presente</span> para quem gosta de ver a primavera chegar cedo em casa.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: "pintada-a-mao",
    imagem: "img/produtos/prato-flor-de-pessegueiro.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-2.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-3.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-4.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-5.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-6.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-7.jpg",
      "img/produtos/angulos-extras/prato-flor-de-pessegueiro-8.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 10,
    nome: "Prato Decorativo Ave da Alvorada",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê, inspirado no instante em que os primeiros pássaros começam a cantar, ainda no cinza da madrugada. Uma avezinha em tons de <span class='realce'>azul-acinzentado e branco</span> pousa entre flores rosa-claro e folhas verde-oliva, pintadas em traço solto sobre um fundo marfim. A borda em terracota natural, sem esmalte, mantém o contraste rústico típico da casa. Fica bem na parede, num aparador ou compondo a mesa posta — um <span class='realce--ouro'>presente</span> sereno para começar o dia com calma.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: "pintada-a-mao",
    imagem: "img/produtos/prato-ave-da-alvorada.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-ave-da-alvorada-2.jpg",
      "img/produtos/angulos-extras/prato-ave-da-alvorada-3.jpg",
      "img/produtos/angulos-extras/prato-ave-da-alvorada-4.jpg",
      "img/produtos/angulos-extras/prato-ave-da-alvorada-5.jpg",
      "img/produtos/angulos-extras/prato-ave-da-alvorada-6.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 11,
    nome: "Prato Decorativo Ninho Encantado",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê, inspirado na cena de um ninho recém-feito, com ovos ainda quentes, escondido entre os galhos. Um pássaro azul-turquesa de peito amarelo vigia de perto, cercado por flores pêssego sobre um <span class='realce'>fundo aquarelado em tons de azul</span> que lembra o céu do início da manhã. A assinatura da artesã fecha a peça. Combina com berçário, sala de estar ou como <span class='realce--ouro'>presente</span> para quem está esperando — ou comemorando — uma novidade.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["assinada", "pintada-a-mao"],
    imagem: "img/produtos/prato-ninho-encantado.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-ninho-encantado-2.jpg",
      "img/produtos/angulos-extras/prato-ninho-encantado-3.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 12,
    nome: "Prato Decorativo Serenata a Dois",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê, pintado a partir da cena de dois pássaros que pareciam conversar de um galho a outro, num fim de tarde de quintal. Um casal em <span class='realce'>penas vermelhas, azuis e douradas</span> se equilibra entre ramos carregados de botões dourados, sobre fundo marfim. É uma <span class='realce'>peça de duas figuras</span>, mais rara na produção do ateliê. Combina com sala de jantar ou aparador — um <span class='realce--ouro'>presente</span> bonito para casais.",
    // SEM promoção de propósito (mesmo raciocínio do Pavão Real,
    // id 5): a composição com DUAS figuras de pássaro pede mais
    // tempo de pintura que as peças de 1 pássaro só da linha
    // promocional, então fica fora da campanha "de/por" delas.
    preco: 159.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["queridinho", "pintada-a-mao"],
    imagem: "img/produtos/prato-serenata-a-dois.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-serenata-a-dois-2.jpg",
      "img/produtos/angulos-extras/prato-serenata-a-dois-3.jpg",
      "img/produtos/angulos-extras/prato-serenata-a-dois-4.jpg",
      "img/produtos/angulos-extras/prato-serenata-a-dois-5.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 13,
    nome: "Travessa Decorativa Asas do Paraíso",
    descricao:
      "Travessa oval em cerâmica, <span class='realce'>modelada e pintada à mão</span> no ateliê, batizada a partir do apelido que a própria flor já carrega: ave-do-paraíso, pelas pétalas que se erguem como um pássaro prestes a alçar voo. Duas hastes de estrelícia em <span class='realce'>laranja e roxo vibrantes</span> sobem entre folhas longas em verde-oliva, cobrindo quase toda a extensão oval da peça. O formato alongado pede lugar de destaque numa mesa posta, servindo pães, frutas ou aperitivos — ou simplesmente apoiada de pé, como escultura de parede. Uma peça <span class='realce--ouro'>grande e generosa</span>, para quem gosta de receber com presença.",
    // NOVA subcategoria "Travessas Decorativas" (ver comentário no
    // campo subcategoria, logo abaixo): peça claramente maior que
    // os pratos redondos — travessa OVAL alongada, ultrapassa a
    // base de apoio nas fotos originais. SEM promoção de propósito:
    // é peça de entrada de uma subcategoria nova, sem uma "linha"
    // ainda formada pra ter um "de/por" com sentido.
    // +R$ 100 em 31/10/2026 (autorizado pela artesã): sem "de/por",
    // porque um "de" só pode ser um preço que a peça realmente teve.
    preco: 299.9,
    categoria: "ceramica",
    // "Travessas Decorativas": subcategoria NOVA (as duas travessas
    // desta leva, ids 13 e 14) — formato oval/retangular alongado,
    // bem diferente dos pratos redondos e dos vasos esculturais já
    // existentes. Não precisa ser cadastrada em nenhum outro lugar:
    // o dropdown do menu (montarDropdownCeramica, main.js) e os
    // blocos de ceramica.html descobrem subcategorias sozinhos, a
    // partir dos valores que aparecem aqui.
    subcategoria: "Travessas Decorativas",
    selo: ["queridinho", "pintada-a-mao", "modelada-a-mao"],
    // FOTO PRINCIPAL TROCADA (2ª correção): o recorte manual do turno
    // anterior passou do ponto e cortava a travessa nas laterais,
    // mostrando só uma fatia estreita dela. Em vez de recortar de novo
    // "no escuro", promovi uma das imagensExtras que já mostrava a
    // peça INTEIRA e bem enquadrada — mais seguro que tentar acertar o
    // recorte manualmente de novo.
    imagem: "img/produtos/travessa-asas-do-paraiso.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/travessa-asas-do-paraiso-2.jpg",
      "img/produtos/angulos-extras/travessa-asas-do-paraiso-3.jpg",
      "img/produtos/angulos-extras/travessa-asas-do-paraiso-4.jpg",
      "img/produtos/angulos-extras/travessa-asas-do-paraiso-5.jpg",
      "img/produtos/angulos-extras/travessa-asas-do-paraiso-6.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 14,
    nome: "Travessa Decorativa Bruma Azul",
    descricao:
      "Travessa retangular em cerâmica, <span class='realce'>modelada e pintada à mão</span> no ateliê, pensada como uma manhã de neblina passeando por um jardim cheio de flores. Botões e pétalas em <span class='realce'>aquarela azul-porcelana</span>, com toques dourados entre as folhas, cobrem toda a superfície da peça, num efeito suave e contínuo. O formato alongado e as bordas levemente curvas tornam a travessa <span class='realce--ouro'>generosa</span> para servir à mesa ou simplesmente compor um aparador. Combina com decoração clássica e contemporânea, por ser praticamente monocromática.",
    // Mesma subcategoria nova "Travessas Decorativas" (ver id 13) e
    // mesma classe de tamanho (retangular alongada, também bem
    // maior que os pratos redondos) — por isso o mesmo preço
    // (as duas com +R$ 100 em 31/10/2026, autorizado pela artesã).
    preco: 299.9,
    categoria: "ceramica",
    subcategoria: "Travessas Decorativas",
    selo: "pintada-a-mao",
    // FOTO PRINCIPAL TROCADA: a peça estava colada nas bordas do
    // quadro (praticamente sem margem), fazendo qualquer corte de
    // card (object-fit:cover) arriscar cortar a própria travessa.
    // Promovida uma extra com mais respiro ao redor da peça.
    imagem: "img/produtos/travessa-bruma-azul.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/travessa-bruma-azul-2.jpg",
      "img/produtos/angulos-extras/travessa-bruma-azul-3.jpg",
      "img/produtos/angulos-extras/travessa-bruma-azul-4.jpg",
      "img/produtos/angulos-extras/travessa-bruma-azul-5.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 15,
    nome: "Prato Decorativo Brisa de Palmeira",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê, pintado para guardar o movimento de uma folha de palmeira balançando ao vento, num dia de muito sol. Uma única fronde em <span class='realce'>verde, amarelo e marrom</span> atravessa a peça na diagonal, sobre um fundo marmorizado em tons de azul-acinzentado e branco. É um dos pratos <span class='realce'>maiores</span> do ateliê — protagonismo de um motivo só, sem disputar espaço. Fica bem como centro de mesa, apoiado num cavalete ou pendurado na parede, e é um <span class='realce--ouro'>presente</span> descontraído para quem ama trópicos.",
    // SEM promoção: redondo como os demais "Pratos Artísticos", mas
    // perceptivelmente MAIOR nas fotos (mais próximo de um charger
    // que de um prato padrão) — preço fica acima da linha
    // promocional pelo tamanho, não por ser peça "de duas figuras"
    // como a Serenata a Dois (id 12). +R$ 100 em 31/10/2026
    // (autorizado pela artesã); sem "de/por" pelo mesmo motivo.
    preco: 259.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["queridinho", "pintada-a-mao"],
    // FOTO PRINCIPAL RECORTADA (revisão geral do catálogo): mesmo caso
    // da travessa Asas do Paraíso — peça desalinhada à esquerda,
    // recortei o excesso de parede vazia à direita pra recentralizar.
    imagem: "img/produtos/prato-brisa-de-palmeira.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-brisa-de-palmeira-2.jpg",
      "img/produtos/angulos-extras/prato-brisa-de-palmeira-3.jpg",
      "img/produtos/angulos-extras/prato-brisa-de-palmeira-4.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 16,
    nome: "Prato Decorativo Renda Portuguesa",
    descricao:
      "Prato decorativo em cerâmica, <span class='realce'>torneado e pintado à mão</span> no ateliê, inspirado nos azulejos portugueses que forram tantas fachadas e igrejas — a mesma treliça em losango, aqui reinventada com um medalhão central que lembra <span class='realce'>renda antiga</span>. Tudo pintado em azul-marinho sobre esmalte branco, num traço miúdo e paciente. É a peça mais gráfica do ateliê, sem flores nem bichos — só padrão e simetria. Combina com decoração clássica, cozinhas de fazenda ou paredes de galeria, e é um <span class='realce--ouro'>presente</span> elegante para quem prefere o desenho geométrico ao floral.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: "pintada-a-mao",
    // FOTO PRINCIPAL TROCADA (revisão geral do catálogo): a antiga
    // (agora extra nº2) estava em resolução bem mais baixa que o
    // padrão do site (570×495 contra os 900×1600 de praticamente todo
    // o resto do catálogo) — ficava visivelmente borrada/pequena
    // perto das outras peças. Promovida uma das extras, já na
    // resolução correta e com o mesmo ângulo de exibição em pé usado
    // no resto da linha de pratos.
    imagem: "img/produtos/prato-renda-portuguesa.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-renda-portuguesa-2.jpg",
      "img/produtos/angulos-extras/prato-renda-portuguesa-3.jpg",
      "img/produtos/angulos-extras/prato-renda-portuguesa-4.jpg",
      "img/produtos/angulos-extras/prato-renda-portuguesa-5.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- LOTE "SITE MÃE" 2 (22/09) --------------------------------
  // 29 peças novas (ids 17-45), extraídas de fotos/vídeos do WhatsApp
  // agrupados por proximidade de horário no nome do arquivo (ver
  // conversa) e organizadas em 4 subcategorias NOVAS: "Kits",
  // "Canecas Artísticas", "Objetos Decorativos" (peças utilitárias/
  // decorativas que não são pratos, vasos nem canecas) e "Peças de
  // Devoção" (id 42 — corrigido depois de "Guirlanda de Contas" para
  // "Terço de Mesa Grãos de Oração", ao perceber que não era acessório
  // decorativo genérico, mas peça religiosa), além de reforçar "Pratos
  // Artísticos" e "Vasos Escultóricos" já existentes. videoUrl é um
  // campo NOVO neste lote — ver comentário de decisão de design em
  // js/produto.js (montarDetalhe) sobre como ele aparece na página da
  // peça. Os vídeos das ids 18, 19 e 34 foram CORRIGIDOS depois de uma
  // conferência frame a frame (ver comentários em cada uma): dois
  // vídeos, atribuídos por proximidade de horário na primeira leva,
  // na verdade mostravam a peça errada.
  {
    id: 17,
    nome: "Kit Jogo de Chá Pétala — Bule, Leiteira e 3 Xícaras",
    descricao:
      "Um kit completo e raro: bule, leiteira e três xícaras com pires em formato de pétala, todos <span class='realce'>modelados e esmaltados à mão</span> no mesmo tom terroso, com flores rosadas aplicadas uma a uma — nenhuma peça sai do forno igual à outra, e aqui elas se encontram formando um conjunto verdadeiramente <span class='realce'>único</span>. É o tipo de peça que transforma um cafezinho corriqueiro num pequeno ritual, perfeita para receber visitas ou para aquele momento só seu. Composto por 8 peças (bule, leiteira e 3 conjuntos de xícara com pires), é uma <span class='realce--ouro'>peça de coleção</span> — depois que este sair do ateliê, não haverá outro conjunto idêntico.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 449.9,
    preco: 399.9,
    categoria: "ceramica",
    // RENOMEADO de "Kits" (nome vago, destoava do padrão elaborado das
    // outras subcategorias) para "Conjuntos Artesanais" — aplicado nas
    // 8 peças desta subcategoria (o nome de cada PRODUTO individual,
    // como "Kit Jogo de Chá Pétala", continua com "Kit" normalmente; só
    // o nome da SUBCATEGORIA mudou). Como subcategoriasCeramica()
    // (js/ceramica.js) e o menu (montarDropdownCeramica, js/main.js)
    // descobrem as subcategorias automaticamente a partir dos valores
    // aqui, mudar só esta string já atualiza o site inteiro — cards,
    // menu, filtros e título da página de listagem — sem precisar
    // tocar em mais nenhum arquivo.
    subcategoria: "Conjuntos Artesanais",
    selo: "kit",
    imagem: "img/produtos/kit-jogo-de-cha-bule-leiteira-xicaras-petala.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-jogo-de-cha-bule-leiteira-xicaras-petala-2.jpg",
      "img/produtos/angulos-extras/kit-jogo-de-cha-bule-leiteira-xicaras-petala-3.jpg",
      "img/produtos/angulos-extras/kit-jogo-de-cha-bule-leiteira-xicaras-petala-4.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-jogo-de-cha-bule-leiteira-xicaras-petala.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 19,
    // RENOMEADO (id 18 "Caneca Surpresa Raposinha" foi REMOVIDA do
    // catálogo): a Anasor confirmou que só existem 2 canecas surpresa
    // de verdade — Cachorrinho e Gatinho — e que a "raposinha" foi um
    // erro de identificação nosso durante o agrupamento das fotos por
    // proximidade de horário; as fotos/vídeo que batizamos de
    // "raposinha" são, na verdade, OUTROS ângulos desta MESMA caneca do
    // cachorrinho. Por isso as imagensExtras e o videoUrl abaixo agora
    // reúnem tudo num produto só, em vez de dois produtos "gêmeos"
    // errados. "Caneca Artística" no nome: padronização pedida pro
    // catálogo inteiro de canecas (ver comentário equivalente nas
    // outras canecas).
    nome: "Caneca Artística Surpresa Cachorrinho",
    // Descrição reforçada após conferir o vídeo (ver videoUrl abaixo):
    // ele mostra o efeito de verdade — o cachorrinho sendo revelado aos
    // poucos enquanto o leite é derramado/bebido — por isso a frase
    // "conforme você bebe" deixou de ser só a PROMESSA do produto e
    // virou algo que a própria peça prova em movimento.
    descricao:
      "Uma caneca com segredo: no fundo dela, um cachorrinho em miniatura, <span class='realce'>modelado e pintado à mão</span>, espera para aparecer assim que a última gota é bebida. No vídeo ao lado dá pra ver o efeito de verdade — <span class='realce'>a surpresa é revelada aos poucos, conforme você bebe</span> ou inclina a caneca, até o cachorrinho aparecer por inteiro no fundo. É um daqueles detalhes que transformam o café da manhã em um pequeno momento de surpresa e sorriso — <span class='realce'>ideal para presentear</span> quem ama um toque de fantasia no dia a dia. Peça pequena, delicada e cheia de personalidade: encontrar o seu cachorrinho é <span class='realce--ouro'>coisa rara</span>.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: ["edicao-limitada", "pintada-a-mao", "modelada-a-mao"],
    // Foto principal TROCADA (ver Passo 4 do pedido — padrão "vista
    // frontal centralizada"): entre as 5 fotos reunidas neste produto,
    // esta é a que mostra a caneca inteira, de frente e centralizada
    // (as outras 4 são anguladas de cima ou descentralizadas — viraram
    // imagensExtras).
    imagem: "img/produtos/caneca-surpresa-cachorrinho.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-surpresa-cachorrinho-2.jpg",
      "img/produtos/angulos-extras/caneca-surpresa-cachorrinho-3.jpg",
      "img/produtos/angulos-extras/caneca-surpresa-cachorrinho-4.jpg",
      "img/produtos/angulos-extras/caneca-surpresa-cachorrinho-5.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-surpresa-cachorrinho.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 20,
    // "Caneca Artística [Nome]" (aqui e em todas as outras canecas do
    // catálogo, ids 19/26/27/28/29/30/31): padronização pedida — antes
    // era só "Caneca [Nome]", sem o "Artística". Só o texto do nome
    // muda; descrição/preço/imagens continuam os mesmos.
    nome: "Caneca Artística Surpresa Gatinho",
    // Descrição reforçada após conferir o vídeo (ver videoUrl abaixo):
    // ele mostra a leiteira derramando leite dentro da caneca e o
    // gatinho aparecendo aos poucos no fundo, exatamente o efeito
    // descrito abaixo — mesmo raciocínio da Cachorrinho (id 19).
    descricao:
      "Um gatinho de bigodes desenhados à mão espia do fundo desta caneca, <span class='realce'>modelado em cerâmica</span> e revelado aos poucos conforme a bebida desce. No vídeo ao lado dá pra ver o momento exato em que o leite cobre a caneca e <span class='realce'>o gatinho vai emergindo aos poucos</span>, até aparecer por inteiro — a surpresa acontecendo de verdade, não só na imaginação. Para os apaixonados por gatos, é praticamente impossível resistir — uma peça <span class='realce'>funcional e divertida</span> ao mesmo tempo, perfeita para o café da manhã ou para presentear quem também ama os bichanos. Como toda peça do ateliê, é <span class='realce--ouro'>única</span>: o próximo gatinho modelado nunca sairá exatamente igual a este.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: "edicao-limitada",
    imagem: "img/produtos/caneca-surpresa-gatinho.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-surpresa-gatinho-2.jpg",
      "img/produtos/angulos-extras/caneca-surpresa-gatinho-3.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-surpresa-gatinho.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 21,
    // CORREÇÃO DE CATEGORIA: estava em "Vasos Escultóricos", mas a
    // peça é uma JARRA (bojo com bico e alça pra servir líquido,
    // formato bem diferente do vaso decorativo puro das outras peças
    // dessa subcategoria) — o próprio nome já dizia "Jarra". Criada a
    // subcategoria nova "Jarras" só pra ela por enquanto (o sistema
    // descobre subcategorias automaticamente a partir do valor aqui —
    // ver subcategoriasCeramica(), js/ceramica.js — então não precisou
    // mexer em mais nada pra ela aparecer certa no site).
    nome: "Vaso Jarra Flor de Campo",
    descricao:
      "Uma jarra de corpo generoso e alça encorpada, com pequenas flores azuis, brancas e rosadas <span class='realce'>pintadas à mão, uma a uma</span>, sobre um esmalte bege aveludado. É uma peça versátil — serve tanto como vaso para um pequeno arranjo quanto como objeto decorativo solo, trazendo um ar de jardim de primavera para qualquer cômodo. O acabamento rústico do bocal contrasta com a delicadeza da pintura floral, um equilíbrio que só se consegue com <span class='realce--ouro'>muitas horas de trabalho manual</span>.",
    preco: 169.9,
    categoria: "ceramica",
    subcategoria: "Jarras",
    selo: ["queridinho", "pintada-a-mao"],
    imagem: "img/produtos/vaso-jarra-floral-pintada-a-mao.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-jarra-floral-pintada-a-mao-2.jpg",
      "img/produtos/angulos-extras/vaso-jarra-floral-pintada-a-mao-3.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 22,
    nome: "Kit Jarra e 2 Copos Textura Casca",
    descricao:
      "Um conjunto de jarra e dois copos com textura de <span class='realce'>casca de árvore</span>, em esmalte terroso que lembra areia ao entardecer — perfeito para servir suco, vinho ou água numa mesa posta com personalidade. As três peças foram <span class='realce'>queimadas e esmaltadas juntas</span>, garantindo a mesma variação de tom entre elas, um detalhe que só um conjunto genuinamente artesanal consegue entregar. É a escolha certa para quem busca elevar o dia a dia da mesa, e também um <span class='realce--ouro'>presente de casa nova</span> e tanto.",
    preco: 229.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: "kit",
    // FOTO PRINCIPAL REENQUADRADA: a antiga (agora extra nº2) tinha a
    // câmera olhando de cima pra dentro dos copos, jarra desalinhada à
    // esquerda. Esta (conteúdo trocado, nome do arquivo igual) mostra o
    // conjunto nivelado e simétrico — jarra ao centro, um copo de cada
    // lado — batendo com o padrão "vista frontal centralizada".
    imagem: "img/produtos/kit-jarra-e-2-copos-rustico.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-jarra-e-2-copos-rustico-2.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-jarra-e-2-copos-rustico.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 23,
    nome: "Kit 4 Canequinhas Arlequim Marmorizado",
    descricao:
      "Quatro canequinhas de pequeno porte, cada uma com uma mistura <span class='realce'>única de amarelo, vinho, azul-marinho e terracota</span> marmorizados na queima — nenhuma repete o desenho da outra, mesmo nascendo do mesmo lote de esmalte. É a peça perfeita para quem gosta de misturar cores fortes na mesa de café, ou para presentear em grupo — uma canequinha para cada pessoa especial. Um kit <span class='realce--ouro'>genuinamente impossível de replicar</span>: o padrão marmorizado depende do acaso do forno, e este exato conjunto de quatro não vai se repetir.",
    preco: 254.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: "kit",
    imagem: "img/produtos/kit-4-canequinhas-marmorizadas.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-4-canequinhas-marmorizadas-2.jpg",
      "img/produtos/angulos-extras/kit-4-canequinhas-marmorizadas-3.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-4-canequinhas-marmorizadas.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 24,
    // Renomeado (pedido explícito): "Boleira com Tampa Jardim de
    // Morangos" → "Boleira Jardim de Morangos", nome mais enxuto pra
    // aparecer na nova seção "Cerâmica no Seu Café da Tarde" (Home).
    nome: "Boleira Jardim de Morangos",
    descricao:
      "Uma boleira com tampa em cerâmica bege, coroada por um pequeno puxador em formato de flor e cercada por uma grinalda de <span class='realce'>morangos e florzinhas pintados à mão</span>. Além de proteger o bolo da poeira e das moscas, é uma peça de presença própria mesmo fechada — ideal para o café da tarde, para presentear quem ama receber visitas, ou simplesmente para deixar à mostra na cozinha como <span class='realce'>objeto decorativo</span>. Uma peça grande e de acabamento generoso, <span class='realce--ouro'>rara</span> no formato tradicional de boleira com tampa em cerâmica artesanal.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 259.9,
    preco: 234.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "pintada-a-mao",
    imagem: "img/produtos/boleira-com-tampa-morangos-e-flores.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/boleira-com-tampa-morangos-e-flores-2.jpg",
      "img/produtos/angulos-extras/boleira-com-tampa-morangos-e-flores-3.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 25,
    nome: "Vaso Escultórico Refúgio de Pétalas",
    descricao:
      "Um vaso de silhueta orgânica e sinuosa, esculpido em argila crua com dois recortes vazados que brincam com a luz — sobre ele, um ramo de <span class='realce'>flores brancas aplicadas à mão</span>, folha por folha, pétala por pétala. É uma peça que funciona como escultura mesmo sem flores dentro, protagonista de qualquer aparador ou estante. O acabamento em terracota natural, sem esmalte vitrificado, realça a textura do barro e reforça o caráter <span class='realce--ouro'>artesanal e único</span> da peça.",
    preco: 179.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: "queridinho",
    imagem: "img/produtos/vaso-escultorico-silhueta-e-flor-branca.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-flor-branca-2.jpg",
      "img/produtos/angulos-extras/vaso-escultorico-silhueta-e-flor-branca-3.jpg",
    ],
    videoUrl: "img/produtos/videos/vaso-escultorico-silhueta-e-flor-branca.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 26,
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Passarinhos do Amor",
    descricao:
      "Um casal de passarinhos amarelos pousa sobre um galho florido nesta caneca, pintado à mão com a palavra <span class='realce'>&ldquo;LOVE&rdquo;</span> e pequenos corações ao lado — um presente carregado de significado para quem se ama. A superfície em relevo dá volume aos passarinhos, um detalhe que só se percebe (e se aprecia de verdade) ao segurar a peça nas mãos. Perfeita para presentear no Dia dos Namorados, em aniversários de casamento, ou simplesmente para lembrar alguém querido todos os dias — uma <span class='realce--ouro'>peça única</span>, sem repetição no ateliê.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 139.9,
    preco: 124.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: "pintada-a-mao",
    // FOTO PRINCIPAL TROCADA + RECORTADA: a antiga (agora extra nº2)
    // tinha muito espaço vazio acima da peça. Esta (conteúdo trocado,
    // nome do arquivo igual) já vinha mais nivelada, e ainda cortei o
    // excesso de parede/orquídea no topo — os passarinhos ficam bem
    // mais em evidência.
    imagem: "img/produtos/caneca-passarinhos-do-amor.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-passarinhos-do-amor-2.jpg",
      "img/produtos/angulos-extras/caneca-passarinhos-do-amor-3.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-passarinhos-do-amor.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 27,
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Buquê de Rosas Esculpidas",
    descricao:
      "A alça desta caneca se transforma em um verdadeiro buquê: rosas vermelhas <span class='realce'>esculpidas uma a uma</span> brotam de uma folha verde que serve de apoio para os dedos — um detalhe tridimensional raro de se ver em cerâmica utilitária. O corpo em esmalte branco-esverdeado degradê contrasta suavemente com o vermelho das rosas, tornando a peça um verdadeiro <span class='realce'>objeto de admiração</span> na hora do café. Uma escolha e tanto para presentear quem ama flores, e uma <span class='realce--ouro'>prova de valor artesanal</span> que vale cada detalhe modelado à mão.",
    preco: 154.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: "modelada-a-mao",
    // FOTO PRINCIPAL TROCADA + RECORTADA: as 3 fotos deste produto são
    // todas de cima (olhando pra dentro da caneca) — não havia uma
    // "vista frontal" de verdade disponível, nem no vídeo (que na
    // verdade passeia por VÁRIAS canecas diferentes, não só esta —
    // checado quadro a quadro). Entre as 3, promovi a que mostra o
    // corpo inteiro da peça (degradê verde-branco + base marrom) mais
    // completo, e recortei o excesso de parede vazia no topo. Não é a
    // foto ideal, mas é a melhor real disponível.
    imagem: "img/produtos/caneca-buque-de-rosas-esculpidas.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-buque-de-rosas-esculpidas-2.jpg",
      "img/produtos/angulos-extras/caneca-buque-de-rosas-esculpidas-3.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-buque-de-rosas-esculpidas.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 28,
    // NÃO É DUPLICATA de "Caneca Artística Buquê de Rosas Esculpidas"
    // (id 27) — investiguei a fundo antes de decidir (pedido pedia pra
    // remover uma das duas, mas removê-la sem checar seria destrutivo
    // e difícil de desfazer). O que causou a confusão: a foto
    // PRINCIPAL desta peça estava, por um erro de arquivo num turno
    // anterior, mostrando a caneca ERRADA (uma cópia exata da foto
    // principal da Buquê de Rosas — mesmas rosas vermelhas, mesma
    // alça). Só a foto principal estava errada: as DUAS fotos extras,
    // a DESCRIÇÃO (pássaro de bico laranja, esmalte escuro em degradê)
    // e o VÍDEO desta peça sempre mostraram consistentemente uma
    // caneca BEM diferente — a do pássaro. Corrigido promovendo uma
    // das extras corretas para principal (a foto duplicada errada foi
    // descartada, não faz sentido como "ângulo extra" de uma peça que
    // não é a mostrada nela). Ver resumo da conversa pra mais detalhes
    // — se mesmo assim for a MESMA peça física na realidade, avise que
    // uma delas é removida.
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Pássaro Azul ao Amanhecer",
    descricao:
      "Um pássaro de bico laranja inclina a cabeça para dentro desta caneca de esmalte escuro em degradê, como se também quisesse provar o café — uma cena capturada em cerâmica com humor e delicadeza. Ao lado, uma flor vermelha aplicada completa a composição, equilibrando o visual mais sóbrio do esmalte. Para quem ama observar pássaros, ou simplesmente aprecia um objeto de mesa com <span class='realce'>história para contar</span>, esta é uma peça que <span class='realce--ouro'>não se repete</span> no ateliê.",
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    imagem: "img/produtos/caneca-passaro-azul.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-passaro-azul-2.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-passaro-azul.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 29,
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Pássaro e Rosa",
    descricao:
      "Uma caneca de corpo arredondado, esmalte azul-acinzentado fosco por fora e branco por dentro, com um pequeno pássaro pousado sobre uma rosa aplicada na borda — um detalhe discreto que se revela aos poucos para quem observa de perto. É uma peça <span class='realce'>simples e elegante</span>, ideal para quem prefere um design mais clean sem abrir mão do toque artesanal do ateliê. Como todas as peças aqui, é <span class='realce--ouro'>única</span> — modelada e pintada à mão, sem produção em série.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: ["pintada-a-mao", "modelada-a-mao"],
    // FOTO PRINCIPAL RECORTADA DE NOVO, a partir do ORIGINAL intacto
    // (não da versão já recortada do turno anterior — recortar um
    // recorte, em cascata, foi o que causou o problema: cada corte
    // some com pixels de vez, então recortar de novo em cima de uma
    // foto já cortada só reduz ainda mais a área útil e pode cortar
    // partes da peça sem querer, como aconteceu). Esta versão vem
    // direto do arquivo-fonte (pasta "site mãe", nunca tocado) e
    // enquadra o pássaro INTEIRO (cabeça à cauda) + o buquê de flores
    // vermelhas — a decoração externa que o pedido pediu em destaque —
    // reduzindo proporcionalmente o quanto o interior com leite domina
    // o quadro. Único registro fotográfico desta peça (sem extras,
    // sem vídeo), então não havia outra foto pra promover no lugar.
    imagem: "img/produtos/caneca-redonda-passaro-e-rosa.jpg",
    imagensExtras: [],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 30,
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Pássaro no Galho Florido",
    descricao:
      "Um passarinho pousa sobre um galho ramificado que forma a própria alça desta caneca — um design escultórico em que a peça inteira vira uma pequena cena de jardim. O esmalte em degradê de verde-escuro para preto, com efeito de gotejamento natural da queima, dá um ar rústico e misterioso à peça, equilibrado pelos pequenos brotos vermelhos que pontuam o galho. Um <span class='realce'>trabalho de escultura aplicada</span> raro de se encontrar em uma caneca de uso diário — <span class='realce--ouro'>peça única</span>, sem produção repetida.",
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: "queridinho",
    // FOTO PRINCIPAL TROCADA DE NOVO: a troca do turno anterior ainda
    // deixava a peça descentralizada (deslocada pra direita, pássaro
    // cortado na borda esquerda). Entre as extras havia uma opção
    // MELHOR que eu não tinha usado ainda: nivelada, corpo inteiro
    // visível e bem centralizada — promovida agora.
    imagem: "img/produtos/caneca-passaro-no-galho.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-passaro-no-galho-2.jpg",
      "img/produtos/angulos-extras/caneca-passaro-no-galho-3.jpg",
    ],
    videoUrl: "img/produtos/videos/caneca-passaro-no-galho.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 31,
    // "Caneca Artística [Nome]" (padronização — ver comentário completo em id 20)
    nome: "Caneca Artística Rosas Champagne",
    descricao:
      "Pequenas rosas na cor champagne, com miolo dourado, decoram a alça desta caneca em esmalte bege terroso — uma paleta sofisticada e atemporal, longe do floral tradicional. É uma peça que combina elegância com o conforto de uma caneca de uso diário, ideal para quem gosta de detalhes refinados na própria xícara de café da manhã. Cada rosa foi <span class='realce'>modelada à mão, pétala por pétala</span>, tornando esta uma peça <span class='realce--ouro'>impossível de encontrar igual</span> em qualquer loja.",
    preco: 124.9,
    categoria: "ceramica",
    subcategoria: "Canecas Artísticas",
    selo: "modelada-a-mao",
    // FOTO PRINCIPAL TROCADA DE NOVO (pedido explícito): agora é a
    // 2ª foto de imagensExtras (a que ERA a extra nº3) — câmera
    // nivelada com a peça, corpo inteiro visível, o "padrão de foto
    // frontal" que o pedido queria especificamente pra este produto
    // (ele aparece na nova seção "Cerâmica no Seu Café da Tarde").
    imagem: "img/produtos/caneca-rosas-douradas-champagne.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/caneca-rosas-douradas-champagne-2.jpg",
      "img/produtos/angulos-extras/caneca-rosas-douradas-champagne-3.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 32,
    nome: "Kit 3 Xícaras de Café Terra Escura",
    descricao:
      "Três xícaras com pires em esmalte marrom-chocolate profundo, com o interior em branco cremoso — um kit clássico e sóbrio, perfeito para servir um café especial para visitas ou para compor uma mesa de café da manhã com personalidade. As bordas irregulares dos pires, deixadas propositalmente <span class='realce'>orgânicas</span>, reforçam o caráter artesanal do conjunto. Um kit de 6 peças (3 xícaras + 3 pires) <span class='realce--ouro'>feito e queimado junto</span>, garantindo harmonia entre as peças — o tipo de presente que qualquer amante de café vai guardar com carinho.",
    preco: 219.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: "kit",
    imagem: "img/produtos/kit-3-xicaras-de-cafe-com-pires-chocolate.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-3-xicaras-de-cafe-com-pires-chocolate-2.jpg",
      "img/produtos/angulos-extras/kit-3-xicaras-de-cafe-com-pires-chocolate-3.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-3-xicaras-de-cafe-com-pires-chocolate.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 33,
    nome: "Pote Decorativo Bruma Dourada",
    descricao:
      "Um pote com tampa em esmalte verde-oliva e dourado, com textura irregular que lembra musgo sobre pedra — o acabamento reativo da queima cria manchas únicas em cada peça, impossíveis de planejar ou repetir. É perfeito para guardar pequenos tesouros (chaves, joias, doces) ou simplesmente como <span class='realce'>objeto decorativo</span> sobre uma mesa ou estante. Uma peça de forte <span class='realce--ouro'>caráter artesanal</span>, para quem valoriza texturas cruas e imperfeições que contam uma história.",
    preco: 134.9,
    disponivel: false, // vendida: continua no site como portfólio
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "queridinho",
    imagem: "img/produtos/pote-decorativo-com-tampa-verde-oliva.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/pote-decorativo-com-tampa-verde-oliva-2.jpg",
    ],
    videoUrl: "img/produtos/videos/pote-decorativo-com-tampa-verde-oliva.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 34,
    // Renomeado: "Potinho" soava pouco elegante pro catálogo. Nome novo
    // mantém a referência ao formato de maçã (o que a peça É), mas
    // troca "potinho" por "guardiãs" — reforça a função (guardar
    // pequenos tesouros) no mesmo tom lírico dos outros nomes do site.
    nome: "Kit 3 Maçãs Guardiãs do Pomar",
    descricao:
      "Três potinhos com tampa em formato de maçã, esmaltados em vermelho vivo com cabinho verde, e interior em branco — um kit lúdico e cheio de charme, perfeito para guardar pequenos doces, temperos ou bijuterias. Juntos, formam uma pequena cesta de frutas de cerâmica sobre a mesa, um toque de <span class='realce'>alegria e cor</span> em qualquer cozinha. Um kit de 3 peças <span class='realce--ouro'>feito à mão</span>, com pequenas variações de tom entre uma maçã e outra — a prova de que nenhuma saiu do mesmo molde industrial.",
    preco: 194.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: "kit",
    imagem: "img/produtos/kit-3-potinhos-maca.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-3-potinhos-maca-2.jpg",
    ],
    // SEM videoUrl: o vídeo antes associado aqui na verdade mostra o
    // Pote Decorativo Bruma Dourada (id 33) sendo aberto — mesma peça
    // do vídeo já correto daquele produto, não as maçãs. Removido daqui
    // (e o arquivo duplicado apagado do disco) em vez de deixar um
    // vídeo que mostra a peça errada; não havia outro vídeo do lote que
    // mostrasse de fato os potinhos-maçã.
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 35,
    nome: "Kit 2 Tigelinhas Jardim Encantado",
    descricao:
      "Duas tigelinhas com borda azul-marinho e o interior pintado à mão com um <span class='realce'>jardim de flores rosadas e margaridas</span> sobre fundo verde-claro — perfeitas para servir petiscos, azeitonas, ou como potinhos de mesa em um jantar especial. A pintura minuciosa, feita pincelada a pincelada, transforma cada tigela num pequeno quadro que só se revela quando ela está vazia. Um kit de duas peças, <span class='realce--ouro'>gêmeas mas nunca idênticas</span>, ideal para presentear em dupla.",
    preco: 149.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: ["kit", "pintada-a-mao"],
    // FOTO PRINCIPAL RECORTADA: mesma foto de antes, mas cortando o
    // excesso de parede vazia no topo do quadro — as duas tigelas
    // passam a preencher a maior parte do enquadramento, mais perto do
    // padrão "vista frontal centralizada" pedido.
    imagem: "img/produtos/kit-2-tigelinhas-jardim-encantado.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-2-tigelinhas-jardim-encantado-2.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 36,
    nome: "Kit 4 Casinhas de Fada Luminária",
    descricao:
      "Quatro casinhas de fada em miniatura, cada uma com um &ldquo;telhado&rdquo; esculpido em formato diferente — pétala, cogumelo, concha — e pequenos furos que deixam a luz de uma vela escapar por dentro, criando um efeito mágico ao anoitecer. Decoradas com flores aplicadas e detalhes pintados à mão, são peças de <span class='realce'>fantasia pura</span>, perfeitas para quartos infantis, jardins de inverno ou mesas de centro que pedem um toque de encantamento. Um conjunto de 4 peças <span class='realce--ouro'>genuinamente únicas</span> — nenhuma casinha do ateliê tem o mesmo telhado.",
    preco: 334.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: ["queridinho", "kit", "pintada-a-mao"],
    // FOTO PRINCIPAL TROCADA (achado anterior, mantido): a antiga
    // (agora extra nº2) só mostrava 3 das 4 casinhas claramente. Esta
    // mostra as 4 peças do kit lado a lado, o que importa MAIS aqui do
    // que o enquadramento perfeito — um kit precisa mostrar TODAS as
    // peças que o compõem.
    // VERTICAL 4:5 (Leva 3, "primeira foto sempre em pé"): esta foto é
    // horizontal (1600x900) e NENHUMA das duas extras já tinha versão
    // vertical pra reaproveitar. Recortar cortaria pelo menos 1 das 4
    // casinhas (elas se espalham por quase toda a largura do quadro) —
    // proibido pela regra "nunca corte o produto". Em vez disso, a
    // foto foi ESCALADA (sem cortar nada) e completada com uma barra
    // sólida da MESMA cor do fundo (cinza-claro, amostrada da própria
    // foto) em cima e embaixo, até fechar 4:5. A foto ORIGINAL
    // (sem padding, 1600x900) virou a extra nº4 — nada foi apagado.
    imagem: "img/produtos/kit-4-casinhas-de-fada-luminaria.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-4-casinhas-de-fada-luminaria-2.jpg",
      "img/produtos/angulos-extras/kit-4-casinhas-de-fada-luminaria-3.jpg",
      "img/produtos/angulos-extras/kit-4-casinhas-de-fada-luminaria-4.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-4-casinhas-de-fada-luminaria.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 37,
    nome: "Saboneteira Pássaro Azul-Noite",
    descricao:
      "Uma saboneteira redonda em esmalte azul-marinho profundo, com um pequeno pássaro dourado pousado na borda, como se viesse beber água ali mesmo. É uma peça que eleva a rotina simples de lavar as mãos, trazendo um toque artesanal para o banheiro ou lavabo. Perfeita como <span class='realce'>presente de casa nova</span> ou para quem gosta de cuidar de cada detalhe da decoração — <span class='realce--ouro'>peça única</span>, sem produção repetida.",
    preco: 99.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    imagem: "img/produtos/saboneteira-redonda-passaro-azul.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/saboneteira-redonda-passaro-azul-2.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 38,
    nome: "Saboneteira Folha e Pássaro Dourado",
    descricao:
      "Uma saboneteira em formato de folha, com nervuras esculpidas à mão e esmalte marrom-escuro fosco, tem um pequeno pássaro dourado pousado na ponta — um detalhe que transforma um objeto utilitário em uma pequena escultura. Ideal para o lavabo, a pia da cozinha, ou como bandeja de chaves e bijuterias na entrada de casa. Uma peça <span class='realce'>funcional e decorativa ao mesmo tempo</span>, com o acabamento <span class='realce--ouro'>impossível de repetir</span> que só o trabalho manual entrega.",
    preco: 99.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    imagem: "img/produtos/saboneteira-folha-com-passaro-dourado.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/saboneteira-folha-com-passaro-dourado-2.jpg",
      "img/produtos/angulos-extras/saboneteira-folha-com-passaro-dourado-3.jpg",
    ],
    videoUrl: "img/produtos/videos/saboneteira-folha-com-passaro-dourado.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 39,
    nome: "Porta-Joias Jacaré das Águas Azuis",
    descricao:
      "Um prato fundo em esmalte azul marmorizado — que lembra o movimento da água — ganha vida com um pequeno jacaré esculpido à mão, deitado à beira do &ldquo;lago&rdquo;, e um pino que funciona como porta-anéis. É uma peça cheia de personalidade para guardar joias do dia a dia sobre a cômoda ou o criado-mudo, e também um mimo e tanto para quem ama peças diferentes. Uma peça <span class='realce'>esculpida em detalhes</span>, <span class='realce--ouro'>única no ateliê</span> — não há outro jacaré igual a este.",
    preco: 124.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    imagem: "img/produtos/porta-joias-jacare-azul-marmorizado.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/porta-joias-jacare-azul-marmorizado-2.jpg",
      "img/produtos/angulos-extras/porta-joias-jacare-azul-marmorizado-3.jpg",
    ],
    videoUrl: "img/produtos/videos/porta-joias-jacare-azul-marmorizado.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 40,
    nome: "Kit 2 Copos Ondas do Mar",
    descricao:
      "Dois copos com esmalte em degradê de azul-marinho para branco, como o movimento de uma onda quebrando na areia — perfeitos para servir água, suco ou vinho tinto numa mesa que pede um toque de mar. A textura levemente irregular do esmalte reforça o efeito de movimento, tornando cada copo <span class='realce'>ligeiramente diferente</span> do outro, mesmo nascendo do mesmo lote. Um kit de 2 peças, ideal para presentear em par — <span class='realce--ouro'>peça exclusiva</span>, sem produção em série.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 149.9,
    preco: 134.9,
    categoria: "ceramica",
    subcategoria: "Conjuntos Artesanais",
    selo: ["novidade", "kit"],
    imagem: "img/produtos/kit-2-copos-ondas-azuis.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-2-copos-ondas-azuis-2.jpg",
    ],
    videoUrl: "img/produtos/videos/kit-2-copos-ondas-azuis.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 41,
    nome: "Prato Decorativo Canário e Flor de Outono",
    descricao:
      "Dois canários em pleno voo se encontram sobre um ramo de flores alaranjadas neste prato decorativo, pintado à mão sobre um fundo de barro cru com sombreado suave, quase como uma pintura a carvão. É uma peça pensada para pendurar na parede ou apoiar num cavalete, trazendo movimento e cor para qualquer ambiente. Combina com decoração rústica ou boho, e é um <span class='realce--ouro'>presente</span> e tanto para quem ama a vida no campo e o canto dos pássaros — peça <span class='realce'>pintada à mão</span>, sem duas iguais.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 169.9,
    preco: 154.9,
    categoria: "ceramica",
    subcategoria: "Pratos Artísticos",
    selo: ["novidade", "pintada-a-mao"],
    imagem: "img/produtos/prato-passaros-e-flores-alaranjadas.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-passaros-e-flores-alaranjadas-2.jpg",
    ],
    videoUrl: "img/produtos/videos/prato-passaros-e-flores-alaranjadas.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 42,
    // RENOMEADO: as fotos originais tinham sido lidas como contas soltas
    // sobre a mesa (possível matéria-prima fotografada por engano) e o
    // produto entrou no catálogo como uma "guirlanda decorativa". Na
    // verdade é um TERÇO DE MESA (peça devocional) — as duas tiras de
    // contas de cerâmica com borlas são os dois lados do terço, dispostos
    // abertos para a foto (jeito comum de fotografar terços/rosários).
    // Nome, descrição, preço e subcategoria abaixo foram todos refeitos
    // para refletir o uso religioso real da peça, em vez de tratá-la como
    // acessório decorativo genérico.
    nome: "Terço de Mesa Grãos de Oração",
    descricao:
      "Um terço de mesa em contas de cerâmica crua, <span class='realce'>moldadas e enfiadas uma a uma à mão</span>, com borlas de fio natural nas pontas — uma peça devocional pensada para ficar à vista, sobre uma mesa de cabeceira, um oratório ou um cantinho de oração em casa. Mais do que decoração, é um convite para pausar: um objeto para ter por perto na hora do terço, ou simplesmente como lembrança silenciosa de fé no dia a dia. Cada conta foi <span class='realce'>moldada e enfiada manualmente</span>, uma a uma, no mesmo cuidado artesanal de toda peça do ateliê. Uma peça <span class='realce--ouro'>simples e cheia de significado</span> — um presente especial para batizados, crismas, ou para quem simplesmente gosta de manter a fé por perto.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Peças de Devoção",
    selo: "novidade",
    imagem: "img/produtos/terco-de-mesa-graos-de-oracao.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/terco-de-mesa-graos-de-oracao-2.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 43,
    nome: "Anjo Guardião Porta-Incenso",
    descricao:
      "Uma escultura de anjo em cerâmica branca, com asas abertas e uma saia perfurada que deixa a fumaça do incenso escapar em pequenos filetes — uma peça que une devoção e decoração num só objeto. É ideal para meditar, orar ou simplesmente perfumar a casa com delicadeza, trazendo uma presença serena para qualquer cômodo. Uma peça <span class='realce'>esculpida à mão</span>, de acabamento generoso e <span class='realce--ouro'>única no ateliê</span> — um presente de significado para quem busca paz em casa.",
    preco: 159.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "novidade",
    imagem: "img/produtos/anjo-guardiao-porta-incenso.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/anjo-guardiao-porta-incenso-2.jpg",
      "img/produtos/angulos-extras/anjo-guardiao-porta-incenso-3.jpg",
    ],
    videoUrl: "img/produtos/videos/anjo-guardiao-porta-incenso.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 44,
    nome: "Coador de Café de Cerâmica Artesanal",
    descricao:
      "Um coador de café no método pour-over, todo em cerâmica esmaltada em tons verde-acinzentados, pensado para se encaixar sobre uma caneca ou jarra e extrair um café mais encorpado, sem papel-filtro descartável. É a escolha certa para quem gosta de um ritual de café mais consciente e bonito de se ver na bancada. Uma peça <span class='realce'>funcional e artesanal</span> ao mesmo tempo — <span class='realce--ouro'>feita à mão</span>, uma peça de cada vez, sem produção industrial.",
    preco: 99.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "novidade",
    imagem: "img/produtos/coador-de-cafe-de-ceramica.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/coador-de-cafe-de-ceramica-2.jpg",
      "img/produtos/angulos-extras/coador-de-cafe-de-ceramica-3.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 45,
    nome: "Vaso Escultórico Elo Noturno",
    descricao:
      "Um vaso de corpo arredondado em esmalte preto brilhante, com duas alças em formato de <span class='realce'>correntes esculpidas à mão</span> — um design ousado que rompe com o floral predominante do ateliê e aposta numa estética mais gráfica e contemporânea. É uma peça de presença forte, perfeita para quem busca um ponto focal de decoração numa sala ou hall de entrada. Uma peça <span class='realce--ouro'>escultórica e única</span>, com acabamento vitrificado espelhado que reflete a luz do ambiente.",
    // "De" = preço praticado antes do corte de ~10% de 20/10 (commit
    // 48f9cd9). O selo "Lançamento -N%" é calculado no main.js.
    precoOriginal: 219.9,
    preco: 199.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: "novidade",
    imagem: "img/produtos/vaso-escultorico-preto-com-alcas-em-elo.jpg",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-escultorico-preto-com-alcas-em-elo-2.jpg",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- LEVA NOVA (24/11) — pote, pratos de pizza e saboneteira ---
  // oculto: true em todas até a rodada de testes terminar (ver
  // CLAUDE.md: "o site no ar nunca mostra peça incompleta").
  {
    id: 46,
    nome: "Pote Âmbar e Meia-Noite",
    descricao:
      "Um pote com tampa em esmalte dourado-âmbar que desce em degradê até um aro bege natural na base — por dentro, a surpresa é um <span class='realce'>azul-marinho profundo</span>, visível só na hora de abrir. O cabo esculpido em bolinha no topo da tampa completa o acabamento delicado. Perfeito para guardar pequenos tesouros (joias, chaves, doces) ou simplesmente para ficar à vista como <span class='realce'>objeto decorativo</span> sobre a mesa. Peça <span class='realce--ouro'>assinada pela artesã</span>, com o acabamento reativo da queima tornando essa combinação de cores impossível de repetir.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "assinada",
    imagem: "img/produtos/pote-ambar-e-meia-noite.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/pote-ambar-e-meia-noite-2.webp",
      "img/produtos/angulos-extras/pote-ambar-e-meia-noite-3.webp",
      "img/produtos/angulos-extras/pote-ambar-e-meia-noite-4.webp",
      "img/produtos/angulos-extras/pote-ambar-e-meia-noite-5.webp",
    ],
    videoUrl: "img/produtos/videos/pote-ambar-e-meia-noite.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: false,
  },
  {
    id: 47,
    nome: "Prato Eu Amo Pizza",
    descricao:
      "Uma fatia de pizza em tamanho de prato, modelada e pintada à mão com a frase <span class='realce'>&ldquo;Eu ❤ Pizza&rdquo;</span> em tons terrosos sobre a massa crua — um prato de conversa para quem ama pizza de verdade. Veio de uma casa que leva pizza a sério, com forno a lenha e tudo, então pode ir à mesa para servir e comer, não só para decorar. Peça <span class='realce--ouro'>assinada pela artesã</span>, pintada à mão — a próxima fatia que sair do forno nunca vem exatamente igual.",
    preco: 139.9,
    categoria: "ceramica",
    subcategoria: "Pratos de Pizza",
    selo: "assinada",
    imagem: "img/produtos/prato-eu-amo-pizza.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-eu-amo-pizza-2.webp",
      "img/produtos/angulos-extras/prato-eu-amo-pizza-3.webp",
    ],
    videoUrl: "img/produtos/videos/prato-eu-amo-pizza.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: false,
  },
  {
    id: 48,
    nome: "Prato Noite de Pizza",
    descricao:
      "Uma fatia de pizza em prato de cerâmica, pintada à mão com rodelas de calabresa e cebola — o sabor clássico das noites de pizza em casa. Veio de uma casa que leva pizza a sério (tem até forno a lenha) e pode ir à mesa para servir e comer de verdade, além de funcionar como peça decorativa na parede ou num cavalete entre um uso e outro. Peça <span class='realce--ouro'>assinada pela artesã</span>, pintada e modelada à mão, uma de cada vez.",
    preco: 129.9,
    categoria: "ceramica",
    subcategoria: "Pratos de Pizza",
    selo: "assinada",
    imagem: "img/produtos/prato-noite-de-pizza.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-noite-de-pizza-2.webp",
      "img/produtos/angulos-extras/prato-noite-de-pizza-3.webp",
    ],
    videoUrl: "img/produtos/videos/prato-noite-de-pizza.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: false,
  },
  {
    // ACHADO EXTRA (não pedido): a mãe enviou 2 fatias com o mesmo
    // desenho de calabresa/cebola, não 1. Tratada como peça separada
    // (cada peça é única — ver regra do catálogo), mas com preço só
    // REPETINDO o da irmã (id 48) como provisório. oculto:true FICA
    // assim até a Anasor confirmar o preço (ver relatório final).
    id: 49,
    nome: "Prato Fatia de Calabresa",
    descricao:
      "Uma segunda fatia da mesma leva de calabresa e cebola, irmã do Prato Noite de Pizza — pintada à mão com a mesma receita, mas nenhuma sai exatamente igual à outra, porque cada traço de pincel é único. Pode ir à mesa para servir pizza de verdade (essa casa tem forno a lenha) ou compor a decoração da cozinha. Peça <span class='realce--ouro'>assinada pela artesã</span>, pintada à mão.",
    preco: 129.9,
    categoria: "ceramica",
    subcategoria: "Pratos de Pizza",
    selo: "assinada",
    imagem: "img/produtos/prato-fatia-de-calabresa.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-fatia-de-calabresa-2.webp",
    ],
    videoUrl: "img/produtos/videos/prato-fatia-de-calabresa.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: true,
  },
  {
    id: 50,
    nome: "Prato Margherita ao Sol",
    descricao:
      "Uma fatia de pizza em prato de cerâmica, pintada à mão com rodelas de tomate maduro e folhas de manjericão sobre a massa crua — a clássica margherita, do jeito que essa casa gosta (tem até forno a lenha). Pode ir à mesa para servir e comer pizza de verdade, ou ficar de decoração na parede entre uma fatia e outra. Peça <span class='realce--ouro'>assinada pela artesã</span>, pintada à mão, sem duas iguais.",
    preco: 129.9,
    categoria: "ceramica",
    subcategoria: "Pratos de Pizza",
    selo: "assinada",
    imagem: "img/produtos/prato-margherita-ao-sol.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-margherita-ao-sol-2.webp",
      "img/produtos/angulos-extras/prato-margherita-ao-sol-3.webp",
    ],
    videoUrl: "img/produtos/videos/prato-margherita-ao-sol.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: false,
  },
  {
    // MESMO DESENHO do Prato Margherita ao Sol (id 50) — confirmado
    // visualmente (mesmo tomate/manjericão, mesma composição) nas
    // fotos. Um anúncio visível por desenho (ver CLAUDE.md): esta fica
    // oculta, igual ao par 48/49. Nunca apagar nem mudar o id.
    id: 51,
    nome: "Prato Horta de Manjericão",
    descricao:
      "Uma fatia de pizza irmã da Margherita ao Sol, com a mesma combinação de tomate e manjericão pintada à mão — mas cada traço de pincel sai diferente, então nenhuma fatia nasce igual à outra. Boa para servir pizza de verdade à mesa (essa casa tem forno a lenha) ou para compor a decoração da cozinha. Peça <span class='realce--ouro'>assinada pela artesã</span>, pintada à mão.",
    preco: 129.9,
    categoria: "ceramica",
    subcategoria: "Pratos de Pizza",
    selo: "assinada",
    imagem: "img/produtos/prato-horta-de-manjericao.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/prato-horta-de-manjericao-2.webp",
    ],
    videoUrl: "img/produtos/videos/prato-horta-de-manjericao.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: true,
  },
  {
    id: 52,
    nome: "Saboneteira Folha Verde-Noturna",
    descricao:
      "Uma saboneteira em formato de folha, modelada à mão com nervuras marcadas uma a uma e esmalte verde-escuro quase noturno, perfurada para escoar a água e manter o sabonete sempre seco. Uma peça simples e funcional que eleva a rotina do lavabo ou da pia da cozinha com um toque artesanal. <span class='realce--ouro'>Peça única</span>, sem produção repetida — a textura da folha nunca sai igual de queima para queima.",
    preco: 94.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "modelada-a-mao",
    imagem: "img/produtos/saboneteira-folha-verde-noturna.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/saboneteira-folha-verde-noturna-2.webp",
      "img/produtos/angulos-extras/saboneteira-folha-verde-noturna-3.webp",
      "img/produtos/angulos-extras/saboneteira-folha-verde-noturna-4.webp",
    ],
    videoUrl: "img/produtos/videos/saboneteira-folha-verde-noturna.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
    oculto: false,
  },

  // --- ANJOS DE LUZ (Artigos Religiosos) -----------------------
  // Única exceção de "peça única, estoque 1" do catálogo: são feitos
  // EM QUANTIDADE (ver permiteQuantidade/estoque/grupoAtacado/
  // minAtacado/precoAtacado, explicados em precoUnitario() acima).
  // Lembrancinha de Batizado/1ª Eucaristia e presente de Natal.
  {
    id: 53,
    nome: "Anjo de Luz Grande",
    descricao:
      "Pensado para ser a <span class='realce'>lembrança de Batizado e Primeira Eucaristia</span> — ou aquele presente de Natal que ninguém esquece. Um anjo em cerâmica branca, <span class='realce'>modelado à mão</span>, com um terço dourado no pescoço e uma saia perfurada que deixa a luz escapar em pontinhos, um a um. Do barro à luz: cada anjo nasce modelado à mão, ganha uma noite no forno e sai esmaltado em branco, pronto para iluminar. Vem numa caixinha com laço e o cartão da Anasor — já pronta para presentear. Encomendas em quantidade para o batizado ou a Primeira Eucaristia de toda a turma? É só chamar no WhatsApp.",
    preco: 35.0,
    precoAtacado: 30.0,
    permiteQuantidade: true,
    estoque: 17,
    maxPorPedido: 17,
    grupoAtacado: "anjos-de-luz",
    minAtacado: 3,
    categoria: "ceramica",
    subcategoria: "Artigos Religiosos",
    selo: "lembranca-batizado",
    imagem: "img/produtos/anjo-de-luz-grande.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/anjo-de-luz-grande-2.webp",
      "img/produtos/angulos-extras/anjo-de-luz-grande-3.webp",
      "img/produtos/angulos-extras/anjo-de-luz-grande-4.webp",
    ],
    videoUrl: "img/produtos/videos/anjo-de-luz-grande.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 54,
    nome: "Anjo de Luz Médio",
    descricao:
      "O tamanho certo para quem quer um <span class='realce'>anjo de luz</span> em cada lembrancinha de Batizado ou Primeira Eucaristia, sem pesar na mesa nem no bolso — e ainda sobra charme para o Natal. Cerâmica branca <span class='realce'>modelada à mão</span>, terço dourado e uma saia cheia de furinhos por onde a luz escapa, uma lasca dourada de cada vez. Do barro à luz: modelado à mão, uma noite no forno, esmalte branco — e pronto para acender. Embalado numa caixinha com laço e o cartão da Anasor, já pronto para presentear. Para encomendas grandes (turma de batizado, Primeira Eucaristia), fale com a Anasor pelo WhatsApp.",
    preco: 28.0,
    precoAtacado: 23.0,
    permiteQuantidade: true,
    estoque: 17,
    maxPorPedido: 17,
    grupoAtacado: "anjos-de-luz",
    minAtacado: 3,
    categoria: "ceramica",
    subcategoria: "Artigos Religiosos",
    selo: "lembranca-batizado",
    imagem: "img/produtos/anjo-de-luz-medio.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/anjo-de-luz-medio-2.webp",
      "img/produtos/angulos-extras/anjo-de-luz-medio-3.webp",
    ],
    videoUrl: "img/produtos/videos/anjo-de-luz-medio.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 55,
    nome: "Anjo de Luz Silhueta",
    descricao:
      "Um anjo fino, em formato de plaquinha, para quem gosta de um presente mais discreto — e ainda assim cheio de significado para o Batizado, a Primeira Eucaristia ou o Natal. Cerâmica branca <span class='realce'>modelada à mão</span>, com terço dourado e um pequeno colo onde se acende uma luz, projetando um brilho suave por trás da silhueta. Do barro à luz: modelado à mão, uma noite no forno, esmalte branco — e pronto para acender. Vem numa caixinha com laço e o cartão da Anasor, pronta para presentear. Precisa de muitas unidades para a turma toda do Batizado ou da Primeira Eucaristia? Fale com a Anasor pelo WhatsApp.",
    preco: 26.0,
    precoAtacado: 21.0,
    permiteQuantidade: true,
    estoque: 16,
    maxPorPedido: 16,
    grupoAtacado: "anjos-de-luz",
    minAtacado: 3,
    categoria: "ceramica",
    subcategoria: "Artigos Religiosos",
    selo: "lembranca-batizado",
    imagem: "img/produtos/anjo-de-luz-silhueta.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/anjo-de-luz-silhueta-2.webp",
      "img/produtos/angulos-extras/anjo-de-luz-silhueta-3.webp",
    ],
    videoUrl: "img/produtos/videos/anjo-de-luz-silhueta.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- VASOS RAKU (leva 24/11) ----------------------------------
  // 3 vasos de queima Raku, fotografados juntos (trio-raku-*.jpg) e
  // cada um também em sessão solo (raku-verde-*/raku-escuro-*) — menos
  // o primeiro (squat, sem sessão própria no material entregue; usa um
  // recorte da foto de grupo como capa, ver comentário nele). Só
  // descrevo efeito de queima/esmalte que aparece NA FOTO (fumaça,
  // brilho metálico) — nada de craquelado ou processo que eu não veja.
  {
    // SEM sessão solo no material (só aparece nas fotos de grupo,
    // trio-raku-*.jpg) — a capa é um RECORTE 4:5 de trio-raku-2.jpg
    // isolando só este vaso (conferido visualmente, produto inteiro
    // visível, sem cortar nada).
    id: 56,
    nome: "Vaso Raku Terra Firme",
    descricao:
      "Vaso em cerâmica queimado pela técnica <span class='realce'>Raku</span>, com a superfície marcada pela fumaça da queima em tons de terra queimada e preto fosco — cada mancha nasceu do próprio fogo, então não existe um igual. Silhueta baixa e encorpada, com ombros largos que se fecham suavemente até a boca. Peça <span class='realce--ouro'>única no ateliê</span>, decorativa, para compor uma mesa de centro, um aparador ou uma estante.",
    preco: 129.0,
    categoria: "ceramica",
    subcategoria: "Vasos Raku",
    selo: "queima-raku",
    materiaPrima: "Cerâmica queimada pela técnica Raku, com redução em fumaça.",
    imagem: "img/produtos/vaso-raku-terra-firme.webp",
    imagensExtras: ["img/produtos/angulos-extras/vaso-raku-terra-firme-2.webp"],
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 57,
    nome: "Vaso Raku Bruma Esmeralda",
    descricao:
      "Vaso em cerâmica queimado pela técnica <span class='realce'>Raku</span>, com um brilho metálico esverdeado que atravessa o corpo em nuvens — efeito que só essa queima consegue, e que nunca sai igual duas vezes. Corpo alongado, ombros marcados e boca levemente irregular, como só se vê em peça feita à mão. Peça <span class='realce--ouro'>única no ateliê</span>, decorativa, para um canto que pede um toque de cor rara.",
    preco: 129.0,
    categoria: "ceramica",
    subcategoria: "Vasos Raku",
    selo: "queima-raku",
    materiaPrima: "Cerâmica queimada pela técnica Raku, com redução em fumaça.",
    imagem: "img/produtos/vaso-raku-bruma-esmeralda.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-raku-bruma-esmeralda-2.webp",
      "img/produtos/angulos-extras/vaso-raku-bruma-esmeralda-3.webp",
    ],
    videoUrl: "img/produtos/videos/vaso-raku-bruma-esmeralda.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    id: 58,
    nome: "Vaso Raku Noite Lavrada",
    descricao:
      "Vaso em cerâmica queimado pela técnica <span class='realce'>Raku</span>, em preto fosco profundo, com a superfície lavrada por marcas da própria queima — uma textura que lembra madeira talhada, mas é só o fogo e a fumaça trabalhando o barro. O maior dos três vasos Raku do ateliê, com corpo generoso e boca larga. Peça <span class='realce--ouro'>única no ateliê</span>, decorativa, perfeita como destaque solo.",
    preco: 129.0,
    categoria: "ceramica",
    subcategoria: "Vasos Raku",
    selo: "queima-raku",
    materiaPrima: "Cerâmica queimada pela técnica Raku, com redução em fumaça.",
    imagem: "img/produtos/vaso-raku-noite-lavrada.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-raku-noite-lavrada-2.webp",
      "img/produtos/angulos-extras/vaso-raku-noite-lavrada-3.webp",
    ],
    videoUrl: "img/produtos/videos/vaso-raku-noite-lavrada.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },
  {
    // KIT: preço real = soma dos 3 avulsos (129*3 = 387), ver
    // precoOriginal — o selo "Lançamento -N%" sai sozinho, pela MESMA
    // regra de qualquer outra peça com desconto real (main.js).
    // "componentesKit": se QUALQUER um dos 3 vasos virar
    // "disponivel: false" (vendido avulso), o kit inteiro bloqueia a
    // compra sozinho (kitTemComponenteVendido, produtos.js) — e quando
    // o KIT vender, os 3 precisam virar "disponivel: false" também (o
    // aviso de pedido já lembra disso, ver pedido-email.js).
    id: 59,
    nome: "Kit dos 3 Vasos Raku",
    descricao:
      "Os três vasos <span class='realce'>Raku</span> do ateliê, juntos: Terra Firme, Bruma Esmeralda e Noite Lavrada — cada um com sua própria queima, sua própria fumaça, seu próprio brilho. Compram-se juntos ou separados; levando os três, sai mais em conta. Peças <span class='realce--ouro'>únicas, feitas à mão</span>, para compor uma mesa ou estante com três personalidades que conversam entre si.",
    precoOriginal: 387.0,
    preco: 300.0,
    categoria: "ceramica",
    subcategoria: "Vasos Raku",
    selo: ["kit", "queima-raku"],
    componentesKit: [56, 57, 58],
    materiaPrima: "Cerâmica queimada pela técnica Raku, com redução em fumaça.",
    imagem: "img/produtos/kit-3-vasos-raku.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/kit-3-vasos-raku-2.webp",
      "img/produtos/angulos-extras/kit-3-vasos-raku-3.webp",
    ],
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- VASO VESTIDO (leva 24/11) ---------------------------------
  {
    id: 60,
    nome: "Vaso Vestido Rendado",
    descricao:
      "Um vaso escultórico em formato de vestido, com a silhueta evasê de uma saia rodada — a &ldquo;saia&rdquo; toda <span class='realce'>texturizada com estampa de renda</span>, impressa à mão na argila ainda mole, e um buquê de rosinhas <span class='realce'>modeladas em relevo</span> na cintura. O acabamento em tom rosa-argila, fosco, reforça o ar delicado da peça. Peça <span class='realce--ouro'>única, modelada à mão</span>, para quem quer um vaso que também é escultura.",
    preco: 224.9,
    categoria: "ceramica",
    subcategoria: "Vasos Escultóricos",
    selo: "modelada-a-mao",
    imagem: "img/produtos/vaso-vestido-rendado.webp",
    imagensExtras: [
      "img/produtos/angulos-extras/vaso-vestido-rendado-2.webp",
      "img/produtos/angulos-extras/vaso-vestido-rendado-3.webp",
    ],
    videoUrl: "img/produtos/videos/vaso-vestido-rendado.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- POTINHO AZUL (leva 24/11) ----------------------------------
  // COMPARADO com o id 46 (Pote Âmbar e Meia-Noite): peça DIFERENTE —
  // o 46 é esmalte âmbar/dourado por fora com azul só por dentro; este
  // é azul-marinho reativo por fora E por dentro, com manchas escuras
  // em formato de raio, tampa com alça em bolinha (o 46 tem tampa em
  // cúpula com alça pontuda). Mesmo preço-padrão da linha (R$ 109,90).
  // Listado no relatório final pra Anasor confirmar que são peças
  // mesmo distintas.
  {
    id: 61,
    nome: "Potinho Manto Azul-Marinho",
    descricao:
      "Um potinho com tampa em esmalte azul-marinho reativo, com manchas escuras em formato de raio que surgem só na queima — cada potinho sai de um jeito, sem repetir o desenho. O cabo da tampa é uma bolinha simples, a combinar com o corpo arredondado. Perfeito para guardar pequenos tesouros (joias, chaves, doces) ou para ficar à vista como <span class='realce'>objeto decorativo</span> sobre a mesa. Peça <span class='realce--ouro'>única no ateliê</span>, com o acabamento reativo da queima tornando essa cor impossível de repetir.",
    preco: 109.9,
    categoria: "ceramica",
    subcategoria: "Objetos Decorativos",
    selo: "novidade",
    imagem: "img/produtos/potinho-manto-azul.webp",
    videoUrl: "img/produtos/videos/potinho-manto-azul.mp4",
    dimensoes: "A definir",
    cuidados: "A definir",
  },

  // --- CROCHÊ -------------------------------------------------
  // Sem fotos ainda. Modelo para quando houver peças (copie o
  // bloco, troque os valores e some as fotos extras que tiver):
  //
  // {
  //   id: 46,
  //   nome: "Sousplat de Crochê Natural",
  //   descricao: "...",
  //   preco: 65.00,
  //   categoria: "croche",
  //   subcategoria: "Sousplats",
  //   imagem: "img/produtos/sousplat-natural.jpg",
  //   imagensExtras: [],
  //   dimensoes: "A definir",
  //   cuidados: "A definir",
  // },
];

// ------------------------------------------------------------
//  produtosVisiveis() — O ÚNICO FILTRO DE "O QUE O CLIENTE VÊ"
// ------------------------------------------------------------
// Devolve só as peças que podem aparecer em LISTAGENS (tira as com
// "oculto: true"). Toda vitrine, contagem, busca e curadoria do site
// — e o GET /api/produtos do backend, que executa este mesmo arquivo
// (ver backend/data/produtos.js) — chama esta função em vez de ler
// "produtos" direto. Por que uma função central: se amanhã surgir
// outro motivo pra esconder uma peça, muda AQUI e vale pra tudo.
// Quem precisa achar QUALQUER peça pelo id (página do produto,
// carrinho, checkout no servidor) continua usando "produtos" — é
// isso que faz a peça oculta funcionar pelo link direto.
// O parâmetro "lista" tem padrão pra uso comum (produtosVisiveis()),
// mas aceita outra lista caso alguém já tenha uma em mãos.
function produtosVisiveis(lista = produtos) {
  return lista.filter((p) => !p.oculto);
}

// ------------------------------------------------------------
//  PREÇO POR QUANTIDADE (exceção dos Anjos de Luz, ver "permiteQuantidade")
// ------------------------------------------------------------
// Regra do catálogo: cada peça de cerâmica é única (estoque 1). Os
// "Anjos de Luz" (Grande/Médio/Silhueta) são a ÚNICA exceção — são
// feitos em quantidade para lembrancinhas de batizado/1ª Eucaristia —
// e por isso têm campos extras opcionais:
//   permiteQuantidade -> true libera o seletor de quantidade (em vez
//                         de travar em 1, como toda peça única).
//   estoque           -> quantas unidades existem HOJE deste modelo
//                         (controlado manualmente, ver scripts/estoque.js).
//                         Acima disso é só por encomenda.
//   grupoAtacado      -> uma "etiqueta" que agrupa modelos que somam
//                         quantidade juntos pro desconto de atacado
//                         (os 3 anjos somam entre si, mesmo sendo
//                         produtos DIFERENTES — por isso o agrupamento
//                         não pode ser "por produto", precisa ser por
//                         este campo).
//   minAtacado        -> quantas unidades do GRUPO (somadas) ativam o
//                         preço de atacado.
//   precoAtacado      -> preço por unidade quando o atacado está ativo.
//
// precoUnitario() é A ÚNICA função que decide "quanto custa 1 unidade
// desta peça" — usada pelo card, pela página do produto, pelo
// mini-carrinho E pelo backend (POST /api/checkout, que lê este mesmo
// arquivo via backend/data/produtos.js). Um lugar só pra essa conta
// nunca ficar dessincronizada entre o que o cliente vê e o que é
// cobrado de verdade.
// "totalDoGrupo" é a quantidade JÁ SOMADA de todas as unidades do
// mesmo grupoAtacado presentes no carrinho/pedido (ver
// totalNoGrupoAtacado, logo abaixo) — quem chama é quem sabe montar
// essa soma, porque ela depende do CONJUNTO de itens (carrinho ou
// pedido), não só desta peça.
function precoUnitario(produto, totalDoGrupo = 1) {
  const atacadoAtivo =
    Boolean(produto.grupoAtacado) &&
    typeof produto.precoAtacado === 'number' &&
    typeof produto.minAtacado === 'number' &&
    totalDoGrupo >= produto.minAtacado;
  return atacadoAtivo ? produto.precoAtacado : produto.preco;
}

// Soma as quantidades de todos os itens que pertencem ao MESMO
// grupoAtacado de "produto" — é esse total (não a quantidade de UM
// modelo só) que decide se o atacado liga. "itens" é uma lista de
// objetos com pelo menos {id, quantidade}: serve tanto pro carrinho do
// front (localStorage) quanto pros itens já validados no backend,
// desde que tenham essas duas chaves.
function totalNoGrupoAtacado(itens, produto) {
  if (!produto.grupoAtacado) return 0;
  return itens.reduce((soma, item) => {
    const doCatalogo = produtos.find((p) => String(p.id) === String(item.id));
    if (!doCatalogo || doCatalogo.grupoAtacado !== produto.grupoAtacado) return soma;
    const quantidade = Number(item.quantidade) || 0;
    return soma + quantidade;
  }, 0);
}

// Peça "esgotada": exceção dos itens com permiteQuantidade (hoje, só os
// Anjos de Luz). Diferente de "disponivel: false" (peça única vendida,
// que NUNCA repõe), aqui o estoque é um CONTADOR manual (ver
// scripts/estoque.js) que pode voltar a subir numa fornada nova — por
// isso o selo e a mensagem são "Esgotado" (temporário), não "Vendido".
function estaEsgotada(produto) {
  return produto.permiteQuantidade === true && Number(produto.estoque) <= 0;
}

// KIT com peças vendidas AVULSO (hoje, só o Kit dos 3 Vasos Raku — ver
// "componentesKit", produtos.js): se qualquer vaso que compõe o kit já
// foi vendido separado, o kit inteiro para de poder ser comprado —
// venderia algo que não existe mais em conjunto. Diferente de
// "disponivel: false" no PRÓPRIO kit (que o lugar certo pra usar é
// quando o KIT MESMO vende, ver o lembrete no aviso de pedido) —
// esta função olha os COMPONENTES, não o produto em si.
function kitTemComponenteVendido(produto) {
  if (!Array.isArray(produto.componentesKit)) return false;
  return produto.componentesKit.some((id) => {
    const componente = produtos.find((p) => p.id === id);
    return componente?.disponivel === false;
  });
}
