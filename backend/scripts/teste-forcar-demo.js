// ============================================================
//  TESTE LOCAL — interruptor FORCAR_DEMO (sem internet)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Confere o interruptor de teste FORCAR_DEMO (ver CLAUDE.md, "testar
//  sem risco"): com FORCAR_DEMO=1, o servidor IGNORA
//  MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_PUBLIC_KEY — mesmo com um
//  token de PRODUÇÃO (prefixo "APP_USR-") presente no ambiente — e cai
//  no checkout de demonstração, sem nunca chamar a API do Mercado Pago.
//  Também confere que, em produção (VERCEL_ENV=production ou
//  NODE_ENV=production), o interruptor é IGNORADO — o site no ar nunca
//  pode "entrar em modo demo" sozinho.
//
//  Criado depois de um teste manual (Fase A) ter mostrado que
//  "$env:MERCADOPAGO_ACCESS_TOKEN=''" no PowerShell REMOVE a variável
//  em vez de deixá-la vazia — e o "--env-file-if-exists=.env" do
//  server.js carregava o backend/.env de qualquer jeito, trazendo a
//  chave REAL de volta. O FORCAR_DEMO existe pra testar sem depender
//  desse comportamento do PowerShell, sem editar nem mover o .env.
//
//  SEM INTERNET: o SDK do Mercado Pago é trocado por um FALSO (igual ao
//  teste de checkout/webhook) — se "Preference.create" for chamado em
//  algum cenário com FORCAR_DEMO=1 ativo, o teste falha, denunciando
//  que uma chamada de rede real teria acontecido. Rodar com:
//      node backend/scripts/teste-forcar-demo.js
// ============================================================

const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');

const PASTA_BACKEND = path.join(__dirname, '..');
// Token FALSO, mas com o MESMO formato do token real (prefixo
// "APP_USR-") de propósito: é o cenário que travou o teste manual na
// Fase A — o FORCAR_DEMO precisa neutralizar mesmo esse formato.
const TOKEN_PRODUCAO_FALSO = 'APP_USR-token-de-producao-falso-para-teste';
const VARIAVEIS = [
  'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'FORCAR_DEMO', 'BASE_URL', 'VERCEL_ENV', 'NODE_ENV',
];

// Flag só sobe se o SDK de verdade fosse chamado — com FORCAR_DEMO=1
// ela precisa continuar "false" em todo cenário de demonstração.
let preferenciaCriada = false;
const sdkFalso = {
  MercadoPagoConfig: class { constructor(opcoes) { this.opcoes = opcoes; } },
  Preference: class {
    async create() {
      preferenciaCriada = true;
      return { init_point: 'https://mercadopago.exemplo/checkout/falso' };
    }
  },
  Payment: class { async get() { return {}; } },
  WebhookSignatureValidator: { validate() {} },
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
        {
          host: '127.0.0.1',
          port: servidor.address().port,
          method: metodo,
          path: caminho,
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados), ...headers },
        },
        (res) => {
          let texto = '';
          res.on('data', (c) => (texto += c));
          res.on('end', () =>
            resolver({
              status: res.statusCode,
              corpo: texto ? (() => { try { return JSON.parse(texto); } catch { return texto; } })() : null,
            })
          );
        }
      );
      req.on('error', rejeitar);
      req.end(dados);
    });
  } finally {
    servidor.close();
  }
}

// Captura o console (carga do server.js + requisição) pra conferir o
// que foi avisado no log de inicialização.
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

const PEDIDO = {
  cliente: { nome: 'Maria Teste', email: 'maria.teste@example.com', telefone: '21987222679', cpf: '529.982.247-25' },
  endereco: { cep: '01310100', rua: 'Avenida Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
  itens: [{ id: 1, quantidade: 1 }],
};

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('FORCAR_DEMO=1 + token de produção: log avisa "MODO DEMONSTRAÇÃO FORÇADO"', async () => {
  const { log } = await comLog(async () =>
    carregarServidor({ FORCAR_DEMO: '1', MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'http://localhost:8765' })
  );
  assert.ok(log.includes('MODO DEMONSTRAÇÃO FORÇADO'), 'log precisa avisar claramente');
});

teste('FORCAR_DEMO=1 + token de produção: checkout cai no fluxo de demonstração, sem chamar o Mercado Pago', async () => {
  preferenciaCriada = false;
  const app = carregarServidor({ FORCAR_DEMO: '1', MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'http://localhost:8765' });
  const { valor } = await comLog(async () => requisitar(app, { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 200);
  assert.match(valor.corpo.checkout_url, /^http:\/\/localhost:8765\/pedido-pendente\.html\?order_id=/);
  assert.equal(preferenciaCriada, false, 'Preference.create nunca pode ser chamado com FORCAR_DEMO=1');
});

teste('FORCAR_DEMO=1 em VERCEL_ENV=production: interruptor ignorado, token real continua ativo', async () => {
  const { log } = await comLog(async () =>
    carregarServidor({ FORCAR_DEMO: '1', VERCEL_ENV: 'production', MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'https://loja.exemplo.com.br' })
  );
  assert.ok(log.includes('FORCAR_DEMO=1 ignorado'), 'log precisa avisar que o interruptor não vale em produção');
  assert.ok(!log.includes('MODO DEMONSTRAÇÃO FORÇADO'), 'não pode afirmar modo demo em produção');
});

teste('FORCAR_DEMO=1 com NODE_ENV=production: interruptor também ignorado', async () => {
  const { log } = await comLog(async () =>
    carregarServidor({ FORCAR_DEMO: '1', NODE_ENV: 'production', MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'https://loja.exemplo.com.br' })
  );
  assert.ok(log.includes('FORCAR_DEMO=1 ignorado'));
});

teste('FORCAR_DEMO=1 ignorado em produção: checkout cria a Preference de verdade (token continua ativo)', async () => {
  preferenciaCriada = false;
  const app = carregarServidor({ FORCAR_DEMO: '1', VERCEL_ENV: 'production', MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'https://loja.exemplo.com.br' });
  const { valor } = await comLog(async () => requisitar(app, { caminho: '/api/checkout', corpo: PEDIDO }));
  assert.equal(valor.status, 200);
  assert.equal(preferenciaCriada, true, 'em produção o token real precisa continuar valendo (interruptor não se aplica)');
});

teste('sem FORCAR_DEMO (padrão): token de produção continua configurado normalmente', async () => {
  const { log } = await comLog(async () =>
    carregarServidor({ MERCADOPAGO_ACCESS_TOKEN: TOKEN_PRODUCAO_FALSO, BASE_URL: 'http://localhost:8765' })
  );
  assert.ok(!log.includes('MODO DEMONSTRAÇÃO FORÇADO'), 'sem o interruptor, não pode entrar em modo demo');
  assert.ok(log.includes('APP_USR-'), 'aviso de credencial de produção continua aparecendo');
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
  console.log(falhas ? `\n${falhas} teste(s) falharam.` : `\nOs ${testes.length} testes passaram — nenhuma chamada de rede foi feita.`);
  process.exitCode = falhas ? 1 : 0;
})();
