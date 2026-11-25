// ============================================================
//  PONTE TEMPORÁRIA PRO CATÁLOGO
// ============================================================
//
//  POR QUE ESTE ARQUIVO EXISTE
//  ---------------------------------------------------------
//  Os dados dos produtos hoje moram em UM lugar só: o arquivo
//  do front-end  ../../js/produtos.js  — que foi escrito pro
//  NAVEGADOR. Lá ele faz apenas:
//
//        const produtos = [ { id: 1, ... }, ... ];
//
//  ou seja, cria uma variável global e pronto. Não tem
//  "module.exports", então o Node não consegue simplesmente
//  fazer  require('../../js/produtos.js')  e receber a lista.
//
//  Em vez de COPIAR o array pra cá (o que criaria dois arquivos
//  pra manter em sincronia — receita de bug), a gente LÊ o texto
//  do arquivo do front e executa esse texto num "sandbox" do
//  módulo nativo `vm`, só pra capturar o valor de `produtos`.
//  Assim continua existindo UMA fonte da verdade.
//
//  ISSO É PROVISÓRIO. O próximo passo do backend é mover o
//  catálogo pra um BANCO DE DADOS (ver TODOs no server.js).
//  Quando isso acontecer, este arquivo é apagado e o
//  ../../js/produtos.js do front passa a consumir a API
//  (fetch('/api/produtos')) em vez de ter os dados embutidos.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// caminho absoluto até o arquivo de produtos do front-end
const caminhoArquivoFront = path.join(__dirname, '..', '..', 'js', 'produtos.js');

function carregarProdutosDoFront() {
  const codigo = fs.readFileSync(caminhoArquivoFront, 'utf-8');

  // sandbox vazio: o código do front não usa nada do navegador
  // (window, document...) no trecho que nos interessa — é só um
  // array literal. Se um dia usar, isto aqui quebra de forma
  // barulhenta (bom: a gente fica sabendo na hora).
  const sandbox = {};
  vm.createContext(sandbox);

  // O `vm.runInContext` devolve o valor da ÚLTIMA expressão avaliada.
  // O arquivo declara `const produtos = [...]` e a função
  // `produtosVisiveis()`; ao anexar uma linha final que monta um
  // objeto com os dois, essa expressão vira o valor de retorno. A
  // função vem junto (em vez de reescrever o filtro aqui) pra a regra
  // de "o que é oculto" continuar morando num lugar só: js/produtos.js.
  return vm.runInContext(
    codigo + '\n({ produtos, produtosVisiveis, precoUnitario, totalNoGrupoAtacado, estaEsgotada });',
    sandbox,
    { filename: caminhoArquivoFront }
  );
}

// Lê UMA vez, quando o servidor sobe (o arquivo não muda em runtime).
// Se der erro de leitura/parse, é melhor o servidor NEM subir do que
// subir servindo um catálogo vazio silenciosamente.
const { produtos, produtosVisiveis, precoUnitario, totalNoGrupoAtacado, estaEsgotada } =
  carregarProdutosDoFront();

if (!Array.isArray(produtos) || produtos.length === 0) {
  throw new Error(
    '[data/produtos.js] Não consegui carregar o catálogo de ../../js/produtos.js ' +
      '(resultado vazio ou não é um array). Confira aquele arquivo.'
  );
}

// produtos: catálogo COMPLETO (inclui peças ocultas) — pra achar uma
//   peça pelo id (GET /api/produtos/:id e o cálculo do checkout).
// produtosVisiveis: filtro das LISTAGENS públicas (GET /api/produtos).
// precoUnitario/totalNoGrupoAtacado: regra de preço por quantidade dos
//   Anjos de Luz (ver js/produtos.js) — o CHECKOUT usa as MESMAS duas
//   funções do front, pra nunca cobrar diferente do que o cliente viu.
// estaEsgotada: estoque zerado (permiteQuantidade) — bloqueia o pedido
//   igual a uma peça vendida, mas sem marcar "disponivel: false".
module.exports = { produtos, produtosVisiveis, precoUnitario, totalNoGrupoAtacado, estaEsgotada };
