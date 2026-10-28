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
};

module.exports = { ROTEIROS, montarCenas, duracaoTotal, FPS };
