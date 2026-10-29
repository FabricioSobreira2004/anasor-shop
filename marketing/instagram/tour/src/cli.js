// Parser de CLI compartilhado por tour.js e src/capturar.js (achado
// do simplify: os 2 arquivos tinham o MESMO parser "--chave valor",
// byte a byte). Formato: qualquer "--chave" vira booleano `true` se o
// próximo argumento também começar com "--" (ou for o último), senão
// vira o valor seguinte.
function lerArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const chave = argv[i].slice(2);
      const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[chave] = valor;
    }
  }
  return args;
}

module.exports = { lerArgs };
