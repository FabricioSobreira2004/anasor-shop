// ============================================================
//  TESTE LOCAL — e-mail de aviso de pedido (sem enviar de verdade)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Simula notificações de PAGAMENTO APROVADO do Mercado Pago — sem
//  gerar nenhum pagamento real, sem chamar a API do Mercado Pago, sem
//  mandar e-mail nenhum de verdade — e CONFERE (assert) que
//  extrairDadosPedido() + montarEmailPedido() (pedido-email.js) montam
//  o bloco "DADOS PARA NOTA FISCAL" certo em cada situação:
//   1. metadata completo (o caso normal desde que o checkout manda tudo);
//   2. payer MASCARADO pelo Mercado Pago ("XXXXXXXXXXX", comprador
//      visitante) com o metadata presente — vale o metadata;
//   3. metadata ausente (Preference antiga) com o payer presente — o
//      payer entra como reserva;
//   4. dado que falta nas duas fontes vira "NÃO INFORMADO" em destaque;
//   5. texto do cliente com HTML é escapado no corpo HTML;
//   6. Reply-To = e-mail do cliente (só quando é um e-mail de verdade).
//  No fim imprime o e-mail de exemplo inteiro — TODOS os dados aqui são
//  FICTÍCIOS (o CPF é gerado, com dígitos verificadores válidos, e não
//  pertence a ninguém).
//
//  "jsonTransport": modo especial do nodemailer que NÃO manda nada
//  pela rede — só valida/serializa a mensagem e devolve o resultado
//  como JSON. Rodar com:
//      node backend/scripts/teste-email-pedido.js
// ============================================================

const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { extrairDadosPedido, montarEmailPedido, enviarEmailPedido } = require('../pedido-email');

// Pagamento aprovado realista (mesmo formato do Payment.get() do SDK),
// com o metadata que o /api/checkout manda desde a mudança da nota
// fiscal (cliente_nome/cliente_email inclusos). Chaves com maiúsculas
// de propósito em algumas — o Mercado Pago pode mudar a caixa delas
// (ver normalizarMetadata em pedido-email.js).
const base = () => ({
  id: 123456789,
  status: 'approved',
  date_approved: '2026-10-20T14:32:10.000-03:00',
  transaction_amount: 269.8,
  installments: 3,
  transaction_details: { installment_amount: 89.93, net_received_amount: 255.79 },
  fee_details: [{ type: 'mercadopago_fee', amount: 14.01 }],
  payment_type_id: 'credit_card',
  payment_method_id: 'visa',
  external_reference: 'AS-20261020-7F3K',
  payer: {
    first_name: 'Joana',
    last_name: 'Exemplo',
    email: 'joana.exemplo@example.com',
    phone: { area_code: '11', number: '912345678' },
    identification: { type: 'CPF', number: '11144477735' },
  },
  additional_info: {
    items: [
      { title: 'Prato Decorativo Melodia da Primavera', quantity: '1', unit_price: '134.90' },
      { title: 'Prato Decorativo Jardim de Outono', quantity: '1', unit_price: '134.90' },
    ],
  },
  metadata: {
    PEDIDO_ID: 'AS-20261020-7F3K',
    Cliente_Nome: 'Maria Fictícia da Silva',
    cliente_email: 'maria.ficticia@example.com',
    CLIENTE_TELEFONE: '21987654321',
    cliente_cpf: '52998224725',
    endereco_cep: '01310100',
    endereco_rua: 'Avenida Exemplo',
    endereco_numero: '1000',
    endereco_complemento: 'Apto 101',
    endereco_bairro: 'Bairro Fictício',
    endereco_cidade: 'São Paulo',
    endereco_uf: 'SP',
    itens_resumo: '1x Prato Decorativo Melodia da Primavera (R$ 134,90 cada); 1x Prato Decorativo Jardim de Outono (R$ 134,90 cada)',
    total: '269.80',
  },
});

const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });
// toLocaleString põe espaço NÃO separável ( ) entre "R$" e o valor
// — normaliza pra espaço comum só pra comparar texto aqui.
const semNbsp = (s) => s.replace(/ /g, ' ');
const email = (pagamento) => {
  const { assunto, texto, html } = montarEmailPedido(extrairDadosPedido(pagamento));
  return { assunto: semNbsp(assunto), texto: semNbsp(texto), html: semNbsp(html) };
};

teste('metadata completo: bloco DADOS PARA NOTA FISCAL com tudo formatado', () => {
  const { texto, html, assunto } = email(base());
  assert.equal(assunto, 'Novo pedido pago AS-20261020-7F3K — R$ 269,80');
  for (const trecho of [
    'DADOS PARA NOTA FISCAL',
    'Pedido: AS-20261020-7F3K',
    'Aprovado em: 20/10/2026, 14:32',
    'Pagamento Mercado Pago nº: 123456789',
    'Forma de pagamento: Cartão de crédito (visa) — 3x de R$ 89,93',
    'Status: Aprovado',
    'Nome completo: Maria Fictícia da Silva',
    'CPF: 529.982.247-25',
    'E-mail: maria.ficticia@example.com',
    'Telefone/WhatsApp: (21) 98765-4321',
    'Abrir WhatsApp: https://wa.me/5521987654321',
    'Rua: Avenida Exemplo',
    'Número: 1000',
    'Complemento: Apto 101',
    'Bairro: Bairro Fictício',
    'Cidade/UF: São Paulo/SP',
    'CEP: 01310-100',
    '1x Prato Decorativo Melodia da Primavera — R$ 134,90 cada — subtotal R$ 134,90',
    'Frete: Grátis',
    'TOTAL PAGO: R$ 269,80',
    'Taxa do Mercado Pago: R$ 14,01',
    'Valor líquido a receber: R$ 255,79',
    'Responda este e-mail ou chame o cliente pelo WhatsApp para combinar o envio.',
  ]) {
    assert.ok(texto.includes(trecho), `texto deveria ter: ${trecho}`);
  }
  assert.ok(!texto.includes('NÃO INFORMADO'), 'nada faltando');
  assert.ok(html.includes('DADOS PARA NOTA FISCAL') && html.includes('<a href="https://wa.me/5521987654321">Abrir WhatsApp</a>'));
  // o metadata venceu o payer em TODOS os campos do cliente
  assert.ok(!texto.includes('Joana') && !texto.includes('111.444.777-35') && !texto.includes('912345678'));
});

teste('payer MASCARADO (XXXXXXXXXXX) com metadata presente: usa o metadata, nunca o "XXX"', () => {
  const p = base();
  p.payer = { first_name: '', last_name: '', email: 'XXXXXXXXXXX', identification: { number: 'XXXXXXXXXXX' } };
  const { texto, html } = email(p);
  assert.ok(texto.includes('Nome completo: Maria Fictícia da Silva'));
  assert.ok(texto.includes('E-mail: maria.ficticia@example.com'));
  assert.ok(texto.includes('CPF: 529.982.247-25'));
  assert.ok(!texto.includes('XXXX') && !html.includes('XXXX'), 'valor mascarado não aparece');
  assert.ok(!texto.includes('não informado pelo Mercado Pago'));
});

teste('metadata AUSENTE (Preference antiga) com payer presente: o payer entra como reserva', () => {
  const p = base();
  p.metadata = { endereco_cep: '20040002', endereco_rua: 'Rua Fictícia', endereco_numero: '7', endereco_bairro: 'Centro', endereco_cidade: 'Rio de Janeiro', endereco_uf: 'RJ' };
  const { texto } = email(p);
  assert.ok(texto.includes('Nome completo: Joana Exemplo'));
  assert.ok(texto.includes('E-mail: joana.exemplo@example.com'));
  assert.ok(texto.includes('CPF: 111.444.777-35'));
  assert.ok(texto.includes('Telefone/WhatsApp: (11) 91234-5678'));
  assert.ok(texto.includes('Pedido: AS-20261020-7F3K'), 'external_reference continua sendo o código');
});

teste('dado faltando nas DUAS fontes: "NÃO INFORMADO" em destaque (texto e HTML)', () => {
  const p = base();
  p.payer = { email: 'XXXXXXXXXXX' };
  p.metadata = { endereco_rua: 'Rua Fictícia', endereco_cidade: 'Niterói', endereco_uf: 'RJ' };
  p.additional_info = {};
  const { texto, html } = email(p);
  for (const rotulo of ['Nome completo', 'CPF', 'E-mail', 'Telefone/WhatsApp', 'Número', 'Bairro', 'CEP']) {
    assert.ok(texto.includes(`${rotulo}: *** NÃO INFORMADO ***`), `${rotulo} deveria estar NÃO INFORMADO`);
  }
  assert.ok(texto.includes('Complemento: (sem complemento)'), 'complemento é opcional: não vira alerta');
  assert.ok(!texto.includes('Abrir WhatsApp'), 'sem telefone, sem link');
  assert.ok(html.includes('<strong style="color:#B3261E;">NÃO INFORMADO</strong>'));
  assert.ok(!texto.includes('XXXX') && !texto.includes('(não informado'));
});

teste('HTML do cliente é ESCAPADO no corpo HTML (nunca vira tag de verdade)', () => {
  const p = base();
  p.metadata.cliente_nome = '<img src=x onerror=alert(1)> Silva';
  p.metadata.endereco_complemento = '"><script>alert(2)</script>';
  p.additional_info.items[0].title = '<b>Peça</b> & cia';
  const { html, texto } = email(p);
  assert.ok(!/<img|<script|<b>/i.test(html), 'nenhuma tag do cliente no HTML');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; Silva'));
  assert.ok(html.includes('&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;b&gt;Peça&lt;/b&gt; &amp; cia'));
  assert.ok(texto.includes('Nome completo: <img src=x onerror=alert(1)> Silva'), 'texto simples mostra cru (não é HTML)');
});

teste('pagamento sem parcelas, sem taxa e sem itens estruturados: usa o resumo do metadata', () => {
  const p = base();
  Object.assign(p, { installments: 1, transaction_details: {}, fee_details: [], payment_type_id: 'bank_transfer', payment_method_id: 'pix', additional_info: {} });
  const { texto } = email(p);
  assert.ok(texto.includes('Forma de pagamento: Pix / Transferência (pix)\n'));
  assert.ok(!texto.includes('Taxa do Mercado Pago') && !texto.includes('Valor líquido'), 'sem valor inventado');
  assert.ok(texto.includes('1x Prato Decorativo Melodia da Primavera (R$ 134,90 cada); 1x Prato Decorativo Jardim de Outono'));
});

teste('envio (jsonTransport): Reply-To = e-mail do cliente; mascarado não vira Reply-To', async () => {
  const transportador = nodemailer.createTransport({ jsonTransport: true });
  const enviar = (p) => enviarEmailPedido(extrairDadosPedido(p), { transportador, destino: 'contatoatelieanasor@gmail.com', remetente: 'teste@anasor-shop.local' });
  const r1 = JSON.parse((await enviar(base())).message);
  assert.equal(r1.replyTo?.[0]?.address, 'maria.ficticia@example.com');
  assert.equal(r1.to[0].address, 'contatoatelieanasor@gmail.com');
  const mascarado = base();
  mascarado.metadata.cliente_email = '';
  mascarado.payer.email = 'XXXXXXXXXXX';
  const r2 = JSON.parse((await enviar(mascarado)).message);
  assert.equal(r2.replyTo, undefined);
  // e-mail "esquisito" (2 endereços numa string) não vira Reply-To
  const duplo = base();
  duplo.metadata.cliente_email = 'a@example.com, b@example.com';
  const r3 = JSON.parse((await enviar(duplo)).message);
  assert.equal(r3.replyTo, undefined);
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
  // e-mail de exemplo inteiro (dados FICTÍCIOS), pra conferir o visual
  if (process.argv.includes('--mostrar')) {
    const { assunto, texto } = email(base());
    console.log(`\n---------- EXEMPLO (dados fictícios) ----------\nAssunto: ${assunto}\n\n${texto}`);
  }
  console.log(falhas ? `\n${falhas} teste(s) falharam.` : `\nOs ${testes.length} testes passaram — nada foi enviado de verdade.`);
  process.exitCode = falhas ? 1 : 0;
})();
