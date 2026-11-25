// ============================================================
//  TESTE LOCAL — Kit dos 3 Vasos Raku (sem internet)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Confere, sem precisar abrir o site, que POST /api/checkout:
//   1. aceita o pedido do kit normalmente quando os 3 vasos
//      componentes continuam "à venda";
//   2. RECUSA (409) o pedido do kit assim que QUALQUER um dos 3 vasos
//      vira "disponivel: false" (vendido avulso) — mesmo que o pedido
//      só tenha o KIT no carrinho, nenhum dos vasos soltos;
//   3. não derruba o pedido de um vaso AVULSO quando é outro
//      componente (não ele) que foi vendido.
//  Rodar com: node backend/scripts/teste-kit-raku.js
// ============================================================

const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');

const PASTA_BACKEND = path.join(__dirname, '..');
const VARIAVEIS = ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET', 'BASE_URL', 'VERCEL_ENV', 'FORCAR_DEMO'];

function carregarServidor(env) {
  for (const k of VARIAVEIS) delete process.env[k];
  Object.assign(process.env, env);
  for (const chave of Object.keys(require.cache)) {
    if (chave.startsWith(PASTA_BACKEND) && !chave.includes('node_modules')) delete require.cache[chave];
  }
  return require('../server');
}

function carregarQuieto(env) {
  const originais = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(originais)) console[k] = () => {};
  try {
    return carregarServidor(env);
  } finally {
    Object.assign(console, originais);
  }
}

async function requisitar(app, { metodo = 'POST', caminho, corpo }) {
  const servidor = app.listen(0);
  await new Promise((r) => servidor.once('listening', r));
  try {
    const dados = corpo ? JSON.stringify(corpo) : '';
    return await new Promise((resolver, rejeitar) => {
      const req = http.request(
        { host: '127.0.0.1', port: servidor.address().port, method: metodo, path: caminho, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados) } },
        (res) => {
          let texto = '';
          res.on('data', (c) => (texto += c));
          res.on('end', () => resolver({ status: res.statusCode, corpo: texto ? (() => { try { return JSON.parse(texto); } catch { return texto; } })() : null }));
        }
      );
      req.on('error', rejeitar);
      req.end(dados);
    });
  } finally {
    servidor.close();
  }
}

const CLIENTE = {
  cliente: { nome: 'Maria Teste', email: 'maria.teste@example.com', telefone: '21987222679', cpf: '529.982.247-25' },
  endereco: { cep: '01310100', rua: 'Avenida Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
};

const KIT = 59;
const VASO_TERRA_FIRME = 56;
const VASO_BRUMA_ESMERALDA = 57;

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('kit disponível: pedido normal, subtotal = preço de kit (300)', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: KIT, quantidade: 1 }] } });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 300);
});

teste('1 componente vendido avulso: pedido do KIT é recusado (409)', async () => {
  const app = carregarQuieto({});
  const peca = require('../data/produtos').produtos.find((p) => p.id === VASO_TERRA_FIRME);
  peca.disponivel = false;
  try {
    const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: KIT, quantidade: 1 }] } });
    assert.equal(valor.status, 409);
    assert.equal(valor.corpo.codigo, 'peca_vendida');
    assert.match(valor.corpo.erro, /Kit dos 3 Vasos Raku/);
    assert.ok(!valor.corpo.checkout_url, 'nenhum pagamento é iniciado');
  } finally {
    delete peca.disponivel;
  }
});

teste('1 componente vendido avulso: o PRÓPRIO vaso vendido continua recusado normalmente', async () => {
  const app = carregarQuieto({});
  const peca = require('../data/produtos').produtos.find((p) => p.id === VASO_TERRA_FIRME);
  peca.disponivel = false;
  try {
    const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: VASO_TERRA_FIRME, quantidade: 1 }] } });
    assert.equal(valor.status, 409);
    assert.equal(valor.corpo.codigo, 'peca_vendida');
  } finally {
    delete peca.disponivel;
  }
});

teste('1 componente vendido avulso: o OUTRO vaso (não vendido) continua comprável normalmente', async () => {
  const app = carregarQuieto({});
  const peca = require('../data/produtos').produtos.find((p) => p.id === VASO_TERRA_FIRME);
  peca.disponivel = false;
  try {
    const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: VASO_BRUMA_ESMERALDA, quantidade: 1 }] } });
    assert.equal(valor.status, 200);
    assert.equal(valor.corpo.subtotal, 129);
  } finally {
    delete peca.disponivel;
  }
});

(async () => {
  let falhas = 0;
  for (const { nome, fn } of testes) {
    try {
      await fn();
      console.log(`✅ ${nome}`);
    } catch (erro) {
      falhas++;
      console.error(`❌ ${nome}\n   ${erro.message}`);
    }
  }
  for (const k of VARIAVEIS) delete process.env[k];
  console.log(falhas ? `\n${falhas} teste(s) falharam.` : `\nOs ${testes.length} testes passaram.`);
  process.exitCode = falhas ? 1 : 0;
})();
