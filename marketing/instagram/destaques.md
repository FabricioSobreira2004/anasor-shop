# Destaques do Instagram — @anasor.ceramica

Cada destaque tem de 3 a 5 stories curtos. Os textos usam apenas informações reais da loja: `politicas.html` (compra, envio, trocas, cuidados e FAQ) e `js/produtos.js` (peças e preços). **Nada de prazo de encomenda inventado:** prazo e valor de encomenda são sempre combinados pelo WhatsApp.

## Capas dos destaques (v3 — gerar-capas-destaque.js)

A v1 (emoji cru sobre círculo bege) e a v2 (ícone de linha fino, fundo
alternado, sem moldura) foram reprovadas pelo Fabrício: "sem borda, sem
símbolo, simples demais". A v3 (2026-11-15, modo autônomo) dá a cada
destaque uma **moldura circular 3D** — a mesma linguagem do redesign v4
dos posts (`gerar-posts.js`) — e um **ícone + 1 palavra** em vez de
emoji. Gerar com `node gerar-capas-destaque.js` (dentro de
`marketing/instagram/`); saída em `marketing/instagram/destaques/`
(fora do git, ver `.gitignore` — reproduzível a qualquer momento a
partir do script).

**Cada capa, de fora para dentro:**
1. Fundo creme (`--cor-fundo`) liso com o padrão "AS" bem suave
   (`--marca-monograma-fraca`, 3,5% de opacidade) + textura de grão.
2. Moldura circular 3D "cerâmica esmaltada": respiro creme → anel
   terracota (`--cor-destaque`) → fio dourado (mesmo `#D9B06A` dos
   medalhões dos posts) → bisel/brilho e sombra interna via `box-shadow`
   (mesma técnica de `.rosto-anasor`/`.confianca__medalhao` em
   `gerar-posts.js`) → sombra de contato no fundo.
3. Um raminho dourado fino contornando uma parte do anel (sempre no
   mesmo ângulo nos 7, pra fileira parecer um conjunto — não é a
   `--marca-flor` do site, que já vem com cor/opacidade fixas no SVG;
   é um desenho próprio, calculado por trigonometria sobre o raio do
   anel, em `raminhoHtml()`).
4. Ícone grande (ou a foto da Anasor, no caso de Ateliê) num "puck"
   creme bem sutil (relevo gummy discreto, não uma 2ª moldura) + o nome
   do destaque embaixo, em Fraunces.

**Os 7 destaques:**

| Destaque | Ícone | Texto na capa |
|---|---|---|
| Peças | Vaso de cerâmica (traço próprio) | Peças |
| Como Comprar | "?" grande em Fraunces (testado contra sacola e ícone de interrogação em círculo — os dois liam pior reduzidos) | Comprar? |
| Frete Grátis | Caminhão (Lucide `truck`, mesmo ícone do selo de frete dos posts) | Frete grátis |
| Encomendas | Pincel com ponta sólida + gota de tinta (traço próprio) | Encomende |
| Ateliê | Rosto da Anasor (`img/institucional/quem-somos.jpg`, mesmo recorte circular dos posts) | Ateliê |
| Bastidores | Disco de argila visto de cima + bolo central + riscos de giro (traço próprio — 3 tentativas anteriores com elipse em perspectiva liam como chapéu) | Bastidores |
| Cuidados | Gota sobre mãos em concha (traço próprio) | Cuidados |

**Legibilidade real (~60-80px no perfil):** nenhuma palavra lê nesse
tamanho — é físico, não dá pra caber texto legível num círculo tão
pequeno sem lotar o ícone. A decisão foi priorizar a SILHUETA do ícone
(ocupa 54% do núcleo da moldura) e deixar o texto como reforço visível
só em tamanhos maiores (story aberto, feed, etc.). Conferido no mock
`_mockup-perfil-390.png` (largura real de celular) a cada rodada de
ajuste de ícone.

**Antes de mudar o design de novo:** o script apaga e regenera toda a
pasta `destaques/` a cada execução — nenhuma capa é editada à mão, então
não existe o risco de perder trabalho ao rodar de novo.

---

## 1. Peças Únicas

**Story 1**
> Aqui nada é feito em série.
> Cada peça é modelada e pintada à mão, uma de cada vez.

**Story 2**
> Por isso cada uma é única: pequenas variações de cor, textura e formato fazem parte do trabalho manual.

**Story 3**
> Quando uma peça é vendida, ela não volta para a vitrine.
> Não existe estoque de reposição igual.

**Story 4**
> Pratos pintados, canecas com surpresa no fundo, vasos escultóricos, travessas e conjuntos.
> Veja o que ainda está disponível no link na bio 🤎

---

## 2. Bastidores

**Story 1**
> Do barro à peça pronta: tudo acontece aqui no ateliê.

**Story 2**
> Os pratos são torneados e depois pintados à mão, pincelada por pincelada.

**Story 3**
> Algumas peças são esculpidas em detalhe: rosas na alça da caneca, um jacaré no porta-joias, telhados de casinhas de fada.

**Story 4**
> Na queima, o esmalte reage e cria efeitos que nunca se repetem.
> É por isso que nenhuma peça sai igual à outra 🤎

> **Nota:** usar vídeos e fotos reais do ateliê (torno, pintura, forno). Ver "pendências de mídia" no fim deste arquivo.

---

## 3. Como Comprar

**Story 1**
> Comprar é simples:
> 1. Toque no link da bio
> 2. Escolha sua peça em Cerâmica ou Crochê
> 3. Adicione ao carrinho e finalize

**Story 2**
> Pagamento por Pix, cartão de crédito ou cartão de débito.

**Story 3**
> Frete grátis para todo o Brasil, em todas as peças.

**Story 4**
> Enviamos pelos Correios em até 7 dias úteis após a confirmação do pagamento.
> O prazo de entrega varia conforme a sua região.

**Story 5**
> Você pode se arrepender da compra em até 7 dias corridos depois de receber a peça, como garante o Código de Defesa do Consumidor.
> Políticas completas no link na bio 🤎

---

## 4. Encomendas

**Story 1**
> Viu uma peça que já foi vendida e se apaixonou?
> Dá para encomendar uma parecida.

**Story 2**
> Como cada peça é feita à mão, a nova nunca será idêntica: será outra peça única, inspirada na que você gostou.

**Story 3**
> As encomendas são combinadas direto comigo pelo WhatsApp: detalhes, prazo e valor, tudo conversado com você.

**Story 4**
> Toque em "Encomende sua peça única" no link da bio e me mande uma mensagem 🤎

---

## 5. Cuidados com a Peça

**Story 1**
> Sua peça foi feita à mão e merece um carinho especial.

**Story 2**
> Cerâmica: lave à mão, com água morna e sabão neutro.

**Story 3**
> Evite a lava-louças e mudanças bruscas de temperatura.

**Story 4**
> Crochê: lave à mão e seque à sombra, para preservar as fibras.

**Story 5**
> Chegou com avaria do transporte ou defeito de fabricação?
> Fale comigo pelo WhatsApp em até 7 dias do recebimento e resolvemos juntos, com reparo, troca ou reembolso 🤎

---

## Pendências de mídia

- Fotos/vídeos reais do ateliê para "Bastidores" (torno, pintura, forno, embalagem).
- Fotos das peças já existem em `img/produtos/` e podem ilustrar "Peças Únicas".
- Capas dos destaques: os emojis estão definidos acima, falta montar as 5 imagens.
