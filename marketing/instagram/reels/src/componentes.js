// Componentes de animação compartilhados pelos templates (Apresentacao,
// Detalhes, Colecao). Tudo em UM arquivo de propósito: são peças
// pequenas e interligadas (a mesma paleta/ritmo em todas), e esta pasta
// já segue o padrão de "poucos arquivos grandes, bem comentados" do
// resto do projeto (ver js/main.js).
const React = require('react');
const {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile,
} = require('remotion');
const ICONES = require('./icones');

// Resolve um caminho relativo de public/ (ex.: "img/produtos/x.jpg")
// pra a URL real que o bundle do Remotion serve — ou deixa passar
// direto se já for uma URL/data URI (a logo chega como data: URI, já
// pronta, calculada 1x em reel.js). staticFile() só funciona certo
// DENTRO do bundle (precisa de window.remotion_staticBase) — por isso
// mora aqui, não em reel.js (Node). Ver comentário em reel.js
// (copiarParaPublic) sobre como isso foi descoberto.
function resolverSrc(caminho) {
  if (!caminho) return caminho;
  if (caminho.startsWith('data:') || caminho.startsWith('http')) return caminho;
  return staticFile(caminho);
}

// ---------------------------------------------------------------
// Coração cheio (SVG) — nunca o emoji 🤎: mesmo motivo da troca nos
// posts (gerar-posts.js) — o emoji do Windows sai com contorno preto
// grosso. Aqui também evita depender de fonte de emoji colorida no
// Chromium do render.
// ---------------------------------------------------------------
function Coracao({ tamanho = 40, cor = '#FFF' }) {
  return React.createElement(
    'svg',
    { width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: cor, stroke: 'none' },
    React.createElement('path', { d: ICONES.CORACAO_PATH })
  );
}

function IconeLinha({ nome, tamanho = 32, cor = 'currentColor' }) {
  return React.createElement('svg', {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: cor,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    dangerouslySetInnerHTML: { __html: ICONES[nome] },
  });
}

// ---------------------------------------------------------------
// Marca d'água — mesma técnica de gerar-posts.js (remoção de fundo por
// luminância), só que já vem PRONTA como data URI (calculada 1x pelo
// reel.js, em Node, antes do render) — nenhum componente aqui lê
// arquivo nem faz processamento de imagem: só recebe a prop e desenha.
// ---------------------------------------------------------------
function MarcaDagua({ src, tamanho = 150 }) {
  const frame = useCurrentFrame();
  const opacidade = interpolate(frame, [0, 20], [0, 0.85], { extrapolateRight: 'clamp' });
  return React.createElement(Img, {
    src: resolverSrc(src),
    style: {
      position: 'absolute',
      right: 48,
      bottom: 64,
      width: tamanho,
      height: 'auto',
      opacity: opacidade,
      filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.35))',
      zIndex: 5,
    },
  });
}

// ---------------------------------------------------------------
// Selo da peça — mesma pílula/cores dos posts (gerar-posts.js) e do
// site (js/main.js, .selo-peca). Entra com spring (pop + leve
// overshoot) no frame indicado; some depois de `duracao` (ou fica, se
// duracao for null — usado quando o selo é o fecho de uma cena curta).
// ---------------------------------------------------------------
function SeloAnimado({ selo, entradaFrame, duracao = null }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 14, stiffness: 160 } });
  let opacidade = pop;
  if (duracao != null) {
    opacidade = interpolate(t, [duracao - 12, duracao], [pop, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (t > duracao) return null;
  }
  const contorno = selo.contorno ? `inset 0 0 0 3px ${selo.contorno}` : 'none';
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        top: 64,
        left: 48,
        zIndex: 5,
        transform: `scale(${0.85 + pop * 0.15}) translateY(${(1 - pop) * -14}px)`,
        opacity: opacidade,
        background: selo.bg,
        color: selo.cor,
        boxShadow: `0 8px 22px rgba(62,46,34,0.28), ${contorno}`,
        fontFamily: 'Jost, sans-serif',
        fontWeight: 600,
        fontSize: 34,
        letterSpacing: '0.02em',
        padding: '20px 36px',
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        whiteSpace: 'nowrap',
      },
    },
    selo.coracao ? React.createElement(Coracao, { tamanho: 28, cor: selo.cor }) : null,
    selo.label
  );
}

// ---------------------------------------------------------------
// Faixa de confiança — os 3 fatos (frete/peça única/compra segura),
// entrada escalonada (cada item chega um pouco depois do anterior).
// ---------------------------------------------------------------
// `sobreClaro`: true quando o fundo por trás da faixa é claro (a tela
// de CTA, fundo creme) — aí o texto/ícone precisam ser escuros, não
// brancos. Default false (fundo escuro/foto, como na capa): branco com
// sombra, pra garantir contraste em cima de QUALQUER foto.
function FaixaConfianca({ cores, entradaFrame, sobreClaro = false }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cor = sobreClaro ? cores.texto : '#FFF';
  const sombra = sobreClaro ? 'none' : '0 2px 8px rgba(0,0,0,0.45)';
  const itens = [
    ['truck', 'Frete grátis'],
    ['gem', 'Peça única'],
    ['shield-check', 'Compra segura'],
  ];
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: 0, right: 0, bottom: 150, zIndex: 5,
        display: 'flex', justifyContent: 'center', gap: 52,
      },
    },
    itens.map(([icone, texto], i) => {
      const t = frame - entradaFrame - i * 5;
      const pop = spring({ frame: t, fps, config: { damping: 16, stiffness: 150 } });
      if (t < -1) return null;
      return React.createElement(
        'div',
        {
          key: icone,
          style: {
            opacity: pop,
            transform: `translateY(${(1 - pop) * 18}px)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          },
        },
        React.createElement(IconeLinha, { nome: icone, tamanho: 30, cor }),
        React.createElement('span', {
          style: { fontFamily: 'Jost, sans-serif', fontSize: 24, color: cor, textShadow: sombra },
        }, texto)
      );
    })
  );
}

// ---------------------------------------------------------------
// Título cinético — entra com um leve slide-up + fade, as palavras
// reveladas em sequência bem rápida (stagger curto: é o NOME da peça,
// não uma legenda, então o efeito é mais "assinatura" que "leitura").
// ---------------------------------------------------------------
function TituloCinetico({ texto, entradaFrame, tamanho = 76, cor = '#FFF' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palavras = texto.split(' ');
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 20px',
        fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: tamanho, lineHeight: 1.08,
        color: cor, textAlign: 'center', textShadow: '0 4px 18px rgba(0,0,0,0.35)',
      },
    },
    palavras.map((p, i) => {
      const t = frame - entradaFrame - i * 4;
      const pop = spring({ frame: t, fps, config: { damping: 16, stiffness: 140 } });
      return React.createElement('span', {
        key: i,
        style: { opacity: pop, transform: `translateY(${(1 - pop) * 26}px)`, display: 'inline-block' },
      }, p);
    })
  );
}

// ---------------------------------------------------------------
// Legenda palavra por palavra — até 6 palavras por tela (pedido
// explícito), cada uma "pop" ao entrar e as anteriores desta leva
// continuam visíveis (efeito karaokê/TikTok), zera quando troca de
// leva. `texto` já deve vir pré-quebrado pelo roteiro em LEVAS de até
// 6 palavras (ver roteiros.js) — aqui só anima UMA leva.
// ---------------------------------------------------------------
function LegendaPalavras({ palavras, inicioFrame, duracao = 60, cor = '#FFF', fundo = 'rgba(62,46,34,0.55)' }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Se há mais de uma leva de legenda numa cena (gancho + revelação,
  // por exemplo), esta some sozinha antes da próxima aparecer.
  const fimLeva = interpolate(frame, [inicioFrame + duracao - 10, inicioFrame + duracao], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (frame > inicioFrame + duracao) return null;
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: 64, right: 64, bottom: 440, zIndex: 6,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 16px',
        opacity: fimLeva,
      },
    },
    palavras.map((p, i) => {
      const t = frame - inicioFrame - i * 5;
      const pop = spring({ frame: t, fps, config: { damping: 13, stiffness: 190 } });
      if (t < -1) return null;
      return React.createElement(
        'span',
        {
          key: i,
          style: {
            opacity: pop,
            transform: `scale(${0.75 + pop * 0.25})`,
            display: 'inline-block',
            fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 58,
            color: cor, background: fundo, padding: '6px 18px', borderRadius: 14,
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          },
        },
        p
      );
    })
  );
}

// ---------------------------------------------------------------
// Foto com movimento de câmera (Ken Burns): interpola scale/translate
// entre `de` e `para` ao longo da duração da cena.
// ---------------------------------------------------------------
function FotoKenBurns({ src, inicioFrame, duracaoFrames, de, para, objectPosition = '50% 50%' }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicioFrame, inicioFrame + duracaoFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease),
  });
  const escala = de.escala + (para.escala - de.escala) * t;
  const x = de.x + (para.x - de.x) * t;
  const y = de.y + (para.y - de.y) * t;
  return React.createElement(Img, {
    src: resolverSrc(src),
    style: {
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      objectPosition, transform: `scale(${escala}) translate(${x}%, ${y}%)`,
    },
  });
}

// ---------------------------------------------------------------
// Inserto de vídeo em moldura circular — NUNCA em tela cheia: os
// vídeos de produto são 576x1024 (baixa resolução pra preencher um
// 1080x1920 sem ficar borrado — ver nota do pedido). Como círculo
// grande (não a tela toda), a baixa resolução não chama atenção, e o
// recorte circular já é a "máscara" pedida (referência a pratos).
// `reverso`: quando true, o vídeo já foi pré-processado (ffmpeg
// -vf reverse, feito em reel.js) — este componente só reproduz.
// ---------------------------------------------------------------
function VideoInserto({ src, inicioFrame, duracaoFrames, diametro = 760, startFrom = 0 }) {
  const frame = useCurrentFrame();
  const t = frame - inicioFrame;
  if (t < 0 || t > duracaoFrames) return null;
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: '50%', top: '50%',
        width: diametro, height: diametro,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%', overflow: 'hidden',
        boxShadow: '0 0 0 10px rgba(255,255,255,0.9), 0 24px 60px rgba(0,0,0,0.35)',
      },
    },
    React.createElement(OffthreadVideo, {
      src: resolverSrc(src),
      startFrom,
      style: { width: '100%', height: '100%', objectFit: 'cover' },
    })
  );
}

// ---------------------------------------------------------------
// Máscara circular de transição — "revela" os filhos através de um
// círculo que cresce a partir do centro (wipe). Usada entre cenas.
// ---------------------------------------------------------------
function MascaraCircular({ children, progresso }) {
  const raio = progresso * 140; // 0 a 140% da diagonal: cobre a tela toda
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, clipPath: `circle(${raio}% at 50% 50%)` } },
    children
  );
}

// ---------------------------------------------------------------
// Botão "Link na bio" com aperto no fim (scale down + sombra
// "engolida" — mesma linguagem do :active gummy do site, ver
// .btn-comprar:active em css/style.css) + coração ao lado.
// ---------------------------------------------------------------
function BotaoGummyFinal({ entradaFrame, apertoFrame, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  const apertando = apertoFrame != null && frame >= apertoFrame && frame < apertoFrame + 14;
  const af = apertando ? interpolate(frame, [apertoFrame, apertoFrame + 7, apertoFrame + 14], [0, 1, 0]) : 0;
  const sombra = 12 - af * 12;
  return React.createElement(
    'div',
    {
      style: {
        opacity: pop,
        transform: `scale(${0.8 + pop * 0.2}) translateY(${af * 6}px)`,
        display: 'flex', alignItems: 'center', gap: 22,
      },
    },
    React.createElement(
      'div',
      {
        style: {
          padding: '30px 76px', borderRadius: 999,
          background: cores.destaque, color: '#FFF',
          fontFamily: 'Jost, sans-serif', fontWeight: 500, fontSize: 48,
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.28), 0 ${sombra}px 0 ${cores.destaqueEscuro}`,
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%)',
        },
      },
      'Link na bio'
    ),
    React.createElement(Coracao, { tamanho: 46, cor: cores.destaque })
  );
}

module.exports = {
  Coracao,
  IconeLinha,
  MarcaDagua,
  SeloAnimado,
  FaixaConfianca,
  TituloCinetico,
  LegendaPalavras,
  FotoKenBurns,
  VideoInserto,
  MascaraCircular,
  BotaoGummyFinal,
  resolverSrc,
};
