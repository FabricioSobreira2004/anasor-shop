// Roteiros dos 6 Reels desta rodada: R1 e R7 refeitos (reels-ideias.md)
// + 4 peças variadas (prato, vaso, caneca, coleção de objetos). Cada
// cena é descrita em "tempo relativo" (duracao, em frames a 30fps);
// montarCenas() soma tudo e calcula o `inicio` absoluto de cada uma —
// trocar a duração de uma cena não exige recalcular as outras à mão.
//
// `foto`/`video` nas cenas são referências SIMBÓLICAS ('principal',
// {extra:i}) resolvidas pelo reel.js a partir de js/produtos.js — este
// arquivo não sabe caminho de arquivo nenhum, só a FORMA do roteiro.

function montarCenas(lista) {
  let acc = 0;
  return lista.map((c) => {
    const cena = { ...c, inicio: acc };
    acc += c.duracao;
    return cena;
  });
}

function duracaoTotal(cenas) {
  const ultima = cenas[cenas.length - 1];
  return ultima.inicio + ultima.duracao;
}

const FPS = 30;

const ROTEIROS = {
  // R1 — "A surpresa no fundo da caneca" (reels-ideias.md). O vídeo
  // real mostra o LEITE SENDO DESPEJADO (cobrindo o gatinho aos poucos,
  // não o contrário) — ver quadros extraídos durante a produção desta
  // rodada. Tocado ao CONTRÁRIO (reel.js faz `ffmpeg -vf reverse` numa
  // cópia, 1x), o mesmo clipe vira exatamente a cena pedida: caneca
  // cheia -> baixando -> gatinho aparece no fundo.
  'r1-caneca-surpresa-gatinho': {
    produtoId: 20,
    template: 'apresentacao',
    reverterVideo: true,
    cenas: () => montarCenas([
      { tipo: 'titulo', duracao: 55, src: { foto: 'principal' } },
      {
        tipo: 'video', duracao: 220, src: { video: 'principal' }, fundo: { foto: 'principal' },
        legendas: [
          { palavras: ['Espera', 'até', 'o', 'fim', '👀'], atraso: 6, duracao: 60 },
          { palavras: ['Ele', 'estava', 'aí', 'o', 'tempo', 'todo'], atraso: 165, duracao: 50 },
        ],
      },
      {
        tipo: 'foto', duracao: 70, src: { extra: 0 },
        de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.1, x: 0, y: -1 },
        legendas: [{ palavras: ['Peça', 'única,', 'feita', 'à', 'mão'], atraso: 8, duracao: 55 }],
      },
      { tipo: 'cta', duracao: 90 },
    ]),
  },

  // R7 — "Casinhas de fada acendendo". O vídeo-fonte é só de dia (sem
  // filmagem noturna ainda — ver reels-ideias.md/memória do projeto);
  // o "acender" vira um efeito gráfico assumido como tal (GlowNoturno,
  // em Apresentacao.jsx): escurece a foto + brilho quente pulsando nos
  // furinhos, não finge ser uma foto real da peça acesa.
  'r7-casinhas-de-fada': {
    produtoId: 36,
    template: 'apresentacao',
    cenas: () => montarCenas([
      { tipo: 'titulo', duracao: 55, src: { foto: 'principal' } },
      {
        tipo: 'video', duracao: 110, src: { video: 'principal' },
        legendas: [{ palavras: ['De', 'dia,', 'são', 'só', 'casinhas', 'de', 'cerâmica'], atraso: 10, duracao: 90 }],
      },
      {
        tipo: 'foto-noite', duracao: 150, src: { foto: 'principal' },
        pontos: [
          { x: 30, y: 58, r: 90 },
          { x: 50, y: 50, r: 110 },
          { x: 70, y: 56, r: 90 },
        ],
        legendas: [{ palavras: ['À', 'noite,', 'elas', 'ganham', 'vida', '✨'], atraso: 40, duracao: 100 }],
      },
      { tipo: 'cta', duracao: 90 },
    ]),
  },

  // Prato — peça variada 1/4
  'prato-canario-flor-de-outono': {
    produtoId: 41,
    template: 'apresentacao',
    cenas: () => montarCenas([
      { tipo: 'titulo', duracao: 55, src: { foto: 'principal' } },
      {
        tipo: 'video', duracao: 150, src: { video: 'principal' },
        legendas: [{ palavras: ['Pintado', 'à', 'mão,', 'traço', 'por', 'traço'], atraso: 10, duracao: 90 }],
      },
      {
        tipo: 'foto', duracao: 90, src: { extra: 0 },
        de: { escala: 1.1, x: -1, y: 0 }, para: { escala: 1.0, x: 1, y: 0 },
        legendas: [{ palavras: ['Nenhum', 'prato', 'sai', 'igual', 'ao', 'outro'], atraso: 10, duracao: 65 }],
      },
      { tipo: 'cta', duracao: 90 },
    ]),
  },

  // Vaso — peça variada 2/4
  'vaso-refugio-de-petalas': {
    produtoId: 25,
    template: 'apresentacao',
    cenas: () => montarCenas([
      { tipo: 'titulo', duracao: 55, src: { foto: 'principal' } },
      {
        tipo: 'foto', duracao: 120, src: { foto: 'principal' },
        de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.15, x: 0, y: -1 },
        legendas: [{ palavras: ['Escultura', 'em', 'cerâmica,', 'não', 'só', 'vaso'], atraso: 10, duracao: 85 }],
      },
      {
        tipo: 'video', duracao: 140, src: { video: 'principal' },
        legendas: [{ palavras: ['Uma', 'peça,', 'vários', 'ângulos'], atraso: 10, duracao: 100 }],
      },
      { tipo: 'cta', duracao: 90 },
    ]),
  },

  // Caneca — peça variada 3/4 — template "detalhes": sem a cena de
  // título cheia (abre quase direto no close), mais curto.
  'caneca-passaro-azul': {
    produtoId: 28,
    template: 'detalhes',
    cenas: () => montarCenas([
      { tipo: 'titulo', duracao: 40, src: { foto: 'principal' } },
      {
        tipo: 'video', duracao: 160, src: { video: 'principal' },
        legendas: [{ palavras: ['De', 'perto,', 'cada', 'pincelada', 'conta'], atraso: 10, duracao: 100 }],
      },
      {
        tipo: 'foto', duracao: 80, src: { extra: 0 },
        de: { escala: 1.15, x: 0, y: 0 }, para: { escala: 1.0, x: 0, y: 0 },
        legendas: [{ palavras: ['Peça', 'única', 'no', 'ateliê'], atraso: 8, duracao: 55 }],
      },
      { tipo: 'cta', duracao: 85 },
    ]),
  },

  // Coleção — peça variada 4/4 (kit/objeto -> vira "coleção de
  // objetos", usa o template C de propósito, ver README.md)
  'colecao-objetos-decorativos': {
    template: 'colecao',
    pecaIds: [39, 43, 38],
    cenas: (pecas) => montarCenas([
      ...pecas.flatMap((p, i) => ([
        { tipo: 'peca', duracao: 100, src: { foto: 'principal', produtoIndice: i }, nome: p.nomeCurto },
      ])),
      { tipo: 'cta', duracao: 90, titulo: 'Objetos com alma' },
    ]),
  },

  // ============================================================
  // Template D — "Conteúdo": Reels só de motion graphics, sem foto/
  // vídeo de peça nenhuma (rodada 3, pedido explícito). Fatos SÓ de
  // politicas.html/js/produtos.js — mesma fonte usada nos carrosséis
  // de conteúdo equivalentes (gerar-posts.js, ver comentário lá sobre
  // cada frase). Ver src/templates/Conteudo.js pro renderer.
  // ============================================================

  // Mesmos 3 passos do carrossel "Como comprar" (gerar-posts.js) —
  // #como-comprar/#prazo-envio de politicas.html.
  'como-comprar-conteudo': {
    template: 'conteudo',
    cenas: () => montarCenas([
      { tipo: 'titulo-conteudo', duracao: 60, icone: 'credit-card', eyebrow: 'Guia rápido', titulo: 'Como comprar' },
      { tipo: 'passo', duracao: 100, numero: 1, total: 3, icone: 'gem', titulo: 'Escolha sua peça', texto: 'Cada peça é única, modelada e pintada à mão.' },
      { tipo: 'passo', duracao: 100, numero: 2, total: 3, icone: 'credit-card', titulo: 'Pague com Pix, crédito ou débito', texto: 'Tudo com segurança, pelo Mercado Pago.' },
      { tipo: 'passo', duracao: 100, numero: 3, total: 3, icone: 'package', titulo: 'Receba com frete grátis', texto: 'Produzimos e enviamos em até 7 dias úteis, pelos Correios.' },
      { tipo: 'cta-conteudo', duracao: 90, titulo: 'Pronta pra escolher a sua?' },
    ]),
  },

  // Mesmos fatos do carrossel "Cuidados com a peça" (politicas.html
  // #cuidados + FAQ) — o slide de lavagem + o de variações já fundido
  // (ver VARIACOES_TITULO/TEXTO em gerar-posts.js, mesmo texto aqui).
  'cuidados-conteudo': {
    template: 'conteudo',
    cenas: () => montarCenas([
      { tipo: 'titulo-conteudo', duracao: 60, icone: 'droplet', eyebrow: 'Guia rápido', titulo: 'Cuidados com a peça' },
      { tipo: 'lista-conteudo', duracao: 130, titulo: 'Como lavar', itens: [
        'Água morna e sabão neutro',
        'Evite a lava-louças',
        'Evite mudanças bruscas de temperatura',
      ] },
      { tipo: 'paragrafo-conteudo', duracao: 130, titulo: 'As variações são a assinatura', texto: 'Pequenas variações de cor, textura e formato em relação às fotos são normais — fazem parte da autenticidade do trabalho manual, não são defeito.' },
      { tipo: 'cta-conteudo', duracao: 90, titulo: 'Cuide bem da sua peça' },
    ]),
  },

  // Mesmos fatos do carrossel "Peça única: o que significa" — CLAUDE.md
  // (estoque 1) + politicas.html #cuidados/#trocas-devolucoes.
  'peca-unica-conteudo': {
    template: 'conteudo',
    cenas: () => montarCenas([
      { tipo: 'titulo-conteudo', duracao: 60, icone: 'gem', eyebrow: 'Por dentro do ateliê', titulo: 'O que é "peça única"' },
      { tipo: 'paragrafo-conteudo', duracao: 120, titulo: 'Estoque sempre 1', texto: 'Cada peça existe numa única unidade. Quando vende, não tem reposição — vira portfólio, não volta pra vitrine.' },
      { tipo: 'paragrafo-conteudo', duracao: 120, titulo: 'As variações são a assinatura', texto: 'Cada peça é única e pode ter pequenas variações de cor, textura e formato — isso é parte da autenticidade do trabalho manual, não é defeito, é processo artesanal.' },
      { tipo: 'paragrafo-conteudo', duracao: 120, titulo: 'Não existe uma troca "idêntica"', texto: 'Como cada peça é única e feita à mão, não existe estoque de reposição igual.' },
      { tipo: 'cta-conteudo', duracao: 90, titulo: 'Encontrou a sua?' },
    ]),
  },

  // Mesmos 4 passos da legenda nº19/carrossel "Encomende a sua" — SEM
  // prazo nem preço fixo (pedido explícito): "a gente combina" é o
  // máximo prometido, igual linkEncomendaWhatsApp() em js/main.js.
  'encomenda-conteudo': {
    template: 'conteudo',
    cenas: () => montarCenas([
      { tipo: 'titulo-conteudo', duracao: 60, icone: 'message-circle', eyebrow: 'Encomende a sua', titulo: 'Como funciona uma encomenda' },
      { tipo: 'passo', duracao: 90, numero: 1, total: 4, icone: 'message-circle', titulo: 'Chame no WhatsApp pelo link na bio', texto: null },
      { tipo: 'passo', duracao: 90, numero: 2, total: 4, icone: 'gem', titulo: 'Conte a ideia ou mostre a peça que amou', texto: null },
      { tipo: 'passo', duracao: 90, numero: 3, total: 4, icone: 'shield-check', titulo: 'A gente combina os detalhes, o prazo e o valor', texto: null },
      { tipo: 'passo', duracao: 90, numero: 4, total: 4, icone: 'sparkles', titulo: 'Eu faço a sua peça à mão, do começo ao fim', texto: null },
      { tipo: 'cta-conteudo', duracao: 90, titulo: 'Encomende a sua peça única' },
    ]),
  },
};

module.exports = { ROTEIROS, montarCenas, duracaoTotal, FPS };
