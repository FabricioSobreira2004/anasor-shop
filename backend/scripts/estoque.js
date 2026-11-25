// ============================================================
//  CLI — atualizar o estoque de um Anjo de Luz (ou outra peça futura
//  com "permiteQuantidade") em js/produtos.js
// ============================================================
//
//  POR QUE ISTO EXISTE
//  ---------------------------------------------------------
//  Não há banco de dados (ver TODO no topo de backend/server.js): o
//  estoque dos Anjos de Luz mora no campo "estoque" de js/produtos.js e
//  NÃO baixa sozinho a cada venda — a Anasor precisa atualizar à mão
//  depois de cada pedido (os avisos de e-mail/Telegram já trazem uma
//  SUGESTÃO pronta, ver sugestoesEstoqueAnjos em pedido-email.js).
//  Editar o número à mão no arquivo é arriscado (erro de digitação,
//  vírgula a menos quebra o catálogo inteiro); este script faz a troca
//  com segurança: valida o id e o número antes de mexer em qualquer
//  coisa, e só troca a LINHA do estoque — o resto do arquivo (preço,
//  descrição, fotos...) fica exatamente como estava.
//
//  USO
//    node backend/scripts/estoque.js <id> <novo-estoque>
//  Exemplos:
//    node backend/scripts/estoque.js 53 14      -> Anjo de Luz Grande vira 14
//    node backend/scripts/estoque.js 55 0        -> Anjo de Luz Silhueta esgota
//
//  "maxPorPedido" anda JUNTO com "estoque" (ver produtos.js: o limite
//  de unidades por pedido é sempre igual ao estoque do modelo) — este
//  script atualiza os DOIS números juntos, pra nunca ficarem
//  dessincronizados.
// ============================================================

const fs = require('fs');
const path = require('path');

const CAMINHO_PRODUTOS = path.join(__dirname, '..', '..', 'js', 'produtos.js');

function sair(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

function main() {
  const [, , idArg, novoArg] = process.argv;

  if (!idArg || novoArg === undefined) {
    sair('uso: node backend/scripts/estoque.js <id> <novo-estoque>');
  }

  const id = Number(idArg);
  const novoEstoque = Number(novoArg);

  if (!Number.isInteger(id) || id <= 0) {
    sair(`id inválido: "${idArg}" (precisa ser um número inteiro positivo).`);
  }
  if (!Number.isInteger(novoEstoque) || novoEstoque < 0) {
    sair(`novo estoque inválido: "${novoArg}" (precisa ser um número inteiro >= 0).`);
  }

  const conteudo = fs.readFileSync(CAMINHO_PRODUTOS, 'utf-8');

  // Acha TODOS os "id: N," do arquivo e escolhe o que bate com o id
  // pedido — não dá pra simplesmente procurar "id: 53," porque "id: 5,"
  // também "contém" o texto errado em buscas ingênuas; aqui comparamos
  // o NÚMERO capturado, não o texto.
  const regexId = /id:\s*(\d+),/g;
  let match;
  let inicioBloco = -1;
  while ((match = regexId.exec(conteudo))) {
    if (Number(match[1]) === id) {
      inicioBloco = match.index;
      break;
    }
  }
  if (inicioBloco === -1) {
    sair(`nenhuma peça com id ${id} encontrada em js/produtos.js.`);
  }

  // Fim do bloco deste produto: o início do PRÓXIMO objeto da lista
  // ("\n  {\n") depois daqui, ou o fechamento do array ("\n];") se for
  // o último produto. Os 2 padrões cobrem o formato usado em todo o
  // arquivo (ver qualquer produto existente).
  const proximoObjeto = conteudo.indexOf('\n  {\n', inicioBloco + 1);
  const fimArray = conteudo.indexOf('\n];', inicioBloco);
  const fimBloco =
    proximoObjeto === -1 ? fimArray : fimArray === -1 ? proximoObjeto : Math.min(proximoObjeto, fimArray);
  if (fimBloco === -1) {
    sair('não consegui identificar o fim do bloco desta peça (formato inesperado do arquivo).');
  }

  const bloco = conteudo.slice(inicioBloco, fimBloco);
  const regexEstoque = /estoque:\s*(\d+),/;
  const achadoEstoque = bloco.match(regexEstoque);
  if (!achadoEstoque) {
    sair(
      `a peça id ${id} não tem campo "estoque" — este script só serve pra peças com ` +
        `"permiteQuantidade: true" (hoje, os Anjos de Luz). Confira o id.`
    );
  }
  const estoqueAntigo = Number(achadoEstoque[1]);

  let blocoNovo = bloco.replace(regexEstoque, `estoque: ${novoEstoque},`);
  // maxPorPedido sempre igual a estoque (ver produtos.js) — troca junto,
  // se existir (sempre existe nas peças com permiteQuantidade de hoje).
  blocoNovo = blocoNovo.replace(/maxPorPedido:\s*\d+,/, `maxPorPedido: ${novoEstoque},`);

  const conteudoNovo = conteudo.slice(0, inicioBloco) + blocoNovo + conteudo.slice(fimBloco);
  fs.writeFileSync(CAMINHO_PRODUTOS, conteudoNovo, 'utf-8');

  const nomeAchado = bloco.match(/nome:\s*"([^"]+)"/)?.[1] || `id ${id}`;
  console.log(`✅ Atualizar estoque: ${nomeAchado} ${estoqueAntigo} → ${novoEstoque}`);
}

main();
