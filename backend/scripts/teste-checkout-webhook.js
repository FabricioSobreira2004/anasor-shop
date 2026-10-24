// ============================================================
//  TESTE LOCAL — proteções do pagamento em produção (sem internet)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Sobe o app Express de verdade (backend/server.js) numa porta local
//  aleatória, um cenário de variáveis de ambiente por vez, e confere:
//   1. CHECKOUT: produção (BASE_URL pública, ou VERCEL_ENV=production)
//      sem MERCADOPAGO_ACCESS_TOKEN responde 503 "pagamento_indisponivel"
//      — nunca o link de demonstração; em localhost o modo demonstração
//      continua funcionando;
//   2. WEBHOOK: pagamento aprovado sem NENHUM aviso entregue -> 503 (o
//      Mercado Pago tenta de novo); pelo menos 1 canal entregou -> 200;
//      assinatura inválida -> 401; evento que não é pagamento e
//      pagamento não aprovado -> 200; falha ao consultar -> 500;
//   3. os logs desses cenários não trazem token nem dado do cliente.
//
//  SEM INTERNET: o SDK do Mercado Pago é trocado por um FALSO (injetado
//  no cache do require antes de carregar o server.js), o Telegram usa um
//  fetch falso (globalThis.fetch) e o e-mail fica sem variáveis (falha
//  "configuracao_ausente" sem tentar conectar). Rodar com:
//      node backend/scripts/teste-checkout-webhook.js
// ============================================================

const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');
const { algumAvisoEntregue } = require('../notificar-pedido');

const PASTA_BACKEND = path.join(__dirname, '..');
const TOKEN_MP_FALSO = 'TEST-token-falso-mercadopago';
const TOKEN_TG_FALSO = '123456:TOKEN-FALSO-DE-TESTE';
const VARIAVEIS = [
  'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET', 'BASE_URL', 'VERCEL_ENV',
  'EMAIL_USER', 'EMAIL_APP_PASSWORD', 'EMAIL_DESTINO', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
];

// Pagamento que o SDK falso devolve; "statusPagamento"/"consultaFalha"
// mudam por cenário. Dados pessoais aqui = o que NÃO pode ir pro log.
let statusPagamento = 'approved';
let consultaFalha = false;
const pagamentoFalso = () => ({
  id: 123,
  status: statusPagamento,
  transaction_amount: 134.9,
  payment_type_id: 'bank_transfer',
  payment_method_id: 'pix',
  external_reference: 'AS-20261024-W3BH',
  payer: { first_name: 'Maria', last_name: 'Teste', email: 'maria.teste@example.com' },
  additional_info: { items: [{ title: 'Prato Decorativo Melodia da Primavera', quantity: '1', unit_price: '134.90' }] },
  metadata: { cliente_telefone: '(21) 98722-2679', cliente_cpf: '123.456.789-00', endereco_rua: 'Avenida Paulista', endereco_cidade: 'São Paulo', endereco_uf: 'SP' },
});
const DADOS_PRIVADOS = ['maria.teste@example.com', '98722', '123.456.789', 'Avenida Paulista', TOKEN_MP_FALSO, TOKEN_TG_FALSO];

// SDK falso do Mercado Pago: só o que o server.js usa. A assinatura é
// "válida" quando o header x-signature é exatamente "assinatura-valida".
const sdkFalso = {
  MercadoPagoConfig: class { constructor(opcoes) { this.opcoes = opcoes; } },
  // Os 2 erros abaixo imitam a API ecoando dado do comprador na
  // mensagem — o teste confere que essa mensagem NÃO vai pro log.
  Preference: class {
    async create() {
      const e = new Error('payer.email invalid: maria.teste@example.com');
      e.status = 400;
      throw e;
    }
  },
  Payment: class {
    async get() {
      if (consultaFalha) { const e = new Error('rede caiu ao buscar maria.teste@example.com'); e.status = 503; throw e; }
      return pagamentoFalso();
    }
  },
  WebhookSignatureValidator: {
    validate({ xSignature }) {
      if (xSignature !== 'assinatura-valida') { const e = new Error('assinatura inválida'); e.reason = 'invalid'; throw e; }
    },
  },
};

// Carrega um server.js NOVO com as variáveis do cenário (ele lê
// process.env só na hora do require) e o SDK falso no lugar do real.
function carregarServidor(env) {
  for (const k of VARIAVEIS) delete process.env[k];
  Object.assign(process.env, env);
  for (const chave of Object.keys(require.cache)) {
    if (chave.startsWith(PASTA_BACKEND) && !chave.includes('node_modules')) delete require.cache[chave];
  }
  const caminhoSdk = require.resolve('mercadopago', { paths: [PASTA_BACKEND] });
  require.cache[caminhoSdk] = { id: caminhoSdk, filename: caminhoSdk, loaded: true, exports: sdkFalso };
  return require('../server');
}

// Sobe o app numa porta livre, faz UMA requisição e derruba.
async function requisitar(app, { metodo = 'POST', caminho, corpo, headers = {} }) {
  const servidor = app.listen(0);
  await new Promise((r) => servidor.once('listening', r));
  try {
    const dados = corpo ? JSON.stringify(corpo) : '';
    return await new Promise((resolver, rejeitar) => {
      const req = http.request(
        { host: '127.0.0.1', port: servidor.address().port, method: metodo, path: caminho, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados), ...headers } },
        (res) => {
          let texto = '';
          res.on('data', (c) => (texto += c));
          res.on('end', () => resolver({ status: res.statusCode, headers: res.headers, corpo: texto ? (() => { try { return JSON.parse(texto); } catch { return texto; } })() : null }));
        }
      );
      req.on('error', rejeitar);
      req.end(dados);
    });
  } finally {
    servidor.close();
  }
}

// Captura o console (carga do server.js + requisição) pra conferir que
// nada privado vai pro log.
async function comLog(fn) {
  const linhas = [];
  const originais = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(originais)) console[k] = (...a) => linhas.push(a.map(String).join(' '));
  try {
    return { valor: await fn(), log: linhas.join('\n') };
  } finally {
    Object.assign(console, originais);
  }
}
// Carrega o server.js sem os avisos de inicialização na saída do teste
// (para os testes que só olham a RESPOSTA, não o log).
function carregarQuieto(env) {
  const originais = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(originais)) console[k] = () => {};
  try {
    return carregarServidor(env);
  } finally {
    Object.assign(console, originais);
  }
}
const semDadoPrivado = (log) => DADOS_PRIVADOS.forEach((d) => assert.ok(!log.includes(d), `log não pode conter "${d}"`));

const PEDIDO = {
  cliente: { nome: 'Maria Teste', email: 'maria.teste@example.com', telefone: '21987222679', cpf: '12345678900' },
  endereco: { cep: '01310100', rua: 'Avenida Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
  itens: [{ id: 1, quantidade: 1 }],
};
const WEBHOOK = '/api/webhook/mercadopago?type=payment&data.id=123';
const PRODUCAO_WEBHOOK = { MERCADOPAGO_ACCESS_TOKEN: TOKEN_MP_FALSO, MERCADOPAGO_WEBHOOK_SECRET: 'segredo-falso', BASE_URL: 'https://loja.exemplo.com.br' };
const ASSINADO = { 'x-signature': 'assinatura-valida', 'x-request-id': 'req-1' };

// fetch falso do Telegram (o pedido-telegram.js usa globalThis.fetch por padrão)
const fetchOriginal = globalThis.fetch;
const telegramResponde = (ok) => { globalThis.fetch = async () => ({ ok, status: ok ? 200 : 500 }); };

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('algumAvisoEntregue: só "ok" conta como aviso entregue', () => {
  assert.equal(algumAvisoEntregue({ email: { status: 'ok' }, telegram: { status: 'falhou' } }), true);
  assert.equal(algumAvisoEntregue({ email: { status: 'falhou' }, telegram: { status: 'ok' } }), true);
  assert.equal(algumAvisoEntregue({ email: { status: 'falhou' }, telegram: { status: 'ignorado' } }), false);
  assert.equal(algumAvisoEntregue({ email: { status: 'ignorado' }, telegram: { status: 'ignorado' } }), false);
  assert.equal(algumAvisoEntregue(undefined), false);
});

teste('checkout em produção (BASE_URL pública) sem token: 503, sem link de demonstração', async () => {
  const { valor, log } = await comLog(async () => requisitar(carregarServidor({ BASE_URL: 'https://loja.exemplo.com.br' }), { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 503);
  assert.equal(valor.corpo.codigo, 'pagamento_indisponivel');
  assert.match(valor.corpo.erro, /WhatsApp/);
  assert.ok(!JSON.stringify(valor.corpo).includes('pedido-pendente'), 'não pode devolver o link de demonstração');
  semDadoPrivado(log);
});

teste('checkout na Vercel em produção sem BASE_URL (cai no padrão localhost) sem token: 503', async () => {
  const { valor } = await comLog(async () => requisitar(carregarServidor({ VERCEL_ENV: 'production' }), { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 503);
  assert.equal(valor.corpo.codigo, 'pagamento_indisponivel');
});

teste('checkout em deploy de PREVIEW da Vercel (URL pública) sem token: 503', async () => {
  const { valor } = await comLog(async () => requisitar(carregarServidor({ VERCEL_ENV: 'preview' }), { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 503);
});

teste('webhook na Vercel em produção sem BASE_URL e sem segredo: 401 (nunca modo permissivo)', async () => {
  const { valor, log } = await comLog(async () =>
    requisitar(carregarServidor({ VERCEL_ENV: 'production', MERCADOPAGO_ACCESS_TOKEN: TOKEN_MP_FALSO }), { caminho: WEBHOOK })
  );
  assert.equal(valor.status, 401);
  assert.ok(!log.includes('modo permissivo'), 'não pode aceitar notificação sem assinatura');
});

teste('webhook: id/type forjados com quebra de linha não entram crus no log', async () => {
  const { log } = await comLog(async () =>
    requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: '/api/webhook/mercadopago?type=payment%0AFALSO&data.id=1%0A%E2%9C%85%20pago', headers: ASSINADO })
  );
  // req.url (log de cada requisição) continua com o texto CODIFICADO
  // (%0A) — inofensivo; o que não pode é surgir uma linha nova forjada
  assert.ok(!log.split('\n').some((l) => l.startsWith('FALSO') || l.startsWith('✅ pago')), 'nenhuma linha de log forjada');
  assert.ok(log.includes('type=(inválido ou vazio) id=(inválido ou vazio)'), 'valores estranhos viram "(inválido ou vazio)"');
});

teste('CORS em produção: só a origem do BASE_URL; outro site não é liberado', async () => {
  const app = carregarQuieto({ MERCADOPAGO_ACCESS_TOKEN: TOKEN_MP_FALSO, BASE_URL: 'https://loja.exemplo.com.br' });
  const preflight = (origem) =>
    requisitar(app, { metodo: 'OPTIONS', caminho: '/api/checkout', headers: { Origin: origem, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  const doSite = await preflight('https://loja.exemplo.com.br');
  const deFora = await preflight('https://site-malicioso.example');
  assert.equal(doSite.headers['access-control-allow-origin'], 'https://loja.exemplo.com.br');
  assert.notEqual(deFora.headers['access-control-allow-origin'], 'https://site-malicioso.example');
  assert.notEqual(deFora.headers['access-control-allow-origin'], '*');
});

teste('CORS em localhost: aberto (front em outra porta no desenvolvimento)', async () => {
  const app = carregarQuieto({ BASE_URL: 'http://localhost:8765' });
  const r = await requisitar(app, { metodo: 'OPTIONS', caminho: '/api/checkout', headers: { Origin: 'http://127.0.0.1:5500', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(r.headers['access-control-allow-origin'], 'http://127.0.0.1:5500');
});

teste('checkout em localhost sem token: modo demonstração continua (link pedido-pendente)', async () => {
  const { valor } = await comLog(async () => requisitar(carregarServidor({ BASE_URL: 'http://localhost:8765' }), { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 200);
  assert.match(valor.corpo.checkout_url, /^http:\/\/localhost:8765\/pedido-pendente\.html\?order_id=/);
  assert.equal(valor.corpo.total, 134.9, 'total recalculado no servidor');
});

teste('checkout: cerâmica sempre 1 un. (1.5, 1e400, 5 e id repetido não multiplicam o total)', async () => {
  const app = carregarQuieto({ BASE_URL: 'http://localhost:8765' });
  const corpo = { ...PEDIDO, itens: [{ id: 1, quantidade: 5 }, { id: '1', quantidade: 1.5 }, { id: 2, quantidade: 1e400 }, { id: 2, quantidade: -3 }] };
  const { valor } = await comLog(async () => requisitar(app, { caminho: '/api/checkout', corpo }));
  const { produtos } = require('../data/produtos');
  const esperado = Math.round((produtos.find((p) => p.id === 1).preco + produtos.find((p) => p.id === 2).preco) * 100) / 100;
  assert.equal(valor.status, 200);
  assert.equal(valor.corpo.total, esperado, '1 de cada peça');
});

teste('checkout: peça vendida (disponivel:false) é recusada com o nome dela', async () => {
  const app = carregarQuieto({ BASE_URL: 'http://localhost:8765' });
  // o server.js usa a MESMA lista (cache do require): marcar aqui vale lá
  const peca = require('../data/produtos').produtos.find((p) => p.id === 2);
  peca.disponivel = false;
  try {
    const { valor } = await comLog(async () => requisitar(app, { caminho: '/api/checkout', corpo: { ...PEDIDO, itens: [{ id: 1, quantidade: 1 }, { id: 2, quantidade: 1 }] } }));
    assert.equal(valor.status, 400);
    assert.ok(valor.corpo.erro.includes(peca.nome) && /vendida/.test(valor.corpo.erro));
  } finally {
    delete peca.disponivel;
  }
});

teste('checkout: mais de 50 linhas no carrinho -> 400', async () => {
  const app = carregarQuieto({ BASE_URL: 'http://localhost:8765' });
  const { valor } = await comLog(async () => requisitar(app, { caminho: '/api/checkout', corpo: { ...PEDIDO, itens: Array.from({ length: 51 }, () => ({ id: 1, quantidade: 1 })) } }));
  assert.equal(valor.status, 400);
});

teste('webhook: aprovado e NENHUM canal entregou (e-mail sem config, Telegram sem config) -> 503', async () => {
  statusPagamento = 'approved';
  const { valor, log } = await comLog(async () => requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: WEBHOOK, headers: ASSINADO }));
  assert.equal(valor.status, 503);
  assert.ok(log.includes('nenhum aviso entregue'), 'log explica o 503');
  semDadoPrivado(log);
});

teste('webhook: aprovado e Telegram falhou (HTTP 500) + e-mail sem config -> 503', async () => {
  telegramResponde(false);
  const { valor, log } = await comLog(async () =>
    requisitar(carregarServidor({ ...PRODUCAO_WEBHOOK, TELEGRAM_BOT_TOKEN: TOKEN_TG_FALSO, TELEGRAM_CHAT_ID: '-100123' }), { caminho: WEBHOOK, headers: ASSINADO })
  );
  assert.equal(valor.status, 503);
  semDadoPrivado(log);
});

teste('webhook: aprovado e Telegram entregou (e-mail falhou) -> 200, sem reenvio', async () => {
  telegramResponde(true);
  const { valor, log } = await comLog(async () =>
    requisitar(carregarServidor({ ...PRODUCAO_WEBHOOK, TELEGRAM_BOT_TOKEN: TOKEN_TG_FALSO, TELEGRAM_CHAT_ID: '-100123' }), { caminho: WEBHOOK, headers: ASSINADO })
  );
  assert.equal(valor.status, 200);
  semDadoPrivado(log);
});

teste('webhook: assinatura inválida -> 401 (sem consultar nem avisar)', async () => {
  const { valor } = await comLog(async () => requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: WEBHOOK, headers: { 'x-signature': 'forjada', 'x-request-id': 'x' } }));
  assert.equal(valor.status, 401);
});

teste('webhook: evento que não é pagamento -> 200', async () => {
  const { valor } = await comLog(async () => requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: '/api/webhook/mercadopago?type=merchant_order&data.id=9', headers: ASSINADO }));
  assert.equal(valor.status, 200);
});

teste('webhook: pagamento não aprovado (pending) -> 200, sem aviso', async () => {
  statusPagamento = 'pending';
  const { valor, log } = await comLog(async () => requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: WEBHOOK, headers: ASSINADO }));
  statusPagamento = 'approved';
  assert.equal(valor.status, 200);
  assert.ok(!log.includes('Aviso por'), 'nenhum canal acionado');
});

teste('webhook: falha ao consultar o pagamento -> 500 (como antes)', async () => {
  consultaFalha = true;
  const { valor, log } = await comLog(async () => requisitar(carregarServidor(PRODUCAO_WEBHOOK), { caminho: WEBHOOK, headers: ASSINADO }));
  consultaFalha = false;
  assert.equal(valor.status, 500);
  assert.ok(log.includes('http_503'), 'log traz só tipo + status');
  semDadoPrivado(log);
});

teste('checkout: falha ao criar a Preference -> 502 e log sem o e-mail que a API ecoou', async () => {
  const { valor, log } = await comLog(async () =>
    requisitar(carregarServidor({ MERCADOPAGO_ACCESS_TOKEN: TOKEN_MP_FALSO, BASE_URL: 'https://loja.exemplo.com.br' }), { caminho: '/api/checkout', corpo: PEDIDO })
  );
  assert.equal(valor.status, 502);
  assert.ok(log.includes('Error http_400'), 'log traz só tipo + status');
  semDadoPrivado(log);
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
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  }
  for (const k of VARIAVEIS) delete process.env[k];
  console.log(falhas ? `\n${falhas} teste(s) falharam.` : `\nOs ${testes.length} testes passaram — nenhuma chamada de rede foi feita.`);
  process.exitCode = falhas ? 1 : 0;
})();
