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
//  WEBHOOK + E-MAIL DE PEDIDO — feito
//  ---------------------------------------------------------
//  POST /api/webhook/mercadopago (mais abaixo) já: valida a assinatura
//  da notificação (WebhookSignatureValidator, SDK oficial), consulta o
//  pagamento DE VERDADE na API do Mercado Pago (nunca confia no corpo
//  da notificação) e, só quando o status vier "approved", manda um
//  e-mail pra Anasor com itens/valor/endereço de entrega/contato do
//  cliente (ver backend/pedido-email.js). Sem isso (ou se o e-mail
//  falhar por qualquer motivo), o endereço completo CONTINUA disponível
//  no metadata da Preference, visível no painel do Mercado Pago — o
//  e-mail é a notificação PROATIVA, o metadata é a rede de segurança.
//
//  NÃO faz parte desta etapa ainda (TODO — próximos passos):
//   [ ] Banco de dados: mover o catálogo pra um Postgres/Mongo
//       (hoje ele é lido do arquivo do front — ver data/produtos.js) —
//       e criar uma tabela de PEDIDOS de verdade (hoje eles só existem
//       na memória do processo, em "pedidosFake" abaixo: reiniciar o
//       servidor apaga tudo). Criar uma camada "repositório" pro resto
//       do código não saber se os dados vêm de arquivo, de SQL, etc.
//       Sem isso, o webhook também não tem como marcar PEDIDOS
//       DUPLICADOS (a mesma notificação reenviada pelo Mercado Pago
//       pode gerar mais de um e-mail pro mesmo pedido — aceitável por
//       ora: o e-mail sempre traz o id do pagamento, dá pra reconhecer
//       duplicata de relance).
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

// SDK oficial do Mercado Pago (pacote npm "mercadopago", v3). Além de
// MercadoPagoConfig/Preference (já usados por POST /api/checkout):
//   - Payment: consulta um pagamento por id (GET /v1/payments/:id) —
//     é o que o webhook usa pra saber o status REAL de um pagamento,
//     nunca confiando no corpo da notificação (ver POST
//     /api/webhook/mercadopago, mais abaixo).
//   - WebhookSignatureValidator/InvalidWebhookSignatureError: o SDK
//     oficial JÁ traz a validação de assinatura HMAC do webhook
//     pronta (comparação em tempo constante, janela de tolerância de
//     relógio) — não precisou ser reimplementada na mão aqui.
// O require fica INCONDICIONAL (igual já era) — carregar o pacote não
// faz nenhuma chamada de rede sozinho, não custa nada mesmo sem token.
const {
  MercadoPagoConfig,
  Preference,
  Payment,
  WebhookSignatureValidator,
} = require('mercadopago');

// Dois acessos ao MESMO catálogo: "produtos" (completo, pra buscar por
// id) e "produtosVisiveis()" (sem as peças "oculto: true", pra listar).
const { produtos, produtosVisiveis } = require('./data/produtos');
const { extrairDadosPedido, formatarReal } = require('./pedido-email');
// Envio dos avisos de pedido pago (e-mail + Telegram, isolados entre si).
const { notificarPedidoAprovado } = require('./notificar-pedido');

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

// ---------- CONFIG DO WEBHOOK (assinatura) E DO E-MAIL ----------
// MERCADOPAGO_WEBHOOK_SECRET: o "segredo" que o painel do Mercado Pago
// mostra ao configurar a URL do webhook — usado por
// WebhookSignatureValidator (POST /api/webhook/mercadopago, mais
// abaixo) pra confirmar que uma notificação realmente veio do Mercado
// Pago, e não de qualquer um que descubra a URL e minta "esse
// pagamento foi aprovado". Ver backend/.env.example.
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || null;

// EMAIL_USER/EMAIL_APP_PASSWORD: a conta Gmail que ENVIA o aviso de
// pedido (SMTP com senha de app, não a senha normal — ver
// backend/.env.example pro passo a passo de gerar uma). EMAIL_DESTINO
// é pra ONDE o aviso vai — normalmente a própria Anasor; separado do
// EMAIL_USER de propósito (a conta que ENVIA não precisa ser a mesma
// que RECEBE, embora possa ser).
const EMAIL_USER = process.env.EMAIL_USER || null;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || null;
const EMAIL_DESTINO = process.env.EMAIL_DESTINO || 'ceramicaecrocheanasor@gmail.com';

// CORREÇÃO (achado do code-review): era um regex de SUBSTRING
// (/localhost|127\.0\.0\.1/.test(BASE_URL)) — "pega" qualquer URL que
// CONTENHA esse texto em qualquer parte, não só quando o host É
// localhost. Era só cosmético enquanto só decidia auto_return/
// notification_url (o pior caso seria perder uma otimização), mas
// agora também decide se o webhook EXIGE assinatura (ver o handler,
// mais abaixo) — uma URL pública que por acaso contivesse a palavra
// "localhost" em algum pedaço (ex.: um domínio de preview da Vercel
// pro branch "fix-localhost-bug") faria o webhook rodar em modo
// permissivo em PRODUÇÃO, sem validar assinatura nenhuma. Em vez do
// regex, compara o HOSTNAME de verdade (via o parser de URL nativo)
// contra os 3 valores que realmente significam "minha própria
// máquina". "fail closed": se BASE_URL não for nem uma URL válida
// (quase impossível — sempre tem um fallback, ver a constante acima),
// trata como "NÃO é localhost" — o lado mais seguro do erro é EXIGIR
// assinatura, não dispensar.
function calcularBaseUrlEhLocalhost(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}
const baseUrlEhLocalhost = calcularBaseUrlEhLocalhost(BASE_URL);

if (!MERCADOPAGO_WEBHOOK_SECRET && !baseUrlEhLocalhost) {
  // Erro (não aviso): em produção, sem o segredo, o webhook REJEITA
  // toda notificação (ver o handler, mais abaixo) — sem isso, qualquer
  // um que descobrisse a URL poderia forjar "paguei!" pra Anasor. Só
  // em localhost (dev, sem o segredo configurado ainda) o webhook roda
  // em modo permissivo.
  console.error(
    '❌ MERCADOPAGO_WEBHOOK_SECRET não configurado em produção — POST /api/webhook/mercadopago ' +
      'vai REJEITAR (401) toda notificação até essa variável existir (ver backend/.env.example).'
  );
}

if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
  console.warn(
    '⚠️  EMAIL_USER/EMAIL_APP_PASSWORD não configurados — quando um pagamento for aprovado, ' +
      'o webhook NÃO vai conseguir notificar a Anasor por e-mail (ver backend/.env.example). ' +
      'O endereço de entrega continua disponível no metadata da Preference, no painel do Mercado Pago.'
  );
}

// Telegram é OPCIONAL (2º canal de aviso, ver pedido-telegram.js):
// só informa, sem alarme. Checa a PRESENÇA das variáveis — o valor do
// token nunca é impresso.
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  console.log(
    'ℹ️  TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID não configurados — o aviso de venda paga sai só por e-mail ' +
      '(ver backend/.env.example).'
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
  // produtosVisiveis(): a lista PÚBLICA não pode revelar a peça de
  // teste oculta. A rota por id (abaixo) e o checkout usam o catálogo
  // completo de propósito — é o que faz o link direto
  // produto.html?id=9001 e o pagamento dela funcionarem.
  res.json(produtosVisiveis());
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

// Gera um código de pedido legível (não é um UUID de verdade, não
// precisa ser: é só pra amarrar o link de pagamento ao registro em
// pedidosFake, aparecer nas telas de retorno E virar o
// "external_reference" da Preference no Mercado Pago — é por ESSE
// código que o webhook reconhece de qual pedido um pagamento aprovado
// é, e que ele aparece no assunto do e-mail de aviso pra Anasor, ver
// pedido-email.js). Formato "AS-AAAAMMDD-XXXX" (AS = Anasor Sobreira):
// mais legível que o antigo "PED-<timestamp>-<3 dígitos>" num e-mail
// ou numa tela de retorno — a data já vem embutida, sem precisar
// decodificar um timestamp Unix pra saber quando o pedido foi feito.
// 4 caracteres alfanuméricos (36^4 ≈ 1,7 milhão de combinações) dão
// uma chance de colisão desprezível mesmo em dias de pico — não
// precisa ser criptograficamente aleatório pra isso, só "praticamente
// único por dia".
const ALFABETO_SUFIXO_PEDIDO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function gerarIdPedido() {
  const dataAAAAMMDD = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let sufixo = '';
  for (let i = 0; i < 4; i++) {
    sufixo += ALFABETO_SUFIXO_PEDIDO[Math.floor(Math.random() * ALFABETO_SUFIXO_PEDIDO.length)];
  }
  return `AS-${dataAAAAMMDD}-${sufixo}`;
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

  // Validação de entrada (Etapa 3, AJUSTADA — antes só checava
  // PRESENÇA de nome/e-mail/CEP; o resto do endereço virou opcional
  // "pra bater com o formulário", na época em que o formulário
  // também os tratava como opcionais). Agora o front exige endereço
  // completo (checkout.html/js/checkout.js) — o backend bloqueando
  // menos do que o front permitiria um pedido sem endereço chegar
  // aqui direto via fetch/curl, ignorando o navegador inteiro. NUNCA
  // confia só na validação do front: é só a primeira camada, feita
  // pra UX; esta aqui é quem de fato decide o que entra.
  const camposClienteObrigatorios = ['nome', 'email'];
  const camposEnderecoObrigatorios = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'];

  const clienteIncompleto =
    !cliente || camposClienteObrigatorios.some((campo) => !String(cliente[campo] || '').trim());
  const enderecoIncompleto =
    !endereco || camposEnderecoObrigatorios.some((campo) => !String(endereco[campo] || '').trim());
  const semItens = !Array.isArray(itens) || itens.length === 0;

  if (clienteIncompleto || enderecoIncompleto || semItens) {
    return res.status(400).json({
      erro: 'Dados do pedido incompletos (cliente, endereço ou itens faltando).',
    });
  }

  // Validação de FORMATO (além de presença) — e-mail e CEP são os 2
  // campos onde um valor presente, mas mal formado, causaria dano real
  // depois (e-mail de contato inválido; CEP que a Anasor não consegue
  // usar pra postar). O resto do endereço (rua/bairro/cidade) é texto
  // livre por natureza, sem "formato errado" possível de checar aqui.
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cliente.email).trim());
  const cepSoDigitos = String(endereco.cep).replace(/\D/g, '');
  const cepValido = cepSoDigitos.length === 8;
  const UFS_VALIDAS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
  ];
  const estadoValido = UFS_VALIDAS.includes(String(endereco.estado).trim().toUpperCase());

  if (!emailValido || !cepValido || !estadoValido) {
    return res.status(400).json({
      erro: 'Dados do pedido inválidos (confira e-mail, CEP e UF).',
    });
  }

  // Sanitização/limite de tamanho: corta qualquer campo de texto num
  // comprimento razoável (defesa contra alguém mandar um body gigante
  // via curl/fetch direto, ignorando os limites que o <input> do
  // navegador já impõe) e remove caracteres de controle invisíveis
  // (podem vir de copiar/colar). Nada disso vira HTML em lugar nenhum
  // hoje (nem aqui, nem no painel do Mercado Pago, que só mostra
  // texto puro) — não é proteção contra XSS, é só higiene de dado.
  const limitar = (valor, max) =>
    String(valor || '')
      .replace(/[\x00-\x1F\x7F]/g, '') // caracteres de controle (tab/newline inclusos — campos de 1 linha só)
      .trim()
      .slice(0, max);

  const clienteSaneado = {
    nome: limitar(cliente.nome, 120),
    email: limitar(cliente.email, 180).toLowerCase(),
    telefone: limitar(cliente.telefone, 20),
    cpf: limitar(cliente.cpf, 14),
  };
  const enderecoSaneado = {
    cep: limitar(endereco.cep, 9),
    rua: limitar(endereco.rua, 200),
    numero: limitar(endereco.numero, 20),
    complemento: limitar(endereco.complemento, 120),
    bairro: limitar(endereco.bairro, 100),
    cidade: limitar(endereco.cidade, 100),
    estado: limitar(endereco.estado, 2).toUpperCase(),
  };

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
    cliente: clienteSaneado,
    endereco: enderecoSaneado,
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
    // reaproveita o MESMO teste já calculado lá em cima (baseUrlEhLocalhost)
    // em vez de repetir o regex aqui — CORREÇÃO (achado do code-review):
    // duas cópias independentes do mesmo regex são 2 lugares pra lembrar
    // de atualizar se um dia a regra mudar (ex.: passar a tratar um
    // subdomínio de staging como "não público" também).
    const baseUrlEhPublica = !baseUrlEhLocalhost;

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
        // (não EXIGE separar em first/last name pro Checkout Pro).
        payer: { name: clienteSaneado.nome, email: clienteSaneado.email },
        back_urls: {
          success: `${BASE_URL}/pedido-confirmado.html?order_id=${orderId}`,
          pending: `${BASE_URL}/pedido-pendente.html?order_id=${orderId}`,
          failure: `${BASE_URL}/pedido-erro.html?order_id=${orderId}`,
        },
        ...(baseUrlEhPublica ? { auto_return: 'approved' } : {}),
        // notification_url: SÓ quando BASE_URL é pública (mesmo motivo
        // do auto_return, acima) — mandar uma notification_url
        // apontando pra "http://localhost:..." não quebra a Preference
        // (ao contrário do auto_return), mas também não serve pra
        // nada: o Mercado Pago roda nos servidores DELE, nunca vai
        // conseguir alcançar o localhost de ninguém. Omitir em vez de
        // mandar um valor inútil deixa isso explícito.
        ...(baseUrlEhPublica ? { notification_url: `${BASE_URL}/api/webhook/mercadopago` } : {}),
        // external_reference amarra a Preference ao NOSSO código de
        // pedido — é assim que o webhook (POST /api/webhook/mercadopago,
        // mais abaixo) sabe qual pedido um pagamento aprovado é, e é o
        // código que aparece no e-mail de aviso pra Anasor.
        external_reference: orderId,
        // METADATA: a forma mais simples e gratuita da Anasor ver os
        // detalhes de um pedido pago de verdade sem banco de dados —
        // tanto no e-mail automático (webhook + pedido-email.js, ver
        // comentário completo lá) quanto, de reserva, direto no painel
        // do Mercado Pago, caso o e-mail falhe por algum motivo. Campos
        // achatados (não aninhados): a API de metadata do Mercado Pago
        // espera pares chave/valor simples, não objetos dentro de
        // objetos. "|| ''" NÃO entra aqui: limitar() (acima) sempre
        // devolve string ("" no mínimo), nunca undefined/null.
        metadata: {
          pedido_id: orderId,
          cliente_telefone: clienteSaneado.telefone,
          cliente_cpf: clienteSaneado.cpf,
          endereco_cep: enderecoSaneado.cep,
          endereco_rua: enderecoSaneado.rua,
          endereco_numero: enderecoSaneado.numero,
          endereco_complemento: enderecoSaneado.complemento,
          endereco_bairro: enderecoSaneado.bairro,
          endereco_cidade: enderecoSaneado.cidade,
          endereco_uf: enderecoSaneado.estado,
          // itens_resumo/subtotal/total: redundância de propósito —
          // o webhook PREFERE additional_info.items (o Mercado Pago
          // costuma ecoar os "items" acima quando consulta o
          // pagamento), mas nem toda forma de pagamento garante isso;
          // este resumo em texto plano é a rede de segurança pro
          // e-mail NUNCA sair sem nenhuma informação de item (ver
          // extrairDadosPedido, pedido-email.js). limitar(..., 450)
          // (mesma função já usada pra saneamento de cliente/endereço,
          // acima) — CORREÇÃO (achado do code-review): um carrinho com
          // MUITOS itens/nomes longos podia gerar uma string sem
          // limite nenhum e estourar o tamanho que a API de metadata
          // do Mercado Pago aceita, derrubando a Preference inteira —
          // ironia de uma "rede de segurança" travar o pedido de
          // verdade. Truncar aqui é seguro: é só o FALLBACK; a fonte
          // preferida (additional_info.items, no pagamento) não passa
          // por este limite.
          itens_resumo: limitar(
            itensResolvidos
              .map((item) => `${item.quantidade}x ${item.nome} (${formatarReal(item.precoUnitario)} cada)`)
              .join('; '),
            450
          ),
          subtotal,
          total,
        },
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
// aba). Fluxo completo:
//   1. Identifica o tipo da notificação e o id do pagamento. Notificação
//      que não é de pagamento (ex.: "merchant_order") -> 200 e pronto,
//      não há o que processar aqui.
//   2. VALIDA A ASSINATURA (x-signature/x-request-id contra
//      MERCADOPAGO_WEBHOOK_SECRET, via WebhookSignatureValidator do SDK
//      oficial) — sem isso, qualquer um que descobrisse esta URL
//      poderia mandar um POST fingindo "paguei!" e dar início a um
//      envio sem pagamento nenhum ter acontecido.
//   3. NUNCA confia no corpo da notificação pra decidir o que fazer —
//      consulta o pagamento DE VERDADE na API do Mercado Pago (GET
//      /v1/payments/:id, com o ACCESS_TOKEN) e só segue se o status
//      que a API devolveu for "approved".
//   4. Monta os dados do pedido a partir do PRÓPRIO pagamento
//      (metadata + additional_info.items + payer — ver
//      extrairDadosPedido, pedido-email.js) e avisa a Anasor por e-mail
//      E pelo Telegram (notificar-pedido.js), AGUARDANDO os dois
//      terminarem (ou estourarem o timeout curto de cada um) antes de
//      responder (numa função serverless a execução para assim que a
//      resposta sai — sem o "await", os avisos poderiam nunca sair).
// Responde 200 sempre que não há nada de recuperável a fazer (tipo
// errado, pagamento não aprovado) e também depois dos avisos, MESMO se
// um ou os dois falharem: um 500 ali faria o Mercado Pago reenviar e o
// canal que deu certo mandaria o aviso DUPLICADO. Só devolve 500 quando
// a falha é ao CONSULTAR o pagamento (aí nenhum aviso saiu ainda e a
// nova tentativa do Mercado Pago pode resolver).
app.post('/api/webhook/mercadopago', async (req, res) => {
  // Formato da notificação (documentado, mas já mudou de versão pra
  // versão no passado — por isso checar os 2 formatos conhecidos pro
  // TIPO): querystring "?type=payment&data.id=123" (atual) ou, em
  // integrações mais antigas, "?topic=payment" / um body { type }.
  const tipo = req.body?.type || req.query?.type || req.query?.topic;

  // paymentId vem SÓ da query string ("data.id"), nunca do corpo —
  // CORREÇÃO (achado do code-review): a assinatura (x-signature, logo
  // abaixo) cobre especificamente o "data.id" da QUERY STRING, nunca o
  // do corpo. Antes este código preferia "req.body?.data?.id" — um
  // atacante que conseguisse REPETIR uma notificação antiga, válida
  // (mesma query string, mesma assinatura, dentro da janela de
  // tolerância) só precisaria trocar o "data.id" do CORPO pra apontar
  // pra outro pagamento: a assinatura continuaria batendo (ela nunca
  // olhou pro corpo), mas o pagamento CONSULTADO/PROCESSADO seria um
  // id que a assinatura nunca verificou. Usando só o da query, o id
  // que é validado é SEMPRE o mesmo id que é consultado depois — não
  // há como os dois dessincronizarem.
  // primeiroValorQuery: um parâmetro de querystring REPETIDO
  // (?data.id=1&data.id=2 — pode acontecer por retry de proxy/CDN,
  // não é exclusivo de alguém tentando forçar algo) faz o Express
  // devolver um ARRAY, não string — CORREÇÃO (achado do code-review):
  // sem tratar isso, o "typeof === 'string'" abaixo falhava
  // silenciosamente, dataIdQuery ficava vazio e a notificação era
  // descartada (200, sem processar) mesmo sendo legítima. MESMO
  // critério que o próprio WebhookSignatureValidator do SDK usa
  // internamente pra normalizar os headers (pega o 1º valor de um
  // array) — consistente com o que a assinatura também vai considerar.
  const primeiroValorQuery = (valor) => {
    if (Array.isArray(valor)) return typeof valor[0] === 'string' ? valor[0] : '';
    return typeof valor === 'string' ? valor : '';
  };
  const dataIdQuery = primeiroValorQuery(req.query?.['data.id']) || primeiroValorQuery(req.query?.id);
  const paymentId = dataIdQuery;

  console.log(`📩 Webhook Mercado Pago recebido: type=${tipo || '(vazio)'} id=${paymentId || '(vazio)'}`);

  // Notificação de outro tipo (ex.: merchant_order) ou sem id nenhum
  // -> nada a processar; 200 evita o Mercado Pago reenviar pra sempre
  // algo que a gente nunca vai tratar.
  if (tipo !== 'payment' || !paymentId) {
    return res.sendStatus(200);
  }

  // ---------- VALIDAÇÃO DE ASSINATURA ----------
  if (MERCADOPAGO_WEBHOOK_SECRET) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers['x-signature'],
        xRequestId: req.headers['x-request-id'],
        dataId: dataIdQuery,
        secret: MERCADOPAGO_WEBHOOK_SECRET,
        // 300s = 5 minutos de tolerância de relógio — generoso o
        // bastante pra qualquer deriva de horário normal entre os
        // servidores do Mercado Pago e a função serverless da Vercel,
        // mas ainda curto o bastante pra rejeitar uma notificação
        // "replay" (alguém capturando e reenviando uma chamada antiga).
        toleranceSeconds: 300,
      });
    } catch (erro) {
      console.warn(
        '⚠️  Webhook com assinatura inválida, rejeitando — reason:',
        erro?.reason || erro?.message || erro
      );
      return res.sendStatus(401);
    }
  } else if (!baseUrlEhLocalhost) {
    // Produção sem o segredo configurado: REJEITA tudo (não dá pra
    // confirmar que a notificação é legítima). Ver o aviso que já
    // sobe no console na inicialização do servidor, mais acima.
    console.error('❌ Webhook rejeitado: MERCADOPAGO_WEBHOOK_SECRET não configurado em produção.');
    return res.sendStatus(401);
  } else {
    // Só localhost, só sem o segredo configurado ainda: modo
    // permissivo pra dar pra testar o resto do fluxo localmente antes
    // de ter um webhook de verdade cadastrado no painel do Mercado
    // Pago (que é quando o segredo passa a existir).
    console.warn('⚠️  Webhook sem validação de assinatura (modo permissivo — só ativo em localhost).');
  }

  // ---------- CONSULTA O PAGAMENTO DE VERDADE ----------
  if (!mp) {
    console.warn('⚠️  Webhook recebido, mas MERCADOPAGO_ACCESS_TOKEN não configurado — não dá pra consultar o pagamento.');
    return res.sendStatus(200); // sem token, não há nada mais a fazer — e reenviar não resolveria
  }

  let pagamento;
  try {
    pagamento = await new Payment(mp).get({ id: paymentId });
  } catch (erro) {
    console.error(`❌ Falha ao consultar o pagamento ${paymentId} na API do Mercado Pago:`, erro?.message || erro);
    return res.sendStatus(500); // pode ser falha de rede passageira — vale o MP reenviar
  }

  if (pagamento.status !== 'approved') {
    // pending/rejected/cancelled/in_process/refunded... — nada a
    // notificar ainda. Quando (se) o status mudar pra "approved", o
    // Mercado Pago manda uma NOVA notificação, e caímos aqui de novo.
    console.log(`ℹ️  Pagamento ${paymentId} com status "${pagamento.status}" — nenhuma notificação enviada.`);
    return res.sendStatus(200);
  }

  // ---------- AVISA A ANASOR (E-MAIL + TELEGRAM) ----------
  const dadosPedido = extrairDadosPedido(pagamento);

  // "await" ANTES de responder: numa função serverless (Vercel), o
  // processo pode ser encerrado assim que a resposta HTTP sai — sem
  // aguardar, os avisos arriscariam nunca terminar. notificarPedidoAprovado
  // roda os dois canais em paralelo, cada um com timeout próprio, e
  // NUNCA lança erro: cada falha é registrada lá só pelo TIPO (sem
  // dados do cliente nem token) — ver backend/notificar-pedido.js.
  await notificarPedidoAprovado(dadosPedido, { destinoEmail: EMAIL_DESTINO });

  // 200 mesmo se algum aviso falhou (ver o comentário acima da rota):
  // reenviar a notificação duplicaria o aviso do canal que funcionou,
  // e configuração ausente não se resolve sozinha com nova tentativa.
  return res.sendStatus(200);
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
