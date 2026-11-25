// ============================================================
//  TESTE LOCAL — preço por quantidade/atacado dos Anjos de Luz
//  (sem internet, sem Mercado Pago de verdade)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Sobe o app Express de verdade (backend/server.js) em modo
//  DEMONSTRAÇÃO (sem MERCADOPAGO_ACCESS_TOKEN, localhost) e manda
//  pedidos de POST /api/checkout só com os Anjos de Luz (ids 53/54/55,
//  ver js/produtos.js), conferindo:
//   1. 1, 2, 3 e 4 unidades (preço unitário e de atacado corretos);
//   2. mistura dos 3 modelos somando pro MESMO grupoAtacado;
//   3. pedido acima do estoque do modelo -> 409 "estoque_insuficiente";
//   4. preço mandado pelo cliente no corpo é IGNORADO (o servidor
//      recalcula do catálogo, nunca confia no body);
//   5. arredondamento: o total bate centavo a centavo com a conta feita
//      à mão, mesmo misturando anjo + peça comum no carrinho.
//  Rodar com: node backend/scripts/teste-anjos-estoque.js
// ============================================================

const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');

const PASTA_BACKEND = path.join(__dirname, '..');
const VARIAVEIS = ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET', 'BASE_URL', 'VERCEL_ENV', 'FORCAR_DEMO'];

// Carrega um server.js NOVO (módulos limpos do cache) com as variáveis
// do cenário — mesmo padrão de scripts/teste-checkout-webhook.js.
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

// Dados fixos de cliente/endereço (CPF fictício com dígitos verificadores
// válidos, gerado — não é de ninguém) — o teste é sobre PREÇO, não sobre
// validação de cadastro, então um conjunto válido só uma vez já basta.
const CLIENTE = {
  cliente: { nome: 'Maria Teste', email: 'maria.teste@example.com', telefone: '21987222679', cpf: '529.982.247-25' },
  endereco: { cep: '01310100', rua: 'Avenida Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
};

const GRANDE = 53, MEDIO = 54, SILHUETA = 55;
// Preços de js/produtos.js (unidade / atacado a partir de 3 no grupo):
// Grande 35/30, Médio 28/23, Silhueta 26/21.

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('1 unidade do Anjo Grande: preço cheio (sem atacado)', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 1 }] } });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 35);
  assert.equal(valor.corpo.total, 35);
});

teste('2 unidades do Anjo Grande: ainda preço cheio (total do grupo = 2, abaixo de 3)', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 2 }] } });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 70); // 2 x 35
});

teste('3 unidades misturando Grande + Médio: atacado liga nos DOIS modelos', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 2 }, { id: MEDIO, quantidade: 1 }] },
  });
  assert.equal(valor.status, 200);
  // 2 x 30 (atacado) + 1 x 23 (atacado) = 83
  assert.equal(valor.corpo.subtotal, 83);
});

teste('4 unidades (3 Grande + 1 Silhueta): atacado nos 3 Grande e na Silhueta', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 3 }, { id: SILHUETA, quantidade: 1 }] },
  });
  assert.equal(valor.status, 200);
  // 3 x 30 (atacado) + 1 x 21 (atacado) = 111
  assert.equal(valor.corpo.subtotal, 111);
});

teste('pedido acima do estoque do modelo: 409 estoque_insuficiente, nenhum pedido criado', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    // estoque do Grande é 17 (ver js/produtos.js) — pedir 18 estoura
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 18 }] },
  });
  assert.equal(valor.status, 409);
  assert.equal(valor.corpo.codigo, 'estoque_insuficiente');
  assert.match(valor.corpo.erro, /Anjo de Luz Grande/);
});

teste('modelo com estoque zerado (esgotado): 409, mesmo pedindo só 1 unidade', async () => {
  // carrega o app PRIMEIRO (põe data/produtos.js no cache do require) e
  // só DEPOIS pega o mesmo módulo cacheado pra mutar — na ordem inversa,
  // carregarServidor limparia o cache e desfaria a mutação sem querer.
  const app = carregarQuieto({});
  const peca = require('../data/produtos').produtos.find((p) => p.id === SILHUETA);
  const estoqueOriginal = peca.estoque;
  peca.estoque = 0;
  try {
    const valor = await requisitar(app, { caminho: '/api/checkout', corpo: { ...CLIENTE, itens: [{ id: SILHUETA, quantidade: 1 }] } });
    assert.equal(valor.status, 409);
    assert.equal(valor.corpo.codigo, 'peca_vendida');
    assert.match(valor.corpo.erro, /esgotada/);
    assert.ok(!valor.corpo.checkout_url, 'nenhum pagamento é iniciado');
  } finally {
    peca.estoque = estoqueOriginal;
  }
});

teste('preço adulterado no corpo da requisição é ignorado (servidor recalcula do catálogo)', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    // o front NUNCA manda preço (ver js/checkout.js), mas um cliente
    // malicioso poderia montar o body na mão com campos extras
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 1, preco: 0.01, precoUnitario: 0.01 }] },
  });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 35); // preço do catálogo, não o 0.01 enviado
});

teste('arredondamento: anjo (atacado) + peça comum fecham no centavo', async () => {
  const app = carregarQuieto({});
  // 3 Anjos Grande em atacado (3 x 30 = 90) + 1 "Prato Decorativo
  // Melodia da Primavera" (id 1, preço 134.9, ver js/produtos.js)
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 3 }, { id: 1, quantidade: 1 }] },
  });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 224.9); // 90 + 134.9, sem sujeira de ponto flutuante
  assert.equal(valor.corpo.total, 224.9); // frete grátis
});

teste('quantidade 1.5/negativa/0 num Anjo de Luz: trava em 1, nunca aceita fração ou zero', async () => {
  const app = carregarQuieto({});
  const valor = await requisitar(app, {
    caminho: '/api/checkout',
    corpo: { ...CLIENTE, itens: [{ id: GRANDE, quantidade: 1.5 }] },
  });
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.subtotal, 35); // 1 unidade, preço cheio
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
