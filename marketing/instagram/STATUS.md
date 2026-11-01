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

## 2) Fechamento rico (tour + Reels) — ✅ CONCLUÍDO

- **Tour (Versão A e B) — ✅ CONCLUÍDO**: retrato da Anasor em círculo
  dourado, tagline, botão gummy com aperto, @handle grande + coração,
  faixa de confiança real, entrada em cascata (~2,5s). Versão B em
  layout horizontal. Vídeos re-renderizados, loop/GIF e kit já
  atualizados. Versão anterior em `site-mae\tour\_v2\`.
- **Reels (12 de peça + 4 de conteúdo) — ✅ CONCLUÍDO**: componente
  `FechoRico` novo em `reels/src/componentes.js` (retrato + título +
  botão + handle grande + faixa de confiança, cascata de entrada),
  usado pelos 3 templates (Apresentacao/Colecao/Conteudo — antes cada
  um montava o fecho à mão, duplicado). Os 16 Reels re-renderizados
  (1 por vez, peça primeiro, depois conteúdo). Versões anteriores
  arquivadas em `reels\_v2\` (14 — os outros 2, `r1-caneca-surpresa-
  gatinho` e `cuidados-conteudo`, foram sobrescritos sem arquivar por
  um erro de processo, registrado em DECISOES.md). Checado
  visualmente nos 3 templates (Apresentacao, Colecao, Conteudo).

## 3) Capas de destaque v2 — ✅ CONCLUÍDO

- `marketing/instagram/gerar-capas-destaque.js` (novo script, v1 não
  tinha gerador no repo). 5 ícones de linha temáticos (vaso+brilho,
  roda+peça, sacola+laço, lápis+estrela, gota+mãos), cor da marca,
  fundo alternando bege/marrom, textura de papel, marca d'água.
  2 rodadas de crítica visual (achado e corrigido: `file:///` não
  carregava na folha de contato — Chromium recusava, virou `data:`
  base64; 2ª rodada confirma série harmônica). Saída:
  `E:\projetos\site-mae\instagram-perfil\v2\` (v1 mantida). Mapeamento
  capa→destaque documentado no `LEIA-ME.md` do kit.

## 4) Narração em todos os vídeos — ✅ CONCLUÍDO

- Voz: Microsoft Maria Desktop (pt-BR, feminina, SAPI/System.Speech
  do Windows), `Rate=2` — Piper TTS não foi tentado (motivo em
  `DECISOES.md`). Mesma voz em todos os 18 vídeos.
- Roteiros (texto, committado): `marketing/instagram/narracao/roteiros.md`
  — 1 por vídeo, só fatos reais de `js/produtos.js`/`politicas.html`,
  sem Pix/prazo/preço fixo, nome da peça citado logo na 1ª cláusula
  (pra sobreviver ao corte automático), fechamento fixo "Link na
  bio, no arroba anasor ponto cerâmica." em todos.
- Script reproduzível: `marketing/instagram/narracao/narrar.js` +
  `sintetizar-voz.ps1` (síntese) — `node narrar.js` regenera tudo
  depois de qualquer edição em `roteiros.md`. README curto em
  `marketing/instagram/narracao/README.md`.
- Mixagem (ffmpeg): voz começa em 0,3s, `loudnorm` a -16 LUFS (pico
  máx. -1,5dB, sem estourar), AAC 48kHz estéreo 128kbps, vídeo
  `-c:v copy` (sem recompressão). Mudo original arquivado em
  `E:\projetos\site-mae\reels\_mudo\` e `...\tour\_mudo\` (nunca
  apagado).
- Rodado nos 18 vídeos (12 Reels de peça + 4 de conteúdo +
  `tour-instagram` + `tour-portfolio`; `tour-loop.mp4` continua
  mudo, de propósito). Todos passaram nas 4 checagens (1 faixa de
  áudio + 1 de vídeo, sem silêncio total, sem estouro, voz mais
  curta que o vídeo) — valores completos em
  `E:\projetos\_tmp\narracao-relatorio.txt`.
- 11 dos 18 precisaram de corte automático de texto (nunca
  aceleração) pra caber na duração real; 2 Reels de coleção
  (`colecao-objetos-decorativos`, `colecao-pecas-de-alma`) perderam
  o nome da 3ª peça só na narração (continuam visíveis na tela) —
  detalhe em `DECISOES.md`.

## 5) Kit e fechamento final — ✅ CONCLUÍDO

- Kit regenerado (`node marketing/instagram/montar-kit-postagem.js`)
  com os vídeos narrados/fechamento rico já no lugar — 11 dias com
  mídia pronta, 6 pendentes (filmagem/depoimento real, sem mudança).
- `E:\projetos\site-mae\kit-postagem\LEIA-ME.md`: nova seção "🔊 Os
  Reels e o Tour agora têm narração" (explica como silenciar/trocar
  por música), checklist por dia ganhou um item de narração pra dias
  com Reel, aviso do Pix mantido como estava.
- SIMPLIFY (4 agentes, via fork) + CODE-REVIEW (medium, feito por
  mim direto depois que o subagente caiu num rate-limit de sessão)
  no código novo da rodada (`narracao/`, `gerar-capas-destaque.js`,
  `reels/src/componentes.js` + templates, `montar-kit-postagem.js`)
  — achados reais aplicados, detalhe em `DECISOES.md`.
- `node --check` em todos os scripts tocados: OK.
- Backend offline (`node backend/scripts/teste-forcar-demo.js`): 6/6
  testes passaram, nenhuma chamada de rede.
- `git status`: limpo, tudo commitado e já em `origin/main`.
- Nenhum processo meu aberto (os `node`/`chrome` encontrados são de
  outra ferramenta do Fabrício — Codex — e do Chrome normal dele, de
  antes desta rodada; não toquei em nenhum). `backend/.env`
  intocado (última modificação de 15/09, bem antes desta rodada).
- Produção: 200 em `/`, `/ceramica.html`, `/produto.html?id=33`,
  `/links`, `/api/health`.

---

# Rodada 6 — narração natural + rolagem delicada (modo totalmente autônomo)

Pedido em 2026-10-29, Rodada 5 aprovada. 2 ajustes prioritários: (A)
narração travada/lenta, (B) rolagem rápida demais no tour. A em
paralelo (fork), B na sessão principal.

## A) Narração mais natural — ✅ CONCLUÍDO

- Roteiros reescritos (`narracao/roteiros.md`): texto corrido, 1
  ponto final a cada ~12-15 palavras, hook+nome na 1ª cláusula, os 2
  Reels de coleção citam as 3 peças completas (corrige a Rodada 5).
- `narrar.js`: `--voz`/`--ritmo` por linha de comando; removido o
  fallback de `atempo` (nunca mais acelera áudio); checa silêncio
  interno ≥0,6s (`silencedetect`); acabamento com highpass 80Hz,
  compressor, fade-out 120ms, loudnorm -16 LUFS.
- Voz padrão de produção: SAPI Maria, Rate=4 (calibrado com texto
  REAL, não frase de teste isolada — ver DECISOES.md). Piper TTS
  instalado (licença MIT, 4 vozes pt_BR, todas masculinas) como
  opção — amostras em `E:\projetos\site-mae\narracao-amostras\` pro
  Fabrício ouvir e decidir; não virou padrão (não dá pra confirmar
  por ouvido que o ritmo forçado não tem artefato).
- Aplicado nos 16 Reels (`E:\projetos\site-mae\reels\`) e, depois do
  item B terminar o re-render, também em `tour-instagram.mp4` (45,0s)
  e `tour-portfolio.mp4` (47,0s) — ffprobe confirma 1 faixa de vídeo +
  1 de áudio nos 2, duração e ritmo (2,8-3,1 wps) dentro do esperado.

## B) Rolagem delicada no tour — ✅ CONCLUÍDO

- Motor de rolagem reescrito (`captura-ferramentas.js`): perfil
  trapézio com rampas em seno (pico ≈1,22x a média, era 3x na curva
  cúbica antiga) — permite caber um arrasto de ~300px em ~1s sem
  passar de 450px/s. Arrastos de 200-380px com pausa de 0,6-1,2s
  entre eles — nunca mais 1 rolagem contínua longa. Validação por
  código (scrollY real medido quadro a quadro) com margem de 15% pro
  ruído de arredondamento de pixel/frame (achado testando — ver
  DECISOES.md).
- Teto de distância por arrasto (400px, depois de 2 ajustes — 900
  dava 65s de vídeo, 550 ainda dava ~49,5s) — achado capturando de
  verdade: a Home mede ~13.000px de altura no mobile, então um alvo
  em % da altura total virava rolagem de milhares de px.
- Carrossel horizontal com indicador de toque acompanhando o dedo;
  toques com pausa antes/depois + ~150ms de "pressionado"; desktop
  ganhou 1 rolagem suave (600px/s) — antes não rolava nada.
- `loop.js` reescrito: bumerangue (ida + volta revertida) pra loop
  perfeito sem salto, 9s (dentro de 8-10s pedido).
- Captura mobile+desktop, render dos 2 vídeos, validação de geometria/
  quadros brancos (`validar-geometria.js`/`verificar-quadros.js`, ✅
  limpos nos 2), crítica visual de 10 quadros em cada (achou e
  corrigiu o bug da transição com "quadro em branco" entre cenas —
  `<Sequence>` esticado em `QUADROS_WIPE` além da duração oficial, ver
  DECISOES.md) — tudo concluído. Versão anterior arquivada em
  `tour\_v2\`. `tour-loop.mp4`/`.gif` refeitos em bumerangue (9s).

## Kit e fechamento final — ✅ CONCLUÍDO

- Narração (item A) aplicada nos 2 vídeos novos do tour (retomado
  depois da queda de energia de 2026-10-29/30 — ver DECISOES.md,
  entrada "RETOMADA" de 2026-10-30, pra como o estado foi reconstruído
  do git/disco em vez de memória).
- Kit regenerado (`node montar-kit-postagem.js`) — `extra-tour-do-
  site\tour-instagram.mp4` confirmado com áudio+vídeo por ffprobe.
  `LEIA-ME.md` (site-mae) já citava `--voz`/`--ritmo`/
  `narracao-amostras` corretamente, nenhuma mudança necessária.
- code-review (medium) no diff completo da rodada: achou 2 problemas
  reais, corrigidos — `sintetizar-piper.ps1` (novo, exigido por
  `narrar.js` pra vozes Piper) estava untracked e ficaria fora do
  commit; comentário desatualizado em `captura-ferramentas.js`
  (citava uma função que nunca existiu, `rolarElementoEmArrastos`).
- `node --check` em todos os 11 scripts tocados: ✅ OK. Testes offline
  do backend: ✅ todos passaram. git limpo, commit feito, push na
  main sem force. Produção confirmada 200.

**Rodada 6 completa — A, B e o fechamento final concluídos.**

Notebook do pai: ajustes 1 a 5 feitos em 2026-10-30; o PC de casa precisa de git pull antes de qualquer alteração.

---

# Rodada 7 — narração Piper jeff + legenda em todos (modo totalmente autônomo)

Pedido em 2026-10-31, Fabrício fora de casa até a noite, quer postar a
partir de amanhã (2026-11-01). Decisões em `DECISOES.md`.

## 1) Voz (Piper jeff, ritmo 0,7) — ✅ CONCLUÍDO

`narrar.js`: `VOZ_PADRAO='jeff'`, ritmo padrão 0,7 (escolha do
Fabrício depois de ouvir `narracao-amostras\`). Achado e corrigido:
o Piper tem um preditor de duração ESTOCÁSTICO — `--noise-w-scale 0`
em `sintetizar-piper.ps1` tornou a síntese determinística (mesmo
texto sempre sai com a mesma duração). Checagem de "ritmo" trocada
pra uma faixa ±15% em volta da wps MEDIDA na amostra de cada voz
(antes era um limiar fixo calibrado só pra Maria/SAPI).

## 2) Narração nos 18 vídeos — ✅ CONCLUÍDO

`node narrar.js` rodado nos 18 (12 Reels de peça, 4 de conteúdo, 2
Tours) — todos passaram em fluxos/silêncio-total/clipping/duração.
Antes de sobrescrever, o `.mp4` anterior (narração Maria da Rodada 6)
foi arquivado em `<pasta>\_anteriores\2026-10-31\<nome>.mp4` (regra
nova: nunca sobrescrever sem arquivar). Sidecar JSON por vídeo em
`E:\projetos\site-mae\_narracao-dados\` (texto final falado + tempos
reais) alimenta a legenda. Pendência de qualidade não resolvida:
TODOS os 18 têm 1 a 10 pausas ≥0,6s no meio da fala (pausa natural do
Piper/jeff em vírgulas de frases longas, não um corte/artefato) — ver
DECISOES.md, decisão de não reescrever os 18 roteiros agora.

## 3) Legenda queimada (novo, nunca feito antes) — ✅ CONCLUÍDO

Novo script `narracao/legendar.js`: tempo por palavra estimado por
proporção de caracteres (tentei o filtro `whisper` do ffmpeg pra ASR
de verdade — funciona tecnicamente, mas a transcrição da voz
sintética saiu errada demais pra confiar, não usei). Blocos de 3-6
palavras, `.srt` entregue + `.ass` próprio (com `PlayResX`/`PlayResY`
corretos — achado crítico: `force_style` sobre `.srt` puro saía com
texto gigante/fora de posição, documentado em DECISOES.md) pra
queimar com contorno grosso (AA garantido em qualquer fundo). Posição
por categoria: tour mobile (reaproveita `CAPTION_TOP` já validado do
próprio projeto), tour desktop (ajustada depois de 1 teste visual —
a moldura real termina mais embaixo do que os números do código
sugeriam) e Reels (dentro da faixa "nada importante" já estabelecida
nas rodadas anteriores). Checagem automática de sobreposição
(amplitude de luminância na caixa da legenda) rodou nos 18 — 1
falso-positivo investigado e aceito (transição de cena, não
sobreposição real), documentado.

## 4) Qualidade e kit — ✅ CONCLUÍDO

ffprobe (resolução/duração/áudio) e varredura de quadro preto
(`blackdetect`) limpos nos 18. Prints início/meio/fim em
`E:\projetos\site-mae\_prints\videos-finais\`. `montar-kit-postagem.js`
rodado de novo — 11/17 dias prontos (sem mudança; os 6 pendentes
continuam exigindo filmagem/depoimento real). `LEIA-ME.md` e
`AMANHA-POSTAR.md` (novo) atualizados: como "Dia 1" do calendário
pede filmagem ainda pendente, o post sugerido pra amanhã é o Tour do
Site (`extra-tour-do-site\`, já pronto) — decisão em DECISOES.md.

**Rodada 7 completa.** Ver relatório final (fora deste arquivo) pras
pendências reais do Fabrício.

---

## Notebook do pai — 2026-10-31

Notebook do pai: preços +100 (3 peças), botão Ver mais 3D, carrossel na página de subcategorias, feitos em 2026-10-31; o PC de casa precisa de git pull antes de qualquer alteração.

- Preços: Travessa Asas do Paraíso (13) e Travessa Bruma Azul (14) R$ 199,90 → R$ 299,90; Prato Brisa de Palmeira (15) R$ 159,90 → R$ 259,90. Nenhuma tinha "de/por".
- Botão `.btn-ver-mais` (variação escura e `--claro`) na Escolha do Ateliê, Edição Surpresa e Seleção Especial.
- ceramica.html (sem ?sub) em carrossel; "Faixa de preço" e "Ordenar por", que apareciam ali sem efeito, agora funcionam (ver DECISOES.md).

---

## Rodada 8 — sincronização do PC de casa + correções de narração/legenda (2026-10-31) — ✅ CONCLUÍDO

PC de casa sincronizado e vídeos revisados em 2026-10-31. `git pull --rebase` trouxe os 5 commits do notebook do pai (fast-forward, sem conflito) — preços já corretos em `js/produtos.js` e `legendas.md`. Único texto desatualizado era `site-mae/instagram-posts/post-08.md` (não regenerado desde 27/10), corrigido rodando `gerar-posts.js` de novo; o gerador já lê o preço ao vivo de `produtos.js` (nada a mudar no código). Nenhum vídeo/roteiro cita as 3 peças com preço novo.

Os 4 bugs da code-review em `narrar.js`/`legendar.js` (apontados no fim da Rodada 7) foram corrigidos e testados:
- `legendar.js` idempotente (master permanente sem legenda em `_sem_legenda/`, nunca mais lê do arquivo já legendado) — `teste-legendar.js`.
- Formatador único de tempo sem overflow de milissegundos/centissegundos — `teste-legendar.js`.
- Checagem de área livre agora BLOQUEIA a gravação (exceto 1 falso-positivo já verificado visualmente, numa lista documentada) — `teste-legendar.js`.
- Checagem de ritmo rígida mesmo pra vozes sem referência própria (cai pra referência da voz padrão jeff/0.7, nunca pula) — `teste-narrar.js`.

Rodei o checker corrigido nos 18 vídeos de produção: todos passaram na área livre de verdade, áudio+vídeo presentes, ~-16 LUFS, sem quadro preto, cartão final sem corte. `kit-postagem/` resincronizado (`montar-kit-postagem.js`) depois que um vídeo (`r1-caneca-surpresa-gatinho`) trocou de bytes no reencode — 11/17 dias prontos, igual antes. `AMANHA-POSTAR.md`/`LEIA-ME.md` já estavam corretos, sem mudança. Detalhe completo de cada achado em `DECISOES.md`, "Rodada 8".
- ?v=47. Deploy conferido: 200 em /, /ceramica.html, ?sub=jarras, produto 33, /links, /api/health.
- Pendente (decisão do Fabrício): achados da code-review no código de narração que veio do PC de casa (legendar.js/narrar.js) — ver relatório da sessão.
