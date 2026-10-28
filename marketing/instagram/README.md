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
   carrossel) + faixa de confiança no rodapé.
2–4. **Fotos extras** — até 3, com moldura branca e legenda "Detalhe"
   na primeira.
5. **Por que comprar com a Anasor Sobreira** — 4 fatos reais de
   `politicas.html` (frete, pagamento, prazo de envio, direito de
   arrependimento).
6. **Chamada** — "Peça única", botão "Link na bio" e a mesma faixa de
   confiança da capa.

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

## Ferramenta de revisão (não faz parte do fluxo normal)

`node folha-contato.js` gera `folha-contato.png` nesta pasta (fora do
git) com as 9 capas + um exemplo de cada tipo de slide lado a lado —
útil pra bater o olho em tudo de uma vez antes de publicar. Roda depois
de `gerar-posts.js`.
