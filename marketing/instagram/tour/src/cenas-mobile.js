// Roteiro de CAPTURA do celular (Rodada 4 — Tour do Site). Cada função
// é uma cena: navega, interage com toques/rolagem REAIS no site de
// verdade (servidor local em modo demonstração) e devolve os frames
// pro chamador codificar em .mp4. Nenhuma peça vendida é comprada de
// verdade, nenhum pagamento é gerado — ver capturar.js.
const {
  manterFoto, rolarEmArrastos, arrastarCarrossel, instalarIndicadorToque,
  tocarComIndicador, capturarVideo, esperarCampoPreenchido, criarFabricaCena,
} = require('./captura-ferramentas');
const { FPS, VELOCIDADE_MAX_PX_S, ID_PRODUTO_PRINCIPAL, ID_PRODUTO_VENDIDO, CPF_TESTE, CEP_TESTE } = require('./dispositivos');

const VMAX = VELOCIDADE_MAX_PX_S.mobile;

async function capturarMobile(page, dirBase, baseUrl, manifest) {
  await instalarIndicadorToque(page);
  const cena = criarFabricaCena('mobile', dirBase, manifest);

  // 1) Home + hero
  await cena('home-hero', async (dir, c) => {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await manterFoto(page, dir, c, 45);
  });

  // 2) Rolagem pelos carrosséis (Queridinhos, subcategorias) — pedido
  // explícito da Rodada 6 (item B): arrastos curtos com pausa, nunca
  // 1 rolagem contínua. Distância FIXA (não % da altura da página) —
  // achado capturando de verdade: a Home tem quase 13.000px de altura
  // no mobile (hero + várias vitrines empilhadas), então uma % da
  // altura total virava uma rolagem de milhares de px, bem mais que o
  // "mostrar mais um pouco" que a cena pede. 400px (o teto padrão do
  // motor, `distanciaMaximaPx` em captura-ferramentas.js — pedir mais
  // que isso aqui só seria truncado do mesmo jeito) já passa da hero
  // pra dentro da 1ª vitrine, o bastante pra esta cena curta.
  await cena('home-scroll-carrosseis', async (dir, c) => {
    await rolarEmArrastos(page, dir, c, { de: 0, para: 400, velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'home-scroll-1' });

    // Carrossel horizontal (".carrossel-viewport", ex.: "Queridinhos
    // do Ateliê") — pedido explícito: arrasto de 0,7-1,0s com o
    // indicador de toque acompanhando o dedo. `arrastarCarrossel` acha
    // sozinha qual ".carrossel-viewport" está visível (a página tem
    // vários) e devolve `null` se nenhum estiver — degrada bem, não
    // derruba a captura por um seletor que pode não existir se o
    // catálogo mudar o layout.
    const achou = await arrastarCarrossel(page, '.carrossel-viewport', dir, c, { distanciaPx: 260, velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'home-carrossel' });
    if (!achou) await manterFoto(page, dir, c, Math.round(0.8 * FPS));

    // Parte do scrollY REAL da página (não de um número calculado
    // antes) — o arrasto anterior pode ter sido limitado pelo teto de
    // distância do motor (ver nota em captura-ferramentas.js), então
    // confiar num valor pré-calculado criaria um SALTO (a página
    // pularia do ponto real pro ponto "esperado").
    const atual = await page.evaluate(() => window.scrollY);
    await rolarEmArrastos(page, dir, c, { de: atual, para: atual + 400, velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'home-scroll-2' });
    await manterFoto(page, dir, c, Math.round(0.8 * FPS));
  });

  // 3) Card com selo — ACHADO NA 2ª RODADA DE CRÍTICA VISUAL: a 1ª
  // correção (filtrar o "Vendido") trocou pra ceramica.html, mas essa
  // página, SEM subcategoria escolhida, só mostra ladrilhos de
  // subcategoria + 1 card só (a peça vendida de exemplo) — nenhum
  // selo de MÉRITO visível (conferido rodando um script à parte:
  // ceramica.html tem 1 .selo-peca no total, e é o "Vendido"). A Home
  // tem 12 (10 "Queridinha do Ateliê", 1 "Peça Assinada", 1
  // "Vendido") — as vitrines curadas "Queridinhos do Ateliê" etc. Por
  // isso esta cena volta pra Home (não ceramica.html).
  await cena('card-selo', async (dir, c) => {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const y = await page.evaluate(() => {
      // :not(.selo-peca--vendido) — ACHADO NA 1ª RODADA DE CRÍTICA
      // VISUAL: sem esse filtro, o 1º ".selo-peca" da página podia ser
      // o selo "Vendido" (prioridade mais alta — ver CLAUDE.md), que
      // esta cena já mostrava em duplicidade com as cenas dedicadas
      // "vendida-secao"/"vendida-produto". Aqui o pedido é mostrar um
      // selo de MÉRITO (mais-vendido/queridinho/assinada/novidade).
      const selo = document.querySelector('.selo-peca:not(.selo-peca--vendido)');
      if (!selo) return 0;
      const card = selo.closest('.produto-card') || selo;
      const rect = card.getBoundingClientRect();
      return window.scrollY + rect.top - window.innerHeight * 0.3;
    });
    await rolarEmArrastos(page, dir, c, { de: 0, para: Math.max(0, Math.round(y)), velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'card-selo' });
    await manterFoto(page, dir, c, 30);
  });

  // 4) Página da peça: galeria (troca de foto pelas miniaturas, toque
  // real), vídeo, medidas/matéria-prima, upsell "Mais ... do Ateliê"
  await cena('produto-galeria', async (dir, c) => {
    await page.goto(`${baseUrl}/produto.html?id=${ID_PRODUTO_PRINCIPAL}`, { waitUntil: 'networkidle' });
    await manterFoto(page, dir, c, 20);
    const miniaturas = await page.$$('.galeria__thumb');
    for (const thumb of miniaturas.slice(1, 3)) {
      const box = await thumb.boundingBox();
      if (!box) continue;
      await tocarComIndicador(page, dir, c, { x: box.x + box.width / 2, y: box.y + box.height / 2, pausaDepois: false });
      await manterFoto(page, dir, c, 18);
    }
  });

  await cena('produto-video', async (dir, c) => {
    const video = await page.$('.produto-video__player');
    if (!video) { await manterFoto(page, dir, c, 1); return; } // peça sem vídeo-fonte não deveria ser a escolhida, mas não derruba a captura
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), '.produto-video__player');
    await manterFoto(page, dir, c, 10);
    // boundingBox() DEPOIS do scrollIntoView (achado do code-review) —
    // antes era calculado ANTES de rolar, então o toque mirava onde o
    // vídeo estava na posição de rolagem anterior, não onde ele ficou
    // depois de centralizar na tela.
    const box = await video.boundingBox();
    await tocarComIndicador(page, dir, c, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await capturarVideo(page, '.produto-video__player', dir, c, { quadros: 55, fps: FPS });
  });

  await cena('produto-medidas', async (dir, c) => {
    const y = await page.evaluate(() => {
      const el = document.querySelector('.produto-detalhes, .descricao-galeria') || document.body;
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.top - 80;
    });
    const atual = await page.evaluate(() => window.scrollY);
    await rolarEmArrastos(page, dir, c, { de: atual, para: Math.round(y), velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'produto-medidas' });
    await manterFoto(page, dir, c, 20);
  });

  await cena('produto-upsell', async (dir, c) => {
    const y = await page.evaluate(() => {
      const titulos = Array.from(document.querySelectorAll('h2, h3'));
      const el = titulos.find((h) => /do Ateliê/i.test(h.textContent || ''));
      if (!el) return document.body.scrollHeight;
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.top - 100;
    });
    const atual = await page.evaluate(() => window.scrollY);
    await rolarEmArrastos(page, dir, c, { de: atual, para: Math.round(y), velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'produto-upsell' });
    await manterFoto(page, dir, c, 20);
  });

  // 5) Adicionar ao carrinho (mini-carrinho lateral abre sozinho)
  await cena('adicionar-carrinho', async (dir, c) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await manterFoto(page, dir, c, 5);
    const botao = await page.$('.btn-comprar');
    if (!botao) { await manterFoto(page, dir, c, 1); return; } // mesma defesa de "vendida-produto"/"produto-video" — achado do code-review (faltava aqui)
    const box = await botao.boundingBox();
    await tocarComIndicador(page, dir, c, { x: box.x + box.width / 2, y: box.y + box.height / 2, pausaDepois: false });
    await page.waitForSelector('.mini-carrinho', { state: 'visible', timeout: 4000 }).catch(() => {});
    await manterFoto(page, dir, c, 50);
  });

  // 6) Checkout: campos, CEP preenchendo endereço pelo ViaCEP, selos
  await cena('checkout', async (dir, c) => {
    await page.goto(`${baseUrl}/checkout.html`, { waitUntil: 'networkidle' });
    await manterFoto(page, dir, c, 10);
    await page.fill('#nome', 'Cliente Exemplo');
    await page.fill('#email', 'exemplo@exemplo.com');
    await page.fill('#telefone', '(21) 98765-4321');
    await page.fill('#cpf', CPF_TESTE);
    await manterFoto(page, dir, c, 8);
    await page.fill('#cep', CEP_TESTE);
    await page.locator('#cep').blur();
    await manterFoto(page, dir, c, 10);
    await esperarCampoPreenchido(page, '#rua').catch(() => {});
    await manterFoto(page, dir, c, 10);
    await page.fill('#numero', '100');
    const selos = await page.$('.checkout-selos');
    if (selos) await selos.scrollIntoViewIfNeeded();
    await manterFoto(page, dir, c, 50);
  });

  // 7) Peça vendida: "Já encontraram um lar" (listagem) + "Encomendar
  // peça parecida" (página da peça vendida de exemplo, id 33)
  await cena('vendida-secao', async (dir, c) => {
    await page.goto(`${baseUrl}/ceramica.html`, { waitUntil: 'networkidle' });
    const alturaPagina = await page.evaluate(() => document.body.scrollHeight);
    // Não rola até o fim da página — o teto de distância do motor
    // (400px por padrão, ver `distanciaMaximaPx` em
    // captura-ferramentas.js) já evita que esta cena sozinha estoure
    // o tempo do vídeo; passar o percurso máximo como alvo só garante
    // que o teto é o que de fato decide, mesmo se a listagem crescer.
    const maximo = Math.max(0, alturaPagina - page.viewportSize().height);
    await rolarEmArrastos(page, dir, c, { de: 0, para: maximo, velocidadeMaxPxS: VMAX, dispositivo: 'mobile', cena: 'vendida-secao' });
    await manterFoto(page, dir, c, 15);
  });

  await cena('vendida-produto', async (dir, c) => {
    await page.goto(`${baseUrl}/produto.html?id=${ID_PRODUTO_VENDIDO}`, { waitUntil: 'networkidle' });
    const botao = await page.$('.produto-encomenda__btn, .btn-comprar-agora');
    if (botao) await botao.scrollIntoViewIfNeeded();
    await manterFoto(page, dir, c, 36);
  });

  // 8) /links — ".html" direto (achado na Rodada 5, item 1b): "/links"
  // (sem extensão, igual à URL de produção) só funciona em produção
  // por causa da reescrita do vercel.json; aqui bateria no 404 do
  // Express e capturava a PÁGINA DE ERRO (branca) — era essa a
  // "tela toda branca" relatada.
  await cena('links', async (dir, c) => {
    await page.goto(`${baseUrl}/links.html`, { waitUntil: 'networkidle' });
    // 35 (não 45) — ajuste fino pra caber no teto de 45s do vídeo
    // inteiro (Rodada 6, item B2) depois de medir o total real com
    // as cenas de rolagem novas.
    await manterFoto(page, dir, c, 35);
  });
}

module.exports = { capturarMobile };
