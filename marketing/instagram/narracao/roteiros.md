# Roteiros de narração — @anasor.ceramica

Rodada 5, item 4 (reescrito na Rodada 6, item A1/A7 — texto mais
corrido e natural, sem fragmentos soltos). Um texto por vídeo (18 no
total — os 12 Reels de peça, os 4 Reels de conteúdo, `tour-instagram`
e `tour-portfolio`; o loop do README fica mudo, não tem roteiro aqui).

**Regras seguidas em todos os textos:**
- Só fatos reais, conferidos em `js/produtos.js` (nome exato de cada
  peça) e `politicas.html` (frete grátis, prazo de envio, pagamento
  pelo Mercado Pago, peça única/estoque 1).
- Nenhum cita Pix, prazo inventado, preço fixo ou "mais vendido".
- Números por extenso.
- Cada peça é citada pelo nome completo, exatamente como está em
  `produtos.js` — nos 2 Reels de coleção, as 3 peças de cada, por
  extenso (Rodada 6, item A7: na Rodada 5 a narração citava só 2 das
  3 por falta de espaço; o ritmo mais rápido desta rodada abre
  espaço pra citar as 3).
- Gancho nos primeiros ~2 segundos (frase de abertura).
- Fechamento igual em todos: **"Link na bio, no arroba anasor ponto
  cerâmica."** (pronúncia natural do @, pedido explícito).
- Ritmo alvo (Rodada 6): 2,8 a 3,1 palavras por segundo, calibrado
  NA VOZ (rate do SAPI / length_scale do Piper — nunca esticando o
  áudio depois com atempo). Ver `narracao/README.md` pra escolha de
  voz padrão e como trocar.
- **Texto corrido, não fragmentado** (pedido explícito, Rodada 6): no
  máximo 1 ponto final a cada ~12-15 palavras — frases ligadas por
  vírgula/conectivo ("que", "e", "enquanto", "porque"), tom de quem
  apresenta o ateliê com carinho, não locutor de aviso. Fragmento
  solto tipo "Cores marmorizadas, feitas pra combinar." isolado foi
  banido — tudo entra num fluxo só.
- Reels de peça: texto próprio, sobre a peça mostrada, com o NOME DA
  PEÇA logo na 1ª cláusula — importante porque o corte automático
  (`narrar.js`, quando o texto não cabe na duração) solta a ÚLTIMA
  cláusula primeiro, nunca a primeira: o nome da peça precisa estar
  numa cláusula que nunca é cortada. Reels de CONTEÚDO: paráfrase das
  legendas já existentes e já checadas em `reels/src/roteiros.js`
  (mesmos fatos, não reinventados). Tour: descreve recursos reais do
  site, sem citar preço de peça nenhuma (texto re-ajustado quando o
  vídeo mudar de duração no item B desta rodada).

Se, ao gerar o áudio de verdade, um texto não couber na duração do
vídeo com folga, ele é cortado — por frase/cláusula inteira, nunca no
meio de uma palavra, e NUNCA acelerando o áudio depois (proibido
desde a Rodada 6: é isso que causava o efeito "picado" relatado) — e
a mudança fica registrada em `DECISOES.md`.

---

## Reels de peça (12)

### r1-caneca-surpresa-gatinho (14,50 s)
Peça: Caneca Artística Surpresa Gatinho (produto id 20)

> A Caneca Artística Surpresa Gatinho esconde um gatinho pintado à mão no fundo, que vai aparecendo pouquinho a pouquinho conforme você bebe, numa peça única, feita com carinho no ateliê da Anasor. Link na bio, no arroba anasor ponto cerâmica.

### r7-casinhas-de-fada (13,50 s)
Peça: Kit 4 Casinhas de Fada Luminária (produto id 36)

> O Kit 4 Casinhas de Fada Luminária reúne quatro casinhas modeladas e pintadas à mão, cada uma com uma luz suave por dentro, formando um conjunto único no ateliê. Link na bio, no arroba anasor ponto cerâmica.

### prato-canario-flor-de-outono (12,83 s)
Peça: Prato Decorativo Canário e Flor de Outono (produto id 41)

> O Prato Decorativo Canário e Flor de Outono traz um canário pousado entre flores de outono, pintado à mão com todo cuidado, numa peça única que não se repete. Link na bio, no arroba anasor ponto cerâmica.

### vaso-refugio-de-petalas (13,50 s)
Peça: Vaso Escultórico Refúgio de Pétalas (produto id 25)

> O Vaso Escultórico Refúgio de Pétalas nasce das mãos da artesã como um verdadeiro refúgio esculpido em pétalas, moldado à mão, numa peça única no ateliê da Anasor. Link na bio, no arroba anasor ponto cerâmica.

### caneca-passaro-azul (12,17 s)
Peça: Caneca Artística Pássaro Azul ao Amanhecer (produto id 28)

> A Caneca Artística Pássaro Azul ao Amanhecer traz um pássaro observando o amanhecer, pintado à mão com esmalte em degradê, numa peça que não se repete. Link na bio, no arroba anasor ponto cerâmica.

### colecao-objetos-decorativos (13,00 s)
Peças: Porta-Joias Jacaré das Águas Azuis (id 39), Anjo Guardião Porta-Incenso (id 43), Saboneteira Folha e Pássaro Dourado (id 38)

> Três peças com alma própria saem do mesmo ateliê: o Porta-Joias Jacaré das Águas Azuis, o Anjo Guardião Porta-Incenso e a Saboneteira Folha e Pássaro Dourado, cada uma modelada e pintada à mão. Link na bio, no arroba anasor ponto cerâmica.

### caneca-surpresa-cachorrinho (13,50 s)
Peça: Caneca Artística Surpresa Cachorrinho (produto id 19)

> A Caneca Artística Surpresa Cachorrinho revela um cachorrinho pintado à mão no fundo, que vai aparecendo conforme você bebe, numa peça única e cheia de personalidade. Link na bio, no arroba anasor ponto cerâmica.

### kit-canequinhas-arlequim (12,67 s)
Peça: Kit 4 Canequinhas Arlequim Marmorizado (produto id 23)

> O Kit 4 Canequinhas Arlequim Marmorizado traz cores marmorizadas em cada canequinha, modeladas à mão uma a uma, formando um conjunto único no ateliê. Link na bio, no arroba anasor ponto cerâmica.

### anjo-guardiao-porta-incenso (13,50 s)
Peça: Anjo Guardião Porta-Incenso (produto id 43)

> O Anjo Guardião Porta-Incenso é esculpido à mão como um guardião silencioso pra sua casa, numa peça única que carrega todo o cuidado do ateliê. Link na bio, no arroba anasor ponto cerâmica.

### kit-copos-ondas-do-mar (12,67 s)
Peça: Kit 2 Copos Ondas do Mar (produto id 40)

> O Kit 2 Copos Ondas do Mar traz o movimento do mar modelado à mão em cada copo, formando uma peça única no ateliê da Anasor. Link na bio, no arroba anasor ponto cerâmica.

### prato-ave-da-alvorada (12,50 s)
Peça: Prato Decorativo Ave da Alvorada (produto id 10)

> O Prato Decorativo Ave da Alvorada mostra uma ave anunciando o começo do dia, pintada à mão com todo cuidado, numa peça única que não se repete. Link na bio, no arroba anasor ponto cerâmica.

### colecao-pecas-de-alma (13,00 s)
Peças: Kit 3 Xícaras de Café Terra Escura (id 32), Saboneteira Pássaro Azul-Noite (id 37), Vaso Escultórico Elo Noturno (id 45)

> Peças com história pra contar saem do mesmo ateliê: o Kit 3 Xícaras de Café Terra Escura, a Saboneteira Pássaro Azul-Noite e o Vaso Escultórico Elo Noturno, todas modeladas e pintadas à mão. Link na bio, no arroba anasor ponto cerâmica.

---

## Reels de conteúdo (4)

Paráfrase das legendas já existentes em `reels/src/roteiros.js`
(mesmos fatos — nenhum fato novo introduzido aqui).

### cuidados-conteudo (13,67 s)
Fonte: lista "Como lavar" + "As variações são a assinatura"

> Sua peça pede um cuidado simples: lave com água morna e sabão neutro, evite a lava-louças e mudanças bruscas de temperatura, e lembre-se que pequenas variações são a assinatura de cada peça única. Link na bio, no arroba anasor ponto cerâmica.

### como-comprar-conteudo (15,00 s)
Fonte: 3 passos "Como comprar" (sem citar Pix, ao contrário da legenda na tela)

> Comprar na Anasor é simples assim: você escolhe a sua peça única, paga com segurança pelo Mercado Pago, e recebe em casa com frete grátis, em até sete dias úteis. Link na bio, no arroba anasor ponto cerâmica.

### peca-unica-conteudo (17,00 s)
Fonte: "Estoque sempre 1" + "As variações são a assinatura" + "Não existe troca idêntica"

> Aqui, nenhuma peça se repete, porque cada uma existe numa única unidade, e quando vende, ela não volta pra vitrine: vira parte do portfólio do ateliê, já que pequenas variações de cor e formato são a própria assinatura do trabalho manual, nunca um defeito. Link na bio, no arroba anasor ponto cerâmica.

### encomenda-conteudo (17,00 s)
Fonte: 4 passos "Como funciona uma encomenda" (sem prazo nem preço fixo, igual à legenda na tela)

> Quer uma peça pensada pra você? Chame no WhatsApp pelo link na bio, conte sua ideia, a gente combina juntos os detalhes, o prazo e o valor, e eu faço a sua peça à mão, do começo ao fim. Link na bio, no arroba anasor ponto cerâmica.

---

## Tour do site (2)

### tour-instagram (45,00 s)
Fonte: recursos reais do site, sem citar preço de peça nenhuma.
Rodada 9 (achado do Fabrício): o roteiro antigo (84 palavras) só
preenchia ~26s dos 45s do vídeo, deixando quase 19s de silêncio no
fim — o vídeo é um tour por VÁRIAS telas (home, produto, carrinho,
checkout, vendidas, links) e o roteiro antigo só narrava 2-3 delas.
Reescrito pra acompanhar, em ordem, as mesmas cenas do roteiro visual
(roteiro-mobile.js) — ~126 palavras, ~39s na voz padrão, cabe nos 45s
com folga sem cortar.

> Vem conhecer o site do ateliê Anasor Cerâmica. Na home você passeia pelas coleções de cerâmica e crochê. Toda peça é única e feita à mão. Quando uma vende não tem reposição igual. Na página de cada peça tem fotos vídeo e as medidas reais. Dá pra decidir com calma antes de comprar. Escolheu a sua? Ela vai pro carrinho bem ali do lado sempre visível. No checkout o endereço se completa sozinho a partir do CEP. A compra é segura pelo Mercado Pago e o frete é grátis pra todo o Brasil. Até as peças já vendidas continuam no site compondo o portfólio do ateliê. Dá pra encomendar uma parecida. Link na bio, no arroba anasor ponto cerâmica.

### tour-portfolio (47,00 s)
Fonte: mesmos recursos do site, com um pouco mais de detalhe (versão mais longa, pensada pra portfólio).
Rodada 9 (achado do Fabrício): texto antigo (110 palavras, 10
vírgulas) preenchia só 34,7s dos 47s, deixando 12s de silêncio no
fim. Reescrito com bem menos vírgulas (frases curtas) — mesma
informação, ~114 palavras, cabe melhor nos 47s.

> Este é um tour completo pelo site da Anasor Cerâmica. Pensado tanto pra quem compra pelo celular quanto pra quem navega no computador. Cada peça é única e sempre numa unidade só. Nunca existe uma segunda peça igual. Na página de cada peça tem fotos, vídeo e medidas reais. A navegação segue do carrinho lateral até o checkout. Lá o endereço se completa automaticamente a partir do CEP. O pagamento é processado com segurança pelo Mercado Pago. O frete é grátis pra todo o Brasil. Quando uma peça vende ela não sai do site. Passa a compor o portfólio do ateliê, mostrando o trabalho já realizado. Link na bio, no arroba anasor ponto cerâmica.
