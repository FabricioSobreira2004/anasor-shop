// Roteiro v5 (Rodada 12) — ACHADO medindo o v4 (ver DECISOES.md,
// "narração travando"): 13 frases MOBILE curtas (6-12 palavras cada),
// uma síntese por frase, pausa fixa entre elas — mesmo sintetizando
// cada uma de uma vez só (já era assim na v4), o ouvido percebe "fala,
// para, fala, para" porque nenhuma frase tem 2-3 orações pra soar
// corrida. Correção: TRECHOS mais longos (2-3 orações, conectivos
// naturais) — no mobile isso significa agrupar várias das 13 CENAS
// visuais (clipes) por trecho (ex.: fotos+vídeo+medidas do produto
// virou 1 trecho só, narrando os 3 clipes em sequência) — sem isso, 13
// trechos de 14-26 palavras cada passariam de 90s (pedido de duração
// ≈36-44s é incompatível com 13 trechos longos; registrado em
// DECISOES.md). Nenhum clipe foi removido — todos os 13 ainda
// aparecem, na mesma ordem; só a duração de cada um agora é uma FATIA
// proporcional do trecho que os narra (ver tour/gerar-v5.js,
// construirTimelineMobileV5). Fatos iguais aos da v4 (produtos.js/
// políticas), só reorganizados/conectados.
const FRASES_MOBILE_V5 = [
  {
    id: 'home', cenas: ['home-hero', 'home-scroll'],
    texto: 'Vem conhecer o site do ateliê Anasor Cerâmica, e passeie pelas coleções de cerâmica e crochê.',
  },
  {
    id: 'selo', cenas: ['card-selo'],
    texto: 'Toda peça é única, feita à mão, com estoque de uma peça só.',
  },
  {
    id: 'produto', cenas: ['produto-galeria', 'produto-video', 'produto-medidas'],
    texto: 'Cada peça tem fotos reais, dá pra ver em vídeo, e as medidas aparecem certinhas, antes de decidir.',
  },
  {
    id: 'colecao', cenas: ['produto-upsell', 'carrinho'],
    texto: 'Outras peças da coleção aparecem também, e a escolhida vai pro carrinho, sempre visível.',
  },
  {
    id: 'checkout', cenas: ['checkout'],
    texto: 'No checkout, o CEP completa o endereço sozinho, sem precisar digitar tudo à mão.',
  },
  {
    id: 'vendida', cenas: ['vendida-secao', 'vendida-produto'],
    texto: 'Peça vendida nunca sai do site — ela fica no portfólio do ateliê, e dá pra encomendar uma parecida.',
  },
  {
    id: 'links', cenas: ['links'],
    texto: 'O frete é grátis pra todo o Brasil, com a compra protegida pelo Mercado Pago.',
  },
];
// Fechamento FIXO — curto de propósito (exceção explícita do pedido:
// nunca cortar o "arroba anasor ponto cerâmica", tem que ser falado
// inteiro quando o cartão final com o @ entra).
const FECHO_MOBILE_V5 = { id: 'fecho', cenas: ['fecho'], texto: 'Link na bio, no arroba anasor ponto cerâmica.' };

// Desktop (portfólio) — mesma estrutura de 6 cenas/8 itens da v4
// (nenhum balão novo, nenhuma cena removida), só os textos mais
// fluidos (2 orações conectadas em vez de 1 cláusula seca). Cabe no
// orçamento de palavras sem precisar agrupar cenas (8 itens já davam
// pra cena, ao contrário do mobile com 13) — ver DECISOES.md.
const FRASES_DESKTOP_V5 = [
  { cena: 'abertura', texto: 'Este é um tour pelo site da Anasor Cerâmica, direto do portfólio de quem desenvolveu.', balao: false },
  { cena: 'home', texto: 'Uma loja online construída do zero, com HTML, CSS, JavaScript, Node.js e Express.', balao: false },
  { cena: 'listagem', texto: 'O preço de cada peça é recalculado no servidor — nunca só no que chega do navegador.', balao: true },
  { cena: 'produto', texto: 'Cada peça tem fotos, vídeo e medidas reais, do mesmo arquivo único de produtos.', balao: false },
  { cena: 'checkout', texto: 'O CEP e o CPF são validados no servidor antes de seguir pro pagamento.', balao: true },
  { cena: 'checkout', texto: 'Quando o pedido é pago, a Anasor é avisada na hora — por e-mail e também pelo Telegram.', balao: true },
  { cena: 'fecho', texto: 'Cada push no GitHub já publica a nova versão no ar, direto na Vercel.', balao: true },
  { cena: 'fecho', texto: 'Este site foi desenvolvido por FabricioSobreira — da ideia ao ar, ponta a ponta.', balao: false },
];

module.exports = { FRASES_MOBILE_V5, FECHO_MOBILE_V5, FRASES_DESKTOP_V5 };
