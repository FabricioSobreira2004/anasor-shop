// Template A — "Apresentação da peça": título cinético de abertura,
// 2-4 cenas (foto com Ken Burns, vídeo em moldura circular, ou foto
// "de noite" com brilho animado — ver GlowNoturno) com legenda
// palavra-por-palavra, e fecho com CTA + faixa de confiança.
//
// Recebe TUDO pronto via props (nenhuma leitura de arquivo aqui: isso
// é trabalho do reel.js, do lado Node) — este arquivo só sabe animar.
const React = require('react');
const { AbsoluteFill, Img, interpolate, useCurrentFrame } = require('remotion');
const {
  MarcaDagua, SeloAnimado, FaixaConfianca, TituloCinetico,
  LegendaPalavras, FaixaLegendaFundo, FotoKenBurns, FotoParallax, BrilhoEsmalte, VinhetaGrao,
  VideoInserto, MascaraCircular, BotaoGummyFinal, FechoRico, resolverSrc,
} = require('../componentes');

// Brilho noturno: escurece a foto (filter) e sobrepõe 2-3 "luzes"
// (gradiente radial quente) que pulsam — simula a casinha acesa por
// dentro sem precisar de filmagem nova à noite (que não existe ainda,
// ver reels-ideias.md/memória do projeto). É efeito gráfico assumido
// como tal, não finge ser uma foto real.
function GlowNoturno({ src, objectPosition, pontos, inicioFrame }) {
  const frame = useCurrentFrame();
  const t = frame - inicioFrame;
  const escurecer = interpolate(t, [0, 30], [1, 0.22], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  return React.createElement(
    AbsoluteFill,
    null,
    React.createElement(Img, {
      src: resolverSrc(src),
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition,
        filter: `brightness(${escurecer}) saturate(0.7)`,
      },
    }),
    pontos.map((p, i) => {
      const pulso = 0.7 + 0.3 * Math.sin((frame + i * 18) / 9);
      const aparece = interpolate(t, [24 + i * 6, 40 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return React.createElement('div', {
        key: i,
        style: {
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.r, height: p.r,
          transform: `translate(-50%,-50%) scale(${pulso})`,
          borderRadius: '50%', opacity: aparece,
          background: 'radial-gradient(circle, rgba(255,208,120,0.95) 0%, rgba(255,170,60,0.55) 35%, rgba(255,170,60,0) 72%)',
          filter: 'blur(1px)',
        },
      });
    })
  );
}

function Apresentacao({ produto, cores, logoUri, retratoUri, selo, cenas, fps }) {
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

      if (cena.tipo === 'titulo') {
        conteudo.push(
          // FotoParallax (não FotoKenBurns puro): a cena de abertura é a
          // que fica mais tempo parada na tela (título lendo) — é onde a
          // profundidade do parallax mais se nota. v2/B1.
          React.createElement(FotoParallax, {
            key: 'kb', src: cena.src, inicioFrame: cena.inicio, duracaoFrames: cena.duracao,
            de: { escala: 1.08, x: 0, y: 0 }, para: { escala: 1.0, x: 0, y: -1 },
            objectPosition: cena.objectPosition || '50% 50%',
          }),
          React.createElement('div', {
            key: 'vel', style: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.42) 100%)' },
          }),
          React.createElement(BrilhoEsmalte, { key: 'brilho', inicioFrame: cena.inicio + 10 }),
          selo && React.createElement(SeloAnimado, { key: 'selo', selo, entradaFrame: cena.inicio + 14 }),
          React.createElement('div', {
            key: 'tit', style: { position: 'absolute', left: 60, right: 60, top: '72%', transform: 'translateY(-50%)' },
          }, React.createElement(TituloCinetico, { texto: produto.nomeCurto, entradaFrame: cena.inicio + 22 }))
        );
      } else if (cena.tipo === 'video') {
        conteudo.push(
          // Fundo desfocado: se a cena não disser qual foto usar,
          // cai pro fundo escuro (cores.texto) — nunca quebra por
          // falta de `fundo` nem deixa o <Img> sem src.
          cena.fundo
            ? React.createElement(Img, {
                key: 'fundo', src: resolverSrc(cena.fundo), style: {
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                  filter: 'blur(26px) brightness(0.55)', transform: 'scale(1.12)',
                },
              })
            : React.createElement('div', { key: 'fundo', style: { position: 'absolute', inset: 0, background: cores.texto } }),
          React.createElement(VideoInserto, {
            key: 'vid', src: cena.src, inicioFrame: cena.inicio, duracaoFrames: cena.duracao,
            startFrom: cena.startFrom || 0,
          })
        );
      } else if (cena.tipo === 'foto-noite') {
        conteudo.push(React.createElement(GlowNoturno, {
          key: 'noite', src: cena.src, objectPosition: cena.objectPosition, pontos: cena.pontos, inicioFrame: cena.inicio,
        }));
      } else if (cena.tipo === 'foto') {
        conteudo.push(
          React.createElement(FotoParallax, {
            key: 'kb', src: cena.src, inicioFrame: cena.inicio, duracaoFrames: cena.duracao,
            de: cena.de, para: cena.para, objectPosition: cena.objectPosition || '50% 50%',
          }),
          React.createElement(BrilhoEsmalte, { key: 'brilho', inicioFrame: cena.inicio + Math.round(cena.duracao * 0.35) })
        );
      } else if (cena.tipo === 'cta') {
        // FechoRico (Rodada 5, item 2) — retrato da Anasor + título +
        // botão gummy + handle GRANDE com coração, em cascata. Troca o
        // que antes era título+botão+handle-pequeno-sem-animação
        // montados à mão aqui.
        conteudo.push(
          React.createElement('div', { key: 'bg', style: { position: 'absolute', inset: 0, backgroundColor: cores.fundo } }),
          React.createElement('div', {
            key: 'conteudo',
            style: {
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 28,
            },
          },
            React.createElement(FechoRico, {
              titulo: 'Peça única', entradaFrame: cena.inicio + 6, duracaoFrames: cena.duracao - 6,
              cores, retratoUri, sobreClaro: true,
            })
          ),
          React.createElement(FaixaConfianca, { key: 'fc', cores, entradaFrame: cena.inicio + 58, sobreClaro: true })
        );
      }

      // Faixa de gradiente na base (Rodada 9) — SEMPRE presente em
      // cenas com foto/vídeo full-bleed (não no CTA, que já tem fundo
      // sólido controlado): reserva contraste pra legenda nova,
      // queimada depois por narracao/legendar.js, sem precisar saber
      // nada sobre ela aqui (o template não lê narração/legenda).
      if (cena.tipo !== 'cta') {
        conteudo.push(React.createElement(FaixaLegendaFundo, { key: 'faixa-legenda' }));
      }

      // Uma cena pode ter mais de uma "leva" de legenda (ex.: o gancho
      // no início e o texto de revelação perto do fim) — cada uma some
      // sozinha quando a próxima cena faz o wipe por cima.
      (cena.legendas || []).forEach((leg, li) => {
        conteudo.push(React.createElement(LegendaPalavras, {
          key: `leg${li}`, palavras: leg.palavras, inicioFrame: cena.inicio + leg.atraso, duracao: leg.duracao || 60,
          // 'foto-noite' já escurece a cena: a legenda padrão (pílula
          // marrom translúcida) quase some em cima do escuro — vira
          // pílula clara aqui, do mesmo jeito que o selo/faixa de
          // confiança não são "sempre brancos" (ver sobreClaro).
          ...(cena.tipo === 'foto-noite' ? { cor: cores.texto, fundo: 'rgba(251,246,239,0.92)' } : {}),
        }));
      });

      return React.createElement(
        'div',
        { key: i, style: { position: 'absolute', inset: 0, zIndex: i } },
        i === 0
          ? conteudo
          : React.createElement(MascaraCircular, { progresso: progressoWipe }, conteudo)
      );
    }),
    React.createElement(MarcaDagua, { src: logoUri }),
    // VinhetaGrao por ÚLTIMO (zIndex 9, maior que tudo acima): cobre
    // toda cena e toda transição, incluindo a marca d'água — pedido
    // explícito de v2/B1 ("leve vinheta e grão de filme").
    React.createElement(VinhetaGrao, { key: 'vinheta' })
  );
}

module.exports = { Apresentacao };
