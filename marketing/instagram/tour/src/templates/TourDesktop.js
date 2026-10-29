// Versão B — Tour do Site pro portfólio/LinkedIn (1920×1080). Ritmo
// mais lento, desktop e celular lado a lado em boa parte do vídeo,
// faixa de tecnologias fixa no rodapé e destaques técnicos em
// linguagem simples. Fecho com o endereço do site + nome do autor
// (sem botão "link na bio" — isso é coisa de Instagram).
const React = require('react');
const { Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } = require('remotion');
const {
  FundoBege, MarcaDagua, VinhetaGrao, FechoPortfolio, FaixaTecnologias,
  DestaqueTecnico, MascaraCircular, DispositivoFlutuante, MolduraCelular, MolduraDesktop,
} = require('../componentes');

const TECNOLOGIAS = ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express', 'Mercado Pago', 'Vercel'];

function TituloAbertura({ entradaFrame, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 140 } });
  if (t < -1) return null;
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: pop, transform: `translateY(${(1 - pop) * 20}px)` } },
    React.createElement('div', { style: { fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 68, color: cores.texto } }, 'Tour do Site'),
    React.createElement('div', { style: { fontFamily: 'Jost, sans-serif', fontSize: 30, color: cores.secundaria } }, 'Anasor Sobreira — loja de cerâmica artesanal')
  );
}

// Cada cena mora dentro de um <Sequence> — mesmo motivo de
// CenaMobile em TourMobile.js (ver o comentário lá): sem isso, os
// vídeos mais tarde no roteiro (checkout, fecho) tentariam buscar um
// ponto do clipe que não existe e travariam o render inteiro.
function CenaDesktop({ cena, i, clipesDesktop, clipesMobile, cores, retratoUri }) {
  const frame = useCurrentFrame();
  const progressoWipe = i === 0 ? 1 : interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  let conteudo;
  if (cena.tipo === 'abertura') {
    conteudo = React.createElement(TituloAbertura, { entradaFrame: 6, cores });
  } else if (cena.tipo === 'fecho') {
    conteudo = React.createElement(FechoPortfolio, { entradaFrame: 6, cores, retratoUri });
  } else if (cena.tipo === 'desktop-solo') {
    conteudo = React.createElement(
      DispositivoFlutuante,
      { inicioFrame: 0, duracaoFrames: cena.duracao, de: cena.de, para: cena.para, inclinacaoBase: 0 },
      React.createElement(MolduraDesktop, { src: clipesDesktop[cena.desktop].arquivo, largura: 1180, altura: 738 })
    );
  } else { // 'lado-a-lado'
    conteudo = React.createElement(
      DispositivoFlutuante,
      { inicioFrame: 0, duracaoFrames: cena.duracao, de: cena.de, para: cena.para, inclinacaoBase: 4 },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 90 } },
        React.createElement(MolduraDesktop, { src: clipesDesktop[cena.desktop].arquivo, largura: 980, altura: 613 }),
        React.createElement(MolduraCelular, { src: clipesMobile[cena.mobile].arquivo, largura: 280, altura: 578 })
      )
    );
  }

  // roteiro-desktop.js sempre manda `destaques` (array) — nunca mais
  // o singular `destaque` (achado do simplify: normalizado na fonte,
  // não precisa mais desse fallback aqui).
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, zIndex: i + 1 } },
    i === 0 ? conteudo : React.createElement(MascaraCircular, { progresso: progressoWipe }, conteudo),
    (cena.destaques || []).map((d, di) => React.createElement(DestaqueTecnico, {
      key: di, texto: d.texto, inicioFrame: d.atraso, duracao: d.duracao, cores,
    }))
  );
}

function TourDesktop({ cenas, cores, logoUri, retratoUri, clipesDesktop, clipesMobile, faixaTecnologias }) {
  const frame = useCurrentFrame();
  const faixaVisivel = frame >= faixaTecnologias.inicio && frame <= faixaTecnologias.fim;

  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } },
    React.createElement(FundoBege, { cores }),
    cenas.map((cena, i) => React.createElement(
      Sequence,
      { key: i, from: cena.inicio, durationInFrames: cena.duracao, name: cena.nome, layout: 'none' },
      React.createElement(CenaDesktop, { cena, i, clipesDesktop, clipesMobile, cores, retratoUri })
    )),
    faixaVisivel ? React.createElement(FaixaTecnologias, { itens: TECNOLOGIAS, cores }) : null,
    React.createElement(MarcaDagua, { src: logoUri, tamanho: 100, right: 48, bottom: faixaVisivel ? 90 : 48 }),
    React.createElement(VinhetaGrao)
  );
}

module.exports = { TourDesktop };
