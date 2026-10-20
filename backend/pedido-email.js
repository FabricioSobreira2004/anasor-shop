// ============================================================
//  NOTIFICAÇÃO DE PEDIDO POR E-MAIL — Anasor Sobreira
// ============================================================
//
//  POR QUE ESTE ARQUIVO EXISTE
//  ---------------------------------------------------------
//  A loja hoje não tem banco de dados nem painel próprio (ver TODO no
//  topo de server.js) — o único jeito confiável da Anasor saber "chegou
//  um pedido pago, e pra onde eu envio essa peça?" é o webhook do
//  Mercado Pago (POST /api/webhook/mercadopago, em server.js) avisar
//  ALGUÉM assim que um pagamento for aprovado. Esse "alguém" é este
//  módulo: monta e manda um e-mail pra ela com tudo que precisa (itens,
//  valor, forma de pagamento, dados do cliente e o endereço de entrega
//  completo), sem precisar abrir o painel do Mercado Pago e caçar o
//  metadata do pagamento.
//
//  Separado de server.js (não é só mais uma função lá dentro) porque:
//   1. é testável sozinho — montarEmailPedido() é uma função PURA
//      (recebe dados, devolve {assunto, texto, html}, não manda nada),
//      dá pra chamar num script de teste sem precisar de um pagamento
//      de verdade nem de rede (ver backend/scripts/teste-email-pedido.js).
//   2. server.js já é um arquivo grande; separar o "o que vai no
//      e-mail" de "como o webhook decide se deve mandar" deixa as duas
//      responsabilidades mais fáceis de achar/revisar cada uma.
// ============================================================

const nodemailer = require('nodemailer');

// ---------- FORMATAÇÃO ----------
// Mesma formatação "R$ 149,90" do front (formatarPreco, js/main.js) —
// reescrita aqui porque aquele arquivo é script de navegador (usa
// `window`/é carregado via <script> solto), não um módulo Node
// importável; duplicar esta função pequena é mais simples que criar
// um 3º arquivo "compartilhado" só por causa dela.
function formatarReal(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Escapa os 5 caracteres que importam pra HTML — qualquer texto que
// vem do CLIENTE (nome, endereço, telefone...) precisa passar por
// aqui antes de entrar no corpo HTML do e-mail. O corpo em TEXTO
// SIMPLES (texto puro) não precisa disso — HTML só existe na versão
// ".html" do e-mail. Sem isto, um nome como `<img src=x onerror=...>`
// preenchido de propósito no checkout viraria HTML de verdade na
// caixa de entrada da Anasor (a maioria dos clientes de e-mail barra
// isso, mas não é motivo pra não escapar — é grátis e sempre correto).
function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- LEITURA DO PAGAMENTO (Mercado Pago) ----------

// O metadata que ENVIAMOS (POST /api/checkout, server.js) já nasce em
// snake_case minúsculo (endereco_rua, cliente_cpf...), mas o Mercado
// Pago não garante devolver exatamente essas chaves do jeito que foram
// mandadas — a documentação deles avisa que o campo pode vir com as
// chaves convertidas pra minúsculo/snake_case por conta própria (e
// nested objects, se algum dia alguém mandar um, viram string JSON).
// normalizarMetadata() defende contra isso: baixa TODAS as chaves pra
// minúsculo antes de ler qualquer uma — se um dia o MP devolver
// "clienteCpf" em vez de "cliente_cpf", por exemplo, isso aqui sozinho
// não resolveria (ainda seria um nome de chave diferente), mas cobre o
// caso documentado (maiúsculo/minúsculo) sem precisar de um mapa de
// sinônimos gigante pra um campo que a gente mesmo escreveu.
function normalizarMetadata(metadataBruto) {
  const normalizado = {};
  if (metadataBruto && typeof metadataBruto === 'object') {
    for (const [chave, valor] of Object.entries(metadataBruto)) {
      normalizado[String(chave).toLowerCase()] = valor;
    }
  }
  return normalizado;
}

const NOMES_TIPO_PAGAMENTO = {
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  ticket: 'Boleto',
  bank_transfer: 'Pix / Transferência',
  account_money: 'Saldo Mercado Pago',
  digital_currency: 'Carteira digital',
  digital_wallet: 'Carteira digital',
  prepaid_card: 'Cartão pré-pago',
};

// "payment_type_id" é a CATEGORIA (ex.: "bank_transfer") — convertida
// pro nome em português; "payment_method_id" é o MEIO específico
// dentro dela (ex.: "pix", "visa", "bolbradesco") — mantido cru entre
// parênteses porque não vale a pena manter um dicionário gigante de
// todos os bancos/bandeiras que o Mercado Pago aceita, só pra
// peça o texto final tipo "Pix / Transferência (pix)".
function montarTextoFormaPagamento(tipoId, metodoId) {
  const nomeTipo = NOMES_TIPO_PAGAMENTO[tipoId] || tipoId || 'Não informado';
  return metodoId && metodoId !== tipoId ? `${nomeTipo} (${metodoId})` : nomeTipo;
}

// Recebe a resposta de Payment.get() (SDK oficial, GET /v1/payments/:id
// — ver server.js) e devolve só o que o e-mail precisa, já organizado.
// NUNCA confia em req.body do webhook pra montar isto — quem chama
// esta função (server.js) já consultou a API de verdade antes.
function extrairDadosPedido(pagamento) {
  const metadata = normalizarMetadata(pagamento.metadata);
  const payer = pagamento.payer || {};

  // NOME do cliente: não existe no NOSSO metadata (nunca mandamos
  // "nome" pra lá — só telefone/cpf/endereço, ver POST /api/checkout)
  // — vem do PRÓPRIO Mercado Pago, preenchido pela pessoa na tela do
  // Checkout Pro. Pode vir vazio dependendo da forma de pagamento.
  const nomeCliente =
    [payer.first_name, payer.last_name].filter(Boolean).join(' ').trim() || null;
  const emailCliente = payer.email || null;

  // telefone/CPF: preferimos o que a PRÓPRIA PESSOA digitou no NOSSO
  // formulário (metadata — mesmo texto que ela confirmou no checkout
  // do site) e só caímos pro que o Mercado Pago registrou (payer) se
  // o nosso vier vazio (ex.: campo opcional que ela pulou no site, mas
  // preencheu lá pro Pix exigir CPF).
  const telefoneMetadata = String(metadata.cliente_telefone || '').trim();
  const telefonePayer = payer.phone
    ? `${payer.phone.area_code || ''}${payer.phone.number || ''}`.trim()
    : '';
  const telefone = telefoneMetadata || telefonePayer;

  const cpfMetadata = String(metadata.cliente_cpf || '').trim();
  const cpfPayer = payer.identification?.number || '';
  const cpf = cpfMetadata || cpfPayer;

  const endereco = {
    cep: String(metadata.endereco_cep || '').trim(),
    rua: String(metadata.endereco_rua || '').trim(),
    numero: String(metadata.endereco_numero || '').trim(),
    complemento: String(metadata.endereco_complemento || '').trim(),
    bairro: String(metadata.endereco_bairro || '').trim(),
    cidade: String(metadata.endereco_cidade || '').trim(),
    estado: String(metadata.endereco_uf || '').trim(),
  };

  // ITENS: preferimos additional_info.items (o Mercado Pago costuma
  // ecoar os "items" que mandamos na Preference — ver POST
  // /api/checkout) por serem a fonte MAIS estruturada; se um dia isso
  // vier vazio (não é 100% garantido em toda forma de pagamento),
  // caímos pro resumo em texto que TAMBÉM mandamos no metadata
  // ("itens_resumo") como rede de segurança — nunca ficamos sem
  // NENHUMA informação de item no e-mail.
  const itensBrutos = Array.isArray(pagamento.additional_info?.items)
    ? pagamento.additional_info.items
    : [];
  const itens =
    itensBrutos.length > 0
      ? itensBrutos.map((item) => ({
          nome: item.title || item.description || 'Item',
          quantidade: Number(item.quantity) || 1,
          precoUnitario: Number(item.unit_price) || 0,
        }))
      : null;
  const itensResumoTexto = String(metadata.itens_resumo || '').trim();

  const formaPagamento = montarTextoFormaPagamento(
    pagamento.payment_type_id,
    pagamento.payment_method_id
  );

  // Number(metadata.total): valores de metadata podem voltar como
  // STRING (o Mercado Pago não garante preservar o tipo número — ver
  // comentário de normalizarMetadata, acima) — Number() de uma string
  // numérica funciona igual; só o transaction_amount do PRÓPRIO
  // pagamento (não do metadata) é a fonte preferida, por ser o valor
  // que REALMENTE foi cobrado. Number.isFinite() (não "||"), de
  // propósito — CORREÇÃO (achado do code-review): "||" trata 0 como
  // falsy, então um pedido LEGITIMAMENTE de R$0,00 (ex.: 100% de
  // cupom/desconto) cairia pro metadata.total em vez do valor real
  // cobrado; Number.isFinite(0) é true, então 0 é aceito como valor
  // válido, só caindo pro próximo da lista quando o número for
  // NaN/ausente de verdade.
  const valorTransacao = Number(pagamento.transaction_amount);
  const valorMetadata = Number(metadata.total);
  const valorTotal = Number.isFinite(valorTransacao)
    ? valorTransacao
    : Number.isFinite(valorMetadata)
    ? valorMetadata
    : 0;

  return {
    // external_reference é o NOSSO código (gerado em gerarIdPedido(),
    // server.js, formato AS-AAAAMMDD-XXXX) — pedido_id no metadata é
    // só uma 2ª cópia dele (redundância barata, caso um dia alguém
    // crie uma Preference sem passar external_reference).
    codigoPedido: pagamento.external_reference || metadata.pedido_id || `MP-${pagamento.id}`,
    pagamentoId: pagamento.id,
    dataAprovacao: pagamento.date_approved || pagamento.date_created || new Date().toISOString(),
    valorTotal,
    formaPagamento,
    cliente: { nome: nomeCliente, email: emailCliente, telefone, cpf },
    endereco,
    itens,
    itensResumoTexto,
  };
}

// ---------- MONTAGEM DO E-MAIL ----------

// Monta o link do WhatsApp do CLIENTE (não o da loja — esse já existe
// em js/main.js, WHATSAPP_NUMERO). "55" = Brasil; o telefone salvo já
// inclui DDD (campo formatado no checkout, js/checkout.js) mas não o
// código do país. slice(-11): mesmo se alguém colar um número já com
// "55" na frente, ou com um 9º dígito a mais/a menos, pega só os 11
// dígitos finais (DDD + número de celular, o padrão brasileiro) — não
// é validação de telefone de verdade, só evita montar um link
// claramente quebrado tipo "https://wa.me/5555219872226790".
function montarLinkWhatsApp(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '');
  if (digitos.length < 10) return null; // curto demais pra ser DDD+número
  const numeroBrasil = digitos.slice(-11);
  return `https://wa.me/55${numeroBrasil}`;
}

// Função PURA: recebe os dados já extraídos (extrairDadosPedido, acima)
// e devolve {assunto, texto, html} — NÃO manda nada, não sabe nem que
// nodemailer existe. É o que backend/scripts/teste-email-pedido.js usa
// pra validar o FORMATO do e-mail sem precisar enviar nada de verdade.
function montarEmailPedido(dadosPedido) {
  const { codigoPedido, pagamentoId, dataAprovacao, valorTotal, formaPagamento, cliente, endereco, itens, itensResumoTexto } =
    dadosPedido;

  const dataFormatada = new Date(dataAprovacao).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const linkWhatsApp = montarLinkWhatsApp(cliente.telefone);

  const enderecoCompleto = endereco.rua
    ? [
        `${endereco.rua}${endereco.numero ? ', ' + endereco.numero : ''}`,
        endereco.complemento,
        endereco.bairro,
        endereco.cidade && endereco.estado ? `${endereco.cidade}/${endereco.estado}` : endereco.cidade || endereco.estado,
        endereco.cep ? `CEP ${endereco.cep}` : '',
      ]
        .filter(Boolean)
        .join(' — ')
    : '';

  // --- TEXTO SIMPLES ---
  const linhasItensTexto = itens
    ? itens.map((item) => `  - ${item.quantidade}x ${item.nome} — ${formatarReal(item.precoUnitario)} cada`).join('\n')
    : itensResumoTexto
    ? `  ${itensResumoTexto}`
    : '  (detalhe dos itens indisponível — confira o pagamento no painel do Mercado Pago)';

  const texto = `NOVO PEDIDO PAGO — ${codigoPedido}

Pagamento Mercado Pago #${pagamentoId}, aprovado em ${dataFormatada}.

CLIENTE
Nome: ${cliente.nome || '(não informado pelo Mercado Pago)'}
E-mail: ${cliente.email || '-'}
Telefone: ${cliente.telefone || '-'}${linkWhatsApp ? `  (WhatsApp: ${linkWhatsApp})` : ''}
CPF: ${cliente.cpf || '-'}

ENDEREÇO DE ENTREGA
${enderecoCompleto || '(endereço não disponível — confira o pedido ou entre em contato com o cliente)'}

ITENS
${linhasItensTexto}

Forma de pagamento: ${formaPagamento}
TOTAL: ${formatarReal(valorTotal)}

---
Código do pedido: ${codigoPedido}
ID do pagamento no Mercado Pago: ${pagamentoId}
`;

  // --- HTML SIMPLES ---
  // Sem CSS externo/framework — é um e-mail, a maioria dos clientes
  // ignora <style> em <head> mesmo; estilo inline mínimo, só pra não
  // chegar como um bloco de texto cru sem NENHUMA hierarquia.
  const linhasItensHtml = itens
    ? itens
        .map(
          (item) =>
            `<tr><td style="padding:4px 8px 4px 0;">${escaparHtml(item.quantidade)}x ${escaparHtml(item.nome)}</td><td style="padding:4px 0;text-align:right;">${escaparHtml(formatarReal(item.precoUnitario))} cada</td></tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:4px 0;">${itensResumoTexto ? escaparHtml(itensResumoTexto) : '(detalhe dos itens indisponível — confira o pagamento no painel do Mercado Pago)'}</td></tr>`;

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#3E2E22;max-width:560px;">
  <h2 style="margin:0 0 4px;">Novo pedido pago — ${escaparHtml(codigoPedido)}</h2>
  <p style="margin:0 0 16px;color:#5A4A3A;">Pagamento Mercado Pago #${escaparHtml(pagamentoId)}, aprovado em ${escaparHtml(dataFormatada)}.</p>

  <h3 style="margin:16px 0 4px;">Cliente</h3>
  <p style="margin:0;">
    Nome: ${escaparHtml(cliente.nome) || '(não informado pelo Mercado Pago)'}<br>
    E-mail: ${escaparHtml(cliente.email) || '-'}<br>
    Telefone: ${escaparHtml(cliente.telefone) || '-'}
    ${linkWhatsApp ? ` — <a href="${escaparHtml(linkWhatsApp)}">Abrir WhatsApp</a>` : ''}<br>
    CPF: ${escaparHtml(cliente.cpf) || '-'}
  </p>

  <h3 style="margin:16px 0 4px;">Endereço de entrega</h3>
  <p style="margin:0;">${escaparHtml(enderecoCompleto) || '(endereço não disponível — confira o pedido ou entre em contato com o cliente)'}</p>

  <h3 style="margin:16px 0 4px;">Itens</h3>
  <table style="border-collapse:collapse;width:100%;">${linhasItensHtml}</table>

  <p style="margin:16px 0 4px;">Forma de pagamento: ${escaparHtml(formaPagamento)}</p>
  <p style="margin:0;font-size:1.1em;"><strong>Total: ${escaparHtml(formatarReal(valorTotal))}</strong></p>

  <hr style="margin:20px 0;border:none;border-top:1px solid #EFE3D0;">
  <p style="margin:0;font-size:0.85em;color:#8A7A6A;">
    Código do pedido: ${escaparHtml(codigoPedido)}<br>
    ID do pagamento no Mercado Pago: ${escaparHtml(pagamentoId)}
  </p>
</div>
`;

  const assunto = `Novo pedido pago ${codigoPedido} — ${formatarReal(valorTotal)}`;

  return { assunto, texto, html };
}

// ---------- ENVIO ----------

// Gmail via SMTP com SENHA DE APP (não a senha normal da conta — o
// Google exige isso pra acesso de app/SMTP desde que desativou "apps
// menos seguros"). "service: 'gmail'" é o atalho que o nodemailer já
// conhece (smtp.gmail.com:465, TLS) — não precisa configurar host/
// porta na mão. Devolve null (não lança erro) quando as variáveis não
// estão configuradas — quem chama decide o que fazer (ver server.js:
// webhook responde 200 mesmo sem conseguir notificar por e-mail, pois
// reenviar a notificação não vai fazer a variável aparecer sozinha).
function criarTransportadorGmail() {
  const EMAIL_USER = process.env.EMAIL_USER || null;
  const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || null;
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
}

// Monta o e-mail (montarEmailPedido, acima) e manda. "transportador"
// é injetável de propósito (parâmetro opcional) — é o que permite
// backend/scripts/teste-email-pedido.js passar um transporte
// "jsonTransport" (nodemailer não manda nada de verdade, só valida o
// formato da mensagem) sem duplicar esta função só pra testar.
async function enviarEmailPedido(dadosPedido, { transportador, destino, remetente } = {}) {
  const { assunto, texto, html } = montarEmailPedido(dadosPedido);

  const transporte = transportador || criarTransportadorGmail();
  if (!transporte) {
    // Erro DISTINTO de propósito (não um Error genérico) — server.js
    // usa isto pra decidir "configuração ausente" (responde 200, não
    // adianta o Mercado Pago reenviar) vs. "falha ao enviar de
    // verdade" (responde 500, vale reenviar depois).
    const erro = new Error(
      'Transportador de e-mail não configurado (EMAIL_USER/EMAIL_APP_PASSWORD ausentes).'
    );
    erro.configuracaoAusente = true;
    throw erro;
  }

  const remetenteFinal = remetente || process.env.EMAIL_USER || 'nao-responda@anasor-shop.local';
  const destinatario = destino || process.env.EMAIL_DESTINO || 'ceramicaecrocheanasor@gmail.com';

  return transporte.sendMail({
    from: `"Anasor Shop" <${remetenteFinal}>`,
    to: destinatario,
    subject: assunto,
    text: texto,
    html,
  });
}

module.exports = {
  formatarReal,
  escaparHtml,
  normalizarMetadata,
  extrairDadosPedido,
  montarEmailPedido,
  montarLinkWhatsApp,
  criarTransportadorGmail,
  enviarEmailPedido,
};
