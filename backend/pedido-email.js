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
//  É TAMBÉM o documento que ela usa pra EMITIR A NOTA FISCAL — por isso
//  o bloco "DADOS PARA NOTA FISCAL" e a regra de origem dos dados:
//  o que o cliente digitou no NOSSO checkout (metadata da Preference) é
//  a fonte principal; o "payer" do pagamento do Mercado Pago é só
//  reserva, porque ele pode vir vazio ou MASCARADO ("XXXXXXXXXXX")
//  quando a pessoa paga como visitante (foi o que aconteceu no pedido
//  AS-20261024-NO9M). Dado que faltar nas duas fontes aparece como
//  "NÃO INFORMADO", em destaque — nunca um "-" fácil de não ver.
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
const { soDigitos, formatarCpf, formatarTelefone } = require('./documentos');
// Catálogo (mesma fonte do checkout) só pra "sugestoesEstoqueAnjos",
// abaixo — NÃO é usado pra calcular preço/total do e-mail (isso já vem
// pronto do pagamento) nem muda o caráter "função pura" deste arquivo:
// é só uma consulta de leitura ao mesmo catálogo estático.
const { produtos } = require('./data/produtos');

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

// ---------- SUGESTÃO DE ATUALIZAR ESTOQUE (Anjos de Luz) ----------
// Não há banco de dados: o estoque de cada Anjo de Luz mora em
// js/produtos.js e só desce com "node backend/scripts/estoque.js <id>
// <novo>", à MÃO (ver o campo "estoque" em produtos.js). Este aviso é
// só uma CONTA PRONTA pra quem lê o e-mail/Telegram não precisar fazer
// de cabeça — "sugestão; confira" porque o pedido pode ter vindo de
// mais de uma fonte (ex.: venda direta no WhatsApp) e o número real
// pode já ter mudado. Casamento por NOME (não por id): o Mercado Pago
// não garante devolver o id do item que mandamos na Preference, só
// título/quantidade/preço (ver extrairDadosPedido, "itens", acima).
function sugestoesEstoqueAnjos(itensPedido) {
  if (!Array.isArray(itensPedido)) return [];
  return itensPedido
    .map((item) => {
      const catalogo = produtos.find((p) => p.permiteQuantidade && p.nome === item.nome);
      if (!catalogo) return null;
      const estoqueAtual = Number(catalogo.estoque) || 0;
      const quantidadeVendida = Number(item.quantidade) || 0;
      const sugerido = Math.max(0, estoqueAtual - quantidadeVendida);
      return `${catalogo.nome}: ${estoqueAtual} → ${sugerido} (sugestão; confira)`;
    })
    .filter(Boolean);
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

// 01310100 -> 01310-100 (como vai na etiqueta/nota)
function formatarCep(valor) {
  const d = soDigitos(valor);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : String(valor ?? '').trim();
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

// Valor MASCARADO pelo Mercado Pago (comprador visitante): o e-mail
// chega como "XXXXXXXXXXX" e às vezes vem só parte dele com asteriscos
// ou x ("ma***@gmail.com", "xxxxxxx5725"). Isso NÃO é dado — não pode
// ir pra nota fiscal; é tratado igual a vazio. Maiúsculas/minúsculas
// tanto faz (achado do code-review: "xxxx" minúsculo passava).
function pareceMascarado(texto) {
  return /^[X*•]+$/i.test(texto) || /x{4,}|\*{3,}/i.test(texto);
}

// Escolhe o valor de um campo: o NOSSO (metadata, digitado pelo
// cliente no checkout) vence sempre que existir — e NÃO passa pelo
// teste de máscara (achado do code-review): é texto do próprio cliente,
// e um complemento como "Casa 2 *** portão azul" não pode sumir. As
// reservas do Mercado Pago, sim: valor mascarado delas é ignorado.
// "" quando nenhuma fonte tem.
function escolherValor(nosso, ...reservasMercadoPago) {
  const proprio = String(nosso ?? '').trim();
  if (proprio) return proprio;
  for (const reserva of reservasMercadoPago) {
    const texto = String(reserva ?? '').trim();
    if (texto && !pareceMascarado(texto)) return texto;
  }
  return '';
}

// Telefone do lado do Mercado Pago ({area_code, number}). Se "number"
// já vier com o DDD dentro (10+ dígitos), usa só ele — senão
// concatenar daria "2121987222679" (achado do code-review).
function telefoneDoMercadoPago(fone) {
  if (!fone) return '';
  const numero = soDigitos(fone.number);
  return numero.length >= 10 ? numero : `${soDigitos(fone.area_code)}${numero}`;
}

// UF de 2 letras ou nada: a reserva shipments.receiver_address traz
// "state_name" por EXTENSO ("São Paulo"), que viraria "São Paulo/São
// Paulo" na nota e "SÃ" no Telegram (achado do code-review).
const ufOuVazio = (valor) => (/^[A-Za-z]{2}$/.test(String(valor ?? '').trim()) ? String(valor).trim().toUpperCase() : '');

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

// Status do pagamento em português (o webhook só manda e-mail de
// "approved", mas o campo existe pra nota/conferência e não custa
// cobrir os outros).
const NOMES_STATUS = {
  approved: 'Aprovado',
  authorized: 'Autorizado',
  in_process: 'Em análise',
  pending: 'Pendente',
  rejected: 'Recusado',
  refunded: 'Devolvido',
  cancelled: 'Cancelado',
  charged_back: 'Contestado (chargeback)',
};

// Número finito ou null — campos de valor do Mercado Pago podem faltar
// conforme a forma de pagamento (taxa/líquido nem sempre vêm na hora).
const numeroOuNull = (valor) => (valor !== null && valor !== '' && Number.isFinite(Number(valor)) ? Number(valor) : null);

// Recebe a resposta de Payment.get() (SDK oficial, GET /v1/payments/:id
// — ver server.js) e devolve só o que o e-mail precisa, já organizado.
// NUNCA confia em req.body do webhook pra montar isto — quem chama
// esta função (server.js) já consultou a API de verdade antes.
function extrairDadosPedido(pagamento) {
  const metadata = normalizarMetadata(pagamento.metadata);
  const payer = pagamento.payer || {};
  // reservas de ENDEREÇO do lado do Mercado Pago (só usadas se o nosso
  // metadata faltar): o payer da Preference costuma voltar em
  // additional_info.payer; shipments.receiver_address existe em
  // integrações com frete do Mercado Pago (não é o nosso caso hoje).
  const enderecoMP = pagamento.additional_info?.payer?.address || {};
  const recebedorMP = pagamento.additional_info?.shipments?.receiver_address || {};

  // CLIENTE: metadata (o que a PRÓPRIA PESSOA digitou no nosso checkout
  // e confirmou) primeiro; payer do Mercado Pago só quando o nosso
  // faltar — ver o comentário no topo do arquivo.
  // additional_info.payer = eco do payer que a NOSSA Preference mandou
  // (costuma vir mais completo que o payer do pagamento)
  const payerEco = pagamento.additional_info?.payer || {};
  const cliente = {
    nome: escolherValor(
      metadata.cliente_nome,
      [payer.first_name, payer.last_name].filter(Boolean).join(' '),
      [payerEco.first_name, payerEco.last_name].filter(Boolean).join(' ')
    ),
    email: escolherValor(metadata.cliente_email, payer.email),
    telefone: escolherValor(metadata.cliente_telefone, telefoneDoMercadoPago(payer.phone), telefoneDoMercadoPago(payerEco.phone)),
    cpf: escolherValor(metadata.cliente_cpf, payer.identification?.number),
  };

  const endereco = {
    cep: escolherValor(metadata.endereco_cep, enderecoMP.zip_code, recebedorMP.zip_code),
    rua: escolherValor(metadata.endereco_rua, enderecoMP.street_name, recebedorMP.street_name),
    numero: escolherValor(metadata.endereco_numero, enderecoMP.street_number, recebedorMP.street_number),
    complemento: escolherValor(metadata.endereco_complemento),
    bairro: escolherValor(metadata.endereco_bairro),
    cidade: escolherValor(metadata.endereco_cidade, recebedorMP.city_name),
    estado: escolherValor(metadata.endereco_uf, ufOuVazio(recebedorMP.state_name)),
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
      ? itensBrutos.map((item) => {
          const quantidade = Number(item.quantity) || 1;
          const precoUnitario = Number(item.unit_price) || 0;
          return {
            nome: item.title || item.description || 'Item',
            quantidade,
            precoUnitario,
            subtotal: Math.round(quantidade * precoUnitario * 100) / 100,
          };
        })
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

  // PARCELAS (cartão): só interessam quando passam de 1x.
  const numeroParcelas = Number(pagamento.installments) || 1;
  const valorParcela = numeroOuNull(pagamento.transaction_details?.installment_amount);
  const parcelas = numeroParcelas > 1 ? { quantidade: numeroParcelas, valor: valorParcela } : null;

  // TAXA e LÍQUIDO do Mercado Pago, quando o pagamento já traz (em Pix
  // e cartão costuma vir na aprovação; se não vier, o e-mail omite a
  // linha em vez de mostrar um valor errado). Taxa = só as tarifas
  // cobradas da ANASOR (fee_payer "collector") — os juros do
  // parcelamento que o COMPRADOR paga também aparecem em fee_details
  // (fee_payer "payer") e não são custo dela (achado do code-review).
  const taxas = (Array.isArray(pagamento.fee_details) ? pagamento.fee_details : []).filter(
    (t) => !t.fee_payer || t.fee_payer === 'collector'
  );
  const taxaMercadoPago = taxas.length > 0
    ? Math.round(taxas.reduce((soma, t) => soma + (Number(t.amount) || 0), 0) * 100) / 100
    : null;
  const valorLiquido = numeroOuNull(pagamento.transaction_details?.net_received_amount);

  // JUROS DO PARCELAMENTO pagos pelo comprador: total_paid_amount (o que
  // saiu do cartão dele) - transaction_amount (o valor do pedido). Sem
  // esta linha, "3x de R$ 95,27" e "TOTAL PAGO: R$ 269,80" não fechavam
  // a conta e pareciam erro (achado do code-review). A nota fiscal é do
  // valor do pedido; os juros são do Mercado Pago com o comprador.
  const totalPagoComprador = numeroOuNull(pagamento.transaction_details?.total_paid_amount);
  const jurosComprador =
    totalPagoComprador !== null && totalPagoComprador - valorTotal > 0.004
      ? Math.round((totalPagoComprador - valorTotal) * 100) / 100
      : null;

  return {
    // external_reference é o NOSSO código (gerado em gerarIdPedido(),
    // server.js, formato AS-AAAAMMDD-XXXX) — pedido_id no metadata é
    // só uma 2ª cópia dele (redundância barata, caso um dia alguém
    // crie uma Preference sem passar external_reference).
    codigoPedido: pagamento.external_reference || metadata.pedido_id || `MP-${pagamento.id}`,
    pagamentoId: pagamento.id,
    dataAprovacao: pagamento.date_approved || pagamento.date_created || new Date().toISOString(),
    status: NOMES_STATUS[pagamento.status] || pagamento.status || '',
    valorTotal,
    formaPagamento,
    parcelas,
    jurosComprador,
    taxaMercadoPago,
    valorLiquido,
    cliente,
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

// O que aparece no lugar de um dado que NÃO chegou por nenhuma fonte —
// em destaque de propósito: a Anasor precisa notar ANTES de emitir a
// nota (e pedir o dado ao cliente), não descobrir depois.
const NAO_INFORMADO_TEXTO = '*** NÃO INFORMADO ***';
const NAO_INFORMADO_HTML = '<strong style="color:#B3261E;">NÃO INFORMADO</strong>';

// Função PURA: recebe os dados já extraídos (extrairDadosPedido, acima)
// e devolve {assunto, texto, html} — NÃO manda nada, não sabe nem que
// nodemailer existe. É o que backend/scripts/teste-email-pedido.js usa
// pra validar o FORMATO do e-mail sem precisar enviar nada de verdade.
function montarEmailPedido(dadosPedido) {
  const {
    codigoPedido, pagamentoId, dataAprovacao, status, valorTotal, formaPagamento, parcelas,
    jurosComprador = null, taxaMercadoPago, valorLiquido, cliente, endereco, itens, itensResumoTexto,
  } = dadosPedido;

  const dataFormatada = new Date(dataAprovacao).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const linkWhatsApp = montarLinkWhatsApp(cliente.telefone);
  const formaComParcelas = parcelas
    ? `${formaPagamento} — ${parcelas.quantidade}x${parcelas.valor !== null ? ` de ${formatarReal(parcelas.valor)}` : ''}`
    : formaPagamento;
  const cidadeUf = [endereco.cidade, endereco.estado].filter(Boolean).join('/');

  // Uma lista só de [rótulo, valor] por bloco, usada pelas DUAS versões
  // (texto e HTML) — assim as duas nunca mostram campos diferentes.
  // valor '' = não informado (vira o destaque); "opcional: true" =
  // campo que pode não existir de verdade (complemento) e aí mostra
  // "(sem complemento)" em vez do alerta.
  const blocoPedido = [
    ['Pedido', codigoPedido],
    ['Aprovado em', dataFormatada],
    ['Pagamento Mercado Pago nº', String(pagamentoId ?? '')],
    ['Forma de pagamento', formaComParcelas],
    ['Status', status],
  ];
  const blocoCliente = [
    ['Nome completo', cliente.nome],
    ['CPF', cliente.cpf ? formatarCpf(cliente.cpf) : ''],
    ['E-mail', cliente.email],
    ['Telefone/WhatsApp', cliente.telefone ? formatarTelefone(cliente.telefone) : ''],
  ];
  const blocoEndereco = [
    ['Rua', endereco.rua],
    ['Número', endereco.numero],
    ['Complemento', endereco.complemento, { opcional: true }],
    ['Bairro', endereco.bairro],
    ['Cidade/UF', cidadeUf],
    ['CEP', endereco.cep ? formatarCep(endereco.cep) : ''],
  ];
  const blocoValores = [
    ['Frete', 'Grátis'],
    ['TOTAL PAGO', formatarReal(valorTotal)],
    ...(jurosComprador !== null ? [['Juros do parcelamento (pagos pelo cliente ao Mercado Pago)', formatarReal(jurosComprador)]] : []),
    ...(taxaMercadoPago !== null ? [['Taxa do Mercado Pago', formatarReal(taxaMercadoPago)]] : []),
    ...(valorLiquido !== null ? [['Valor líquido a receber', formatarReal(valorLiquido)]] : []),
  ];

  // --- TEXTO SIMPLES ---
  const linhaTexto = ([rotulo, valor, opcoes]) =>
    `${rotulo}: ${valor || (opcoes?.opcional ? '(sem complemento)' : NAO_INFORMADO_TEXTO)}`;
  const blocoTexto = (linhas) => linhas.map(linhaTexto).join('\n');

  const linhasItensTexto = itens
    ? itens
        .map((item) => `${item.quantidade}x ${item.nome} — ${formatarReal(item.precoUnitario)} cada — subtotal ${formatarReal(item.subtotal)}`)
        .join('\n')
    : itensResumoTexto || `${NAO_INFORMADO_TEXTO} (confira o pagamento no painel do Mercado Pago)`;

  const sugestoesEstoque = sugestoesEstoqueAnjos(itens);
  const blocoEstoqueTexto = sugestoesEstoque.length
    ? `\nATUALIZAR ESTOQUE (Anjos de Luz)\n${sugestoesEstoque.join('\n')}\n`
    : '';

  const texto = `NOVO PEDIDO PAGO — ${codigoPedido}

========== DADOS PARA NOTA FISCAL ==========

PEDIDO
${blocoTexto(blocoPedido)}

CLIENTE
${blocoTexto(blocoCliente)}${linkWhatsApp ? `\nAbrir WhatsApp: ${linkWhatsApp}` : ''}

ENDEREÇO DE ENTREGA
${blocoTexto(blocoEndereco)}

ITENS
${linhasItensTexto}
${blocoEstoqueTexto}
${blocoTexto(blocoValores)}

============================================

Responda este e-mail ou chame o cliente pelo WhatsApp para combinar o envio.
`;

  // --- HTML SIMPLES ---
  // Sem CSS externo/framework — é um e-mail, a maioria dos clientes
  // ignora <style> em <head> mesmo; estilo inline mínimo. TUDO que vem
  // de fora (cliente, Mercado Pago) passa por escaparHtml; só o
  // destaque "NÃO INFORMADO" (constante nossa) entra como HTML.
  const linhaHtml = ([rotulo, valor, opcoes]) =>
    `<tr><td style="padding:3px 12px 3px 0;color:#5A4A3A;white-space:nowrap;vertical-align:top;">${escaparHtml(rotulo)}</td>` +
    `<td style="padding:3px 0;">${valor ? escaparHtml(valor) : opcoes?.opcional ? '(sem complemento)' : NAO_INFORMADO_HTML}</td></tr>`;
  const tabelaHtml = (linhas, extra = '') =>
    `<table style="border-collapse:collapse;">${linhas.map(linhaHtml).join('')}${extra}</table>`;
  const tituloHtml = (texto) => `<h3 style="margin:18px 0 6px;font-size:1em;letter-spacing:0.04em;">${escaparHtml(texto)}</h3>`;

  const linhasItensHtml = itens
    ? itens
        .map(
          (item) =>
            `<tr><td style="padding:3px 12px 3px 0;">${escaparHtml(item.quantidade)}x ${escaparHtml(item.nome)}</td>` +
            `<td style="padding:3px 12px 3px 0;text-align:right;white-space:nowrap;">${escaparHtml(formatarReal(item.precoUnitario))} cada</td>` +
            `<td style="padding:3px 0;text-align:right;white-space:nowrap;">${escaparHtml(formatarReal(item.subtotal))}</td></tr>`
        )
        .join('')
    : `<tr><td style="padding:3px 0;">${itensResumoTexto ? escaparHtml(itensResumoTexto) : `${NAO_INFORMADO_HTML} (confira o pagamento no painel do Mercado Pago)`}</td></tr>`;

  const blocoEstoqueHtml = sugestoesEstoque.length
    ? `${tituloHtml('Atualizar estoque (Anjos de Luz)')}<table style="border-collapse:collapse;">${sugestoesEstoque
        .map((linha) => `<tr><td style="padding:3px 0;">${escaparHtml(linha)}</td></tr>`)
        .join('')}</table>`
    : '';

  const linhaWhatsAppHtml = linkWhatsApp
    ? `<tr><td></td><td style="padding:3px 0;"><a href="${escaparHtml(linkWhatsApp)}">Abrir WhatsApp</a></td></tr>`
    : '';

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#3E2E22;max-width:600px;">
  <h2 style="margin:0 0 12px;">Novo pedido pago — ${escaparHtml(codigoPedido)}</h2>
  <div style="border:2px solid #9E4F2E;border-radius:8px;padding:12px 16px;">
    <p style="margin:0 0 4px;font-weight:bold;letter-spacing:0.06em;color:#9E4F2E;">DADOS PARA NOTA FISCAL</p>
    ${tituloHtml('Pedido')}
    ${tabelaHtml(blocoPedido)}
    ${tituloHtml('Cliente')}
    ${tabelaHtml(blocoCliente, linhaWhatsAppHtml)}
    ${tituloHtml('Endereço de entrega')}
    ${tabelaHtml(blocoEndereco)}
    ${tituloHtml('Itens')}
    <table style="border-collapse:collapse;">${linhasItensHtml}</table>
    ${blocoEstoqueHtml}
    <div style="margin-top:10px;">${tabelaHtml(blocoValores)}</div>
  </div>
  <p style="margin:16px 0 0;">Responda este e-mail ou chame o cliente pelo WhatsApp para combinar o envio.</p>
</div>
`;

  const assunto = `Novo pedido pago ${codigoPedido} — ${formatarReal(valorTotal)}`;

  return { assunto, texto, html };
}

// ---------- ENVIO ----------

// E-mail OFICIAL da loja — destino padrão do aviso de pedido. Mora AQUI,
// num lugar só (server.js importa daqui): antes estava escrito em 2
// arquivos e uma troca de endereço precisava lembrar dos dois.
const EMAIL_DESTINO_PADRAO = 'contatoatelieanasor@gmail.com';

// Gmail via SMTP com SENHA DE APP (não a senha normal da conta — o
// Google exige isso pra acesso de app/SMTP desde que desativou "apps
// menos seguros"). "service: 'gmail'" é o atalho que o nodemailer já
// conhece (smtp.gmail.com:465, TLS) — não precisa configurar host/
// porta na mão. Devolve null (não lança erro) quando as variáveis não
// estão configuradas — quem chama decide o que fazer (enviarEmailPedido,
// abaixo, transforma isso num erro "configuracaoAusente").
function criarTransportadorGmail() {
  const EMAIL_USER = process.env.EMAIL_USER || null;
  const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || null;
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
}

// E-mail simples o bastante pra virar Reply-To: um endereço só, sem
// espaço, vírgula, aspas nem quebra de linha (nada que pudesse virar 2
// destinatários ou um cabeçalho a mais).
const emailSimples = (valor) => /^[^\s@,;<>"'()]+@[^\s@,;<>"'()]+\.[^\s@,;<>"'()]+$/.test(String(valor || ''));

// Monta o e-mail (montarEmailPedido, acima) e manda. "transportador"
// é injetável de propósito (parâmetro opcional) — é o que permite
// backend/scripts/teste-email-pedido.js passar um transporte
// "jsonTransport" (nodemailer não manda nada de verdade, só valida o
// formato da mensagem) sem duplicar esta função só pra testar.
async function enviarEmailPedido(dadosPedido, { transportador, destino, remetente } = {}) {
  const { assunto, texto, html } = montarEmailPedido(dadosPedido);

  const transporte = transportador || criarTransportadorGmail();
  if (!transporte) {
    // Erro DISTINTO de propósito (não um Error genérico): o log do
    // aviso (notificar-pedido.js, tipoDoErro) mostra
    // "configuracao_ausente" em vez de um erro qualquer, e quem lê o
    // log da Vercel sabe na hora que falta variável, não que o Gmail
    // caiu. Pro webhook as duas coisas contam igual: canal que não
    // entregou (se nenhum entregar, ele responde 503 — ver server.js).
    const erro = new Error(
      'Transportador de e-mail não configurado (EMAIL_USER/EMAIL_APP_PASSWORD ausentes).'
    );
    erro.configuracaoAusente = true;
    throw erro;
  }

  const remetenteFinal = remetente || process.env.EMAIL_USER || 'nao-responda@anasor-shop.local';
  // Sem destino explícito nem variável, vai pro e-mail OFICIAL da loja.
  const destinatario = destino || process.env.EMAIL_DESTINO || EMAIL_DESTINO_PADRAO;

  return transporte.sendMail({
    from: `"Anasor Shop" <${remetenteFinal}>`,
    to: destinatario,
    // Reply-To = e-mail do CLIENTE: o fim do e-mail diz "Responda este
    // e-mail..." — sem isto, a resposta da Anasor voltaria pra própria
    // conta que envia o aviso, não pro cliente. Só quando o endereço é
    // simples e de verdade (não mascarado, ver primeiroValorReal).
    ...(emailSimples(dadosPedido.cliente?.email) ? { replyTo: dadosPedido.cliente.email } : {}),
    subject: assunto,
    text: texto,
    html,
  });
}

module.exports = {
  EMAIL_DESTINO_PADRAO,
  formatarReal,
  escaparHtml,
  normalizarMetadata,
  pareceMascarado,
  extrairDadosPedido,
  montarEmailPedido,
  montarLinkWhatsApp,
  criarTransportadorGmail,
  enviarEmailPedido,
  sugestoesEstoqueAnjos,
};
