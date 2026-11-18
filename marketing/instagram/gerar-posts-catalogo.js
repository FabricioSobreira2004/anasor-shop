#!/usr/bin/env node
// ============================================================
// Posts + Stories do catálogo completo (@anasor.ceramica) — pedido
// explícito do Fabrício, modo 100% autônomo, 2026-11-18 (ver DECISOES.md,
// "Rodada 16 — catálogo completo"). gerar-posts.js já cobre 9 peças
// "curadas" (post-01 a 09) + 4 carrosséis de conteúdo; este script cobre
// TODAS as outras peças disponíveis do catálogo, no mesmo padrão visual
// v4 (reaproveita as funções de gerar-posts.js via module.exports — ver
// cabeçalho daquele arquivo — em vez de duplicar o motor HTML/CSS/
// Playwright).
//
// Como rodar:
//   cd marketing/instagram
//   node gerar-posts-catalogo.js
//
// Saída: marketing/instagram/conteudo/ — pedido explícito desta rodada
// (diferente de instagram-posts/, que fica em site-mae/); fica DENTRO do
// repositório mas fora do git (.gitignore, mesmo padrão de destaques/),
// porque são PNGs gerados, pesados, 100% reproduzíveis a partir deste
// script.
//
// Peças puladas (regra do pedido, ver também relatório final):
//   - id 33 (Pote Decorativo Bruma Dourada): disponivel:false, já é o
//     exemplo de "peça vendida" usado no carrossel "Encomende a sua" de
//     gerar-posts.js — não devia ganhar post de venda próprio de qualquer
//     forma (regra de negócio do CLAUDE.md).
//   - id 29 (Caneca Artística Pássaro e Rosa): pedido explícito do
//     Fabrício ("duvidosa") — só 1 foto registrada, com histórico de
//     recorte problemático (ver comentário em js/produtos.js).
//   - "Caneca Surpresa Raposinha" e "Guirlanda de Contas com Franjas"
//     (citadas no pedido como duvidosas): NÃO EXISTEM MAIS no catálogo
//     sob esses nomes — já foram corrigidas em rodadas anteriores (ver
//     comentários em js/produtos.js linha ~619 e ~1147): a "raposinha"
//     era a MESMA caneca do cachorrinho (id 19, já curada), e a
//     "guirlanda" foi re-identificada como id 42 "Terço de Mesa Grãos de
//     Oração" — um produto confirmado, com descrição real, sem motivo
//     para continuar de fora. DECISÃO: incluir o id 42 normalmente.
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const P = require('./gerar-posts.js');
const { formatarLegenda } = require('./formatar-legenda.js');

const SAIDA = path.join(__dirname, 'conteudo');
const SAIDA_POSTS = path.join(SAIDA, 'posts');
const SAIDA_STORIES_PRODUTOS = path.join(SAIDA, 'stories', 'produtos');
const SAIDA_STORIES_INST = path.join(SAIDA, 'stories', 'institucionais');

const { LARGURA, ALTURA, ALTURA_STORY, DOURADO } = P;
const MAX_FOTOS_EXTRAS = 4; // pedido explícito desta rodada (era 3 nos posts curados)

// Área segura dos Stories (pedido explícito: nada importante nos 250px de
// cima nem nos 300px de baixo) — com folga, mesmo espírito do MARGEM_SEGURA
// "72 não 56" de gerar-posts.js: 280/340 dão uma margem extra sem custo.
const STORY_TOPO = 280;
const STORY_BASE = 340;

// ---- Peças explicitamente fora desta rodada (ver cabeçalho) ----
const PULAR_VENDIDA = [33];
const PULAR_DUVIDOSA = [29];

// ============================================================
// Catálogo desta rodada: ORDEM escolhida à mão (não por fórmula) pra
// alternar categoria a categoria (prato/caneca/vaso/kit/objeto...) sem
// nenhuma categoria se repetir muitas vezes em seguida, com os melhores
// de cada categoria (mais fotos, selo queridinho/assinada) primeiro
// dentro da própria categoria — mesmo espírito de PECAS em gerar-posts.js
// (lista com critério documentado, não um algoritmo genérico pra 1 uso
// só). Categorias com 1 peça só (Travessa/Jarra/Devoção) foram inseridas
// em pontos espaçados do meio, pra não ficarem todas juntas no fim.
// ============================================================
const ORDEM_IDS = [
  2, 20, 7, 36, 39, 14, 9, 26, 25, 23, 44, 12, 30, 45, 35, 43, 21, 3, 31,
  40, 38, 4, 28, 22, 37, 42, 10, 32, 16, 34, 15, 11, 41,
];

// ---- 26 legendas novas (as outras 7 já existem em legendas.md e são
// reaproveitadas pelo nome — ver carregarLegendaDoProduto). Mesma
// estrutura da legenda nº1 (gancho → sensorial → "por que é especial" →
// bloco de compra → CTA de encomenda), texto único por peça: toda frase
// sensorial vem de um destaque REAL da descrição de produtos.js, nunca
// inventada — ver _scratch-candidatos (conferência feita antes de
// escrever) e o comentário de cada bloco onde algo pede contexto. ----
const LEGENDAS_NOVAS = {
  2: {
    texto: `🌺 **Buquê de Calla Rubra** 🤍
_Um ramo vermelho que não murcha nunca._

Modelado e pintado à mão, com copos-de-leite em vermelho e terracota se abrindo sobre folhagem dourada e um fundo azul-e-branco marmorizado. A borda branca e a assinatura da artesã fecham a peça — é das maiores e mais chamativas do ateliê.

✨ **Por que ele é especial**
🤲 Pintado à mão, peça assinada pela artesã
💎 Peça única: não existe outro igual
🖼️ Protagonista num aparador, numa estante alta ou na parede da sala

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido, com a sua cara? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #pecaassinada #decoracaodeparede #feitoamao #artesanatobrasileiro #presentecriativo #mesaposta #flornaceramica',
  },
  7: {
    texto: `🤍 **Copos-de-Leite em Flor** 🌿
_Um vaso que já nasce florido._

Corpo cilíndrico em esmaltes mel e verde-oliva, com copos-de-leite brancos modelados em alto-relevo saindo da borda — a flor faz parte do vaso, não é pintura. Fica bonito com flores frescas, com secas ou vazio.

✨ **Por que ele é especial**
🤲 Feito e modelado à mão, flor por flor
💎 Peça única: não existe outro igual
🏠 Centro de mesa que já vem completo, sem precisar de arranjo

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 169,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#vasoescultorico #ceramicaautoral #esculturaemceramica #decoracaodeinteriores #pecaunica #feitoamao #artedecorativa #presentecriativo #flornaceramica',
  },
  14: {
    texto: `💙 **Bruma Azul** 🌸
_Uma manhã de neblina pintada numa travessa._

Modelada e pintada à mão, com botões e pétalas em aquarela azul-porcelana e toques dourados cobrindo toda a superfície, num efeito suave e contínuo. O formato alongado é generoso pra servir à mesa ou só compor um aparador.

✨ **Por que ela é especial**
🤲 Modelada e pintada à mão, do início ao fim
💎 Peça única: não existe outra igual
🍽️ Combina com decoração clássica e contemporânea

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 299,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#travessadecorativa #ceramicaartesanal #mesaposta #pintadoamao #feitoamao #pecaunica #presenteartesanal #decoracaodeinteriores',
  },
  9: {
    texto: `🌸 **Flor de Pessegueiro** 🍑
_Os primeiros botões depois do inverno._

Torneado e pintado à mão, nascido de uma tarde observando o pessegueiro do quintal abrir as primeiras flores. Pinceladas soltas, quase de aquarela, em rosa-salmão sobre fundo marfim, com borda em terracota natural sem esmalte.

✨ **Por que ele é especial**
🤲 Torneado e pintado à mão no ateliê
💎 Peça única: não existe outro igual
🖼️ Bonito na parede, no aparador ou na mesa posta

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #decoracaoafetiva #feitoamao #artesanatobrasileiro #presentecriativo #mesaposta #flordepessegueiro',
  },
  25: {
    texto: `🤍 **Refúgio de Pétalas** 🌿
_Uma escultura mesmo sem nenhuma flor dentro._

Silhueta orgânica e sinuosa, esculpida em argila crua com recortes vazados que brincam com a luz, e um ramo de flores brancas aplicadas à mão, pétala por pétala. Protagonista de qualquer aparador ou estante, com ou sem flores de verdade dentro.

✨ **Por que ele é especial**
🤲 Esculpido e aplicado à mão, pétala por pétala
💎 Peça única: não existe outro igual
🏠 Funciona como escultura, mesmo vazio

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 179,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#vasoescultorico #ceramicaautoral #esculturaemceramica #decoracaodeinteriores #pecaunica #feitoamao #artedecorativa #presentecriativo',
  },
  23: {
    texto: `🎨 **4 Canequinhas Arlequim Marmorizado** ☕
_Nenhuma saiu igual à outra — nem podia._

Um kit de quatro canequinhas, cada uma com uma mistura única de amarelo, vinho, azul-marinho e terracota marmorizados na queima. O padrão depende do acaso do forno: este conjunto de quatro não se repete.

✨ **Por que ele é especial**
🎲 4 canequinhas, cada uma com seu próprio marmorizado
💎 Conjunto único: não existe outro igual a este
🎁 Perfeita pra presentear em grupo, uma pra cada pessoa especial

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 254,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#kitceramica #conjuntoartesanal #ceramicaartesanal #presentecompleto #feitoamao #mesaposta #pecaunica #cafedamanha',
  },
  12: {
    texto: `🐦 **Serenata a Dois** 🧡
_Dois pássaros conversando de um galho a outro._

Torneado e pintado à mão, a partir de dois pássaros que pareciam dialogar num fim de tarde de quintal. Um casal em penas vermelhas, azuis e douradas se equilibra entre ramos carregados de botões dourados — uma peça de duas figuras, mais rara na produção do ateliê.

✨ **Por que ele é especial**
🤲 Torneado e pintado à mão no ateliê
💎 Peça única: não existe outro igual
🎁 Um presente bonito para casais

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 159,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #presenteparacasais #feitoamao #artesanatobrasileiro #decoracaodeparede #mesaposta',
  },
  30: {
    texto: `🐦 **Pássaro no Galho Florido** 🌿
_A alça da caneca é o próprio galho._

Um passarinho pousa sobre um galho ramificado que forma a própria alça da caneca — a peça inteira vira uma pequena cena de jardim. Esmalte em degradê de verde-escuro para preto, com efeito de gotejamento natural da queima, e brotos vermelhos pontuando o galho.

✨ **Por que ela é especial**
🤲 Trabalho de escultura aplicada, raro numa peça de uso diário
💎 Peça única: não existe outra igual
☕ Funcional de verdade — vai bem no café de todo dia

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#canecaartesanal #ceramicaartesanal #presenteespecial #feitoamao #pecaunica #cafedamanha #passarinhos',
  },
  45: {
    texto: `🖤 **Elo Noturno** ✨
_O ateliê também sabe ser ousado._

Corpo arredondado em esmalte preto brilhante, com duas alças em formato de correntes esculpidas à mão — um design gráfico e contemporâneo, diferente do floral que assina a maior parte do ateliê. Acabamento vitrificado espelhado que reflete a luz do ambiente.

✨ **Por que ele é especial**
🤲 Correntes esculpidas à mão, uma a uma
💎 Peça única: não existe outro igual
🏠 Ponto focal forte numa sala ou hall de entrada

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 199,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#vasoescultorico #ceramicaautoral #esculturaemceramica #decoracaocontemporanea #pecaunica #feitoamao #artedecorativa',
  },
  35: {
    texto: `🌼 **2 Tigelinhas Jardim Encantado** 🍃
_Um pequeno quadro que só aparece quando a tigela esvazia._

Duas tigelinhas com borda azul-marinho e o interior pintado à mão com um jardim de flores rosadas e margaridas sobre fundo verde-claro. Perfeitas para petiscos, azeitonas ou como potinhos de mesa — gêmeas, mas nunca idênticas.

✨ **Por que elas são especiais**
🤲 2 tigelinhas, pintadas à mão, pincelada a pincelada
💎 Conjunto único: não existe outro igual a este
🎁 Ideal pra presentear em dupla

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 149,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#kitceramica #conjuntoartesanal #ceramicaartesanal #presentecompleto #feitoamao #mesaposta #pecaunica',
  },
  43: {
    texto: `😇 **Anjo Guardião Porta-Incenso** 🕊️
_Devoção e decoração no mesmo objeto._

Uma escultura de anjo em cerâmica branca, com asas abertas e uma saia perfurada que deixa a fumaça do incenso escapar em pequenos filetes. Ideal pra meditar, orar ou só perfumar a casa com delicadeza.

✨ **Por que ele é especial**
🤲 Esculpido à mão, acabamento generoso
💎 Peça única: não existe outro igual
🕯️ Une devoção e decoração num só objeto

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 159,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#pecadedevocao #ceramicaartesanal #decoracaoafetiva #feitoamao #pecaunica #presenteespecial #portaincenso',
  },
  21: {
    texto: `🌼 **Flor de Campo** 🏺
_Um jardim de primavera pintado à mão, flor por flor._

Corpo generoso e alça encorpada, com pequenas flores azuis, brancas e rosadas pintadas à mão, uma a uma, sobre esmalte bege aveludado. Serve tanto como vaso para um pequeno arranjo quanto como objeto decorativo solo.

✨ **Por que ela é especial**
🤲 Pintada à mão, flor por flor
💎 Peça única: não existe outra igual
🏠 Versátil: com flores ou sozinha, já decora

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 169,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#jarradeceramica #ceramicaartesanal #decoracaodeinteriores #feitoamao #pecaunica #flornaceramica',
  },
  3: {
    texto: `🌸 **Cerejeira Coral** 🎀
_Flores que não murcham, pintadas à mão em traço fino._

Pintura em traço fino e delicado: flores coral de estames delicados e folhas verde-oliva, em estilo aquarela sobre esmalte creme. Borda natural em terracota e a assinatura da artesã fecham a peça.

✨ **Por que ele é especial**
🤲 Pintado à mão, peça assinada pela artesã
💎 Peça única: não existe outro igual
🖼️ Leve e discreto — combina com paredes claras e mesas de canto

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #pecaassinada #decoracaoafetiva #feitoamao #presentecriativo #mesaposta',
  },
  31: {
    texto: `🌹 **Rosas Champagne** ☕
_Elegância discreta na sua xícara de todo dia._

Pequenas rosas na cor champagne, com miolo dourado, decoram a alça desta caneca em esmalte bege terroso — uma paleta sofisticada, longe do floral tradicional. Cada rosa foi modelada à mão, pétala por pétala.

✨ **Por que ela é especial**
🤲 Modelada à mão, pétala por pétala
💎 Peça única: não existe outra igual
☕ Elegante no dia a dia, sem perder o conforto de uma caneca de uso

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 124,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#canecaartesanal #ceramicaartesanal #presenteespecial #feitoamao #pecaunica #cafedamanha #rosas',
  },
  38: {
    texto: `🍃 **Folha e Pássaro Dourado** 🐦
_Um objeto do dia a dia que vira pequena escultura._

Saboneteira em formato de folha, com nervuras esculpidas à mão e esmalte marrom-escuro fosco, com um pequeno pássaro dourado pousado na ponta. Funcional e decorativa ao mesmo tempo.

✨ **Por que ela é especial**
🤲 Esculpida à mão, nervura por nervura
💎 Peça única: não existe outra igual
🚿 Ideal pro lavabo, a pia da cozinha ou de bandeja na entrada

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 99,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#objetodecorativo #ceramicaartesanal #decoracaoafetiva #feitoamao #pecaunica #presentecriativo #saboneteira',
  },
  4: {
    texto: `🌻 **Girassóis ao Sol** ☀️
_A peça mais quente e luminosa do ateliê._

Pintado à mão, com girassóis de miolo ferrugem e folhas verde-oliva sobre um fundo azul-céu mesclado. Acende um canto apagado da casa na hora — na parede como quadro, numa cômoda, ou como fruteira decorativa no centro da mesa.

✨ **Por que ele é especial**
🤲 Pintado à mão no ateliê
💎 Peça única: não existe outro igual
🍊 Serve como fruteira decorativa, não só como quadro

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #decoracaoafetiva #feitoamao #presentecriativo #girassois #fruteira',
  },
  28: {
    texto: `🐦 **Pássaro Azul ao Amanhecer** ☕
_Ele também quer provar o seu café._

Um pássaro de bico laranja inclina a cabeça para dentro da caneca, como se quisesse provar o café — uma cena em esmalte escuro degradê, com uma flor vermelha aplicada equilibrando o visual. Humor e delicadeza na mesma peça.

✨ **Por que ela é especial**
🤲 Modelada e aplicada à mão
💎 Peça única: não existe outra igual
😄 Tem história pra contar — ótima pra quem ama observar pássaros

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#canecaartesanal #ceramicaartesanal #presenteespecial #feitoamao #pecaunica #cafedamanha #passarinhos',
  },
  22: {
    texto: `🌾 **Jarra e 2 Copos Textura Casca** 🍷
_As três peças foram queimadas juntas — por isso combinam tão bem._

Um conjunto de 1 jarra e 2 copos com textura de casca de árvore, em esmalte terroso que lembra areia ao entardecer. As três peças foram queimadas e esmaltadas juntas, garantindo a mesma variação de tom entre elas — um detalhe que só um conjunto genuinamente artesanal entrega.

✨ **Por que ele é especial**
🏺 1 jarra + 2 copos, queimados juntos
💎 Conjunto único: não existe outro igual a este
🎁 Ótimo presente de casa nova

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 229,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#kitceramica #conjuntoartesanal #ceramicaartesanal #presentecompleto #feitoamao #mesaposta #pecaunica #casanova',
  },
  37: {
    texto: `🌙 **Pássaro Azul-Noite** 🧼
_Até lavar as mãos pode ter um detalhe bonito._

Saboneteira redonda em esmalte azul-marinho profundo, com um pequeno pássaro dourado pousado na borda, como se viesse beber água ali mesmo. Eleva a rotina simples do banheiro ou lavabo.

✨ **Por que ela é especial**
🤲 Modelada e pintada à mão
💎 Peça única: não existe outra igual
🎁 Presente de casa nova certeiro

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 99,90 · toque no **link da bio** e garanta a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#objetodecorativo #ceramicaartesanal #decoracaoafetiva #feitoamao #pecaunica #presentecriativo #casanova',
  },
  42: {
    texto: `🙏 **Grãos de Oração** ✨
_Um convite pra pausar, bem ali na mesa de cabeceira._

Contas de cerâmica crua, moldadas e enfiadas uma a uma à mão, com borlas de fio natural nas pontas — uma peça devocional pensada pra ficar à vista, num oratório ou cantinho de oração. Mais do que decoração, é lembrança silenciosa de fé no dia a dia.

✨ **Por que ele é especial**
🤲 Cada conta moldada e enfiada manualmente
💎 Peça única: não existe outra igual
🎁 Presente especial pra batizados e crismas

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 109,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#pecadedevocao #fedecasa #ceramicaartesanal #feitoamao #presenteespecial #tercodemesa',
  },
  10: {
    texto: `🌅 **Ave da Alvorada** 🐦
_O instante em que os primeiros pássaros começam a cantar._

Torneado e pintado à mão, com uma avezinha em azul-acinzentado e branco pousando entre flores rosa-claro, em traço solto sobre fundo marfim. Borda em terracota natural, sem esmalte.

✨ **Por que ele é especial**
🤲 Torneado e pintado à mão no ateliê
💎 Peça única: não existe outro igual
🌤️ Um presente sereno pra começar o dia com calma

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #decoracaoafetiva #feitoamao #presentecriativo #passarinhos',
  },
  32: {
    texto: `☕ **3 Xícaras de Café Terra Escura** 🤎
_6 peças, queimadas juntas pra ficarem em harmonia._

Três xícaras com pires em esmalte marrom-chocolate profundo e interior branco cremoso — um kit de 6 peças (3 xícaras + 3 pires), clássico e sóbrio. As bordas irregulares dos pires, propositalmente orgânicas, reforçam o caráter artesanal do conjunto.

✨ **Por que ele é especial**
☕ 3 xícaras + 3 pires, feitos e queimados juntos
💎 Conjunto único: não existe outro igual a este
🎁 Presente certeiro pra quem ama um café especial

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 219,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#kitceramica #conjuntoartesanal #ceramicaartesanal #presentecompleto #feitoamao #mesaposta #pecaunica #cafedamanha',
  },
  34: {
    texto: `🍎 **3 Maçãs Guardiãs do Pomar** 🧡
_Uma cestinha de frutas que nunca estraga._

Três potinhos com tampa em formato de maçã, esmaltados em vermelho vivo com cabinho verde e interior branco — um kit lúdico pra guardar doces, temperos ou bijuterias. Juntos, formam uma pequena cesta de frutas de cerâmica sobre a mesa.

✨ **Por que ele é especial**
🍎 3 potinhos em formato de maçã, feitos à mão
💎 Conjunto único: não existe outro igual a este
🎁 Um toque de alegria e cor em qualquer cozinha

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 194,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto parecido? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#kitceramica #conjuntoartesanal #ceramicaartesanal #presentecompleto #feitoamao #mesaposta #pecaunica',
  },
  15: {
    texto: `🌴 **Brisa de Palmeira** 💨
_O movimento do vento, guardado numa peça só._

Torneado e pintado à mão, com uma única fronde de palmeira em verde, amarelo e marrom atravessando a peça na diagonal, sobre fundo marmorizado azul-acinzentado e branco. Um dos pratos maiores do ateliê — protagonismo de um motivo só.

✨ **Por que ele é especial**
🤲 Torneado e pintado à mão no ateliê
💎 Peça única: não existe outro igual
🖼️ Centro de mesa, cavalete ou parede — ele domina qualquer um dos três

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 259,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #decoracaoafetiva #feitoamao #presentecriativo #tropical',
  },
  11: {
    texto: `🥚 **Ninho Encantado** 🐦
_Um ninho recém-feito, com ovos ainda quentes._

Torneado e pintado à mão, com um pássaro azul-turquesa de peito amarelo vigiando de perto, cercado por flores pêssego sobre um fundo aquarelado em tons de azul que lembra o céu do início da manhã. Assinatura da artesã.

✨ **Por que ele é especial**
🤲 Pintado à mão, peça assinada pela artesã
💎 Peça única: não existe outro igual
🍼 Combina com berçário, sala de estar, ou presente pra quem espera uma novidade

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 134,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #pecaassinada #decoracaoafetiva #feitoamao #presentecriativo #chadebebe',
  },
  41: {
    texto: `🍂 **Canário e Flor de Outono** 🐦
_Dois canários se encontram em pleno voo._

Pintado à mão sobre um fundo de barro cru com sombreado suave, quase como uma pintura a carvão, com dois canários em pleno voo se encontrando sobre um ramo de flores alaranjadas. Pensado pra pendurar na parede ou apoiar num cavalete.

✨ **Por que ele é especial**
🤲 Pintado à mão, sem duas iguais
💎 Peça única: não existe outro igual
🎨 Traz movimento e cor pra decoração rústica ou boho

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 R$ 154,90 · toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente faz por encomenda.`,
    hashtags: '#pratodecorativo #ceramicaartesanal #pintadoamao #decoracaorustica #feitoamao #presentecriativo #passarinhos',
  },
};

// Pega a legenda já escrita em legendas.md pelo NOME da peça (mesma
// lógica de main() em gerar-posts.js); se não achar, cai na nova.
function legendaDoProduto(produto, legendasExistentes) {
  const existente = legendasExistentes.find(
    (l) => l.nome === produto.nome || l.nome === P.nomeCurto(produto.nome)
  );
  if (existente) return { texto: existente.texto, hashtags: existente.hashtags, origem: `legendas.md nº ${existente.numero}` };
  const nova = LEGENDAS_NOVAS[produto.id];
  if (!nova) throw new Error(`Peça id ${produto.id} (${produto.nome}) sem legenda — adicione em LEGENDAS_NOVAS ou legendas.md`);
  return { texto: nova.texto, hashtags: nova.hashtags, origem: 'legenda nova desta rodada' };
}

// ---- Slug de pasta a partir do nome da peça (sem acento, sem travessão) ----
function slug(nome) {
  return P.nomeCurto(nome)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function limparPasta(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

// ============================================================
// POST da peça (carrossel): capa (layout 1, sempre — é o único 100%
// adaptado ao redesign v4 por completo, ver README.md "v4" — layouts
// 2/3/4 ainda não têm a hierarquia de nome; usar só o 1 mantém TODO post
// novo no mesmo padrão premium do post-01, sem risco de inconsistência)
// + 1-4 fotos extra (mínimo 1, máximo 4 — pedido explícito) + "por que
// comprar" + chamada final.
// ============================================================
async function gerarPostProduto(pagina, v, produto, logoUri, rostoUri, legendasExistentes, n) {
  const fotos = [produto.imagem, ...(produto.imagensExtras || [])]
    .map((f) => path.join(P.RAIZ, f))
    .filter((f) => fs.existsSync(f));
  if (!fotos.length) {
    console.warn(`[pulado] id ${produto.id} "${produto.nome}": nenhuma foto encontrada em img/.`);
    return null;
  }

  const nn = String(n).padStart(2, '0');
  const pastaSlug = `${nn}-${slug(produto.nome)}`;
  const pasta = path.join(SAIDA_POSTS, pastaSlug);
  fs.mkdirSync(pasta, { recursive: true });

  const nome = P.nomeCurto(produto.nome);
  const recorte = '50% 50%';
  const slides = [];
  const salvar = async (html, descricao, alt) => {
    const arquivo = `${slides.length + 1}.png`;
    await P.renderizar(pagina, html, path.join(pasta, arquivo));
    slides.push({ arquivo, descricao, alt });
  };

  await salvar(
    P.slideCapa(v, P.dataUri(fotos[0]), nome, recorte, produto, logoUri),
    'capa com a foto principal, selo e nome da peça',
    `${produto.nome}, peça de cerâmica artesanal da Anasor Sobreira`
  );

  // Mínimo 1 foto extra, máximo 4 (pedido explícito) — nenhuma peça deste
  // catálogo tem só 1 foto no total, mas o fallback abaixo cobre o caso.
  let fotosExtras = fotos.slice(1, 1 + MAX_FOTOS_EXTRAS);
  if (!fotosExtras.length) fotosExtras = [fotos[0]];
  const destaques = P.extrairDestaques(produto.descricao || '');
  const thumbsUris = fotos.slice(0, fotosExtras.length + 1).map((f) => P.dataUri(f));
  for (const [i, foto] of fotosExtras.entries()) {
    const legendaFoto = destaques[i] || P.LEGENDAS_FOTO_RESERVA[i % P.LEGENDAS_FOTO_RESERVA.length];
    const variante = (i % 3) + 1;
    await salvar(
      P.slideFotoPorVariante(variante, v, P.dataUri(foto), legendaFoto, thumbsUris, i + 1, logoUri),
      `foto extra (${path.basename(foto)}) — legenda "${legendaFoto}", layout ${variante}`,
      `${legendaFoto}: ${nome}, peça de cerâmica artesanal`
    );
  }

  await salvar(
    P.slideConfianca(v, logoUri, rostoUri),
    '"Por que comprar com a Anasor Sobreira" — frete, pagamento, envio, peça única',
    'Por que comprar com a Anasor Sobreira: frete grátis para todo o Brasil, Pix/crédito/débito via Mercado Pago, envio em até 7 dias úteis, peça única'
  );
  await salvar(
    P.slideChamada(v, logoUri, rostoUri),
    '"Peça única / Link na bio" + faixa de confiança',
    'Peça única, feita à mão, uma de cada vez — @anasor.ceramica, link na bio'
  );

  const legenda = legendaDoProduto(produto, legendasExistentes);
  const corpoFormatado = formatarLegenda(legenda.texto);
  fs.writeFileSync(path.join(pasta, 'legenda.txt'), `${corpoFormatado}\n\n${legenda.hashtags}`, 'utf8');
  fs.writeFileSync(
    path.join(pasta, 'alt-text.txt'),
    slides.map((s, i) => `${i + 1}.png: ${s.alt}`).join('\n'),
    'utf8'
  );

  // Stories do produto (ver gerarStoriesProduto) na mesma pasta-slug.
  const pastaStories = path.join(SAIDA_STORIES_PRODUTOS, pastaSlug);
  fs.mkdirSync(pastaStories, { recursive: true });
  await P.renderizar(
    pagina,
    storyFotoPeca(v, P.dataUri(fotos[0]), nome, recorte, logoUri),
    path.join(pastaStories, 'story-1.png'),
    LARGURA, ALTURA_STORY
  );
  const fotoDetalhe = fotos[1] || fotos[0];
  await P.renderizar(
    pagina,
    storyDetalhePeca(v, P.dataUri(fotoDetalhe), thumbsUris, logoUri),
    path.join(pastaStories, 'story-2.png'),
    LARGURA, ALTURA_STORY
  );

  console.log(`post ${nn} (${slides.length} slides + 2 stories): ${produto.nome} — legenda: ${legenda.origem}`);
  return { n, produto, pastaSlug, categoria: produto.subcategoria };
}

// ============================================================
// Stories de PRODUTO — novas (não existem em gerar-posts.js, que só tem
// a capa em formato Story). Área segura: 280px topo / 340px base (ver
// STORY_TOPO/STORY_BASE) — maior que o mínimo pedido (250/300), mesma
// lógica de folga de MARGEM_SEGURA.
// ============================================================

// Story 1: foto grande em moldura 3D + nome com hierarquia + tagline.
function storyFotoPeca(v, fotoUri, nomeCompleto, recorte, logoUri) {
  const { tipo, poetico } = P.dividirNome(nomeCompleto);
  return P.baseHtml(v, `
    <main class="story-foto">
      <div class="story-foto__moldura">
        <img src="${fotoUri}" alt="" style="object-position:${recorte}">
        <div class="story-foto__chip">${P.marcaDaguaHtml(logoUri, '', false)}</div>
      </div>
      <div class="story-foto__legenda">
        ${tipo ? `<p class="story-foto__tipo">${P.escaparHtml(tipo)}</p>` : ''}
        <h1 id="titulo" data-max-linhas="2">${P.escaparHtml(poetico)}</h1>
        <p class="story-foto__tagline">Peça única, feita à mão ${P.svgCoracao(32, v.destaque)}</p>
      </div>
    </main>`, `
    .story-foto {
      position: absolute; top: ${STORY_TOPO}px; bottom: ${STORY_BASE}px; left: 0; right: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 40px; padding: 0 64px;
    }
    .story-foto__moldura {
      position: relative; width: 100%; max-width: 860px; flex: 1 1 auto; min-height: 0;
      border-radius: 32px; overflow: hidden;
      box-shadow: 0 0 0 10px ${v.fundo}, 0 0 0 14px ${v.destaque}, 0 36px 70px rgba(62, 46, 34, 0.32);
    }
    .story-foto__moldura img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .story-foto__chip {
      position: absolute; top: 28px; right: 28px; width: 116px; height: 116px; border-radius: 50%;
      background: rgba(251, 246, 239, 0.97); display: flex; align-items: center; justify-content: center;
      padding: 16px; box-shadow: 0 2px 0 rgba(255, 255, 255, 0.5) inset, 0 8px 20px rgba(0, 0, 0, 0.3);
    }
    .story-foto__chip .marca-dagua { position: static; width: 100%; height: auto; opacity: 1; filter: none; }
    .story-foto__legenda { flex: 0 0 auto; text-align: center; }
    .story-foto__tipo {
      font-family: 'Jost', sans-serif; font-weight: 500; font-size: 30px;
      letter-spacing: 0.06em; text-transform: uppercase; color: ${v.destaque}; margin-bottom: 10px;
    }
    h1 { font-family: 'Fraunces', serif; font-weight: 600; font-style: italic; font-size: 76px; line-height: 1.1; max-height: calc(76px * 1.1 * 2 + 4px); }
    .story-foto__tagline {
      margin-top: 20px; font-size: 36px; color: ${v.destaque};
      display: flex; align-items: center; justify-content: center; gap: 14px;
    }`, ALTURA_STORY);
}

// Story 2: detalhe + miniaturas + "frete grátis" — e o terço inferior do
// Story (abaixo de y=1280) fica DELIBERADAMENTE vazio, espaço reservado
// pro sticker de link do Instagram (indicado só no relatório, nunca
// desenhado na arte — pedido explícito).
function storyDetalhePeca(v, fotoDetalheUri, thumbsUris, logoUri) {
  const thumbs = thumbsUris.length > 1
    ? `<div class="story-detalhe__thumbs">${thumbsUris.map((u) => `<div class="story-detalhe__thumb"><img src="${u}" alt=""></div>`).join('')}</div>`
    : '';
  return P.baseHtml(v, `
    <div class="story-detalhe__reserva"></div>
    <main class="story-detalhe">
      <div class="story-detalhe__chip">${P.marcaDaguaHtml(logoUri, '', false)}</div>
      <div class="story-detalhe__moldura"><img src="${fotoDetalheUri}" alt=""></div>
      ${thumbs}
      <div class="story-detalhe__frete">${P.svgIcone('truck', 44, '#FFF')}<span>Frete grátis para todo o Brasil</span></div>
    </main>`, `
    /* terço inferior (y > 1280, bem mais que os 300px mínimos pedidos)
       reservado pro sticker de link — nenhum elemento visual aqui. */
    .story-detalhe__reserva { position: absolute; left: 0; right: 0; bottom: 0; height: 640px; }
    .story-detalhe {
      position: absolute; top: ${STORY_TOPO}px; left: 0; right: 0; height: 1000px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 36px; padding: 0 70px;
    }
    .story-detalhe__chip {
      position: absolute; top: 0; right: 16px; width: 104px; height: 104px; border-radius: 50%;
      background: rgba(251, 246, 239, 0.97); display: flex; align-items: center; justify-content: center;
      padding: 14px; box-shadow: 0 2px 0 rgba(255, 255, 255, 0.5) inset, 0 8px 20px rgba(0, 0, 0, 0.28);
    }
    .story-detalhe__chip .marca-dagua { position: static; width: 100%; height: auto; opacity: 1; filter: none; }
    .story-detalhe__moldura {
      width: 640px; height: 640px; border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; overflow: hidden;
      box-shadow: 0 0 0 6px ${v.fundo}, 0 0 0 9px ${v.destaque}, 0 26px 50px rgba(62, 46, 34, 0.3);
    }
    .story-detalhe__moldura img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .story-detalhe__thumbs { display: flex; gap: 16px; }
    .story-detalhe__thumb { width: 88px; height: 88px; border-radius: 50%; overflow: hidden; opacity: 0.75; box-shadow: 0 6px 14px rgba(62, 46, 34, 0.22); }
    .story-detalhe__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .story-detalhe__frete {
      display: flex; align-items: center; gap: 18px; padding: 22px 40px; border-radius: 999px;
      background: ${v.destaque}; color: #FFF;
      font-family: 'Jost', sans-serif; font-weight: 500; font-size: 30px;
      box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.28), 0 10px 0 ${v.destaqueEscuro};
    }`, ALTURA_STORY);
}

// ============================================================
// Stories INSTITUCIONAIS — alimentam os destaques do perfil (mesma
// identidade de gerar-capas-destaque.js v3: medalhões 3D, ícones de
// traço único, rosto da Anasor). Compartilham o CSS base abaixo.
// ============================================================
function cssStoryBase(v) {
  return `
    .story-safe {
      position: absolute; top: ${STORY_TOPO}px; bottom: ${STORY_BASE}px; left: 0; right: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 34px; padding: 0 84px; text-align: center;
    }
    .story-badge {
      width: 210px; height: 210px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background-image: linear-gradient(135deg, ${v.destaque}, ${DOURADO});
      box-shadow:
        inset 3px 3px 6px rgba(255, 255, 255, 0.4), inset -4px -5px 10px rgba(62, 46, 34, 0.28),
        0 6px 0 ${v.destaqueEscuro}, 0 16px 30px rgba(62, 46, 34, 0.3);
    }
    .story-eyebrow {
      font-family: 'Jost', sans-serif; font-weight: 500; font-size: 32px;
      letter-spacing: 0.06em; text-transform: uppercase; color: ${v.destaque};
    }
    .story-titulo {
      font-family: 'Fraunces', serif; font-weight: 600; font-style: italic;
      font-size: 68px; line-height: 1.14; max-width: 880px;
    }
    .story-sub { font-family: 'Jost', sans-serif; font-size: 32px; line-height: 1.4; color: ${v.texto}; max-width: 820px; }
    .story-divisor { width: 140px; height: 2px; background: ${v.destaque}; opacity: 0.5; }
    .story-item {
      display: flex; align-items: center; gap: 24px; width: 100%; max-width: 860px; text-align: left;
      background: rgba(255, 255, 255, 0.55); border-radius: 30px; padding: 26px 34px;
      box-shadow: 0 2px 0 rgba(255, 255, 255, 0.6) inset, 0 14px 28px rgba(62, 46, 34, 0.14);
    }
    .story-item__icone {
      flex-shrink: 0; width: 76px; height: 76px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background-image: linear-gradient(135deg, ${v.destaque}, ${DOURADO});
      box-shadow: inset 2px 2px 3px rgba(255, 255, 255, 0.4), inset -2px -2px 4px rgba(62, 46, 34, 0.25), 0 4px 0 ${v.destaqueEscuro};
    }
    .story-item__texto { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 29px; line-height: 1.3; color: ${v.texto}; }
    .story-passo-numero {
      font-family: 'Jost', sans-serif; font-weight: 500; font-size: 30px; color: ${v.secundaria};
    }
    .story-chip-logo {
      position: absolute; top: ${STORY_TOPO}px; right: 48px; width: 104px; height: 104px; border-radius: 50%;
      background: rgba(251, 246, 239, 0.97); display: flex; align-items: center; justify-content: center;
      padding: 14px; z-index: 2; box-shadow: 0 2px 0 rgba(255, 255, 255, 0.5) inset, 0 8px 20px rgba(0, 0, 0, 0.28);
    }
    .story-chip-logo .marca-dagua { position: static; width: 100%; height: auto; opacity: 1; filter: none; }
  `;
}
function chipLogoStoryHtml(logoUri) {
  return `<div class="story-chip-logo">${P.marcaDaguaHtml(logoUri, '', false)}</div>`;
}

// Ícones próprios (não-Lucide) pros temas de contato — desenho de traço
// único, mesmo espírito de gerar-capas-destaque.js (vaso/roda/pincel ali
// também são desenho próprio, não existe equivalente exato no set Lucide
// já usado no site para "conversa"/"globo").
const ICONE_CHAT = '<path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>';
const ICONE_ENVELOPE = '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>';
const ICONE_GLOBO = '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/>';
function svgIconeProprio(pathD, tamanho, cor) {
  return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`;
}

// ---- Contato ----
function storyContato(v, logoUri) {
  const itens = [
    [ICONE_CHAT, 'WhatsApp (21) 98722-2679'],
    [ICONE_ENVELOPE, 'contatoatelieanasor@gmail.com'],
    ['@', '@anasor.ceramica'],
    [ICONE_GLOBO, 'anasor-sobreira.vercel.app'],
  ];
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <div class="story-badge">${svgIconeProprio(ICONE_CHAT, 92, '#FFF')}</div>
      <p class="story-eyebrow">Contato</p>
      <h1 class="story-titulo">Fale com a gente</h1>
      ${itens.map(([icone, texto]) => `<div class="story-item">
        <span class="story-item__icone">${icone === '@' ? '<span style="font-family:\'Fraunces\',serif;font-weight:600;font-size:40px;color:#FFF;">@</span>' : svgIconeProprio(icone, 36, '#FFF')}</span>
        <span class="story-item__texto">${P.escaparHtml(texto)}</span>
      </div>`).join('')}
    </main>`, cssStoryBase(v), ALTURA_STORY);
}

// ---- Como comprar (4 stories: intro + 3 passos, mesmos fatos de
// politicas.html #como-comprar/#prazo-envio já usados em
// gerarCarrosseisConteudo de gerar-posts.js) ----
function storyComoComprarIntro(v, logoUri) {
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <div class="story-badge">${P.svgIcone('credit-card', 88, '#FFF')}</div>
      <p class="story-eyebrow">Guia rápido</p>
      <h1 class="story-titulo">Como comprar</h1>
      <div class="story-divisor"></div>
      <p class="story-sub">3 passos simples, do site até a sua casa</p>
    </main>`, cssStoryBase(v), ALTURA_STORY);
}
function storyComoComprarPasso(v, numero, total, icone, titulo, texto, logoUri) {
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <p class="story-passo-numero">Passo ${numero} de ${total}</p>
      <div class="story-badge">${P.svgIcone(icone, 88, '#FFF')}</div>
      <h1 class="story-titulo">${P.escaparHtml(titulo)}</h1>
      <p class="story-sub">${P.escaparHtml(texto)}</p>
    </main>`, cssStoryBase(v), ALTURA_STORY);
}

// ---- Frete ----
function storyFrete(v, logoUri) {
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <div class="story-badge">${P.svgIcone('truck', 92, '#FFF')}</div>
      <p class="story-eyebrow">Para todo o Brasil</p>
      <h1 class="story-titulo">Frete grátis em todas as peças</h1>
      <p class="story-sub">Já embutido no preço — sem surpresa no carrinho. Produzimos e embalamos com cuidado: envio em até 7 dias úteis, pelos Correios.</p>
    </main>`, cssStoryBase(v), ALTURA_STORY);
}

// ---- Encomendas ----
function storyEncomendas(v, logoUri) {
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <div class="story-badge">${P.svgIcone('pen-line', 88, '#FFF')}</div>
      <p class="story-eyebrow">Sob encomenda</p>
      <h1 class="story-titulo">Quer uma parecida ou personalizada?</h1>
      <p class="story-sub">Me chama no direct ou no WhatsApp: a gente combina juntos a ideia, o prazo e o valor. Não vai ser idêntica — vai ser outra peça única, feita pra você.</p>
    </main>`, cssStoryBase(v), ALTURA_STORY);
}

// ---- Cuidados (fatos de politicas.html #cuidados — campo "cuidados" de
// produtos.js está "A definir" em toda a peça deste catálogo, então o
// fato geral do site é o único real disponível) ----
function storyCuidados(v, logoUri) {
  const itens = [
    ['droplet', 'Água morna e sabão neutro'],
    ['rotate-ccw', 'Evite a lava-louças'],
    ['gem', 'Evite mudanças bruscas de temperatura'],
  ];
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      <div class="story-badge">${P.svgIcone('droplet', 88, '#FFF')}</div>
      <p class="story-eyebrow">Guia rápido</p>
      <h1 class="story-titulo">Cuidados com a peça</h1>
      ${itens.map(([icone, texto]) => `<div class="story-item">
        <span class="story-item__icone">${P.svgIcone(icone, 34, '#FFF')}</span>
        <span class="story-item__texto">${P.escaparHtml(texto)}</span>
      </div>`).join('')}
      <p class="story-sub">Pequenas variações de cor e textura não são defeito: são a marca do trabalho manual.</p>
    </main>`, cssStoryBase(v), ALTURA_STORY);
}

// ---- Ateliê / quem faz ----
function storyAtelie(v, logoUri, rostoUri) {
  return P.baseHtml(v, `
    ${chipLogoStoryHtml(logoUri)}
    <main class="story-safe">
      ${P.rostoAnasorHtml(rostoUri, 220, 'story-atelie__rosto')}
      <p class="story-eyebrow">Por dentro do ateliê</p>
      <h1 class="story-titulo">Anasor Sobreira</h1>
      <p class="story-sub">Sou eu quem modela, pinta e queima cada peça — do barro até a última pincelada. Nenhuma peça sai igual à outra, porque nenhuma passa duas vezes pelas mesmas mãos.</p>
    </main>`, `${cssStoryBase(v)}\n.story-atelie__rosto { margin-bottom: 4px; }`, ALTURA_STORY);
}

// ============================================================
// Validação automática (economia de tokens: não abrimos toda imagem —
// só conferimos dimensão/tamanho de arquivo de TUDO que foi gerado, e
// abrimos visualmente só uma amostra, ver relatório final).
// ============================================================
function validarPng(caminho, larguraEsperada, alturaEsperada) {
  const buf = fs.readFileSync(caminho);
  if (buf.length < 1000) throw new Error(`${caminho}: arquivo suspeito de vazio (${buf.length} bytes)`);
  // IHDR do PNG: bytes 16-23 (largura/altura, big-endian, 4 bytes cada).
  const largura = buf.readUInt32BE(16);
  const altura = buf.readUInt32BE(20);
  if (largura !== larguraEsperada || altura !== alturaEsperada) {
    throw new Error(`${caminho}: dimensão ${largura}x${altura}, esperado ${larguraEsperada}x${alturaEsperada}`);
  }
}

async function main() {
  const produtos = P.carregarProdutos();
  const legendasExistentes = P.carregarLegendas();
  const v = P.lerVariaveisCss();
  const logoJpgUri = P.dataUri(path.join(P.RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));
  const rostoUri = P.dataUri(path.join(P.RAIZ, 'img', 'institucional', 'quem-somos.jpg'));

  limparPasta(SAIDA_POSTS);
  limparPasta(SAIDA_STORIES_PRODUTOS);
  fs.mkdirSync(SAIDA_STORIES_INST, { recursive: true });

  const navegador = await chromium.launch();
  const resultado = { gerados: [], pulados: [] };
  try {
    const pagina = await navegador.newPage();
    const logoUri = await P.removerFundoLogo(pagina, logoJpgUri);

    // ---- Posts + stories de cada peça ----
    for (const [indice, id] of ORDEM_IDS.entries()) {
      if (PULAR_VENDIDA.includes(id) || PULAR_DUVIDOSA.includes(id)) continue; // não deveria acontecer (ORDEM_IDS já exclui), defesa simples
      const produto = produtos.find((p) => p.id === id);
      if (!produto || produto.disponivel === false || produto.oculto) {
        console.warn(`[pulado] id ${id}: indisponível ou oculto.`);
        resultado.pulados.push({ id, motivo: 'indisponível/oculto' });
        continue;
      }
      const n = indice + 1;
      const r = await gerarPostProduto(pagina, v, produto, logoUri, rostoUri, legendasExistentes, n);
      if (r) resultado.gerados.push(r);
      else resultado.pulados.push({ id, nome: produto.nome, motivo: 'sem foto no disco' });
    }

    // ---- Stories institucionais ----
    const salvarInst = async (pastaNome, arquivoNome, html) => {
      const pasta = path.join(SAIDA_STORIES_INST, pastaNome);
      fs.mkdirSync(pasta, { recursive: true });
      const arquivo = path.join(pasta, arquivoNome);
      await P.renderizar(pagina, html, arquivo, LARGURA, ALTURA_STORY);
      validarPng(arquivo, LARGURA, ALTURA_STORY);
    };

    await salvarInst('contato', 'story-1.png', storyContato(v, logoUri));

    await salvarInst('como-comprar', 'story-1.png', storyComoComprarIntro(v, logoUri));
    await salvarInst('como-comprar', 'story-2.png', storyComoComprarPasso(
      v, 1, 3, 'gem', 'Escolha sua peça',
      'Cada peça é única, modelada e pintada à mão — sem repetição.', logoUri
    ));
    await salvarInst('como-comprar', 'story-3.png', storyComoComprarPasso(
      v, 2, 3, 'credit-card', 'Pague com Pix, crédito ou débito',
      'Tudo processado com segurança pelo Mercado Pago.', logoUri
    ));
    await salvarInst('como-comprar', 'story-4.png', storyComoComprarPasso(
      v, 3, 3, 'package', 'Receba com frete grátis',
      'Produzimos e embalamos com cuidado — envio em até 7 dias úteis.', logoUri
    ));

    await salvarInst('frete', 'story-1.png', storyFrete(v, logoUri));
    await salvarInst('encomendas', 'story-1.png', storyEncomendas(v, logoUri));
    await salvarInst('cuidados', 'story-1.png', storyCuidados(v, logoUri));
    await salvarInst('atelie', 'story-1.png', storyAtelie(v, logoUri, rostoUri));

    console.log('\nStories institucionais: 9 arquivos em conteudo/stories/institucionais/');
  } finally {
    await navegador.close();
  }

  // ---- Validação automática de TODOS os posts/stories de produto ----
  for (const { pastaSlug } of resultado.gerados) {
    const pastaPost = path.join(SAIDA_POSTS, pastaSlug);
    for (const arq of fs.readdirSync(pastaPost)) {
      if (arq.endsWith('.png')) validarPng(path.join(pastaPost, arq), LARGURA, ALTURA);
    }
    const pastaStories = path.join(SAIDA_STORIES_PRODUTOS, pastaSlug);
    for (const arq of fs.readdirSync(pastaStories)) {
      validarPng(path.join(pastaStories, arq), LARGURA, ALTURA_STORY);
    }
  }
  console.log(`\nValidação automática (dimensão + tamanho de arquivo) ok para ${resultado.gerados.length} posts.`);

  // ---- _LEIA-ME.txt: ordem sugerida de postagem ----
  const linhas = resultado.gerados.map(({ n, produto, categoria }) => {
    const nn = String(n).padStart(2, '0');
    return `${nn}. ${produto.nome} (${categoria}) — R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
  });
  const leiame = `Ordem sugerida de postagem — catálogo completo (Rodada 16)
====================================================

Pedido: alternar categorias (prato/caneca/vaso/kit/objeto...) sem repetir
a mesma categoria muitas vezes em seguida, com os melhores de cada
categoria primeiro (mais fotos, selo queridinho/assinada). O post-01 já
publicado (Prato Melodia da Primavera) e os outros 8 posts curados
(02-09 do calendário) ficam DE FORA desta lista — já estão no feed.

${linhas.join('\n')}

Cada pasta em posts/NN-nome-da-peca/ tem: slides numerados (1.png, 2.png...),
legenda.txt (pronto pra colar) e alt-text.txt (texto alternativo de cada slide).

Stickers de LINK do Instagram (Stories de produto, story-2.png de cada
peça): o terço inferior da arte (abaixo de ~1280px de 1920px) foi deixado
vazio DE PROPÓSITO — cole o sticker de link ali, apontando pra página da
peça no site.
`;
  fs.writeFileSync(path.join(SAIDA, '_LEIA-ME.txt'), leiame, 'utf8');

  console.log(`\nPulados (${resultado.pulados.length}):`, resultado.pulados);
  console.log(`\nPronto: ${SAIDA}`);
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
