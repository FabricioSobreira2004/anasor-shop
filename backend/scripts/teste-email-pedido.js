// ============================================================
//  TESTE LOCAL — e-mail de aviso de pedido (sem enviar de verdade)
// ============================================================
//
//  O QUE ISTO FAZ
//  ---------------------------------------------------------
//  Simula uma notificação de PAGAMENTO APROVADO do Mercado Pago —
//  sem gerar nenhum pagamento real, sem chamar a API do Mercado Pago,
//  sem mandar e-mail nenhum de verdade — só pra validar que
//  extrairDadosPedido() + montarEmailPedido() (pedido-email.js)
//  produzem um e-mail bem formado a partir de dados de pagamento
//  realistas, e que enviarEmailPedido() consegue de fato entregar a
//  mensagem pro transporte do nodemailer sem erro de formato.
//
//  "jsonTransport": modo especial do nodemailer que NÃO manda nada
//  pela rede — só valida/serializa a mensagem e devolve o resultado
//  como JSON. É a forma oficial da própria lib de testar sem precisar
//  de credenciais SMTP nem risco de mandar e-mail de teste pra
//  ninguém.
//
//  NÃO é uma rota Express — não fica exposto em produção (não tem
//  app.get/app.post nenhum aqui, só funções chamadas direto). Rodar
//  com:
//      node backend/scripts/teste-email-pedido.js
// ============================================================

const nodemailer = require('nodemailer');
const { extrairDadosPedido, montarEmailPedido, enviarEmailPedido } = require('../pedido-email');

function titulo(texto) {
  console.log(`\n${'='.repeat(60)}\n${texto}\n${'='.repeat(60)}`);
}

// ---------- CENÁRIO 1: pagamento "completo" ----------
// additional_info.items presente (o caminho preferido em
// extrairDadosPedido), metadata com as chaves em MAIÚSCULO de
// propósito — testa normalizarMetadata() (o Mercado Pago não garante
// devolver as chaves exatamente como foram mandadas; ver o comentário
// grande em pedido-email.js).
const pagamentoCompleto = {
  id: 123456789,
  status: 'approved',
  date_approved: '2026-10-20T14:32:10.000-03:00',
  date_created: '2026-10-20T14:30:00.000-03:00',
  transaction_amount: 269.8,
  payment_type_id: 'bank_transfer',
  payment_method_id: 'pix',
  external_reference: 'AS-20261020-7F3K',
  payer: {
    first_name: 'Maria',
    last_name: 'Teste da Silva',
    email: 'maria.teste@example.com',
    phone: { area_code: '21', number: '987222679' },
    identification: { type: 'CPF', number: '12345678900' },
  },
  additional_info: {
    items: [
      { title: 'Prato Decorativo Melodia da Primavera', quantity: '2', unit_price: '134.90' },
      { title: 'Vaso Escultórico Silhueta e Poesia', quantity: '1', unit_price: '0.00' }, // preço zerado de propósito, testa formatarReal com 0
    ],
  },
  metadata: {
    // chaves em MAIÚSCULO/mistas de propósito — simula a conversão
    // que o Mercado Pago pode aplicar (ver comentário em
    // normalizarMetadata, pedido-email.js)
    PEDIDO_ID: 'AS-20261020-7F3K',
    Cliente_Telefone: '(21) 98722-2679',
    CLIENTE_CPF: '123.456.789-00',
    endereco_cep: '01310-100',
    endereco_rua: 'Avenida Paulista',
    endereco_numero: '1000',
    endereco_complemento: 'Apto 101',
    endereco_bairro: 'Bela Vista',
    endereco_cidade: 'São Paulo',
    endereco_uf: 'SP',
    itens_resumo: '2x Prato Decorativo Melodia da Primavera (R$ 134,90 cada); 1x Vaso Escultórico Silhueta e Poesia (R$ 134,90 cada)',
    subtotal: '269.80',
    total: '269.80',
  },
};

// ---------- CENÁRIO 2: pagamento "mínimo" ----------
// SEM additional_info.items (testa o fallback pro "itens_resumo" do
// metadata) e SEM payer.first_name/last_name (testa o "(não informado
// pelo Mercado Pago)" no nome) — o tipo de payment mais pobre em dados
// que ainda assim precisa virar um e-mail útil.
const pagamentoMinimo = {
  id: 987654321,
  status: 'approved',
  date_approved: '2026-10-20T10:00:00.000-03:00',
  transaction_amount: 109.9,
  payment_type_id: 'ticket',
  payment_method_id: 'bolbradesco',
  external_reference: 'AS-20261020-Z9Q2',
  payer: { email: 'joao@example.com' }, // sem nome, sem telefone, sem CPF
  additional_info: {}, // sem "items" nenhum
  metadata: {
    pedido_id: 'AS-20261020-Z9Q2',
    cliente_telefone: '',
    cliente_cpf: '',
    endereco_cep: '20040-002',
    endereco_rua: 'Avenida Rio Branco',
    endereco_numero: '1',
    endereco_complemento: '',
    endereco_bairro: 'Centro',
    endereco_cidade: 'Rio de Janeiro',
    endereco_uf: 'RJ',
    itens_resumo: '1x Caneca Artística Surpresa Cachorrinho (R$ 109,90 cada)',
    subtotal: '109.90',
    total: '109.90',
  },
};

async function testarCenario(nome, pagamento) {
  titulo(`CENÁRIO: ${nome}`);

  const dadosPedido = extrairDadosPedido(pagamento);
  console.log('--- dadosPedido extraído ---');
  console.log(JSON.stringify(dadosPedido, null, 2));

  const { assunto, texto, html } = montarEmailPedido(dadosPedido);
  console.log('\n--- ASSUNTO ---');
  console.log(assunto);
  console.log('\n--- TEXTO (preview) ---');
  console.log(texto);
  console.log('\n--- HTML (primeiros 300 caracteres) ---');
  console.log(html.slice(0, 300) + '...');

  // jsonTransport: nodemailer MONTA a mensagem de verdade (MIME,
  // headers, boundary de multipart) mas não manda nada pela rede —
  // devolve o resultado como JSON. Se montarEmailPedido() produzisse
  // algo que o nodemailer não aceita (ex.: um campo com tipo errado),
  // esta chamada teria lançado erro.
  const transportadorTeste = nodemailer.createTransport({ jsonTransport: true });
  const resultado = await enviarEmailPedido(dadosPedido, {
    transportador: transportadorTeste,
    destino: 'contatoatelieanasor@gmail.com',
    remetente: 'teste@anasor-shop.local',
  });

  console.log('\n--- resultado do nodemailer (jsonTransport — nada foi enviado de verdade) ---');
  console.log({
    messageId: resultado.messageId,
    envelope: resultado.envelope,
    // "message" é o JSON serializado da mensagem inteira (MIME) — só
    // mostro o tamanho pra não poluir o terminal com um blob gigante.
    tamanhoMensagemSerializada: resultado.message ? resultado.message.length : 0,
  });

  return { dadosPedido, assunto };
}

(async () => {
  const resultados = [];
  resultados.push(await testarCenario('pagamento completo (Pix, items + metadata maiúsculo)', pagamentoCompleto));
  resultados.push(await testarCenario('pagamento mínimo (boleto, sem items, sem nome do payer)', pagamentoMinimo));

  titulo('RESUMO');
  resultados.forEach(({ assunto }) => console.log('✅', assunto));
  console.log('\nOs 2 cenários rodaram sem lançar erro — formato do e-mail validado.');
})().catch((erro) => {
  console.error('❌ Teste falhou:', erro);
  process.exitCode = 1;
});
