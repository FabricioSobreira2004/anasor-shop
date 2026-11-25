// ============================================================
//  NOTIFICAÇÃO DE PEDIDO POR TELEGRAM — Anasor Sobreira
// ============================================================
//
//  POR QUE ESTE ARQUIVO EXISTE
//  ---------------------------------------------------------
//  O e-mail (pedido-email.js) leva TODOS os dados do pedido, mas e-mail
//  nem sempre chega na hora no celular. Este módulo é um SEGUNDO canal,
//  instantâneo: uma mensagem curta num grupo do Telegram ("Vendas
//  Anasor") assim que o webhook confirma um pagamento aprovado.
//
//  PRIVACIDADE DE PROPÓSITO: a mensagem leva só o necessário pra saber
//  "vendeu!" (código do pedido, itens, total e cidade/UF). Endereço
//  completo, telefone, CPF e e-mail do cliente ficam SÓ no e-mail — um
//  grupo de Telegram é mais fácil de vazar (print, celular emprestado,
//  alguém adicionado ao grupo depois) do que a caixa de entrada.
//
//  Mesma separação de pedido-email.js: montarMensagemTelegram() é PURA
//  (recebe dados, devolve texto) e enviarTelegramPedido() recebe o
//  "fetch" por parâmetro — dá pra testar tudo sem internet (ver
//  backend/scripts/teste-telegram-pedido.js).
// ============================================================

const { formatarReal, sugestoesEstoqueAnjos, lembretesKitVendido } = require('./pedido-email');

// 5 s: o webhook roda numa função serverless e espera os avisos antes
// de responder ao Mercado Pago. Um Telegram lento não pode segurar a
// função até o limite de tempo da Vercel (e derrubar o e-mail junto).
const TIMEOUT_PADRAO_MS = 5000;

// Limite da Bot API pra "text" é 4096 caracteres. Cortamos bem antes:
// a mensagem é um resumo, e um carrinho enorme não pode fazer o envio
// falhar por tamanho.
const LIMITE_MENSAGEM = 1000;

// Texto que veio do CLIENTE (cidade/UF digitadas no checkout) ou do
// Mercado Pago vira UMA linha limpa: sem caracteres de controle nem
// quebras de linha (ninguém consegue "desenhar" linhas falsas na
// mensagem, tipo um "Total R$ 0,00" a mais) e com tamanho limitado.
// Não precisa escapar Markdown/HTML porque enviamos SEM parse_mode:
// o Telegram mostra o texto exatamente como veio, sem formatar nada.
function linhaLimpa(valor, max = 80) {
  return cortar(
    String(valor ?? '')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    max
  );
}

// Corta por CARACTERE de verdade (Array.from separa por code point), não
// por unidade UTF-16 como o .slice() de string: um emoji ocupa 2
// unidades, e cortá-lo no meio deixaria meio caractere inválido que a
// Bot API recusa (erro 400) — o aviso inteiro deixaria de sair.
function cortar(texto, max) {
  return Array.from(texto).slice(0, max).join('');
}

// Nomes dos itens: prefere a lista estruturada (additional_info.items,
// ver extrairDadosPedido em pedido-email.js); sem ela, usa o resumo em
// texto do metadata. "2x" só aparece se um dia a quantidade passar de
// 1 — hoje toda peça é única (estoque 1).
function textoItens(dadosPedido) {
  if (Array.isArray(dadosPedido.itens) && dadosPedido.itens.length > 0) {
    return dadosPedido.itens
      .map((item) => {
        const nome = linhaLimpa(item.nome, 100);
        return item.quantidade > 1 ? `${item.quantidade}x ${nome}` : nome;
      })
      .join(', ');
  }
  return linhaLimpa(dadosPedido.itensResumoTexto, 300) || 'itens no e-mail';
}

// Monta o texto final. Formato pedido pelo Fabrício:
// "🤎 Nova venda paga! Pedido AS-XXXX · itens · Total R$ valor ·
//  cidade/UF. Endereço completo e dados do cliente no e-mail."
function montarMensagemTelegram(dadosPedido) {
  const cidade = linhaLimpa(dadosPedido.endereco?.cidade, 60);
  const uf = linhaLimpa(dadosPedido.endereco?.estado, 2).toUpperCase();
  const local = [cidade, uf].filter(Boolean).join('/') || 'local no e-mail';

  // Sugestão de estoque (Anjos de Luz): só entra quando o pedido tem
  // pelo menos um (sugestoesEstoqueAnjos devolve [] pra qualquer outro
  // pedido) — texto curto de propósito, o e-mail já traz o detalhe.
  const sugestoes = sugestoesEstoqueAnjos(dadosPedido.itens);
  const textoEstoque = sugestoes.length
    ? ` · Atualizar estoque: ${sugestoes.map((s) => linhaLimpa(s, 80)).join('; ')}`
    : '';
  const lembretesKit = lembretesKitVendido(dadosPedido.itens);
  const textoKit = lembretesKit.length
    ? ` · ⚠️ ${lembretesKit.map((s) => linhaLimpa(s, 100)).join('; ')}`
    : '';

  const texto =
    `🤎 Nova venda paga! Pedido ${linhaLimpa(dadosPedido.codigoPedido, 40)} · ` +
    `${textoItens(dadosPedido)} · Total ${formatarReal(dadosPedido.valorTotal)} · ${local}.${textoEstoque}${textoKit} ` +
    'Endereço completo e dados do cliente no e-mail.';
  return cortar(texto, LIMITE_MENSAGEM);
}

// Erro com um "tipo" curto e SEM dados sensíveis. Motivo: a URL da Bot
// API carrega o token (".../bot<TOKEN>/sendMessage"), e erros de rede
// às vezes repetem a URL na mensagem. Quem chama loga só erro.tipo —
// nunca a mensagem original, nunca a URL.
function erroTelegram(tipo) {
  const erro = new Error(`Falha ao enviar aviso pelo Telegram (${tipo}).`);
  erro.tipo = tipo;
  return erro;
}

// Envia a mensagem. Sem TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID, só ignora
// (retorna { ignorado: true }): o Telegram é um canal OPCIONAL, a loja
// funciona sem ele e não tem por que encher o log de erro.
// Parâmetros opcionais existem pros testes: "fetch" falso, token/chat
// de mentira e um timeout curto.
async function enviarTelegramPedido(
  dadosPedido,
  {
    fetch: fetchImpl = globalThis.fetch,
    token = process.env.TELEGRAM_BOT_TOKEN,
    chatId = process.env.TELEGRAM_CHAT_ID,
    timeoutMs = TIMEOUT_PADRAO_MS,
  } = {}
) {
  if (!token || !chatId) return { ignorado: true };

  const texto = montarMensagemTelegram(dadosPedido);

  // Timeout em DUAS camadas: o AbortController cancela a requisição de
  // verdade (libera a conexão), e o Promise.race garante que a função
  // devolve no prazo MESMO que o fetch ignore o abort — o webhook nunca
  // fica pendurado esperando o Telegram.
  const controle = new AbortController();
  let timer;
  const estouro = new Promise((_, rejeitar) => {
    timer = setTimeout(() => {
      controle.abort();
      rejeitar(erroTelegram('timeout'));
    }, timeoutMs);
  });

  let resposta;
  try {
    resposta = await Promise.race([
      fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sem "parse_mode" DE PROPÓSITO: texto puro, então um nome de
        // cidade como "*Rio*" ou "<b>x</b>" aparece literal, sem virar
        // formatação. disable_web_page_preview: nada de prévia de link.
        body: JSON.stringify({ chat_id: chatId, text: texto, disable_web_page_preview: true }),
        signal: controle.signal,
      }),
      estouro,
    ]);
  } catch (erro) {
    // Já é o nosso erro de timeout? repassa. Qualquer outra coisa
    // (abort, DNS, conexão recusada) vira "rede" — sem a mensagem
    // original, que poderia conter a URL com o token.
    if (erro?.tipo) throw erro;
    throw erroTelegram(controle.signal.aborted ? 'timeout' : 'rede');
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    // Só o status HTTP (ex.: 401 token errado, 400 chat id errado). O
    // corpo da resposta não entra no erro: não precisamos dele pra
    // entender o problema e não queremos ecoar nada no log.
    throw erroTelegram(`http_${resposta.status}`);
  }
  return { enviado: true };
}

module.exports = {
  TIMEOUT_PADRAO_MS,
  montarMensagemTelegram,
  enviarTelegramPedido,
};
