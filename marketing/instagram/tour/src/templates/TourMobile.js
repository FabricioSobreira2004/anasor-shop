// Versão A — Tour do Site pro Instagram (1080×1920). Celular flutuante
// sobre fundo bege com marca d'água, trocando de cena (vídeo real do
// site) com wipe circular, legendas cinéticas e fecho com CTA.
const React = require('react');
const { Sequence, useCurrentFrame, interpolate } = require('remotion');
const {
  FundoBege, MarcaDagua, SeloTour, LegendaCinetica, VinhetaGrao,
  FechoInstagram, MascaraCircular, DispositivoFlutuante, MolduraCelular,
} = require('../componentes');

// Cada cena mora dentro de um <Sequence> — ACHADO SÓ RODANDO (não
// relendo o código): sem isso, useCurrentFrame() dentro da cena
// devolve o frame ABSOLUTO da composição inteira, não o frame local
// desde que a cena começou. O <OffthreadVideo> (dentro de
// MolduraCelular) usa esse frame pra decidir EM QUE PONTO do clipe
// buscar — numa cena que começa no frame 674 (ex.: "vendida-secao",
// clipe de só 60 quadros/2s), ele tentava buscar o quadro em
// 674/30≈22,5s de um vídeo de 2s, um ponto que não existe. O
// resultado não foi um erro claro: o fetch do quadro TRAVOU (timeout
// de 28s do Remotion), derrubando o render inteiro. <Sequence> zera o
// frame local no início de cada cena — exatamente o que faltava.
function CenaMobile({ cena, i, clipes, cores }) {
  const frame = useCurrentFrame();
  const progressoWipe = i === 0 ? 1 : interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  let conteudo;
  if (cena.tipo === 'fecho') {
    conteudo = React.createElement(FechoInstagram, { entradaFrame: 6, cores });
  } else {
    conteudo = React.createElement(
      DispositivoFlutuante,
      { inicioFrame: 0, duracaoFrames: cena.duracao, de: cena.de, para: cena.para, inclinacaoBase: i % 2 === 0 ? 7 : -7 },
      React.createElement(MolduraCelular, { src: clipes[cena.clipe].arquivo })
    );
  }

  // roteiro-mobile.js sempre manda `legendas` (array) — achado do
  // simplify: normalizado na fonte, não precisa mais de fallback aqui.
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, zIndex: i + 1 } },
    i === 0 ? conteudo : React.createElement(MascaraCircular, { progresso: progressoWipe }, conteudo),
    (cena.legendas || []).map((leg, li) => React.createElement(LegendaCinetica, {
      key: li, texto: leg.texto, inicioFrame: leg.atraso, duracao: leg.duracao,
    }))
  );
}

function TourMobile({ cenas, cores, logoUri, clipes }) {
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } },
    React.createElement(FundoBege, { cores }),
    cenas.map((cena, i) => React.createElement(
      Sequence,
      { key: i, from: cena.inicio, durationInFrames: cena.duracao, name: cena.nome, layout: 'none' },
      React.createElement(CenaMobile, { cena, i, clipes, cores })
    )),
    React.createElement(SeloTour, { cores, texto: 'Tour do Site' }),
    React.createElement(MarcaDagua, { src: logoUri }),
    React.createElement(VinhetaGrao)
  );
}

module.exports = { TourMobile };
