// Versão A — Tour do Site pro Instagram (1080×1920). Celular flutuante
// sobre fundo bege com marca d'água, trocando de cena (vídeo real do
// site) com wipe circular, legendas cinéticas e fecho com CTA.
const React = require('react');
const { Sequence, useCurrentFrame, interpolate } = require('remotion');
const {
  FundoBege, MarcaDagua, SeloTour, LegendaCinetica, LegendaKaraoke, VinhetaGrao,
  FechoInstagram, DispositivoFlutuante, MolduraCelular, LAYOUT_CELULAR,
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
const QUADROS_WIPE = 16;

function CenaMobile({ cena, i, clipes, cores, retratoUri }) {
  const frame = useCurrentFrame();
  // Crossfade (opacidade), não mais wipe circular — ACHADO DO
  // FABRÍCIO (Rodada 10): o wipe em íris (MascaraCircular) lia como
  // "a tela vira um recorte de foto com arcos", chamativo demais pra
  // um tour que deveria fluir. A cena de baixo (anterior) já fica
  // visível por baixo durante toda a troca (Sequence estendido em
  // QUADROS_WIPE, ver comentário no fundo do arquivo) — só a cena de
  // CIMA (nova) precisa entrar com opacidade 0→1 pra virar um
  // crossfade suave, sem precisar desenhar nenhuma máscara.
  const opacidadeEntrada = i === 0 ? 1 : interpolate(frame, [0, QUADROS_WIPE], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  let conteudo;
  if (cena.tipo === 'fecho') {
    conteudo = React.createElement(FechoInstagram, { entradaFrame: 6, cores, retratoUri });
  } else {
    // `ancoragem` — Rodada 5, item 1a: celular fixo num `top` previsível
    // (LAYOUT_CELULAR), não mais centralizado no canvas inteiro — é
    // isso que permite provar por código que ele nunca alcança a
    // legenda (ver LAYOUT_CELULAR em componentes.js e
    // src/validar-geometria.js).
    conteudo = React.createElement(
      DispositivoFlutuante,
      {
        inicioFrame: 0, duracaoFrames: cena.duracao, de: cena.de, para: cena.para,
        // Reduzido de ±7° pra ±2° (Rodada 9, achado do Fabrício: o
        // aparelho parecia "inclinado" — mantém um leve ar 3D sem
        // prejudicar a leitura da tela, que é o objetivo do tour.
        inclinacaoBase: i % 2 === 0 ? 2 : -2,
        ancoragem: { top: LAYOUT_CELULAR.TOPO, largura: LAYOUT_CELULAR.LARGURA },
      },
      React.createElement(MolduraCelular, { src: clipes[cena.clipe].arquivo, largura: LAYOUT_CELULAR.LARGURA, altura: LAYOUT_CELULAR.ALTURA })
    );
  }

  // roteiro-mobile.js sempre manda `legendas` (array) — achado do
  // simplify: normalizado na fonte, não precisa mais de fallback aqui.
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, zIndex: i + 1 } },
    i === 0 ? conteudo : React.createElement('div', { style: { position: 'absolute', inset: 0, opacity: opacidadeEntrada } }, conteudo),
    (cena.legendas || []).map((leg, li) => React.createElement(LegendaCinetica, {
      key: li, texto: leg.texto, inicioFrame: leg.atraso, duracao: leg.duracao,
    }))
  );
}

function TourMobile({ cenas, cores, logoUri, retratoUri, clipes, legendaBlocos, fps = 30 }) {
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } },
    React.createElement(FundoBege, { cores }),
    // durationInFrames + QUADROS_WIPE (exceto a última cena) — achado
    // visual (Rodada 6, QA de 10 quadros): como cada cena mora num
    // <Sequence> PRÓPRIO, sem sobreposição, a cena anterior já tinha
    // terminado (Sequence fechado) no exato instante em que a
    // PRÓXIMA cena começa seu wipe circular (progresso≈0, quase
    // invisível) — resultado: ~2 quadros praticamente em branco (só
    // fundo bege) em TODA transição entre cenas, achado só olhando o
    // vídeo renderizado quadro a quadro, não pela varredura de
    // luminância (o bege não é branco o bastante pra disparar o
    // limiar). Esticar o Sequence além da duração "oficial" da cena
    // mantém a cena ANTERIOR visível por baixo enquanto a próxima
    // cena ainda está quase transparente — câmera e vídeo apenas
    // seguram no último quadro durante essa folga (clamp já existente
    // em DispositivoFlutuante; OffthreadVideo segura no último quadro
    // do clipe, mesmo comportamento já usado em outras cenas mais
    // curtas que a duração pedida).
    cenas.map((cena, i) => {
      const ultima = i === cenas.length - 1;
      const duracaoSequence = ultima ? cena.duracao : cena.duracao + QUADROS_WIPE;
      return React.createElement(
        Sequence,
        { key: i, from: cena.inicio, durationInFrames: duracaoSequence, name: cena.nome, layout: 'none' },
        React.createElement(CenaMobile, { cena, i, clipes, cores, retratoUri })
      );
    }),
    React.createElement(SeloTour, { cores, texto: 'Tour do Site' }),
    // left/top (não right/bottom) + tamanho ~1,85x — Rodada 10 (v3):
    // ver comentário de LAYOUT_CELULAR acima. Corredor livre à
    // esquerda do celular (LAYOUT_CELULAR.LARGURA:560 centrado em
    // 1080 → 260px de cada lado) — logo de 240px cabe com 10px de
    // margem de cada lado do corredor, vertical centralizada na altura
    // do celular (TOPO 245 + ALTURA/2 575 = centro 820; 820-120=700).
    // Longe da coluna de botões do Instagram (direita, y:1100-1700),
    // do celular e da faixa de legenda (y:1440-1600).
    React.createElement(MarcaDagua, { src: logoUri, tamanho: 240, left: 10, top: 700 }),
    // Legenda karaokê v3 — RENDERIZADA AQUI, dentro da própria
    // composição (não como overlay de vídeo separado — ver
    // componentes.js/LegendaKaraoke pro motivo). zIndex 30 (acima de
    // tudo, abaixo só da VinhetaGrao/grão, que é puramente estética).
    legendaBlocos ? React.createElement(LegendaKaraoke, { blocos: legendaBlocos, fps, top: LAYOUT_CELULAR.CAPTION_TOP, altura: 160, fonte: 44 }) : null,
    React.createElement(VinhetaGrao)
  );
}

module.exports = { TourMobile };
