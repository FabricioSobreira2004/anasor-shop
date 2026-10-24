// ============================================================
//  TESTE LOCAL — aviso de pedido pelo Telegram (sem internet)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Valida pedido-telegram.js e notificar-pedido.js SEM chamar a API do
//  Telegram nem mandar e-mail: o "fetch" é falso (uma função nossa que
//  finge ser a Bot API — responde ok, erro, trava...) e o e-mail usa o
//  jsonTransport do nodemailer (monta a mensagem, não envia). Cobre:
//   1. formato da mensagem e o que NÃO pode ir nela (privacidade);
//   2. texto do cliente não consegue quebrar linha nem formatar;
//   3. sem TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID: ignora em silêncio;
//   4. erros HTTP, de rede e timeout — sem o token na mensagem;
//   5. falha/travamento de UM canal não impede o outro, e nada disso
//      vira exceção nem vaza dado pessoal/token no log.
//
//  Mesmo esquema de backend/scripts/teste-email-pedido.js: não é rota
//  Express, não fica exposto em produção. Rodar com:
//      node backend/scripts/teste-telegram-pedido.js
// ============================================================

const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { extrairDadosPedido, enviarEmailPedido } = require('../pedido-email');
const { montarMensagemTelegram, enviarTelegramPedido } = require('../pedido-telegram');
const { notificarPedidoAprovado, TIMEOUTS_PADRAO } = require('../notificar-pedido');

// Token/chat FALSOS: só servem pra conferir que o token vai na URL e
// que NUNCA aparece em erro nem log.
const TOKEN_FALSO = '123456:TOKEN-FALSO-DE-TESTE';
const CHAT_FALSO = '-1001234567890';

// Pagamento aprovado realista (mesmo formato do Payment.get() do SDK).
// Os dados pessoais abaixo são justamente o que o teste confere que
// NÃO vai pro Telegram.
const pagamento = {
  id: 555,
  status: 'approved',
  transaction_amount: 10,
  payment_type_id: 'bank_transfer',
  payment_method_id: 'pix',
  external_reference: 'AS-20261024-T3ST',
  payer: { first_name: 'Maria', last_name: 'Teste', email: 'maria.teste@example.com' },
  additional_info: { items: [{ title: 'Peça de Teste — não comprar', quantity: '1', unit_price: '10.00' }] },
  metadata: {
    cliente_telefone: '(21) 98722-2679',
    cliente_cpf: '123.456.789-00',
    endereco_cep: '01310-100',
    endereco_rua: 'Avenida Paulista',
    endereco_numero: '1000',
    endereco_bairro: 'Bela Vista',
    endereco_cidade: 'São Paulo',
    endereco_uf: 'SP',
  },
};
const dados = extrairDadosPedido(pagamento);
const DADOS_PRIVADOS = ['maria.teste@example.com', '98722', '123.456.789', 'Avenida Paulista', '1000', '01310', 'Bela Vista'];

// fetch falso que só registra a chamada e responde como a Bot API.
function fetchFalso(resposta = { ok: true, status: 200 }) {
  const chamadas = [];
  const fn = async (url, opcoes) => {
    chamadas.push({ url, opcoes, corpo: JSON.parse(opcoes.body) });
    return resposta;
  };
  fn.chamadas = chamadas;
  return fn;
}

// Captura tudo que vai pro console durante "fn" — pra provar que o log
// não traz token nem dado pessoal.
async function capturarLog(fn) {
  const linhas = [];
  const originais = { log: console.log, error: console.error, warn: console.warn };
  for (const k of Object.keys(originais)) console[k] = (...a) => linhas.push(a.join(' '));
  try {
    return { valor: await fn(), log: linhas.join('\n') };
  } finally {
    Object.assign(console, originais);
  }
}

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('mensagem no formato pedido, sem dados privados', () => {
  const texto = montarMensagemTelegram(dados);
  console.log('   mensagem: ' + texto);
  assert.equal(
    texto,
    '🤎 Nova venda paga! Pedido AS-20261024-T3ST · Peça de Teste — não comprar · Total R$ 10,00 · São Paulo/SP. ' +
      'Endereço completo e dados do cliente no e-mail.'
  );
  for (const privado of DADOS_PRIVADOS) assert.ok(!texto.includes(privado), `não pode conter "${privado}"`);
});

teste('texto do cliente não quebra linha (injeção de linhas falsas)', () => {
  const malicioso = { ...dados, endereco: { ...dados.endereco, cidade: 'Rio\nTotal R$ 0,00\r\n*negrito*', estado: 'rj' } };
  const texto = montarMensagemTelegram(malicioso);
  assert.ok(!/[\r\n]/.test(texto), 'sem quebra de linha');
  assert.ok(texto.includes('Rio Total R$ 0,00 *negrito*/RJ'), 'vira uma linha só, literal');
});

teste('emoji no limite do corte não vira meio caractere', () => {
  const texto = montarMensagemTelegram({ ...dados, endereco: { cidade: 'a'.repeat(59) + '🏺🏺', estado: 'SP' } });
  assert.ok(texto.isWellFormed(), 'sem surrogate solto');
  assert.ok(texto.includes('a'.repeat(59) + '🏺/SP'));
});

teste('timeouts separados: e-mail mais longo que o Telegram', () => {
  assert.ok(TIMEOUTS_PADRAO.email > TIMEOUTS_PADRAO.telegram);
});

teste('sem itens estruturados, usa o resumo do metadata', () => {
  const texto = montarMensagemTelegram({ ...dados, itens: null, itensResumoTexto: '1x Caneca (R$ 109,90 cada)' });
  assert.ok(texto.includes('· 1x Caneca (R$ 109,90 cada) ·'));
});

teste('sem variáveis: ignora em silêncio e não chama a rede', async () => {
  const fetch = fetchFalso();
  assert.deepEqual(await enviarTelegramPedido(dados, { fetch, token: '', chatId: '' }), { ignorado: true });
  assert.deepEqual(await enviarTelegramPedido(dados, { fetch, token: TOKEN_FALSO, chatId: undefined }), { ignorado: true });
  assert.equal(fetch.chamadas.length, 0);
});

teste('envio ok: POST na Bot API, texto puro (sem parse_mode)', async () => {
  const fetch = fetchFalso();
  assert.deepEqual(await enviarTelegramPedido(dados, { fetch, token: TOKEN_FALSO, chatId: CHAT_FALSO }), { enviado: true });
  const [chamada] = fetch.chamadas;
  assert.equal(chamada.url, `https://api.telegram.org/bot${TOKEN_FALSO}/sendMessage`);
  assert.equal(chamada.opcoes.method, 'POST');
  assert.equal(chamada.corpo.chat_id, CHAT_FALSO);
  assert.equal(chamada.corpo.text, montarMensagemTelegram(dados));
  assert.ok(!('parse_mode' in chamada.corpo), 'sem parse_mode');
});

teste('erro HTTP (token errado): tipo http_401, sem o token na mensagem', async () => {
  const fetch = fetchFalso({ ok: false, status: 401 });
  await assert.rejects(enviarTelegramPedido(dados, { fetch, token: TOKEN_FALSO, chatId: CHAT_FALSO }), (erro) => {
    assert.equal(erro.tipo, 'http_401');
    assert.ok(!erro.message.includes(TOKEN_FALSO));
    return true;
  });
});

teste('erro de rede que repete a URL: vira "rede", token some', async () => {
  const fetch = async (url) => {
    throw new Error(`connect ECONNREFUSED ${url}`);
  };
  await assert.rejects(enviarTelegramPedido(dados, { fetch, token: TOKEN_FALSO, chatId: CHAT_FALSO }), (erro) => {
    assert.equal(erro.tipo, 'rede');
    assert.ok(!erro.message.includes(TOKEN_FALSO) && !String(erro.stack).includes(TOKEN_FALSO));
    return true;
  });
});

teste('timeout: fetch que trava (e ignora o abort) estoura no prazo', async () => {
  const travado = () => new Promise(() => {});
  const inicio = Date.now();
  await assert.rejects(
    enviarTelegramPedido(dados, { fetch: travado, token: TOKEN_FALSO, chatId: CHAT_FALSO, timeoutMs: 100 }),
    (erro) => erro.tipo === 'timeout'
  );
  const ms = Date.now() - inicio;
  assert.ok(ms >= 90 && ms < 1000, `estourou em ${ms} ms`);
});

// E-mail de verdade até o nodemailer, mas sem rede (jsonTransport).
const emailOk = (d) =>
  enviarEmailPedido(d, { transportador: nodemailer.createTransport({ jsonTransport: true }), destino: 'teste@exemplo.com' });
const telegramOk = (d) => enviarTelegramPedido(d, { fetch: fetchFalso(), token: TOKEN_FALSO, chatId: CHAT_FALSO });

teste('os dois canais ok', async () => {
  const { valor } = await capturarLog(() => notificarPedidoAprovado(dados, { enviarEmail: emailOk, enviarTelegram: telegramOk }));
  assert.deepEqual(valor, { email: { status: 'ok' }, telegram: { status: 'ok' } });
});

teste('e-mail falha (SMTP com e-mail do cliente na mensagem): Telegram sai igual, log só com o tipo', async () => {
  const emailQuebrado = async () => {
    const erro = new Error('Invalid login for maria.teste@example.com');
    erro.code = 'EAUTH';
    throw erro;
  };
  const { valor, log } = await capturarLog(() =>
    notificarPedidoAprovado(dados, { enviarEmail: emailQuebrado, enviarTelegram: telegramOk })
  );
  assert.deepEqual(valor, { email: { status: 'falhou', tipo: 'EAUTH' }, telegram: { status: 'ok' } });
  for (const privado of [...DADOS_PRIVADOS, TOKEN_FALSO]) assert.ok(!log.includes(privado), `log vazou "${privado}"`);
});

teste('e-mail sem configuração (erro síncrono): Telegram sai igual', async () => {
  const semConfig = () => {
    const erro = new Error('sem config');
    erro.configuracaoAusente = true;
    throw erro; // lança ANTES de devolver promessa, de propósito
  };
  const { valor } = await capturarLog(() => notificarPedidoAprovado(dados, { enviarEmail: semConfig, enviarTelegram: telegramOk }));
  assert.deepEqual(valor, { email: { status: 'falhou', tipo: 'configuracao_ausente' }, telegram: { status: 'ok' } });
});

teste('Telegram travado + e-mail ok: e-mail sai, tudo termina no prazo', async () => {
  const travado = () => new Promise(() => {});
  const inicio = Date.now();
  const { valor, log } = await capturarLog(() =>
    notificarPedidoAprovado(dados, { enviarEmail: emailOk, enviarTelegram: travado, timeouts: { email: 150, telegram: 150 } })
  );
  assert.deepEqual(valor, { email: { status: 'ok' }, telegram: { status: 'falhou', tipo: 'timeout' } });
  assert.ok(Date.now() - inicio < 1000);
  assert.ok(!log.includes(TOKEN_FALSO));
});

teste('e-mail travado + Telegram com erro 400: nenhum lança, os dois registrados', async () => {
  const travado = () => new Promise(() => {});
  const telegram400 = (d) =>
    enviarTelegramPedido(d, { fetch: fetchFalso({ ok: false, status: 400 }), token: TOKEN_FALSO, chatId: CHAT_FALSO });
  const { valor, log } = await capturarLog(() =>
    notificarPedidoAprovado(dados, { enviarEmail: travado, enviarTelegram: telegram400, timeouts: { email: 150, telegram: 150 } })
  );
  assert.deepEqual(valor, { email: { status: 'falhou', tipo: 'timeout' }, telegram: { status: 'falhou', tipo: 'http_400' } });
  assert.ok(log.includes('SEM aviso entregue'), 'alerta quando nenhum canal funcionou');
});

teste('Telegram sem variáveis: e-mail sai e o Telegram fica "ignorado"', async () => {
  const semVars = (d) => enviarTelegramPedido(d, { fetch: fetchFalso(), token: '', chatId: '' });
  const { valor } = await capturarLog(() => notificarPedidoAprovado(dados, { enviarEmail: emailOk, enviarTelegram: semVars }));
  assert.deepEqual(valor, { email: { status: 'ok' }, telegram: { status: 'ignorado' } });
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
  console.log(falhas ? `\n${falhas} teste(s) falharam.` : `\nOs ${testes.length} testes passaram — nada foi enviado de verdade.`);
  process.exitCode = falhas ? 1 : 0;
})();
