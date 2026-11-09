// Roteiro v4 (Rodada 11) — frase POR CENA (não mais um parágrafo só,
// dividido por pontuação). Cada entrada casa com a tela exibida
// naquele momento (pedido explícito do Fabrício: "frase x cena", item
// 4) — só fatos reais (produtos.js/politicas.html; no portfólio, só
// fatos do projeto). A duração de cada cena passa a vir da duração
// REAL da fala (ver tour/gerar-v4.js), não mais de um número fixo.
//
// Mobile (Instagram): 1 frase por cena, na MESMA ordem de
// roteiro-mobile.js (home-hero → fecho).
const FRASES_MOBILE = [
  { cena: 'home-hero', texto: 'Vem conhecer o site do ateliê Anasor Cerâmica.' },
  { cena: 'home-scroll', texto: 'Aqui você passeia pelas coleções de cerâmica e crochê.' },
  { cena: 'card-selo', texto: 'Toda peça é única, feita à mão.' },
  { cena: 'produto-galeria', texto: 'Cada peça tem fotos reais, de verdade.' },
  { cena: 'produto-video', texto: 'Dá pra ver a peça em vídeo.' },
  { cena: 'produto-medidas', texto: 'E as medidas, antes de decidir.' },
  { cena: 'produto-upsell', texto: 'Outras peças da coleção aparecem aqui também.' },
  { cena: 'carrinho', texto: 'Ela vai pro carrinho, sempre visível.' },
  { cena: 'checkout', texto: 'No checkout, o CEP completa o endereço sozinho.' },
  { cena: 'vendida-secao', texto: 'Já encontraram um lar — dá pra encomendar uma parecida.' },
  { cena: 'vendida-produto', texto: 'Mesmo vendida, a peça segue no portfólio do ateliê.' },
  { cena: 'links', texto: 'Frete grátis pra todo o Brasil, com compra segura pelo Mercado Pago.' },
  { cena: 'fecho', texto: 'Link na bio, no arroba anasor ponto cerâmica.' },
];

// Desktop (portfólio): 6 cenas, 2 delas (checkout/fecho) com 2 frases
// — mesma ordem/conteúdo dos balões técnicos já existentes em
// roteiro-desktop.js (destaques), só que agora a frase FALADA e o
// balão NA TELA nascem do mesmo texto (nunca mais podem desalinhar).
// `balao:true` — só nas frases que JÁ tinham um balão técnico
// (DestaqueTecnico) antes desta rodada (listagem/checkout/fecho[0]);
// as outras (abertura/home/produto/fecho[1] "desenvolvido por...", já
// mostrado como texto fixo no FechoPortfolio) ficam só na narração —
// nenhum elemento NOVO na tela (pedido explícito: visual aprovado).
const FRASES_DESKTOP = [
  { cena: 'abertura', texto: 'Este é um tour pelo site da Anasor Cerâmica.', balao: false },
  { cena: 'home', texto: 'Uma loja online construída do zero, com HTML, CSS, JavaScript, Node.js e Express.', balao: false },
  { cena: 'listagem', texto: 'O preço de cada peça é recalculado no servidor — nunca só no que chega do navegador.', balao: true },
  { cena: 'produto', texto: 'Cada peça tem fotos, vídeo e medidas reais.', balao: false },
  { cena: 'checkout', texto: 'O CEP e o CPF são validados antes de seguir pro pagamento.', balao: true },
  { cena: 'checkout', texto: 'Quando o pedido é pago, a Anasor é avisada na hora, por e-mail e Telegram.', balao: true },
  { cena: 'fecho', texto: 'Cada push no GitHub já publica a nova versão no ar, direto na Vercel.', balao: true },
  { cena: 'fecho', texto: 'Este site foi desenvolvido por FabricioSobreira.', balao: false },
];

module.exports = { FRASES_MOBILE, FRASES_DESKTOP };
