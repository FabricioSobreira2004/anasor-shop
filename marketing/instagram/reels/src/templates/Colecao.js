// Template C — "Coleção": várias peças em sequência rápida (uma
// FotoKenBurns + nome curto cada), fechando com o mesmo CTA dos outros
// templates. Diferente de Apresentacao/Detalhes (uma peça só, várias
// cenas): aqui é uma peça por cena, então os dados vêm em `pecas`
// (lista), não em `produto` (um só).
const React = require('react');
const { AbsoluteFill, interpolate, useCurrentFrame } = require('remotion');
const {
  MarcaDagua, TituloCinetico, FotoParallax, BrilhoEsmalte, VinhetaGrao,
  MascaraCircular, BotaoGummyFinal, FaixaConfianca,
} = require('../componentes');

function Colecao({ cores, logoUri, cenas }) {
  const frame = useCurrentFrame();

  return React.createElement(
    AbsoluteFill,
    { style: { backgroundColor: cores.texto } },
    cenas.map((cena, i) => {
      if (frame < cena.inicio - 1) return null;
      const progressoWipe = i === 0 ? 1 : interpolate(frame, [cena.inicio, cena.inicio + 14], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });
      const conteudo = [];

      if (cena.tipo === 'peca') {
        conteudo.push(
          React.createElement(FotoParallax, {
            key: 'kb', src: cena.src, inicioFrame: cena.inicio, duracaoFrames: cena.duracao,
            de: { escala: 1.12, x: 1, y: 0 }, para: { escala: 1.0, x: -1, y: 0 },
            objectPosition: cena.objectPosition || '50% 50%',
          }),
          React.createElement(BrilhoEsmalte, { key: 'brilho', inicioFrame: cena.inicio + Math.round(cena.duracao * 0.3) }),
          React.createElement('div', {
            key: 'vel', style: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0) 46%)' },
          }),
          React.createElement('div', {
            // bottom: 430 (não 110): área segura de v2/B3 — "nada
            // importante nos 420px de baixo".
            key: 'nome',
            style: { position: 'absolute', left: 60, right: 60, bottom: 430 },
          }, React.createElement(TituloCinetico, { texto: cena.nome, entradaFrame: cena.inicio + 8, tamanho: 58 }))
        );
      } else if (cena.tipo === 'cta') {
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } }),
          React.createElement('div', {
            key: 'conteudo',
            style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36 },
          },
            React.createElement(TituloCinetico, { texto: cena.titulo, entradaFrame: cena.inicio + 6, tamanho: 68, cor: cores.texto }),
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
    React.createElement(MarcaDagua, { src: logoUri }),
    React.createElement(VinhetaGrao, { key: 'vinheta' })
  );
}

module.exports = { Colecao };
