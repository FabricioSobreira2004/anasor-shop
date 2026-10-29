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
// `comChip`: embrulha a logo num círculo creme translúcido — mesmo
// motivo do chip em gerar-posts.js (v3 dos posts): o corte por
// luminância da logo (reel.js, removerFundoLogo) deixa uma faixa de
// transição que segue o ruído de compressão JPEG do arquivo-fonte —
// invisível sobre foto/vídeo (sempre há textura por trás), mas vira um
// halo quadrado visível sobre uma cena de FUNDO CHAPADO escuro (achado
// testando o template Conteudo.js, rodada 3 — os outros templates
// nunca mostram a marca d'água sobre fundo chapado, só foto/vídeo ou
// o CTA em --cor-fundo claro, por isso nunca precisaram disso antes).
function MarcaDagua({ src, tamanho = 150, comChip = false }) {
  const frame = useCurrentFrame();
  const opacidade = interpolate(frame, [0, 20], [0, 0.85], { extrapolateRight: 'clamp' });
  if (!comChip) {
    return React.createElement(Img, {
      src: resolverSrc(src),
      style: {
        position: 'absolute', right: 48,
        // 430 (não 64): pedido explícito de v2/B3 — "nada importante
        // nos 420px de baixo" (área do Instagram: legenda/@conta/
        // música no Reels de verdade). 64 cairia bem no meio dessa faixa.
        bottom: 430, width: tamanho, height: 'auto', opacity: opacidade,
        filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.35))', zIndex: 5,
      },
    });
  }
  return React.createElement('div', {
    style: {
      position: 'absolute', right: 48, bottom: 430, zIndex: 5,
      width: tamanho, height: tamanho, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(251,246,239,0.95)', opacity: opacidade,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
  }, React.createElement(Img, { src: resolverSrc(src), style: { width: '72%', height: 'auto' } }));
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
        // 260 (não 64): pedido explícito de v2/B3 — "nada importante
        // nos 250px do topo" (no Reels de verdade, o Instagram desenha
        // nome da conta/menu ali em cima).
        top: 260,
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
        // 430 (não 150): mesma área segura de MarcaDagua/SeloAnimado —
        // pedido explícito de v2/B3.
        position: 'absolute', left: 0, right: 0, bottom: 430, zIndex: 5,
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

// easeOutExpo-ish (bezier próximo do padrão de motion design "premium":
// arranca rápido, desacelera bem no fim, sem o "respiro" morto do meio
// que Easing.inOut(Easing.ease) tinha) — v2/B1, pedido explícito de
// "easing refinado". Usado em TODO movimento de câmera (Ken Burns e o
// parallax de fundo, abaixo).
const EASE_CAMERA = Easing.bezier(0.16, 1, 0.3, 1);

// ---------------------------------------------------------------
// Foto com movimento de câmera (Ken Burns): interpola scale/translate
// entre `de` e `para` ao longo da duração da cena.
// ---------------------------------------------------------------
function FotoKenBurns({ src, inicioFrame, duracaoFrames, de, para, objectPosition = '50% 50%' }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicioFrame, inicioFrame + duracaoFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_CAMERA,
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
// Parallax em 2 camadas — v2/B1 ("câmera com zoom/pan e parallax em
// camadas"). SEM recorte/segmentação do objeto (pedido explícito:
// "se não for viável, mantenha camadas simples e registre a decisão" —
// ver DECISOES.md): a MESMA foto vira 2 camadas —
//   - fundo: desfocada, mais escura, ESCALA maior e se move DEVAGAR
//     (menos %) — simula estar "mais longe";
//   - frente: nítida (FotoKenBurns de verdade), se move mais rápido.
// A diferença de velocidade entre as duas é o que lê como profundidade,
// mesmo sem uma camada "real" separada do objeto.
function FotoParallax({ src, inicioFrame, duracaoFrames, de, para, objectPosition = '50% 50%' }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicioFrame, inicioFrame + duracaoFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_CAMERA,
  });
  // fundo: 40% do deslocamento da frente, escala sempre maior (cobre o
  // blur de borda) — "mais longe" = move menos E já começa mais perto.
  const xFundo = (de.x + (para.x - de.x) * t) * 0.4;
  const yFundo = (de.y + (para.y - de.y) * t) * 0.4;
  const escalaFundo = 1.25 + (de.escala + (para.escala - de.escala) * t - 1) * 0.6;
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Img, {
      src: resolverSrc(src),
      style: {
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition,
        transform: `scale(${escalaFundo}) translate(${xFundo}%, ${yFundo}%)`,
        filter: 'blur(18px) brightness(0.75) saturate(1.05)',
      },
    }),
    React.createElement(FotoKenBurns, { src, inicioFrame, duracaoFrames, de, para, objectPosition })
  );
}

// ---------------------------------------------------------------
// Brilho de esmalte — uma faixa de luz diagonal que atravessa a cena
// UMA vez (pedido explícito: "faixa de luz que percorre a peça"),
// imitando o reflexo que esmalte/vidrado de verdade faz. `screen`
// clareia só onde já tem alguma luz (não lava a cena inteira de
// branco). Dispara uma vez em `inicioFrame`, sem repetir.
function BrilhoEsmalte({ inicioFrame, duracaoFrames = 34 }) {
  const frame = useCurrentFrame();
  const t = frame - inicioFrame;
  if (t < 0 || t > duracaoFrames) return null;
  // -30% a 130%: a faixa entra e sai inteira da tela (nunca "corta" nas bordas)
  const pos = interpolate(t, [0, duracaoFrames], [-30, 130], { easing: Easing.inOut(Easing.ease) });
  return React.createElement('div', {
    style: {
      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden',
    },
  }, React.createElement('div', {
    style: {
      position: 'absolute', top: '-20%', bottom: '-20%', left: `${pos}%`, width: '22%',
      transform: 'rotate(18deg)', mixBlendMode: 'screen',
      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
    },
  }));
}

// ---------------------------------------------------------------
// Vinheta + grão de filme — overlay ÚNICO, por cima de TUDO (toda cena,
// toda transição), pedido explícito de v2/B1. Vinheta: radial-gradient
// escurecendo só os cantos (sutil — não é pra notar como "efeito", é
// pra parecer cinema). Grão: ruído SVG (feTurbulence) em baixíssima
// opacidade, com leve CINTILAÇÃO (a posição do tile pula por frame,
// baseado só no número do frame — determinístico, sem Math.random(),
// pra um render ser IGUAL ao outro com os mesmos props).
const GRAO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
  <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;
const GRAO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(GRAO_SVG)}`;

function VinhetaGrao() {
  const frame = useCurrentFrame();
  // Jitter determinístico (não é ruído de verdade frame a frame, é só
  // pra "tremer" a posição do tile — suficiente pro olho ler como grão
  // vivo, não uma textura estática colada na tela).
  const jx = (frame * 47) % 180;
  const jy = (frame * 83) % 180;
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.32) 100%)',
      },
    }),
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
        opacity: 0.05, mixBlendMode: 'overlay',
        backgroundImage: `url("${GRAO_DATA_URI}")`,
        backgroundPosition: `${-jx}px ${-jy}px`,
      },
    })
  );
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

// ---------------------------------------------------------------
// Retrato da Anasor em círculo com aro dourado — Rodada 5, item 2
// (fechamento rico). `src` já vem pronto (data URI, calculado 1x em
// reel.js, mesmo padrão da logo) — este componente só desenha.
// ---------------------------------------------------------------
function RetratoAnasor({ src, tamanho = 200, entradaFrame, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  const flutuar = Math.sin(frame / 50) * 6;
  return React.createElement(
    'div',
    {
      style: {
        width: tamanho, height: tamanho, borderRadius: '50%', overflow: 'hidden',
        border: `5px solid ${cores.destaque}`,
        boxShadow: '0 0 0 3px rgba(251,246,239,0.9), 0 18px 40px rgba(30,20,10,0.35)',
        opacity: pop, transform: `translateY(${(1 - pop) * 24 + flutuar}px)`,
        flexShrink: 0,
      },
    },
    React.createElement(Img, { src: resolverSrc(src), style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 52%' } })
  );
}

// ---------------------------------------------------------------
// Fecho RICO — Rodada 5, item 2: retrato + título + botão gummy
// (aperto) + handle GRANDE com coração + faixa de confiança, em
// cascata (cada peça entra ~12 quadros depois da anterior). Junta num
// só lugar o que os 3 templates (Apresentacao/Colecao/Conteudo)
// faziam cada um por si (título+botão+handle-pequeno+faixa) — menos
// duplicação E mais rico ao mesmo tempo.
function FechoRico({ titulo, entradaFrame, duracaoFrames, cores, retratoUri, sobreClaro = false }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const popIndice = (i) => spring({ frame: frame - entradaFrame - i * 12, fps, config: { damping: 15, stiffness: 150 } });
  const pHandle = popIndice(3);
  const apertoFrame = duracaoFrames != null ? entradaFrame + duracaoFrames - 24 : entradaFrame + 50;
  const corHandle = sobreClaro ? cores.texto : '#FFF';
  return React.createElement(
    React.Fragment, null,
    React.createElement(RetratoAnasor, { src: retratoUri, tamanho: 170, entradaFrame, cores }),
    React.createElement(TituloCinetico, { texto: titulo, entradaFrame: entradaFrame + 12, tamanho: 64, cor: sobreClaro ? cores.texto : '#FFF' }),
    React.createElement(BotaoGummyFinal, { entradaFrame: entradaFrame + 24, apertoFrame, cores }),
    React.createElement('div', {
      style: {
        opacity: pHandle, transform: `translateY(${(1 - pHandle) * 18}px)`,
        fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 40, color: corHandle,
        display: 'flex', alignItems: 'center', gap: 12,
      },
    }, '@anasor.ceramica', React.createElement(Coracao, { tamanho: 30, cor: cores.destaque }))
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
  FotoParallax,
  BrilhoEsmalte,
  VinhetaGrao,
  VideoInserto,
  MascaraCircular,
  BotaoGummyFinal,
  RetratoAnasor,
  FechoRico,
  resolverSrc,
};
