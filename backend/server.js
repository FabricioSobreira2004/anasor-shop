// ============================================================
//  BACKEND — Anasor Sobreira  (trabalho em andamento)
// ============================================================
//
//  ESTADO ATUAL
//  ---------------------------------------------------------
//  Já existem: o catálogo (GET /api/produtos[/:id]) e o checkout
//  (POST /api/checkout) completo — COM as credenciais reais do
//  Mercado Pago configuradas (backend/.env) e o SDK oficial
//  ("mercadopago", npm) criando a Preference de verdade. SEM as
//  credenciais (.env ausente ou incompleto), o checkout continua
//  funcionando em modo "stub": recalcula o pedido de verdade (preço,
//  frete) mas devolve um link de pagamento FAKE, pra quem clonar o
//  projeto sem chaves ainda conseguir testar o resto do fluxo.
//
//  ⚠️ ATENÇÃO — as credenciais atuais em backend/.env têm prefixo
//  "APP_USR-": isso é o formato de PRODUÇÃO do Mercado Pago (a
//  sandbox/teste usa prefixo "TEST-"). Ver o aviso que o servidor
//  imprime no console ao subir, e a mensagem que acompanha esta
//  entrega, antes de rodar qualquer checkout "de teste" com elas.
//
//  NÃO faz parte desta etapa ainda (TODO — próximos passos):
//   [ ] Banco de dados: mover o catálogo pra um Postgres/Mongo
//       (hoje ele é lido do arquivo do front — ver data/produtos.js) —
//       e criar uma tabela de PEDIDOS de verdade (hoje eles só existem
//       na memória do processo, em "pedidosFake" abaixo: reiniciar o
//       servidor apaga tudo). Criar uma camada "repositório" pro resto
//       do código não saber se os dados vêm de arquivo, de SQL, etc.
//   [ ] Webhook de verdade: em POST /api/webhook/mercadopago, buscar o
//       pagamento na API do MP pelo id da notificação, conferir o
//       status e SÓ ENTÃO marcar o pedido como pago no banco — nunca
//       confiar cegamente no corpo da notificação (ela pode ser
//       forjada; a fonte da verdade é sempre uma consulta de volta à
//       API do MP usando o token).
//   [ ] Estoque: cada peça é única (estoque 1). Ao confirmar o
//       pagamento (via webhook), marcar como vendida pra ela sair da
//       vitrine e não ser vendida 2x.
//   [ ] Autenticação da área da artesã (criar/editar/remover peça,
//       ver pedidos). Provavelmente um login simples + sessão/JWT.
//   [ ] Upload das fotos das peças (hoje são arquivos soltos em
//       img/produtos/). Um endpoint de upload + storage (disco
//       ou S3/Cloudinary).
//   [ ] Validação de entrada mais robusta (ex.: com "zod" ou
//       "express-validator") em todos os endpoints que recebem body —
//       hoje o /api/checkout faz só uma checagem manual básica.
//   [ ] Testes (ex.: com "vitest" ou "jest" + "supertest").
//
//  DEPLOY (Vercel) — feito
//  ---------------------------------------------------------
//  Este arquivo roda na Vercel como função serverless (ver
//  api/index.js, que só faz "module.exports = require('../backend/
//  server.js')", e vercel.json, que redireciona /api/* pra ela).
//  Front (HTML/CSS/JS) e backend passaram a ser o MESMO deploy, no
//  mesmo domínio — por isso js/checkout.js chama "/api/checkout"
//  (URL relativa) em vez de um endereço fixo, e por isso só existe
//  BASE_URL (sem uma 2ª variável BACKEND_URL — ver comentário dela
//  mais abaixo).
//
//  VARIÁVEIS DE AMBIENTE (.env)
//  ---------------------------------------------------------
//  Documentadas em backend/.env.example (o .env de verdade, com as
//  chaves reais, NUNCA é commitado — já está no .gitignore). Pra
//  carregá-las, os scripts do package.json usam a flag nativa do
//  Node "--env-file-if-exists=.env" (Node 20.6+; este projeto usa
//  Node 24) — não precisa da lib "dotenv" só pra isso. "-if-exists"
//  é de propósito: o servidor continua subindo normalmente MESMO SEM
//  o .env (que "ainda não existe", como avisado) — só os recursos que
//  dependem das chaves reais (o pagamento em si) ficam no modo "fake"
//  até o arquivo existir.
//
//  COMO RODAR (local, testando só a API)
//   1. cd backend
//   2. npm install        (baixa express + cors + mercadopago)
//   3. npm start          (ou "npm run dev" p/ reiniciar ao salvar)
//   4. abre http://localhost:3001/api/produtos
//  Esse fluxo continua igual (não muda com o deploy na Vercel) — é
//  útil pra testar só o backend, isolado. Pra testar front + backend
//  juntos como na Vercel (URLs relativas funcionando), usar
//  "vercel dev" na raiz do projeto em vez disso.
// ============================================================

const express = require('express');
const cors = require('cors');

// SDK oficial do Mercado Pago (pacote npm "mercadopago", v3 — instalado
// agora que existem credenciais de verdade pra usar). Só os 2 pedaços
// que este arquivo usa: MercadoPagoConfig (configura o client com o
// Access Token) e Preference (cria o link de pagamento do Checkout
// Pro). O require fica aqui em cima INCONDICIONALMENTE — carregar o
// pacote não faz nenhuma chamada de rede sozinho, então não custa nada
// mesmo quando não há token (o client só é instanciado mais abaixo,
// dentro do "if (MERCADOPAGO_ACCESS_TOKEN)").
const { MercadoPagoConfig, Preference } = require('mercadopago');

const produtos = require('./data/produtos');

const app = express();

// PORTA: usa a variável de ambiente PORT se existir (serviços de
// deploy definem essa variável automaticamente); senão, 3001 no
// local. Não é 3000 pra não brigar com outros projetos que
// costumam usar essa porta.
const PORT = process.env.PORT || 3001;

// ---------- CONFIG DO MERCADO PAGO ----------
// Vêm do .env (ver comentário grande acima). Sem ele, todas dão
// "undefined" — por isso o "|| null" e os avisos no log logo abaixo:
// o servidor não trava, só deixa claro que está em modo fake.
//
// SEM dotenv: as variáveis chegam em process.env pela flag nativa do
// Node "--env-file-if-exists=.env" (já configurada nos scripts do
// package.json — ver "COMO RODAR" no topo do arquivo). Não adicionei
// a lib "dotenv" nem require('dotenv').config() aqui: o projeto já
// documentava a decisão de NÃO usá-la (comentário logo acima, escrito
// ANTES deste pedido), e instalar uma 2ª forma de carregar o MESMO
// .env só duplicaria a lógica sem resolver nada que a flag nativa já
// não resolvesse — o próprio README/.env.example do backend também
// descreve esse fluxo sem dotenv. Se um dia o deploy escolhido não
// suportar a flag (serviços bem antigos), aí sim vale reconsiderar.
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || null;
const MERCADOPAGO_PUBLIC_KEY = process.env.MERCADOPAGO_PUBLIC_KEY || null;
// BASE_URL = endereço público do site (front-end E backend juntos —
// ver nota abaixo). É a partir dele que montamos os "back_urls"
// (success/failure/pending) que o Mercado Pago usa pra mandar o
// comprador de volta depois de pagar, e também a "notification_url"
// do webhook. Fallback pro endereço usado em desenvolvimento local
// (python -m http.server / Live Server costumam abrir aqui).
//
// ANTES existia uma 2ª variável, BACKEND_URL, separada do BASE_URL —
// fazia sentido quando front e backend eram pensados como 2 serviços
// hospedados em lugares diferentes (ver TODO "Deploy" acima, que
// citava Render/Railway pro backend). Na Vercel esse projeto passou a
// ser UM deploy só: o Express deste arquivo roda como função
// serverless em /api/* (ver backend/README.md e api/index.js) e o
// HTML/CSS/JS estático é servido do MESMO domínio — então front e
// backend sempre têm a mesma URL pública, e BACKEND_URL ficaria sempre
// igual a BASE_URL. Removê-la evita 2 variáveis pra configurar em vez
// de 1, e principalmente evita o risco de alguém configurar só uma
// das duas na Vercel e o webhook apontar pro lugar errado.
const BASE_URL = process.env.BASE_URL || 'http://localhost:8765';

// Client do Mercado Pago: instanciado 1 VEZ (não a cada requisição) —
// é só configuração (guarda o token), reaproveitar a mesma instância
// em todo POST /api/checkout evita recriar o objeto à toa. Só existe
// quando há token: sem ele, "mp" fica null e a rota cai no fallback
// fake (ver o handler de /api/checkout, mais abaixo).
const mp = MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
  : null;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.warn(
    '⚠️  MERCADOPAGO_ACCESS_TOKEN não configurado — POST /api/checkout vai devolver ' +
      'um checkout_url FAKE (ver backend/.env.example).'
  );
} else if (MERCADOPAGO_ACCESS_TOKEN.startsWith('APP_USR-')) {
  // Aviso, não erro: o servidor sobe normalmente, mas quem estiver
  // rodando "npm run dev" esperando testar sem risco precisa saber
  // ANTES de clicar em "Finalizar Compra". Prefixo "APP_USR-" = chave
  // de PRODUÇÃO no Mercado Pago (dinheiro de verdade); a de
  // sandbox/teste vem com prefixo "TEST-". Ver a mensagem que
  // acompanha esta entrega pra mais detalhes.
  console.warn(
    '⚠️  MERCADOPAGO_ACCESS_TOKEN começa com "APP_USR-": isso é uma credencial de ' +
      'PRODUÇÃO do Mercado Pago, não de teste/sandbox (essas começam com "TEST-"). ' +
      'Cartões de teste do Mercado Pago só funcionam com credenciais TEST- — com esta ' +
      'chave, POST /api/checkout vai criar uma cobrança REAL.'
  );
}

// ---------- MIDDLEWARES (rodam antes das rotas) ----------

// CORS: o front (index.html etc.) vai rodar num endereço diferente
// do backend (outra porta agora; outro domínio depois). Sem liberar
// CORS, o navegador BLOQUEIA o fetch do front pra cá. Por enquanto
// liberamos geral (origin: '*'); quando for pra produção, trocar
// por uma lista só com o domínio real do site.
app.use(cors());

// Lê corpo de requisição em JSON (ainda não tem POST, mas o
// checkout futuro vai precisar — deixando já ligado).
app.use(express.json());

// Log simplíssimo de cada requisição, pra dar pra acompanhar o que
// chega no terminal enquanto se desenvolve. (Depois dá pra trocar
// por "morgan" ou um logger de verdade.)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

// ---------- ROTAS ----------

// Healthcheck: um jeito rápido de saber "o servidor está de pé?"
// (útil pra monitoramento e pros serviços de deploy).
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, servico: 'anasor-shop-backend', versao: '0.1.0' });
});

// GET /api/produtos — devolve o catálogo inteiro, o MESMO array que
// hoje está em js/produtos.js. A ideia é que, no futuro, o front
// troque o array embutido por:
//
//     fetch('http://localhost:3001/api/produtos').then(r => r.json())
//
// e nada mais no front precise mudar (os campos são idênticos).
app.get('/api/produtos', (_req, res) => {
  res.json(produtos);
});

// GET /api/produtos/:id — uma peça só. Já deixo pronto porque a
// página produto.html é toda baseada em "pega a peça de id X".
// Number(req.params.id): o parâmetro da URL vem sempre como texto.
app.get('/api/produtos/:id', (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    // 404 = "não existe recurso com esse id" (padrão HTTP).
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  res.json(produto);
});

// ============================================================
//  "BANCO DE DADOS" DE PEDIDOS — HOJE SÓ EM MEMÓRIA
// ============================================================
// Array simples, vive só enquanto o processo do Node estiver de pé —
// reiniciar o servidor ("npm run dev" reinicia a cada save) APAGA
// todos os pedidos. É suficiente pra testar o fluxo de ponta a ponta
// agora; vira uma tabela de verdade (Postgres/Mongo) no TODO do topo
// do arquivo. Cada pedido: { id, criadoEm, status, cliente, endereco,
// itens (com o preço JÁ recalculado no servidor), subtotal, frete, total }.
const pedidosFake = [];

// Gera um ID de pedido legível (não é um UUID de verdade, não
// precisa ser: é só pra amarrar o link de pagamento fake ao registro
// em pedidosFake e aparecer nas telas de retorno). Formato:
// "PED-<timestamp>-<3 dígitos aleatórios>".
function gerarIdPedido() {
  const sufixoAleatorio = Math.floor(Math.random() * 900 + 100); // 100-999
  return `PED-${Date.now()}-${sufixoAleatorio}`;
}

// ============================================================
//  POST /api/checkout
// ============================================================
// Recebe { cliente, endereco, itens: [{id, quantidade}] } do
// checkout.html. Devolve { ok, orderId, subtotal, frete, total,
// checkout_url }.
//
// REGRA DE OURO: o preço de cada item é recalculado AQUI, a partir do
// catálogo (produtos, a mesma fonte de GET /api/produtos) — o corpo da
// requisição só manda id + quantidade. O navegador NUNCA é a fonte da
// verdade do preço (alguém poderia abrir o DevTools e mandar
// {preco: 0.01}); só o backend decide quanto cada peça custa.
app.post('/api/checkout', async (req, res) => {
  // "async": precisa poder dar "await" na chamada pro Mercado Pago
  // logo abaixo (criar a Preference é uma requisição de rede — não
  // dá pra fazer isso de forma síncrona). O resto da função (validação,
  // cálculo de preço/frete) continua exatamente igual a antes.
  const { cliente, endereco, itens } = req.body || {};

  // Validação de entrada BÁSICA (checa presença, não formato — o
  // formato já foi validado no navegador por js/checkout.js; aqui é
  // só a defesa contra um body malformado ou vazio). Uma validação
  // completa de verdade é um TODO do topo do arquivo (zod/express-validator).
  //
  // CAMPOS OBRIGATÓRIOS reduzidos pra bater com o formulário: só
  // nome/e-mail (identificar quem comprou e como contatar) e CEP
  // (mínimo pra frete/entrega). Telefone, CPF e o resto do endereço
  // (rua/número/bairro/cidade/estado) viraram opcionais também aqui —
  // sem essa mudança, o backend rejeitaria com 400 um pedido que o
  // PRÓPRIO formulário já deixa enviar sem esses campos, o que
  // derrubaria a mudança inteira silenciosamente no passo seguinte.
  const camposClienteObrigatorios = ['nome', 'email'];
  const camposEnderecoObrigatorios = ['cep'];

  const clienteIncompleto =
    !cliente || camposClienteObrigatorios.some((campo) => !cliente[campo]);
  const enderecoIncompleto =
    !endereco || camposEnderecoObrigatorios.some((campo) => !endereco[campo]);
  const semItens = !Array.isArray(itens) || itens.length === 0;

  if (clienteIncompleto || enderecoIncompleto || semItens) {
    return res.status(400).json({
      erro: 'Dados do pedido incompletos (cliente, endereço ou itens faltando).',
    });
  }

  // Resolve cada item contra o catálogo — ignora silenciosamente um
  // id que não existe mais (peça removida do catálogo entre o
  // carrinho ser montado e o checkout ser enviado) em vez de derrubar
  // o pedido inteiro; se sobrar ZERO itens válidos, aí sim é erro.
  const itensResolvidos = itens
    .map((item) => {
      const produto = produtos.find((p) => String(p.id) === String(item.id));
      if (!produto) return null;
      const quantidade = Math.max(1, Number(item.quantidade) || 1);
      return {
        id: produto.id,
        nome: produto.nome,
        precoUnitario: produto.preco, // <- do catálogo, NUNCA do body
        quantidade,
        subtotal: produto.preco * quantidade,
      };
    })
    .filter(Boolean);

  if (itensResolvidos.length === 0) {
    return res.status(400).json({
      erro: 'Nenhum dos itens do carrinho foi encontrado no catálogo.',
    });
  }

  // arredondarCentavos: soma de números com casas decimais em ponto
  // flutuante (JS) pode dar "499.70000000000005" em vez de "499.7" —
  // arredonda pra 2 casas de verdade, senão esse resto sujo vazaria
  // pro JSON da resposta (o front até formataria certo com
  // formatarPreco(), mas a API ficaria com uma aparência descuidada).
  const arredondarCentavos = (valor) => Math.round(valor * 100) / 100;

  const subtotal = arredondarCentavos(
    itensResolvidos.reduce((soma, item) => soma + item.subtotal, 0)
  );

  // FRETE: sempre grátis (decisão do dono, Etapa 1) — o custo já está
  // embutido no preço de cada peça (js/produtos.js), pra todo o
  // Brasil, sem limiar por valor de compra. "frete: 0" explícito (não
  // "null"/"A calcular" como antes) porque agora é um fato sempre
  // verdadeiro, não uma condição.
  const frete = 0;
  const total = subtotal + frete;

  const orderId = gerarIdPedido();

  pedidosFake.push({
    id: orderId,
    criadoEm: new Date().toISOString(),
    status: 'aguardando_pagamento',
    cliente,
    endereco,
    itens: itensResolvidos,
    subtotal,
    frete,
    total,
  });

  // ---------- AQUI ENTRA O MERCADO PAGO DE VERDADE ----------
  // SEM token (variável não configurada): mantém o link FAKE de
  // sempre, dentro do próprio site, simulando "pagamento pendente" —
  // é a resposta mais honesta possível sem um pagamento de verdade
  // ter acontecido. Isso preserva o modo "stub" pra quem clonar o
  // projeto sem credenciais (ver o aviso no console, lá em cima).
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return res.json({
      ok: true,
      orderId,
      subtotal,
      frete,
      total,
      checkout_url: `${BASE_URL}/pedido-pendente.html?order_id=${orderId}`,
    });
  }

  // COM token: cria a Preference de verdade na API do Mercado Pago —
  // "checkout_url" passa a ser o "init_point" dela, o link real do
  // Checkout Pro (onde o comprador digita o cartão). O pedido já foi
  // salvo em pedidosFake ANTES desta chamada (linha acima) — assim,
  // mesmo se a chamada ao Mercado Pago falhar, o registro do pedido
  // não se perde (fica "aguardando_pagamento" órfão, recuperável).
  try {
    // AUTO_RETURN: o Mercado Pago só aceita "auto_return: 'approved'"
    // quando "back_urls.success" é uma URL PÚBLICA de verdade (https,
    // domínio real) — testado na prática ao configurar isto: com
    // back_urls apontando pra "http://localhost:8765" (nosso BASE_URL
    // padrão de dev), a API rejeitava a Preference INTEIRA com
    // "auto_return invalid. back_url.success must be defined", mesmo
    // com os 3 back_urls presentes e bem formados. Sem auto_return,
    // exatamente o mesmo back_urls com localhost é aceito numa boa —
    // então a causa é só essa combinação (auto_return + URL não
    // pública), não os back_urls em si. Por isso: só manda
    // "auto_return" quando BASE_URL não é localhost (ou seja, já em
    // produção/deploy). Em dev, o comprador simplesmente precisa
    // clicar em "Voltar ao site" manualmente após pagar — sem
    // auto_return, o Checkout Pro mostra esse botão em vez de
    // redirecionar sozinho.
    const baseUrlEhPublica = !/localhost|127\.0\.0\.1/.test(BASE_URL);

    const preferencia = await new Preference(mp).create({
      body: {
        items: itensResolvidos.map((item) => ({
          id: String(item.id),
          title: item.nome,
          quantity: item.quantidade,
          unit_price: item.precoUnitario,
          currency_id: 'BRL',
        })),
        // "name" recebe o nome completo direto — o Mercado Pago aceita
        // (não EXIGE separar em first/last name pro Checkout Pro); os
        // outros dados de cliente/endereço já foram validados acima e
        // ficam guardados em pedidosFake, não precisam ir todos pro MP.
        payer: { name: cliente.nome, email: cliente.email },
        back_urls: {
          success: `${BASE_URL}/pedido-confirmado.html?order_id=${orderId}`,
          pending: `${BASE_URL}/pedido-pendente.html?order_id=${orderId}`,
          failure: `${BASE_URL}/pedido-erro.html?order_id=${orderId}`,
        },
        ...(baseUrlEhPublica ? { auto_return: 'approved' } : {}),
        // notification_url = mesma BASE_URL do site, já que front e
        // backend agora são o mesmo deploy na Vercel (ver comentário
        // de BASE_URL lá em cima). Em dev local (BASE_URL ainda
        // apontando pra localhost), o Mercado Pago não vai conseguir
        // chamar de volta de verdade — só funciona depois do deploy
        // público, quando BASE_URL estiver configurada na Vercel.
        notification_url: `${BASE_URL}/api/webhook/mercadopago`,
        // external_reference amarra a Preference ao NOSSO orderId —
        // é assim que o webhook (quando implementado de verdade) vai
        // saber qual pedido em pedidosFake marcar como pago.
        external_reference: orderId,
      },
    });

    return res.json({
      ok: true,
      orderId,
      subtotal,
      frete,
      total,
      checkout_url: preferencia.init_point,
    });
  } catch (erro) {
    // NÃO cai pro link fake aqui: se a chamada ao Mercado Pago falhou
    // (credencial inválida, campo rejeitado, rede fora...), fingir
    // sucesso com um link fake seria pior — o comprador acharia que
    // está tudo certo e nunca pagaria nada de verdade. Melhor devolver
    // um erro explícito pro front mostrar "algo deu errado" (ver
    // js/checkout.js, que já trata resposta de erro do endpoint).
    console.error('❌ Falha ao criar Preference no Mercado Pago:', erro?.message || erro);
    return res.status(502).json({
      erro: 'Não foi possível iniciar o pagamento no Mercado Pago. Tente novamente em instantes.',
    });
  }
});

// ============================================================
//  POST /api/webhook/mercadopago
// ============================================================
// O Mercado Pago chama esta URL SOZINHO (não é o navegador do
// comprador) sempre que o status de um pagamento muda — é assim que
// pedidos são confirmados de VERDADE (não pela pessoa "chegar" na
// pedido-confirmado.html, que ela poderia nem alcançar se fechasse a
// aba). Por enquanto este endpoint só EXISTE e responde 200 (o MP
// exige uma resposta rápida; se não receber, ele tenta de novo depois
// e pode até desativar a notificação) — não faz nada com o corpo
// ainda.
//
// TODO, quando MERCADOPAGO_ACCESS_TOKEN existir:
//   1. Ler o "id" do pagamento que vem na notificação (formato varia:
//      às vezes vem em req.query, às vezes no body — conferir a doc
//      atual do MP, o formato já mudou de versão pra versão).
//   2. NUNCA confiar no corpo da notificação sozinho (pode ser forjada
//      por qualquer um que descubra a URL) — sempre CONSULTAR de volta
//      a API do Mercado Pago com esse id + o MERCADOPAGO_ACCESS_TOKEN,
//      e usar o status que a API devolver como fonte da verdade.
//   3. Achar o pedido correspondente (pelo "external_reference" que
//      mandamos na criação da Preference == nosso orderId) e atualizar
//      o status dele (pago / recusado / estornado...) no banco.
//   4. Responder 200 rapidinho (idealmente ANTES de qualquer trabalho
//      pesado — se demorar, o MP reenvia a notificação achando que
//      falhou, e o passo 3 precisa ser IDEMPOTENTE: rodar 2x com a
//      mesma notificação não pode cobrar/enviar 2 vezes).
app.post('/api/webhook/mercadopago', (req, res) => {
  console.log('📩 Webhook do Mercado Pago recebido (stub, nada processado ainda):', req.body);
  res.sendStatus(200);
});

// Qualquer outra rota /api/* que não casou acima -> 404 em JSON
// (em vez do HTML feião padrão do Express).
app.use('/api', (_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// ---------- SOBE O SERVIDOR (SÓ EM LOCAL) ----------
// "require.main === module" é true SÓ quando este arquivo é o ponto
// de entrada do processo Node (ou seja, quando alguém rodou
// "node server.js" / "npm start" direto — o fluxo local de sempre).
// Quando este arquivo é importado por OUTRO módulo via require()
// (é exatamente o que api/index.js faz, pra servir o Express como
// função serverless na Vercel), essa comparação dá false — e
// app.listen() NUNCA é chamado. Isso é essencial na Vercel: lá não
// existe "um processo que fica de pé esperando conexão numa porta"
// (o modelo é serverless: cada requisição é uma invocação própria da
// função); chamar app.listen() lá dentro não quebraria o deploy, mas
// ficaria tentando abrir uma porta que ninguém usa, e são bytes/tempo
// de inicialização desperdiçados em TODA invocação.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Anasor Sobreira — backend no ar`);
    console.log(`  http://localhost:${PORT}/api/produtos`);
    console.log(`  (${produtos.length} peças carregadas do catálogo)\n`);
  });
}

// Exporta o app Express (sem precisar dar "new" nem chamar nada) —
// é o que api/index.js importa pra expor estas MESMAS rotas como
// função serverless na Vercel. Exportar não tem custo nem efeito
// colateral: só disponibiliza o objeto "app" pra quem importar este
// arquivo; quem roda "node server.js" direto nem usa o valor exportado.
module.exports = app;
