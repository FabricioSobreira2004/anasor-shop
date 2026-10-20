// ============================================================
//  FUNÇÃO SERVERLESS DA VERCEL — ponte pro backend Express
// ============================================================
//
//  Por que este arquivo existe: a Vercel não hospeda "um servidor
//  ligado o tempo todo" (não existe o tradicional app.listen() de pé
//  numa porta) — ela hospeda FUNÇÕES: cada arquivo .js dentro de
//  api/ é tratado como 1 função serverless, invocada a cada
//  requisição pro caminho correspondente. Tudo que uma função desse
//  tipo (runtime @vercel/node, usado automaticamente aqui) precisa
//  exportar é um handler (req, res) — e um app Express JÁ É isso: ele
//  é, por baixo dos panos, uma função (req, res) que faz seu próprio
//  roteamento interno. Por isso basta reexportar o app sem nenhuma
//  camada extra.
//
//  O vercel.json na raiz redireciona qualquer /api/* pra ESTE
//  arquivo (já que o Express dentro de backend/server.js é quem
//  decide, internamente, se a rota é /api/produtos, /api/checkout,
//  etc. — não precisamos de 1 arquivo por rota).
//
//  backend/server.js continua sendo a ÚNICA fonte de verdade das
//  rotas: nada é duplicado aqui. Ele só NÃO chama app.listen() quando
//  é importado (como agora) em vez de executado direto — ver o "if
//  (require.main === module)" no final daquele arquivo.
module.exports = require('../backend/server.js');
