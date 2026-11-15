# Posts do Instagram (@anasor.ceramica)

Gera as artes dos 9 primeiros posts do feed a partir dos dados reais do
site (`js/produtos.js`, `css/style.css`, `politicas.html`) — nunca
inventa preço, selo ou política de frete/pagamento.

## Como rodar

```
cd marketing/instagram
npm install                        # só na primeira vez
npx playwright install chromium    # só na primeira vez
node gerar-posts.js
```

Saída: `E:\projetos\site-mae\instagram-posts\` — 1 PNG 1080×1350 por
slide (`post-NN-K-tipo.png`), 1 `post-NN.md` por peça (legenda,
hashtags, ordem dos slides e texto alternativo de cada imagem) e a capa
de cada post também em formato Story (1080×1920) em `stories\`.

O script **apaga e regenera** tudo que já existir em `post-*` nessas
duas pastas a cada execução (é por isso que toda rodada nova de design
move a versão anterior pra `_v1\` manualmente antes de rodar — ver
"Antes de mudar o design" abaixo). Nunca mexe nos arquivos originais de
`site-mae` (fotos, vídeos) nem em nada fora do padrão `post-*`.

## Como trocar as peças

Edite a lista `PECAS` no topo de `gerar-posts.js` — é só o `id` da peça
em `js/produtos.js` + um comentário dizendo por quê ela está ali (pra
quem for trocar depois entender o critério). Peça vendida, oculta ou
sem foto no disco é pulada automaticamente (aviso no console), com o
número do post preservado (não desalinha o calendário).

## Cada post (6 slides)

1. **Capa** — foto principal + selo da peça (canto superior esquerdo —
   o direito fica livre, é onde o Instagram desenha o contador do
   carrossel) + faixa de confiança em medalhões no rodapé (ver v4 abaixo).
2–4. **Fotos extras** — até 3, em 3 molduras diferentes (polaroid/moldura
   dupla/cantos orgânicos) com legenda tirada da própria descrição da
   peça e miniaturas das outras fotos.
5. **Por que comprar com a Anasor Sobreira** — rosto da Anasor + 4 fatos
   reais (`politicas.html`/regra de negócio): frete, pagamento, prazo de
   envio, peça única — + botão "Garanta a sua".
6. **Chamada** — rosto da Anasor, "Peça única", botão "Link na bio" e a
   mesma faixa de confiança da capa.

Selo da peça: lido do campo `selo` de `produtos.js`, mesma prioridade e
cores de `js/main.js` (`seloDaPeca`/`SELOS_PECA`) — "Mais Vendido" >
"Peça Assinada" > "Queridinha do Ateliê" > "Novidade". Peça sem selo
recebe o selo neutro "Peça única ♥ feita à mão" (não é uma das 4
chamadas reais do site, por isso o visual neutro).

## Marca d'água

O emblema (`img/institucional/logo-anasor.jpg`) tem fundo creme quase
uniforme, sem transparência. `removerFundoLogo()` (dentro do script)
abre o JPG num `<canvas>` do próprio Chromium e apaga por luminância —
o fundo é bem mais claro que o traço dourado/texto, então o corte não
alcança o desenho. Gerado uma vez por execução, reaproveitado em todos
os slides — não precisa de um PNG transparente editado à parte.

## Antes de mudar o design

Se for redesenhar os slides (cores, textos, layout), mova a saída
anterior pra `instagram-posts\_v1\` (ou `_v2\`, etc. — não apague
versões antigas) antes de rodar de novo. O script em si só limpa o que
ele mesmo criaria (arquivos `post-*` nas pastas de saída), nunca uma
`_v1\`/`_v2\` já existente.

## v3 — 4 layouts de capa + grade do perfil + carrosséis de conteúdo

- **4 layouts de capa** (ver `LAYOUT_CAPA_POR_POSICAO`/`slideCapaPorLayout`):
  1. foto cheia + faixa (o layout v2 original);
  2. editorial dividida (foto 58% + bloco `--cor-fundo-alt` com o nome
     grande e a faixa de confiança em coluna);
  3. peça em círculo sobre `--cor-fundo-alt`, com uma sombra elíptica de
     "pedestal" embaixo (referência ao suporte de vidro das fotos reais);
  4. fundo `--cor-texto` (marrom) com o nome em dourado (`DOURADO`,
     mesmo hex do selo "Mais Vendido") e a peça num medalhão circular.
  Alternados posição a posição pra nenhum vizinho da grade 3×3 do
  perfil repetir layout — ver o comentário em `LAYOUT_CAPA_POR_POSICAO`.
- **Grade do perfil**: `instagram-posts\_grade-perfil.png`, recorte 3:4
  das 9 capas (como o Instagram mostra no perfil), pra bater o olho na
  harmonia de cores/layouts antes de postar.
- **4 carrosséis de CONTEÚDO** (`post-10` a `post-13`, não são de uma
  peça específica): "Como comprar", "Cuidados com a peça", "Peça única:
  o que significa" e "Encomende a sua" (exemplo: Pote Decorativo Bruma
  Dourada, id 33, vendido). Só fatos de `politicas.html`/`produtos.js` —
  ver `gerarCarrosseisConteudo()` pra a fonte de cada frase.

## Ferramenta de revisão (não faz parte do fluxo normal)

`node folha-contato.js` gera `folha-contato.png` nesta pasta (fora do
git) com as 9 capas + um exemplo de cada tipo de slide lado a lado —
útil pra bater o olho em tudo de uma vez antes de publicar. Roda depois
de `gerar-posts.js`.

## v4 — redesign (pedido explícito do Fabrício, modo autônomo, 2026-11-14)

O post-01 estava "fraco/simples demais" — ver `antes-depois-post-01.png`
nesta pasta pro comparativo lado a lado dos 6 slides. Todo o padrão abaixo
já sai assim em QUALQUER post gerado por `gerar-posts.js` daqui pra
frente (decisões detalhadas na Rodada 14 de `DECISOES.md`):

- **Marca d'água mais forte**: o padrão "AS" de fundo subiu de 3,5% pra
  10% de opacidade (`--marca-monograma`, não mais a `-fraca`); o emblema
  da logo ganhou um "chip" (círculo creme + sombra) em TODO slide onde
  flutua sobre uma foto (antes só o layout 4 tinha) — é o que o deixava
  "invisível" no celular. Flor/vaso (marcas d'água de traço fino) também
  ficaram mais visíveis nos slides de texto (sem a redução de opacidade
  extra que tinha antes).
- **Rosto da Anasor**: `rostoAnasorHtml()` recorta
  `img/institucional/quem-somos.jpg` num círculo com borda dupla
  (terracota + ouro) e sombra — aparece no slide "por que comprar" (ao
  lado do nome dela) e na chamada final (no lugar do círculo "AS").
- **Selos e faixa de confiança em medalhões 3D**: mesma receita de
  sombras em camadas do checkout do site (`css/checkout.css
  .checkout-selo__icone-fundo`) — ver `faixaConfiancaHtml()`/`.confianca__medalhao`
  e o selo da peça (`seloHtml()`), agora com ícone + relevo gummy.
- **Nome com hierarquia na capa** (layout 1 — os outros 3 layouts ainda
  não foram adaptados, ver Rodada 14 do DECISOES.md): `dividirNome()`
  separa "tipo da peça" (Jost, pequeno) do "nome poético" (Fraunces
  itálico, grande), com fallback seguro (título inteiro, sem dividir)
  pra qualquer nome fora do padrão conhecido do catálogo.
- **Slides de foto-detalhe redesenhados**: 3 variantes alternadas
  automaticamente (`slideFotoPorVariante` — 1 polaroid, 2 moldura dupla,
  3 cantos orgânicos com `--raio-organico`), legenda tirada dos trechos
  `<span class='realce'>` da própria descrição da peça
  (`extrairDestaques()` — nunca inventada) e uma tira de miniaturas das
  outras fotos da peça, com a atual destacada.
- **Slide "por que comprar"**: virou CTA (rosto + cards com ícones
  maiores + botão gummy "Garanta a sua"); o item "7 dias pra se
  arrepender" saiu da arte (a política continua em `politicas.html`),
  entrou "peça única: ninguém vai ter uma igual".
- **Margem de segurança**: 72px em todo elemento de canto (`MARGEM_SEGURA`
  — era 56px).
- **Legenda em negrito/itálico de verdade**: `node formatar-legenda.js
  <número>` converte o `**negrito**`/`_itálico_` de `legendas.md` (que é
  só marcação de intenção, o Instagram não lê Markdown) em Unicode de
  verdade, com tratamento pra palavra acentuada (ver cabeçalho de
  `legendas.md` e comentários de `formatar-legenda.js`). Gera um `.txt`
  pronto pra colar em `legendas-formatadas/`.

**Verificação feita nesta rodada** (reproduzível por qualquer PC depois de
rodar `node gerar-posts.js`): os 6 PNGs do post-01 relidos em tela cheia e
reduzidos a 390px de largura (simulando celular) — marca d'água visível,
selos/medalhões legíveis, nada cortado, título "Peça única ♥" da chamada
final medido via pixel (script Playwright/canvas) em x=538,5 de centro
contra um canvas de 540 de centro (1,5px de diferença). `grade-perfil-
simulacao.png` nesta pasta é uma cópia do mock de grade 3:4 (ver seção
v3 acima) já com o visual v4.
