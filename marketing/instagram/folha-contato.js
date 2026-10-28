// Gera uma folha de contato (grade) com as 9 capas + 1 exemplo de cada
// outro tipo de slide, pra crítica visual em lote — não faz parte do
// fluxo normal (gerar-posts.js já entrega as artes finais); só uma
// ferramenta de revisão desta rodada.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PASTA = path.resolve(__dirname, '..', '..', '..', 'site-mae', 'instagram-posts');

function dataUri(arquivo) {
  return `data:image/png;base64,${fs.readFileSync(arquivo).toString('base64')}`;
}

async function main() {
  const capas = [];
  for (let n = 1; n <= 9; n++) {
    const nn = String(n).padStart(2, '0');
    const f = path.join(PASTA, `post-${nn}-1-capa.png`);
    if (fs.existsSync(f)) capas.push({ nn, uri: dataUri(f) });
  }
  // Um exemplo de cada tipo de slide do post-01 — procurado pelo SUFIXO
  // do nome (-foto/-porque/-chamada), não pelo número de posição: a
  // posição varia com MAX_FOTOS_EXTRAS e com quantas fotos a peça tem
  // (ver gerar-posts.js), então um nome fixo tipo "post-01-5-porque.png"
  // quebraria em silêncio se isso mudar.
  const sufixos = ['foto', 'porque', 'chamada'];
  const arquivosPost01 = fs.existsSync(PASTA)
    ? fs.readdirSync(PASTA).filter((f) => f.startsWith('post-01-') && f.endsWith('.png'))
    : [];
  const outros = sufixos
    .map((sufixo) => arquivosPost01.find((f) => f.includes(`-${sufixo}.png`)))
    .filter(Boolean)
    .map((nome) => ({ nome, uri: dataUri(path.join(PASTA, nome)) }));

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#EFE3D0; font-family: sans-serif; padding: 40px; }
    h2 { font-family: sans-serif; color:#3E2E22; }
    .grade { display:grid; grid-template-columns: repeat(3, 280px); gap: 20px; }
    .grade img { width:100%; display:block; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .legenda { text-align:center; font-size:13px; color:#3E2E22; margin-top:4px; }
  </style></head><body>
    <h2>Capas (9 posts)</h2>
    <div class="grade">
      ${capas.map((c) => `<div><img src="${c.uri}"><div class="legenda">post-${c.nn}</div></div>`).join('')}
    </div>
    <h2>Outros tipos de slide (exemplo post-01)</h2>
    <div class="grade">
      ${outros.map((o) => `<div><img src="${o.uri}"><div class="legenda">${o.nome}</div></div>`).join('')}
    </div>
  </body></html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 2400 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const altura = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 960, height: altura });
  await page.screenshot({ path: path.join(__dirname, 'folha-contato.png'), fullPage: true });
  await browser.close();
  console.log('Folha de contato: ' + path.join(__dirname, 'folha-contato.png'));
}

main();
