// Template D — "Conteúdo": Reels só de motion graphics, SEM foto nem
// vídeo de peça nenhuma (pedido explícito, rodada 3 — "Como comprar",
// "Cuidados com a peça", "O que é peça única", "Encomenda: como
// funciona"). Mesmo motor/mesma linguagem visual dos outros templates
// (MascaraCircular entre cenas, VinhetaGrao por cima de tudo, MarcaDagua
// fixa, FaixaConfianca/BotaoGummyFinal no fecho) — só que cada cena é
// ícone + texto animado, nunca uma foto.
//
// Ritmo de cor: capa e fecho em --cor-fundo (creme, igual às outras
// capas/CTAs), cenas de conteúdo (passo/parágrafo/lista) em --cor-texto
// (marrom escuro) — mesmo contraste do layout 4 dos posts (gerar-
// posts.js), reaproveitado aqui como "cena de conteúdo" em vez de
// "capa alternativa".
const React = require('react');
const { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } = require('remotion');
const {
  MarcaDagua, FaixaConfianca, TituloCinetico, BotaoGummyFinal,
  MascaraCircular, VinhetaGrao, IconeLinha,
} = require('../componentes');

// Badge circular com ícone — pop de entrada (spring), reaproveitado em
// toda cena com ícone (capa, passo).
function IconeBadge({ nome, entradaFrame, tamanho = 140, bg, cor }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 14, stiffness: 160 } });
  return React.createElement('div', {
    style: {
      width: tamanho, height: tamanho, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, transform: `scale(${pop})`, opacity: pop,
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)', flexShrink: 0,
    },
  }, React.createElement(IconeLinha, { nome, tamanho: Math.round(tamanho * 0.4), cor }));
}

// Fade + leve subida — pro corpo de texto (parágrafo/subtítulo de passo).
function TextoAnimado(props) {
  const { texto, entradaFrame, tamanho, cor, tag, peso } = {
    tamanho: 38, cor: '#FFF', tag: 'p', peso: 400, ...props,
  };
  const frame = useCurrentFrame();
  const op = interpolate(frame, [entradaFrame, entradaFrame + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(frame, [entradaFrame, entradaFrame + 18], [18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return React.createElement(tag, {
    style: {
      opacity: op, transform: `translateY(${y}px)`,
      fontFamily: 'Jost, sans-serif', fontWeight: peso, fontSize: tamanho,
      lineHeight: 1.4, color: cor, textAlign: 'center', maxWidth: 840,
    },
  }, texto);
}

// Contador "Passo N de M" / eyebrow — mesma animação simples de fade.
function EyebrowAnimado({ texto, entradaFrame, cor }) {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [entradaFrame, entradaFrame + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return React.createElement('p', {
    style: {
      opacity: op, fontFamily: 'Jost, sans-serif', fontSize: 28, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: cor, marginBottom: 28,
    },
  }, texto);
}

// Lista animada — cada item aparece em sequência (mesmo stagger das
// outras entradas), bolinha de destaque igual à dos carrosséis de feed
// (gerar-posts.js, slideListaSimples).
function ListaAnimada({ itens, entradaFrame, cor, corBolinha }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return React.createElement(
    'ul',
    { style: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 30, maxWidth: 820 } },
    itens.map((item, i) => {
      const t = frame - entradaFrame - i * 10;
      const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 160 } });
      if (t < -1) return null;
      return React.createElement('li', {
        key: i,
        style: {
          opacity: pop, transform: `translateX(${(1 - pop) * -24}px)`,
          display: 'flex', alignItems: 'center', gap: 22,
          fontFamily: 'Jost, sans-serif', fontSize: 36, color: cor,
        },
      },
        React.createElement('span', { style: { width: 18, height: 18, borderRadius: '50%', background: corBolinha, flexShrink: 0 } }),
        item
      );
    })
  );
}

function Conteudo({ cores, logoUri, cenas }) {
  const frame = useCurrentFrame();

  return React.createElement(
    AbsoluteFill,
    { style: { backgroundColor: cores.texto } },
    cenas.map((cena, i) => {
      if (frame < cena.inicio - 1) return null;
      const progressoWipe = i === 0 ? 1 : interpolate(frame, [cena.inicio, cena.inicio + 16], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });
      const conteudo = [];

      if (cena.tipo === 'titulo-conteudo') {
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } }),
          React.createElement('div', {
            key: 'conteudo', style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 90px', gap: 0,
            },
          },
            React.createElement(IconeBadge, { nome: cena.icone, entradaFrame: cena.inicio + 4, bg: cores.destaque, cor: '#FFF' }),
            React.createElement('div', { style: { height: 32 } }),
            React.createElement(EyebrowAnimado, { texto: cena.eyebrow, entradaFrame: cena.inicio + 18, cor: cores.destaque }),
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 24, tamanho: 76, cor: cores.texto })
          )
        );
      } else if (cena.tipo === 'passo') {
        conteudo.push(
          // Fundo opaco PRÓPRIO desta cena — sem isso, a área revelada
          // pelo MascaraCircular (que só recorta, não pinta) deixa a
          // cena ANTERIOR aparecendo por baixo do texto (achado:
          // 3 cenas sobrepostas no mesmo quadro, visualmente ilegível).
          // 'titulo-conteudo'/'cta-conteudo' já tinham isso (fundo
          // claro); as cenas de fundo escuro (passo/parágrafo/lista)
          // ainda não tinham — corrigido aqui e nas 2 seguintes.
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.texto } }),
          React.createElement('div', {
            key: 'conteudo', style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 90px', gap: 0,
            },
          },
            React.createElement(EyebrowAnimado, { texto: `Passo ${cena.numero} de ${cena.total}`, entradaFrame: cena.inicio + 4, cor: cores.secundaria }),
            React.createElement(IconeBadge, {
              nome: cena.icone, entradaFrame: cena.inicio + 10,
              bg: 'rgba(251,246,239,0.14)', cor: cores.fundo,
            }),
            React.createElement('div', { style: { height: 36 } }),
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 22, tamanho: 56, cor: cores.fundo }),
            cena.texto ? React.createElement('div', { style: { height: 26 } }) : null,
            cena.texto ? React.createElement(TextoAnimado, { texto: cena.texto, entradaFrame: cena.inicio + 34, cor: 'rgba(251,246,239,0.82)' }) : null
          )
        );
      } else if (cena.tipo === 'paragrafo-conteudo') {
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.texto } }),
          React.createElement('div', {
            key: 'conteudo', style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 96px', gap: 0,
            },
          },
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 6, tamanho: 58, cor: cores.destaque }),
            React.createElement('div', { style: { height: 34 } }),
            React.createElement(TextoAnimado, { texto: cena.texto, entradaFrame: cena.inicio + 26, tamanho: 38, cor: cores.fundo })
          )
        );
      } else if (cena.tipo === 'lista-conteudo') {
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.texto } }),
          React.createElement('div', {
            key: 'conteudo', style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 96px', gap: 0,
            },
          },
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 6, tamanho: 58, cor: cores.destaque }),
            React.createElement('div', { style: { height: 44 } }),
            React.createElement(ListaAnimada, { itens: cena.itens, entradaFrame: cena.inicio + 24, cor: cores.fundo, corBolinha: cores.destaque })
          )
        );
      } else if (cena.tipo === 'cta-conteudo') {
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } }),
          React.createElement('div', {
            key: 'conteudo',
            style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 36, textAlign: 'center', padding: '0 80px',
            },
          },
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 6, tamanho: 64, cor: cores.texto }),
            React.createElement(BotaoGummyFinal, { entradaFrame: cena.inicio + 26, apertoFrame: cena.inicio + cena.duracao - 24, cores }),
            React.createElement('div', {
              style: {
                opacity: interpolate(frame, [cena.inicio + 34, cena.inicio + 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                fontFamily: 'Jost, sans-serif', fontSize: 34, color: cores.secundaria,
              },
            }, '@anasor.ceramica')
          ),
          React.createElement(FaixaConfianca, { key: 'fc', cores, entradaFrame: cena.inicio + 50, sobreClaro: true })
        );
      }

      return React.createElement(
        'div',
        { key: i, style: { position: 'absolute', inset: 0, zIndex: i } },
        i === 0 ? conteudo : React.createElement(MascaraCircular, { progresso: progressoWipe }, conteudo)
      );
    }),
    // comChip: true — ver comentário em MarcaDagua (componentes.js):
    // cenas de fundo chapado escuro (passo/parágrafo/lista) precisam do
    // chip, e usá-lo também nas 2 cenas de fundo claro (titulo/cta) não
    // tem custo — mesmo visual limpo nas duas.
    React.createElement(MarcaDagua, { src: logoUri, comChip: true }),
    React.createElement(VinhetaGrao, { key: 'vinheta' })
  );
}

module.exports = { Conteudo };
