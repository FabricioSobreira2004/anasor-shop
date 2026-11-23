#!/usr/bin/env node
// ============================================================
// Carrosséis TEMÁTICOS (várias peças por post) — pedido explícito
// (2026-11-22): todos os 44 produtos de js/produtos.js já têm post
// próprio (9 curados em gerar-posts.js + 33 do catálogo completo em
// gerar-posts-catalogo.js — conferido, nenhum id sobrou). Em vez de
// post por peça, estes 9 posts agrupam 3-4 peças por tema ("Café da
// Tarde", "Mesa de Domingo"...), reaproveitando o MESMO motor/visual
// v4 (slideCapa, slideFotoPorVariante, slideConfianca, slideChamada —
// ver gerar-posts.js) em vez de duplicar HTML/CSS.
//
// Diferença do post de 1 peça só: a capa e as fotos extra vêm de
// PRODUTOS DIFERENTES (não da mesma peça em ângulos diferentes) — o
// "produto" passado pro selo da capa é sempre a peça-capa (photos[0]),
// e cada foto extra leva o NOME da peça como legenda (não um destaque
// de descrição). Preço só aparece na legenda de texto (regra do
// catálogo), nunca nas artes.
//
// Saída: site-mae\instagram-posts\nova-leva-2026-11-22\NN-slug\
// (1.png, 2.png..., legenda.txt, alt-text.txt) — pasta que sincroniza
// sozinha pro Google Drive do Fabrício (pedido explícito: NÃO copiar
// pra G:\Meu Drive também).
//
// Como rodar (em lotes de 3, pedido explícito — salva cada lote antes
// do próximo):
//   node gerar-posts-tematicos.js --lote 1   (temas 1-3)
//   node gerar-posts-tematicos.js --lote 2   (temas 4-6)
//   node gerar-posts-tematicos.js --lote 3   (temas 7-9)
// ============================================================
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const P = require('./gerar-posts.js');
const { formatarLegenda } = require('./formatar-legenda.js');

const SAIDA = path.resolve(__dirname, '..', '..', '..', 'site-mae', 'instagram-posts', 'nova-leva-2026-11-22');
const MAX_FOTOS_EXTRAS = 4;

// Recorte de capa pra peças que já têm um ajuste fino conhecido (mesma
// tabela de gerar-posts.js RECORTE_CAPA) — só a peça 5 (Pavão Real)
// está em uso como capa aqui.
const RECORTE_CAPA = { 5: '50% 30%', 13: '50% 8%' };

// ============================================================
// 9 temas, ORDEM DE POSTAGEM sugerida (alterna categoria a categoria:
// caneca / prato-travessa / vaso-jarra / kit / mix-detalhe / objeto /
// mix-curado / devoção / mix-combinação — nenhuma categoria se repete
// em sequência).
// ============================================================
const TEMAS = [
  {
    titulo: 'Café da Tarde',
    emoji: '☕',
    ids: [26, 30, 28, 31],
    texto: `☕ **Café da Tarde** 🤎
_Pra aquela pausa que merece uma caneca bonita._

Separei 4 canecas que combinam com um café (ou chá) bem servido — cada uma com um pássaro ou uma flor pintados à mão, nenhuma igual à outra.

☕ **Passarinhos do Amor** — R$ 124,90
☕ **Pássaro no Galho Florido** — R$ 134,90
☕ **Pássaro Azul ao Amanhecer** — R$ 134,90
☕ **Rosas Champagne** — R$ 124,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e escolha a sua antes que alguém leve

📩 Quer uma parecida? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#canecaartesanal #ceramicaartesanal #pintadoamao #cafedatarde #feitoamao #artesanatobrasileiro #presentecriativo #canecadeceramica #xicaradecafe #decoracaodecozinha',
  },
  {
    titulo: 'Mesa de Domingo',
    emoji: '🍽️',
    ids: [5, 12, 13, 15],
    texto: `🍽️ **Mesa de Domingo** 🤍
_As peças que fazem a mesa parecer um presente._

4 queridinhas do ateliê pra quem gosta de um almoço de domingo com mesa bem posta — um prato assinado, uma travessa grande, duas peças que viram assunto na mesa.

🍽️ **Prato Decorativo Pavão Real** — R$ 174,90
🍽️ **Prato Decorativo Serenata a Dois** — R$ 159,90
🍽️ **Travessa Decorativa Asas do Paraíso** — R$ 299,90
🍽️ **Prato Decorativo Brisa de Palmeira** — R$ 259,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e veja cada peça de perto

📩 Alguma te lembrou de alguém? Chama no direct que a gente combina uma parecida por encomenda.`,
    hashtags: '#pratodecorativo #travessadecorativa #mesaposta #ceramicaartesanal #pecaunica #pintadoamao #decoracaodemesa #artesanatobrasileiro #presentecriativo #loucaartesanal',
  },
  {
    titulo: 'Flores e Vasos',
    emoji: '🌿',
    ids: [7, 25, 21, 45],
    texto: `🌿 **Flores e Vasos** 🤍
_Pra quando o vaso já é a parte mais bonita do arranjo._

4 peças escultóricas que ficam lindas com flor fresca, flor seca ou vazias mesmo — cada uma modelada à mão, uma de cada vez.

🌿 **Vaso Escultórico Copos-de-Leite em Flor** — R$ 169,90
🌿 **Vaso Escultórico Refúgio de Pétalas** — R$ 179,90
🌿 **Vaso Jarra Flor de Campo** — R$ 169,90
🌿 **Vaso Escultórico Elo Noturno** — R$ 199,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e escolha o seu antes que alguém leve

📩 Quer um parecido? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#vasodecorativo #ceramicaartesanal #modeladoamao #decoracaodesala #flornaceramica #pecaunica #artesanatobrasileiro #feitoamao #vasoceramico #presentecriativo',
  },
  {
    titulo: 'Presentes de Verdade',
    emoji: '🎁',
    ids: [36, 17, 23, 40],
    texto: `🎁 **Presentes de Verdade** 🤎
_Quando um presente sozinho não dá conta do recado._

4 conjuntos completos do ateliê — já chegam prontos pra presentear, sem precisar combinar peça com peça.

🎁 **Kit 4 Casinhas de Fada Luminária** — R$ 334,90
🎁 **Kit Jogo de Chá Pétala** (bule, leiteira e 3 xícaras) — R$ 399,90
🎁 **Kit 4 Canequinhas Arlequim Marmorizado** — R$ 254,90
🎁 **Kit 2 Copos Ondas do Mar** — R$ 134,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e garanta o seu antes que alguém leve

📩 Quer um conjunto diferente? Chama no direct que a gente monta um kit por encomenda.`,
    hashtags: '#kitdepresente #presentecriativo #ceramicaartesanal #artesanatobrasileiro #feitoamao #pecaunica #decoracaoafetiva #jogodecha #canecaartesanal #presenteespecial',
  },
  {
    titulo: 'Traços da Artesã',
    emoji: '🖌️',
    ids: [2, 27, 6, 16],
    texto: `🖌️ **Traços da Artesã** 🤍
_O detalhe que só existe porque foi feito à mão._

Separei 4 peças onde o traço da pintura (ou da modelagem) é o próprio motivo de comprar — cada uma assinada ou modelada em alto-relevo, sem molde nenhum.

🖌️ **Prato Buquê de Calla Rubra** — R$ 134,90
🖌️ **Caneca Artística Buquê de Rosas Esculpidas** — R$ 154,90
🖌️ **Vaso Escultórico Silhueta e Poesia** — R$ 179,90
🖌️ **Prato Decorativo Renda Portuguesa** — R$ 134,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e veja o traço de perto

📩 Quer uma parecida, com a sua cara? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#pintadoamao #modeladoamao #ceramicaartesanal #pecaassinada #artesanatobrasileiro #feitoamao #altorrelevo #arteemceramica #pecaunica #decoracaoafetiva',
  },
  {
    titulo: 'Cantos da Casa',
    emoji: '🏠',
    ids: [44, 38, 24, 39],
    texto: `🏠 **Cantos da Casa** 🤎
_Peças pequenas que mudam um cantinho inteiro._

4 objetos do ateliê pensados pra um detalhe só — a bandeja do café, a pia do banheiro, a cômoda — sem perder o acabamento das peças grandes.

🏠 **Coador de Café de Cerâmica Artesanal** — R$ 99,90
🏠 **Saboneteira Folha e Pássaro Dourado** — R$ 99,90
🏠 **Boleira Jardim de Morangos** — R$ 234,90
🏠 **Porta-Joias Jacaré das Águas Azuis** — R$ 124,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e dá uma volta pela loja completa

📩 Quer uma parecida? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#objetodecorativo #ceramicaartesanal #decoracaodebanheiro #decoracaodecozinha #feitoamao #artesanatobrasileiro #pecaunica #presentecriativo #cantinhodecorado #portajoias',
  },
  {
    titulo: 'Queridinhas do Ateliê',
    emoji: '💛',
    ids: [1, 5, 19, 36],
    texto: `💛 **Queridinhas do Ateliê** 🤎
_As peças que mais recebem elogio por aqui._

Juntei 4 peças que carregam o selo "Queridinha do Ateliê" ou que viram comentário sempre que aparecem no feed — um clássico, um prato sofisticado, uma caneca com surpresa e um kit que já virou queridinho de todo mundo.

💛 **Prato Decorativo Melodia da Primavera** — R$ 134,90
💛 **Prato Decorativo Pavão Real** — R$ 174,90
💛 **Caneca Artística Surpresa Cachorrinho** — R$ 109,90
💛 **Kit 4 Casinhas de Fada Luminária** — R$ 334,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e veja qual delas é a sua queridinha

📩 Quer uma parecida? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#queridinhadoatelie #ceramicaartesanal #pecaunica #feitoamao #artesanatobrasileiro #maisvendido #presentecriativo #decoracaoafetiva #pintadoamao #canecasurpresa',
  },
  {
    titulo: 'Bênçãos de Casa',
    emoji: '🙏',
    ids: [42, 43, 37],
    texto: `🙏 **Bênçãos de Casa** 🕊️
_Peças que carregam um pouco de cuidado e proteção._

3 peças do ateliê com esse lado mais simbólico — pra rezar, pra guardar, pra lembrar que a casa está protegida.

🙏 **Terço de Mesa Grãos de Oração** — R$ 109,90
🕊️ **Anjo Guardião Porta-Incenso** — R$ 159,90
🌙 **Saboneteira Pássaro Azul-Noite** — R$ 99,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e conheça cada uma de perto

📩 Quer uma parecida? Chama no direct que a gente conversa sobre encomenda.`,
    hashtags: '#pecadedevocao #tercoterapia #ceramicaartesanal #anjodacasa #feitoamao #artesanatobrasileiro #presentedefe #decoracaoafetiva #pecaunica #oracaoemcasa',
  },
  {
    titulo: 'Combinações de Casa',
    emoji: '✨',
    ids: [3, 31, 22, 9],
    texto: `✨ **Combinações de Casa** 🤎
_Peças que, juntas, contam uma história só._

Separei 4 peças que ficam ainda mais bonitas combinadas — um prato e uma caneca na mesma paleta de cor, um kit de jarra com copos e um prato que fecha o conjunto.

✨ **Prato Decorativo Cerejeira Coral** — R$ 134,90
✨ **Caneca Artística Rosas Champagne** — R$ 124,90
✨ **Kit Jarra e 2 Copos Textura Casca** — R$ 229,90
✨ **Prato Decorativo Flor de Pessegueiro** — R$ 134,90

🚚 Frete grátis para todo o Brasil
💳 Pix, crédito ou débito
🤎 Toque no **link da bio** e monte a sua combinação

📩 Quer montar um conjunto diferente? Chama no direct que a gente combina por encomenda.`,
    hashtags: '#combinedecoracao #ceramicaartesanal #mesaposta #feitoamao #artesanatobrasileiro #pecaunica #decoracaoafetiva #presentecriativo #composicaodemesa #loucaartesanal',
  },
];

function slug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function gerarPostTematico(pagina, v, tema, produtos, logoUri, rostoUri, n) {
  const pecas = tema.ids.map((id) => produtos.find((p) => p.id === id)).filter(Boolean);
  const faltando = tema.ids.filter((id) => !produtos.find((p) => p.id === id));
  if (faltando.length) console.warn(`[aviso] tema "${tema.titulo}": id(s) não encontrados: ${faltando.join(',')}`);

  const nn = String(n).padStart(2, '0');
  const pastaSlug = `${nn}-${slug(tema.titulo)}`;
  const pasta = path.join(SAIDA, pastaSlug);
  fs.mkdirSync(pasta, { recursive: true });

  const hero = pecas[0];
  const heroFoto = path.join(P.RAIZ, hero.imagem);
  const recorte = RECORTE_CAPA[hero.id] || '50% 50%';
  const slides = [];
  const salvar = async (html, descricao, alt) => {
    const arquivo = `${slides.length + 1}.png`;
    await P.renderizar(pagina, html, path.join(pasta, arquivo));
    slides.push({ arquivo, descricao, alt });
  };

  await salvar(
    P.slideCapa(v, P.dataUri(heroFoto), tema.titulo, recorte, hero, logoUri),
    `capa do tema "${tema.titulo}", foto principal: ${hero.nome}`,
    `${tema.titulo} — peças de cerâmica artesanal da Anasor Sobreira`
  );

  // Fotos extras: 1ª é um ângulo diferente da peça-capa (abre com
  // impacto, mesmo princípio do post de peça única), as seguintes são
  // a foto principal de CADA OUTRA peça do tema — legenda de cada foto
  // é o NOME da peça (não um destaque de descrição: aqui são peças
  // diferentes, não ângulos da mesma).
  const extrasFotos = [];
  if (hero.imagensExtras && hero.imagensExtras[0]) {
    extrasFotos.push({ arquivo: path.join(P.RAIZ, hero.imagensExtras[0]), legenda: P.nomeCurto(hero.nome) });
  }
  for (const peca of pecas.slice(1, 1 + MAX_FOTOS_EXTRAS)) {
    extrasFotos.push({ arquivo: path.join(P.RAIZ, peca.imagem), legenda: P.nomeCurto(peca.nome) });
  }
  const extrasFinal = extrasFotos.slice(0, MAX_FOTOS_EXTRAS);
  const thumbsUris = [P.dataUri(heroFoto), ...extrasFinal.map((f) => P.dataUri(f.arquivo))];
  // sequencial (não Promise.all): renderizar reusa a MESMA página/aba
  for (const [i, f] of extrasFinal.entries()) {
    const variante = (i % 3) + 1;
    await salvar(
      P.slideFotoPorVariante(variante, v, P.dataUri(f.arquivo), f.legenda, thumbsUris, i + 1, logoUri),
      `foto de "${f.legenda}" (${path.basename(f.arquivo)}), layout ${variante}`,
      `${f.legenda}, peça de cerâmica artesanal da Anasor Sobreira`
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

  const corpoFormatado = formatarLegenda(tema.texto);
  fs.writeFileSync(path.join(pasta, 'legenda.txt'), `${corpoFormatado}\n\n${tema.hashtags}`, 'utf8');
  fs.writeFileSync(
    path.join(pasta, 'alt-text.txt'),
    slides.map((s, i) => `Slide ${i + 1} (${s.arquivo}): ${s.alt}`).join('\n'),
    'utf8'
  );
  return { pastaSlug, titulo: tema.titulo, pecas: pecas.map((p) => p.nome) };
}

async function main() {
  const loteArg = process.argv.indexOf('--lote');
  const lote = loteArg !== -1 ? Number(process.argv[loteArg + 1]) : null;
  const inicio = lote ? (lote - 1) * 3 : 0;
  const fim = lote ? inicio + 3 : TEMAS.length;
  const temasRodada = TEMAS.slice(inicio, fim).map((t, i) => ({ tema: t, n: inicio + i + 1 }));

  console.log(`Gerando temas ${inicio + 1} a ${fim} de ${TEMAS.length}...`);

  const produtos = P.carregarProdutos();
  const v = P.lerVariaveisCss();
  const logoJpgUri = P.dataUri(path.join(P.RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));
  const rostoUri = P.dataUri(path.join(P.RAIZ, 'img', 'institucional', 'quem-somos.jpg'));
  fs.mkdirSync(SAIDA, { recursive: true });

  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage();
    const logoUri = await P.removerFundoLogo(pagina, logoJpgUri);
    const gerados = [];
    for (const { tema, n } of temasRodada) {
      const r = await gerarPostTematico(pagina, v, tema, produtos, logoUri, rostoUri, n);
      gerados.push(r);
      console.log(`  -> ${r.pastaSlug}: ${r.pecas.join(' · ')}`);
    }
    console.log(`\nOK: ${gerados.length} posts gerados em ${SAIDA}`);
  } finally {
    await navegador.close();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
