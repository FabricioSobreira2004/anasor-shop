# Tour do Site (@anasor.ceramica / portfólio)

Motion graphics a partir de **capturas reais do site** (Playwright,
quadro a quadro — não o `page.video()` padrão, de baixa qualidade)
compostas em **Remotion** (celular/desktop flutuantes, câmera, wipes,
legendas cinéticas) — mesma stack do motor de Reels
(`marketing/instagram/reels/`), reimplementada aqui num pacote próprio
(ver `DECISOES.md`, raiz de `marketing/instagram/`, sobre por que não
importa direto de `reels/src`).

Duas versões:

- **A — Instagram** (`tour-instagram.mp4`): 1080×1920, ~32s, H.264
  High, yuv420p, faststart — este script não grava som.
- **B — Portfólio/LinkedIn** (`tour-portfolio.mp4`): 1920×1080, ~50s,
  desktop e celular lado a lado, faixa de tecnologias, 4 destaques
  técnicos.

Saída: `E:\projetos\site-mae\tour\` (fora do git) + quadros de
conferência em `tour\_conferencia\` + `tour-loop.gif`/`tour-loop.mp4`
(6-8s, pro README do GitHub, fica sempre mudo, de propósito).

**Narração (rodada 5):** `tour-instagram.mp4`/`tour-portfolio.mp4`
ganham narração depois, com
`node marketing/instagram/narracao/narrar.js` (sobrescreve o mesmo
`.mp4`, arquivando o mudo original em `tour\_mudo\`) — rode de novo
depois de regenerar o tour com `tour.js`, senão ele fica sem voz.
`tour-loop.mp4`/`.gif` NÃO entram nessa lista (ficam mudos).

## Como rodar

Primeira vez:

```
cd marketing/instagram/tour
npm install
npx playwright install chromium
```

**Antes de qualquer coisa**, aponte TEMP/TMP/cache pra um disco com
espaço — ver "Por que o disco C: importa" abaixo:

```powershell
$env:TEMP = "D:\anasor-tour-tmp\tempdir"        # ou qualquer pasta sua num disco com espaço
$env:TMP = "D:\anasor-tour-tmp\tempdir"
$env:PLAYWRIGHT_BROWSERS_PATH = "D:\anasor-tour-tmp\playwright-browsers"
```

1. **Suba o servidor local** (dentro de `marketing/instagram/tour`):

   ```powershell
   $env:FORCAR_DEMO = '1'
   node src\servidor-local.js
   ```

   Confirme no log a linha `🔒 MODO DEMONSTRAÇÃO FORÇADO` — igual ao
   pedido no `CLAUDE.md` da raiz do repositório. Fica no ar em
   `http://localhost:8765` (front-end estático + API de
   `backend/server.js`, sem tocar em `backend/server.js`,
   `vercel.json` nem `api/index.js` — ver `DECISOES.md` sobre por que
   não usei `vercel dev`).

2. **Capture** (com o servidor do passo 1 no ar, noutro terminal):

   ```
   node src\capturar.js --device mobile
   node src\capturar.js --device desktop
   ```

   Nenhum pedido é enviado de verdade (nunca clica em "Ir para
   Pagamento"), nenhum pagamento é gerado. Saída:
   `.tmp\capturas\<device>\*.mp4` + `manifest.json`.

3. **Componha e renderize**:

   ```
   node tour.js --versao a       # Instagram
   node tour.js --versao b       # portfólio
   node tour.js --versao ambas
   ```

4. **Loop curto pro README** (precisa da Versão A já renderizada):

   ```
   node src\loop.js
   ```

## Por que o disco C: importa

Mesmo motivo do motor de Reels (ver `reels/README.md`): Remotion, o
Chromium que ele controla e o ffmpeg escrevem bastante coisa
temporária durante captura/render. Se o C: estiver cheio (**era 0
bytes livres** neste PC quando esta rodada foi feita — ver
`DECISOES.md`), tudo falha com erros confusos. `TEMP`/`TMP`/
`PLAYWRIGHT_BROWSERS_PATH` apontando pra outro disco resolve sem
precisar liberar espaço no C:.

## Estrutura do código

- `src/servidor-local.js` — servidor de captura (estático + API de
  `backend/server.js`), só pra esta rodada.
- `src/dispositivos.js` — perfis de dispositivo (iPhone 15 real via
  `playwright.devices`, desktop 1440×900).
- `src/captura-ferramentas.js` — primitivas de captura quadro a quadro
  (rolagem com easing, toque real com indicador visual, captura de
  `<video>` no próprio ritmo dele, codificação em `.mp4`).
- `src/cenas-mobile.js` / `src/cenas-desktop.js` — o roteiro de
  CAPTURA (o que navegar/tocar/rolar em cada cena).
- `src/capturar.js` — CLI da captura.
- `src/componentes.js` — peças visuais da composição (marca d'água,
  selo, legenda cinética, vinheta/grão, molduras genéricas de
  celular/desktop, faixa de tecnologias, destaque técnico).
- `src/roteiro-mobile.js` / `src/roteiro-desktop.js` — o roteiro de
  COMPOSIÇÃO (que clipe, quanto tempo, qual legenda) — lê a duração
  REAL de cada clipe do manifesto, não um número fixo.
- `src/templates/TourMobile.js` / `TourDesktop.js` — o motor Remotion
  de cada versão.
- `src/Root.js` / `src/index.js` — registro das 2 composições.
- `tour.js` — CLI de composição/render (bundle, copia clipes pra
  `public/`, renderiza, passo final de ffmpeg, quadros de conferência,
  ffprobe).
- `src/loop.js` — recorte curto (GIF+MP4) do `tour-instagram.mp4` pro
  README do GitHub.

## Antes de mudar o roteiro de captura

Os nomes dos clipes (`home-hero`, `produto-galeria`, etc.) são a ponte
entre `cenas-mobile.js`/`cenas-desktop.js` (captura) e
`roteiro-mobile.js`/`roteiro-desktop.js` (composição) — mudar um nome
só de um lado quebra a composição em silêncio (`manifest[nome]`
undefined). Rode `node tour.js` de novo depois de qualquer mudança na
captura pra conferir.
