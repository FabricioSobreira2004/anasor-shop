// ============================================================
//  Scaffold compartilhado pelos testes locais de narracao/ (achado
//  do simplify: teste-legendar.js e teste-narrar.js tinham o MESMO
//  runner — teste()/contador de falhas/resumo final — copiado
//  palavra por palavra nos dois arquivos).
// ============================================================

function criarRunner() {
  let falhas = 0;
  function teste(nome, fn) {
    try {
      fn();
      console.log(`✅ ${nome}`);
    } catch (erro) {
      falhas += 1;
      console.error(`❌ ${nome}`);
      console.error(`   ${erro.message}`);
    }
  }
  function finalizar() {
    console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`);
    process.exit(falhas === 0 ? 0 : 1);
  }
  return { teste, finalizar };
}

module.exports = { criarRunner };
