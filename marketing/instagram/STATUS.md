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

## B) Reels v2 — ❌ NÃO COMEÇADO

Motor em `marketing/instagram/reels/`. Falta: tipografia cinética,
legendas palavra por palavra, zoom/pan + parallax, máscaras circulares,
brilho de esmalte, vinheta/grão, selo animado, faixa de confiança
animada, CTA final "Link na bio" com botão pressionado. 12 Reels no
total (6 atuais refeitos + 6 novos), 3 templates. Saída:
`E:\projetos\site-mae\reels\` (v1 pra `reels\_v1\`), quadros de
conferência em `reels\_conferencia\`.

## C) Kit de postagem — ❌ NÃO COMEÇADO

`E:\projetos\site-mae\kit-postagem\`, organizado por
`calendario-30-dias.md` — uma pasta por dia + `LEIA-ME.md`.

## D) Fechamento — ❌ NÃO COMEÇADO

simplify + code-review no código novo, `node --check`, testes offline
do backend, `?v=` pro próximo número se mexer no site, deploy
confirmado, relatório final.
