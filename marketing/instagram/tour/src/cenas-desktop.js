// Roteiro de CAPTURA do desktop (Rodada 4 — Tour do Site). Só as 4
// cenas específicas de desktop (Home com menu, listagem com filtros/
// busca, produto, checkout) — produto e checkout mobile já cobrem a
// interação "de verdade" (toque); aqui o que importa é mostrar o
// LAYOUT desktop (sticky, menu, filtros ao lado) pra Versão B.
const { manterFoto, rolarEmArrastos, esperarCampoPreenchido, criarFabricaCena } = require('./captura-ferramentas');
const { VELOCIDADE_MAX_PX_S, ID_PRODUTO_PRINCIPAL, CPF_TESTE, CEP_TESTE } = require('./dispositivos');

const VMAX = VELOCIDADE_MAX_PX_S.desktop;

async function capturarDesktop(page, dirBase, baseUrl, manifest) {
  const cena = criarFabricaCena('desktop', dirBase, manifest);

  await cena('desktop-home', async (dir, c) => {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await manterFoto(page, dir, c, 60);
  });

  await cena('desktop-listagem', async (dir, c) => {
    await page.goto(`${baseUrl}/ceramica.html`, { waitUntil: 'networkidle' });
    await manterFoto(page, dir, c, 25);
    // .focus() (não .click()) — achado rodando a captura várias vezes
    // (Rodada 6): o .click() falhava com "element is not stable" em
    // ~2 de cada 3 rodadas (timeout de 30s esperando o campo parar de
    // "mexer" — provável animação/reflow ainda em andamento mesmo
    // depois de "networkidle"). .focus() só precisa do elemento
    // existir no DOM, não da posição dele estar visualmente estável.
    await page.locator('#busca').focus();
    await page.type('#busca', 'caneca', { delay: 70 });
    await manterFoto(page, dir, c, 55);
    // Rolagem suave (pedido explícito da Rodada 6, item B1, "e
    // desktop") — mesmo motor da mobile, limite de velocidade mais
    // alto (600px/s, viewport maior). Mostra mais resultados da busca
    // sem precisar de outra cena só pra isso.
    const alturaPagina = await page.evaluate(() => document.body.scrollHeight);
    const maximo = Math.max(0, alturaPagina - page.viewportSize().height);
    await rolarEmArrastos(page, dir, c, { de: 0, para: Math.round(maximo * 0.5), velocidadeMaxPxS: VMAX, dispositivo: 'desktop', cena: 'desktop-listagem' });
    await manterFoto(page, dir, c, 20);
  });

  await cena('desktop-produto', async (dir, c) => {
    await page.goto(`${baseUrl}/produto.html?id=${ID_PRODUTO_PRINCIPAL}`, { waitUntil: 'networkidle' });
    await manterFoto(page, dir, c, 70);
  });

  await cena('desktop-checkout', async (dir, c) => {
    await page.goto(`${baseUrl}/checkout.html`, { waitUntil: 'networkidle' });
    await page.fill('#nome', 'Cliente Exemplo');
    await page.fill('#email', 'exemplo@exemplo.com');
    await page.fill('#telefone', '(21) 98765-4321');
    await page.fill('#cpf', CPF_TESTE);
    await page.fill('#cep', CEP_TESTE);
    await page.locator('#cep').blur();
    await esperarCampoPreenchido(page, '#rua').catch(() => {});
    await page.fill('#numero', '100');
    await manterFoto(page, dir, c, 75);
  });
}

module.exports = { capturarDesktop };
