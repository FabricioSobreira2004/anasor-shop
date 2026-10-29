# Roteiros de narração — @anasor.ceramica

Rodada 5, item 4. Um texto por vídeo (18 no total — os 12 Reels de
peça, os 4 Reels de conteúdo, `tour-instagram` e `tour-portfolio`; o
loop do README fica mudo, não tem roteiro aqui).

**Regras seguidas em todos os textos** (pedido explícito, Rodada 5):
- Só fatos reais, conferidos em `js/produtos.js` (nome exato de cada
  peça) e `politicas.html` (frete grátis, prazo de envio, pagamento
  pelo Mercado Pago, peça única/estoque 1).
- Nenhum cita Pix, prazo inventado, preço fixo ou "mais vendido".
- Números por extenso.
- Cada peça é citada pelo nome completo, exatamente como está em
  `produtos.js`.
- Gancho nos primeiros ~2 segundos (frase de abertura).
- Fechamento igual em todos: **"Link na bio, no arroba anasor ponto
  cerâmica."** (pronúncia natural do @, pedido explícito).
- Ritmo alvo: ~2,5 palavras por segundo (voz Microsoft Maria,
  `Rate=2` — ver `narracao/README.md`), com folga de 0,5 s no fim.
  Duração de cada vídeo medida por `ffprobe` antes de escrever o
  texto (ver coluna "vídeo").
- Reels de peça: texto próprio, sobre a peça mostrada. Reels de
  CONTEÚDO: paráfrase das legendas já existentes e já checadas em
  `reels/src/roteiros.js` (mesmos fatos, não reinventados). Tour:
  descreve recursos reais do site, sem citar preço de peça nenhuma.

Se, ao gerar o áudio de verdade, um texto não couber na duração do
vídeo com folga (ver `narracao/narrar.js`), ele é cortado (nunca
acelerado além de 1,1×) e a mudança fica registrada em
`DECISOES.md` — não se edita este arquivo em silêncio.

---

## Reels de peça (12)

### r1-caneca-surpresa-gatinho (14,50 s)
Peça: Caneca Artística Surpresa Gatinho (produto id 20)

> Tem um segredo escondido nesta caneca. A Caneca Artística Surpresa Gatinho revela, aos poucos, um gatinho pintado à mão no fundo, enquanto você bebe. Link na bio, no arroba anasor ponto cerâmica.

### r7-casinhas-de-fada (13,50 s)
Peça: Kit 4 Casinhas de Fada Luminária (produto id 36)

> Quatro casinhas, uma luz só pra encantar. O Kit 4 Casinhas de Fada Luminária é modelado e pintado à mão, peça por peça. Link na bio, no arroba anasor ponto cerâmica.

### prato-canario-flor-de-outono (12,83 s)
Peça: Prato Decorativo Canário e Flor de Outono (produto id 41)

> Um canário pousa entre flores de outono. O Prato Decorativo Canário e Flor de Outono é pintado à mão, uma peça única no ateliê. Link na bio, no arroba anasor ponto cerâmica.

### vaso-refugio-de-petalas (13,50 s)
Peça: Vaso Escultórico Refúgio de Pétalas (produto id 25)

> Um refúgio esculpido em pétalas. O Vaso Escultórico Refúgio de Pétalas é moldado à mão, sem igual no ateliê da Anasor. Link na bio, no arroba anasor ponto cerâmica.

### caneca-passaro-azul (12,17 s)
Peça: Caneca Artística Pássaro Azul ao Amanhecer (produto id 28)

> Um pássaro observa o amanhecer nesta caneca. A Caneca Artística Pássaro Azul ao Amanhecer é pintada à mão, peça única. Link na bio, no arroba anasor ponto cerâmica.

### colecao-objetos-decorativos (13,00 s)
Peças: Porta-Joias Jacaré das Águas Azuis (id 39), Anjo Guardião Porta-Incenso (id 43), Saboneteira Folha e Pássaro Dourado (id 38)

> Três peças, uma só alma: Porta-Joias Jacaré das Águas Azuis, Anjo Guardião Porta-Incenso e Saboneteira Folha e Pássaro Dourado. Link na bio, no arroba anasor ponto cerâmica.

### caneca-surpresa-cachorrinho (13,50 s)
Peça: Caneca Artística Surpresa Cachorrinho (produto id 19)

> Um cachorrinho se revela no fundo da caneca. A Caneca Artística Surpresa Cachorrinho é pintada à mão, peça por peça. Link na bio, no arroba anasor ponto cerâmica.

### kit-canequinhas-arlequim (12,67 s)
Peça: Kit 4 Canequinhas Arlequim Marmorizado (produto id 23)

> Cores marmorizadas, feitas pra combinar. O Kit 4 Canequinhas Arlequim Marmorizado é modelado à mão, sempre em peça única. Link na bio, no arroba anasor ponto cerâmica.

### anjo-guardiao-porta-incenso (13,50 s)
Peça: Anjo Guardião Porta-Incenso (produto id 43)

> Um guardião silencioso pra sua casa. O Anjo Guardião Porta-Incenso é esculpido à mão, com acabamento único. Link na bio, no arroba anasor ponto cerâmica.

### kit-copos-ondas-do-mar (12,67 s)
Peça: Kit 2 Copos Ondas do Mar (produto id 40)

> O mar em forma de cerâmica. O Kit 2 Copos Ondas do Mar é modelado à mão, peça única no ateliê. Link na bio, no arroba anasor ponto cerâmica.

### prato-ave-da-alvorada (12,50 s)
Peça: Prato Decorativo Ave da Alvorada (produto id 10)

> Uma ave anuncia o começo do dia. O Prato Decorativo Ave da Alvorada é pintado à mão, peça única. Link na bio, no arroba anasor ponto cerâmica.

### colecao-pecas-de-alma (13,00 s)
Peças: Kit 3 Xícaras de Café Terra Escura (id 32), Saboneteira Pássaro Azul-Noite (id 37), Vaso Escultórico Elo Noturno (id 45)

> Peças com história pra contar: Kit 3 Xícaras de Café Terra Escura, Saboneteira Pássaro Azul-Noite e Vaso Escultórico Elo Noturno. Link na bio, no arroba anasor ponto cerâmica.

---

## Reels de conteúdo (4)

Paráfrase das legendas já existentes em `reels/src/roteiros.js`
(mesmos fatos — nenhum fato novo introduzido aqui).

### cuidados-conteudo (13,67 s)
Fonte: lista "Como lavar" + "As variações são a assinatura"

> Sua peça pede um cuidado simples. Lave com água morna e sabão neutro, evite a lava-louças e mudanças bruscas de temperatura. E lembre-se: pequenas variações fazem parte da assinatura de cada peça única. Link na bio, no arroba anasor ponto cerâmica.

### como-comprar-conteudo (15,00 s)
Fonte: 3 passos "Como comprar" (sem citar Pix, ao contrário da legenda na tela)

> Comprar na Anasor é simples. Escolha sua peça única, pague com segurança pelo Mercado Pago, e receba em casa com frete grátis, em até sete dias úteis. Link na bio, no arroba anasor ponto cerâmica.

### peca-unica-conteudo (17,00 s)
Fonte: "Estoque sempre 1" + "As variações são a assinatura" + "Não existe troca idêntica"

> Aqui, nenhuma peça se repete. Cada peça existe numa única unidade: quando vende, não tem reposição, vira parte do portfólio do ateliê. Pequenas variações de cor e formato são a assinatura do trabalho manual, não um defeito. Link na bio, no arroba anasor ponto cerâmica.

### encomenda-conteudo (17,00 s)
Fonte: 4 passos "Como funciona uma encomenda" (sem prazo nem preço fixo, igual à legenda na tela)

> Quer uma peça pensada pra você? Chame no WhatsApp pelo link na bio, conte sua ideia, e a gente combina juntos os detalhes, o prazo e o valor. Depois, eu faço a sua peça à mão, do começo ao fim. Link na bio, no arroba anasor ponto cerâmica.

---

## Tour do site (2)

### tour-instagram (32,17 s)
Fonte: recursos reais do site, sem citar preço de peça nenhuma

> Dá uma volta pelo site da Anasor Cerâmica. Cada peça é única, feita à mão, com fotos, vídeo e medidas reais. Escolha a sua, adicione ao carrinho e feche a compra com segurança pelo Mercado Pago — o endereço se completa sozinho a partir do CEP, e o frete é grátis para todo o Brasil. Peças já vendidas continuam no site, como parte do portfólio do ateliê. Link na bio, no arroba anasor ponto cerâmica.

### tour-portfolio (50,00 s)
Fonte: mesmos recursos do site, com um pouco mais de detalhe (versão mais longa, pensada pra portfólio)

> Este é um tour completo pelo site da Anasor Cerâmica, pensado tanto pra quem compra pelo celular quanto pra quem navega no computador. Cada peça é única, com fotos, vídeo e medidas reais, sempre em uma unidade só — nunca existe seletor de quantidade, porque nunca existe uma segunda peça igual. A navegação segue do carrinho lateral até o checkout, onde o endereço se completa automaticamente a partir do CEP e o pagamento é processado com segurança pelo Mercado Pago. O frete é grátis para todo o Brasil. E quando uma peça vende, ela não sai do site: passa a compor o portfólio do ateliê, mostrando o trabalho já realizado. Link na bio, no arroba anasor ponto cerâmica.
