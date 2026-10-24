// ============================================================
//  AVISO DE PEDIDO PAGO — e-mail + Telegram, um não derruba o outro
// ============================================================
//
//  POR QUE ESTE ARQUIVO EXISTE
//  ---------------------------------------------------------
//  O webhook (server.js) precisa avisar a Anasor por DOIS canais
//  (pedido-email.js e pedido-telegram.js). As regras de "como avisar"
//  moram aqui, num lugar só e testável sem Express nem internet (ver
//  backend/scripts/teste-telegram-pedido.js):
//   1. os dois canais rodam EM PARALELO (Promise.allSettled): o tempo
//      total é o do mais lento, não a soma — importa numa função
//      serverless, que tem limite de duração;
//   2. cada canal tem seu próprio TIMEOUT: um canal travado não segura
//      o outro nem o webhook;
//   3. a falha de um canal NUNCA impede o outro e NUNCA vira erro pra
//      quem chamou (allSettled não rejeita);
//   4. o log registra só o TIPO do erro (ex.: "timeout", "http_401",
//      "EAUTH") — nunca a mensagem original, que pode conter e-mail do
//      cliente (SMTP) ou a URL com o token do bot (Telegram).
// ============================================================

const { enviarEmailPedido } = require('./pedido-email');
const { enviarTelegramPedido, TIMEOUT_PADRAO_MS } = require('./pedido-telegram');

// Prazo de CADA canal, separado de propósito: 5 s é folga de sobra pra
// uma chamada HTTP à API do Telegram, mas o e-mail faz DNS + TLS +
// login SMTP no Gmail, que numa função serverless "fria" pode passar
// disso. Como os dois rodam em paralelo, o webhook espera no máximo o
// maior dos dois (8 s), ainda dentro do limite da Vercel.
const TIMEOUTS_PADRAO = { email: 8000, telegram: TIMEOUT_PADRAO_MS };

// Corre a promessa contra um relógio. O nodemailer não aceita
// AbortSignal, então pro e-mail este é o único jeito de não esperar
// além do prazo (o envio pode até terminar depois, mas o webhook já
// seguiu em frente).
function comTimeout(promessa, ms) {
  let timer;
  const estouro = new Promise((_, rejeitar) => {
    timer = setTimeout(() => {
      const erro = new Error('Tempo esgotado.');
      erro.tipo = 'timeout';
      rejeitar(erro);
    }, ms);
  });
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(timer));
}

// Resume um erro num rótulo curto e seguro pra log. Só aceita
// identificadores simples (letras, números, "_"), então mesmo que uma
// lib coloque algo estranho em "code", nada além disso vai pro log.
function tipoDoErro(erro) {
  if (erro?.configuracaoAusente) return 'configuracao_ausente';
  const candidato = erro?.tipo || erro?.code || erro?.name || 'desconhecido';
  return /^[A-Za-z0-9_]{1,40}$/.test(String(candidato)) ? String(candidato) : 'desconhecido';
}

// Dispara os dois avisos e devolve o que aconteceu com cada um
// ({ email: {...}, telegram: {...} }) — nunca lança erro.
// "enviarEmail"/"enviarTelegram" têm padrão real e só são trocados
// nos testes (canais falsos que demoram, falham etc.).
async function notificarPedidoAprovado(
  dadosPedido,
  {
    destinoEmail,
    timeouts = TIMEOUTS_PADRAO,
    enviarEmail = (dados) => enviarEmailPedido(dados, { destino: destinoEmail }),
    enviarTelegram = (dados) => enviarTelegramPedido(dados, { timeoutMs: timeouts.telegram }),
  } = {}
) {
  const canais = { email: enviarEmail, telegram: enviarTelegram };
  const nomes = Object.keys(canais);

  // Promise.resolve().then(...): se um canal lançar erro SÍNCRONO (antes
  // de devolver promessa), ele vira rejeição normal em vez de escapar
  // daqui e derrubar o outro canal.
  const resultados = await Promise.allSettled(
    nomes.map((nome) => comTimeout(Promise.resolve().then(() => canais[nome](dadosPedido)), timeouts[nome]))
  );

  const resumo = {};
  resultados.forEach((resultado, i) => {
    const nome = nomes[i];
    if (resultado.status === 'fulfilled') {
      // { ignorado: true } = canal sem variáveis configuradas (só o
      // Telegram faz isso; é opcional e não merece alarme).
      resumo[nome] = resultado.value?.ignorado ? { status: 'ignorado' } : { status: 'ok' };
    } else {
      resumo[nome] = { status: 'falhou', tipo: tipoDoErro(resultado.reason) };
    }
  });

  // Código do pedido (AS-...) e id do pagamento não são dados pessoais —
  // ajudam a achar o pagamento no painel do Mercado Pago (onde está o
  // endereço, se nenhum aviso chegar).
  const codigo = `${dadosPedido?.codigoPedido || '(sem código)'} (pagamento ${dadosPedido?.pagamentoId ?? '?'})`;
  for (const nome of nomes) {
    const r = resumo[nome];
    if (r.status === 'ok') console.log(`✅ Aviso por ${nome} enviado — pedido ${codigo}.`);
    else if (r.status === 'ignorado') console.log(`ℹ️  Aviso por ${nome} não configurado — pedido ${codigo}.`);
    else console.error(`❌ Aviso por ${nome} falhou (${r.tipo}) — pedido ${codigo}.`);
  }

  // Os DOIS falharam: a Anasor não foi avisada por canal nenhum. O
  // endereço continua no metadata do pagamento, no painel do MP.
  if (!algumAvisoEntregue(resumo)) {
    console.error(
      `❌ Pedido ${codigo} pago SEM aviso entregue — confira o painel do Mercado Pago (metadata do pagamento).`
    );
  }

  return resumo;
}

// A Anasor ficou sabendo da venda? Só "ok" conta: "ignorado" (canal sem
// configuração) e "falhou" não avisaram ninguém. Separada (e exportada)
// porque o webhook decide por ela se pede ao Mercado Pago pra reenviar
// (503) — uma regra só, testável sem Express (teste-telegram-pedido.js).
function algumAvisoEntregue(resumo) {
  return Object.values(resumo || {}).some((canal) => canal?.status === 'ok');
}

module.exports = { TIMEOUTS_PADRAO, comTimeout, tipoDoErro, algumAvisoEntregue, notificarPedidoAprovado };
