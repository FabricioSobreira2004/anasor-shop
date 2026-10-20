// ============================================================
//  PÁGINAS DE RETORNO DO PAGAMENTO
//  (pedido-confirmado.html / pedido-pendente.html / pedido-erro.html)
// ============================================================
//
//  O Mercado Pago (e qualquer gateway de pagamento) exige, na hora de
//  criar a cobrança, 3 URLs de retorno prontas — success/failure/
//  pending — pra onde ele redireciona o comprador DEPOIS de pagar (ou
//  tentar pagar). Estas 3 páginas HOJE são placeholders (o link que a
//  leva até elas, no fluxo de checkout.js, é FAKE — ver TODO em
//  backend/server.js); quando o Mercado Pago estiver configurado de
//  verdade, ele passa a chamar estas MESMAS URLs sozinho, com o
//  "order_id" (e outros parâmetros da API dele) na query string.
//
//  Este arquivo é o ÚNICO script extra das 3 páginas (além de
//  produtos.js + main.js, carregados antes, mesmo padrão do resto do
//  site) — faz duas coisas simples:
//    1. Lê "?order_id=..." da URL e escreve no <span id="pedido-numero">
//       de cada página (se ela tiver um).
//    2. Esvazia o carrinho, MAS só nas páginas que representam um
//       pedido "fechado" (sucesso ou pendente) — a de erro NÃO esvazia,
//       pra a pessoa poder tentar de novo com o mesmo carrinho. Qual
//       comportamento vale pra cada página é decidido por um atributo
//       no HTML (data-limpar-carrinho="1"), não aqui — assim dá pra
//       ler a intenção de cada página só olhando o <body> dela.
// ============================================================

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order_id');

const numeroEl = document.querySelector('#pedido-numero');
if (numeroEl) {
  numeroEl.textContent = orderId || '—';
}

if (document.body.dataset.limparCarrinho === '1') {
  // salvarCarrinho([]) já cuida de tudo: grava o carrinho vazio,
  // atualiza o número no ícone do header e (se por acaso o
  // mini-carrinho estivesse aberto) re-renderiza o painel. Vem de
  // js/main.js, carregado antes deste arquivo.
  salvarCarrinho([]);
}
