# Status da Rodada 2 — "elevar o nível" (modo autônomo)

Atualizado a cada marco. Se o PC cair no meio desta rodada, uma sessão
nova deve ler ESTE arquivo primeiro (não confiar em memória/relatório
antigo) e continuar do que está marcado 🟡/❌.

## A) Posts de feed v3 — ✅ CONCLUÍDO

- 4 layouts de capa alternados (foto cheia / editorial / círculo /
  marrom-dourado) — código em `gerar-posts.js`, função
  `slideCapaPorLayout`. 2 rodadas de crítica visual feitas (achados:
  halo quadrado atrás da marca d'água no layout 4, corrigido com um
  "chip" creme; vão vazio nos layouts 2/4 e nos slides de conteúdo,
  corrigido ancorando o texto no terço de baixo + elementos decorativos).
- Grade do perfil: `_grade-perfil.png` — harmonia conferida visualmente
  (ver DECISOES.md).
- 4 carrosséis de conteúdo novos (post-10 a post-13): Como comprar,
  Cuidados com a peça, Peça única (o que significa), Encomende a sua.
- v2 arquivada em `E:\projetos\site-mae\instagram-posts\_v2\` (posts +
  stories) antes de rodar a v3.
- Saída atual: `E:\projetos\site-mae\instagram-posts\` — 13 posts
  (post-01 a post-13) + stories (post-01 a post-09, só as peças têm
  Story) + `_grade-perfil.png`.
- **Pendente de verificação:** nenhuma — todos os slides foram abertos e
  revisados nesta sessão.

## B) Reels v2 — ✅ CONCLUÍDO

A base v1 já tinha tipografia cinética, legendas palavra-por-palavra,
Ken Burns, máscara circular (vídeo em moldura), selo/faixa de confiança
animados e CTA com botão gummy — mais do que o esperado. v2 adicionou:
`FotoParallax` (2 camadas), `BrilhoEsmalte` (faixa de luz diagonal),
`VinhetaGrao` (overlay único), easing refinado (`EASE_CAMERA`) e área
segura corrigida (selo/marca d'água/faixa fora dos 250px do topo e
420px de baixo — achado da crítica visual, rodada 2).

12 Reels gerados (6 refeitos com o motor v2 + 6 novos, 3 templates:
7 apresentação, 3 detalhes, 2 coleção) — todos 1080×1920, H.264 High,
yuv420p, 30fps, sem áudio, 12,2–14,5s, 2,7–3,7MB (limite 30MB), nada
importante nos 250px topo/420px baixo. ffprobe conferido em todos.
v1 (5 reels — o 6º, r1, foi sobrescrito sem arquivar por um erro de
processo, ver DECISOES.md) arquivada em `reels\_v1\` (+ `_conferencia`).
Saída: `E:\projetos\site-mae\reels\` + `reels\_conferencia\`.

## C) Kit de postagem — ✅ CONCLUÍDO

`marketing/instagram/montar-kit-postagem.js` monta
`E:\projetos\site-mae\kit-postagem\` a partir do que `gerar-posts.js`/
`reel.js` já deixaram em `site-mae\` — 17 pastas (`dia-01-...` a
`dia-29-...`), cada uma com mídia + `legenda.txt` + `info.txt` +
`checklist-antes-de-postar.txt`, OU `PENDENTE.md` quando falta gravar.
**10 de 17 dias prontos pra postar**; os outros 7 têm legenda pronta
mas precisam de filmagem real (bastidores: torno/pintura/queima/
apresentação da Anasor) ou depoimento real com autorização (prova
social) — NENHUM foi inventado/substituído por conteúdo genérico,
ver `DECISOES.md`. `LEIA-ME.md` (raiz do kit) tem a ordem de postagem,
o checklist e a seção "reserva" (conteúdo extra, fora do calendário de
30 dias, pronto pra repor peça vendida ou abrir o mês 2).

## D) Fechamento — ✅ CONCLUÍDO

- `node --check` nos 12 scripts tocados nesta rodada: ✅ todos OK.
- Testes offline do backend: ✅ 66/66 passaram, nenhuma chamada de rede.
- Nenhum arquivo do site (html/css/js/backend) foi tocado nesta rodada
  — só `marketing/instagram/**` — então `?v=` e deploy não se aplicam.
- Produção (/, /ceramica.html, /produto.html?id=33, /links, /api/health):
  ✅ confirmada 200 de novo, sem mudança (nada publicado pelo site).
- code-review (nível medium): ✅ rodou nos 2 commits novos (posts v3,
  reels v2) e no kit de postagem — achou 8 problemas reais em
  `montar-kit-postagem.js` (nenhum nos outros arquivos), todos
  corrigidos: horário sugerido errado pro dia 12 (lia o texto de
  `formato` em vez de checar o que de fato seria postado), aviso de
  "confira disponibilidade" incoerente no dia 7 (a peça É a vendida de
  exemplo), cópia de mídia sem checar se a origem existe (podia travar
  o script inteiro ou contar um dia vazio como "pronto"), pasta do dia
  não limpa entre execuções (mídia velha podia sobrar junto da nova, ou
  uma pasta órfã se o nome mudasse) e 2 comentários imprecisos.
- `node --check` de novo em todos os 13 scripts após os fixes: ✅ OK.
- git limpo, nada pendente, push feito (main sem force). Nenhum
  processo node/chrome aberto. `backend/.env` intacto (não tocado).
  Nenhuma mídia no git. Nenhum arquivo do site tocado nesta rodada —
  produção confirmada 200 em /, /ceramica.html, /produto.html?id=33,
  /links, /api/health, sem precisar bump de `?v=` (nada publicado).

**Rodada 2 completa — A, B, C e D concluídos.**

---

# Rodada 3 — correções + Reels de conteúdo (modo autônomo)

Pedido do Fabrício em 2026-10-28, depois da Rodada 2. 6 itens, todos
concluídos — decisões em `DECISOES.md`.

1. **"Pelos Correios"** — conferido em politicas.html (#prazo-envio: "via
   Correios"), é verdade, mantido sem alteração.
2. **Slides de variações fundidos** — "As variações são a assinatura" +
   "Não é defeito, é processo" viraram 1 slide só, reaproveitado nos
   carrosséis "Cuidados com a peça" (post-11, 5→4 slides) e "Peça única"
   (post-12, mesmo slide count, conteúdo mais completo).
3. **4 Reels de CONTEÚDO** (motion graphics puro, sem filmagem) — novo
   template `reels/src/templates/Conteudo.js` + 4 roteiros em
   roteiros.js: `como-comprar-conteudo`, `cuidados-conteudo`,
   `peca-unica-conteudo`, `encomenda-conteudo`. 2 bugs achados e
   corrigidos em teste (cenas sem fundo opaco próprio deixavam a cena
   anterior vazar por baixo; halo da marca d'água sobre fundo chapado
   escuro — mesmo bug dos posts, corrigido com um chip, só neste
   template). ffprobe conferido nos 4 (13,7–17s, 1–1,33MB, 1080×1920,
   H.264, yuv420p, sem áudio).
4. **Ligados ao kit de postagem**: dia 12 (post-11→cuidados-conteudo.mp4,
   agora Reel de verdade em vez de carrossel-substituto) e dia 19 (saiu
   de PENDENTE para encomenda-conteudo.mp4). "Como comprar" e "Peça
   única" ficaram na Reserva (nenhum dia do calendário corresponde a
   eles). **11 de 17 dias agora prontos** (era 10).
5. **Aviso de Pix no LEIA-ME.md** — seção própria + linha condicional no
   checklist de cada dia (`citaPix`), avisando pra confirmar a chave Pix
   cadastrada no Mercado Pago e o Pix aparecendo de verdade no checkout
   antes de postar qualquer coisa que cite Pix.
6. **Fechamento**: code-review + simplify no código novo, `node --check`
   em todos os scripts, testes offline do backend, git limpo, push sem
   force — ver detalhes abaixo de onde rodou.

---

# Rodada 4 — "Tour do Site" (modo totalmente autônomo)

Pedido em 2026-10-28, Fabrício na faculdade (sem resposta por várias
horas). **Se o PC cair ou a sessão for interrompida, uma sessão nova
deve ler este arquivo primeiro** e continuar do que está 🟡/❌.

## 0) Ambiente — ✅ CONCLUÍDO

- **Achado crítico**: disco C: com 0 bytes livres neste PC — ver
  `DECISOES.md`. Todo TEMP/cache desta rodada vai pra
  `D:\anasor-tour-tmp\`; entregáveis finais pra
  `E:\projetos\site-mae\tour\` (fora do git).
- `git pull`: já estava atualizado, working tree limpo.
- Servidor local de teste: `marketing/instagram/tour/src/servidor-local.js`
  (porta 8765, `FORCAR_DEMO=1` obrigatório) — ver `DECISOES.md` sobre
  por que não usei `vercel dev`.

## 1) Captura — ✅ CONCLUÍDO

- Pacote `marketing/instagram/tour/` criado (package.json próprio,
  Playwright + Remotion, igual ao padrão de `reels/`).
- Captura mobile (12 cenas, iPhone 15 real via `playwright.devices`,
  toques reais) e desktop (4 cenas, 1440×900) concluídas —
  `.tmp/capturas/<device>/manifest.json` com a duração real de cada
  clipe. Nenhum pedido enviado de verdade, nenhum pagamento gerado
  (CPF/CEP de teste, nunca clicou em "Ir para Pagamento").

## 2) Composição (motion graphics) — ✅ CONCLUÍDO

- `src/componentes.js`, `src/roteiro-mobile.js` + `roteiro-desktop.js`,
  `src/templates/TourMobile.js` + `TourDesktop.js`, `src/Root.js`/
  `index.js`, `tour.js` (CLI de render), `src/fontes.js` (Fraunces/Jost
  via `@remotion/google-fonts` — não instaladas no Windows desta
  máquina), `src/cli.js` (parser de CLI compartilhado) escritos.
- **Versão A (Instagram) — ✅ APROVADA**, 2 rodadas de crítica visual
  (achados e corrigidos: bug de performance do padding de clipe, bug
  crítico de `<Sequence>` ausente — travava o render —, 2 bugs de área
  segura, e a cena "card-selo" mostrando a peça vendida em vez de um
  selo de mérito — ver DECISOES.md pra cada um). Saída final:
  `E:\projetos\site-mae\tour\tour-instagram.mp4` — 1080×1920, H.264
  High, yuv420p, 30fps, 31,2s, 9,9MB.
- **Versão B (portfólio) — ✅ APROVADA**, 2 rodadas de crítica visual
  (achado e corrigido: `DestaqueTecnico` cobria parte do mockup de
  desktop sozinho — virou faixa centralizada no topo, ver DECISOES.md).
  Saída final: `E:\projetos\site-mae\tour\tour-portfolio.mp4` —
  1920×1080, H.264 High, yuv420p, 30fps, 50,0s, 10,5MB.
- loop/GIF do README: `E:\projetos\site-mae\tour\tour-loop.gif`
  (7,25MB) + `tour-loop.mp4` (2,04MB), 7s, conferido visualmente.
- code-review (medium) + simplify (4 agentes) rodaram no código novo
  — achados aplicados (bugs reais de captura, duplicação, código
  morto, performance) ou registrados como PULADOS com o motivo — ver
  `DECISOES.md`. Depois de cada rodada de achados, captura + render
  completos rodaram DE NOVO do zero pra confirmar que nada quebrou
  (`node --check` sozinho não pega erro de referência em runtime —
  aconteceu 1x nesta rodada, corrigido na hora).

## 3) Integração com o kit — ✅ CONCLUÍDO

- `montar-kit-postagem.js`: função `montarExtraTour()` copia
  `tour-instagram.mp4` pra `E:\projetos\site-mae\kit-postagem\
  extra-tour-do-site\` com legenda nº32 de `legendas.md` (sem
  Pix/prazo) + `info.txt`. `LEIA-ME.md` (site-mae) atualizado com a
  seção. Script rodado com o vídeo final — pasta confirmada pronta.

## 4) Qualidade e fechamento — ✅ CONCLUÍDO

- `node --check` em todos os 17 scripts de `tour/`: ✅ todos OK.
- git: só `marketing/instagram/**` tocado (DECISOES.md, STATUS.md,
  legendas.md, montar-kit-postagem.js, tour/ inteiro) — nada do site,
  backend ou `.env`. Commit feito, push pra `main` sem force.
- Produção (`/`, `/ceramica.html`, `/produto.html?id=33`, `/links`,
  `/api/health`): ✅ 200 em todas, conferido depois do push.
- Nenhum processo node/chrome-headless meu aberto no fim da rodada.
  `backend/.env` nunca foi tocado.
- Nenhuma mídia no git (`.tmp/`, `public/`, `node_modules/` de `tour/`
  ignorados; os `.mp4`/`.gif` finais vivem só em `site-mae/`, fora do
  repositório).

**Rodada 4 completa.** Commit `4ec3e58`, push feito pra `main` sem
force. Ver o relatório final (mensagem de fechamento desta rodada,
fora deste arquivo) pra pendências do Fabrício.

---

# Rodada 5 — bugs do tour, fechamento rico, capas v2, narração (modo autônomo)

Pedido em 2026-10-29, Fabrício fora de casa, sem resposta por várias
horas, quer postar HOJE. **Se o PC cair, uma sessão nova deve ler
este arquivo primeiro.** Ordem pedida: 0) disco C: → 1) corrigir
tour-instagram → 2) fechamento rico → 3) capas v2 → 4) narração em
tudo → 5) kit final. Cada item termina com kit atualizado.

## 0) Disco C: — ✅ CONCLUÍDO

~1,4GB liberado (691MB → 2.100MB livres). Relatório das 15 maiores
pastas em `E:\projetos\_tmp\c-maiores-pastas.txt`. Detalhes em
`DECISOES.md`. TEMP/TMP dos meus processos agora apontam pra
`E:\projetos\_tmp` (não mais `D:\anasor-tour-tmp` da Rodada 4).

## 1) Corrigir tour-instagram.mp4 — ✅ CONCLUÍDO

- **1a (legenda sobre o celular)**: causa raiz — câmera (zoom/panorâmica)
  centralizada no canvas inteiro, legenda em posição fixa, sem relação
  entre as duas. Celular ganhou geometria ANCORADA e limites de
  câmera (`LAYOUT_CELULAR` em `componentes.js`); legenda virou `top`
  fixo abaixo do pior caso do celular. Provado por código:
  `src/validar-geometria.js` (✅ nas 12 cenas, rodar de novo depois de
  qualquer mudança de câmera/roteiro).
- **1b (tela branca no fim)**: causa raiz — a cena "links" navegava
  pra `/links` (sem `.html`), que só funciona em produção (reescrita
  do `vercel.json`); local, caía no 404 do Express (página em branco),
  capturada como se fosse conteúdo real. Corrigido em `cenas-mobile.js`
  (`/links.html` direto) e `servidor-local.js` (mesma reescrita do
  vercel.json, fidelidade com produção). Varredura automática:
  `src/verificar-quadros.js` (filtro `signalstats` do ffmpeg) — ✅ limpo
  em `tour-instagram.mp4` (quadro inteiro E só a região da tela),
  `tour-portfolio.mp4` e `tour-loop.mp4`.
- **Achado extra na crítica visual** (não estava na lista, apareceu
  olhando os quadros): as 2 legendas da cena "checkout" se
  sobrepunham (números fixos incompatíveis com a duração real do
  clipe) — corrigido calculando os tempos a partir da duração real.
- 2 rodadas de crítica visual feitas (1ª achou o bug do checkout, 2ª
  saiu limpa — geometria + varredura + 8+ quadros espalhados
  conferidos à mão). Kit e loop/GIF já atualizados com o vídeo novo.

## 2) Fechamento rico (tour + Reels) — 🟡 EM ANDAMENTO

- **Tour (Versão A e B) — ✅ CONCLUÍDO**: retrato da Anasor em círculo
  dourado, tagline, botão gummy com aperto, @handle grande + coração,
  faixa de confiança real, entrada em cascata (~2,5s). Versão B em
  layout horizontal. Vídeos re-renderizados, loop/GIF e kit já
  atualizados. Versão anterior em `site-mae\tour\_v2\`.
- **Reels (12 de peça + 4 de conteúdo) — ❌ PENDENTE**: componente
  ainda não replicado em `reels/src/componentes.js` (Reels já tinha
  título+botão+handle+faixa de confiança no fecho — falta deixar o
  handle maior com coração e somar o retrato). Depois de codificado,
  re-renderizar 1 por vez (sem paralelizar), peça primeiro, conteúdo
  depois.

## 3) Capas de destaque v2 — ❌ PENDENTE

## 4) Narração em todos os vídeos — ❌ PENDENTE

## 5) Kit e fechamento final — ❌ PENDENTE
