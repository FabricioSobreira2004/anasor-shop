// Peças visuais do Tour do Site. Mesma LINGUAGEM visual do motor de
// Reels (marca d'água, legenda cinética, vinheta/grão, botão gummy,
// easing de câmera) — reimplementada aqui, não importada de
// marketing/instagram/reels/src/componentes.js: cada pasta tem seu
// próprio package.json/node_modules (remotion/react instalados 2x);
// importar o arquivo de lá criaria DUAS instâncias de React/Remotion
// no mesmo bundle (useCurrentFrame depende de Context — quebraria de
// um jeito sutil). Decisão registrada em DECISOES.md.
const React = require('react');
const {
  AbsoluteFill, Img, OffthreadVideo, interpolate, spring,
  useCurrentFrame, useVideoConfig, Easing, staticFile,
} = require('remotion');

function resolverSrc(caminho) {
  if (!caminho) return caminho;
  if (caminho.startsWith('data:') || caminho.startsWith('http')) return caminho;
  return staticFile(caminho);
}

// easeOutExpo-ish — mesma curva EASE_CAMERA do motor de Reels (v2),
// usada em todo movimento de câmera/flutuação aqui também, pra ficar
// com a MESMA "textura" de motion design das duas peças.
const EASE_CAMERA = Easing.bezier(0.16, 1, 0.3, 1);

// ---------------------------------------------------------------
// Marca d'água — mesma técnica de reels/src/componentes.js
// (MarcaDagua): recebe a logo JÁ pronta (data URI com fundo removido
// por luminância, calculada 1x em tour.js, em Node — igual reel.js).
// ---------------------------------------------------------------
function MarcaDagua({ src, tamanho = 130, right = 56, bottom = 56 }) {
  const frame = useCurrentFrame();
  const opacidade = interpolate(frame, [0, 20], [0, 0.8], { extrapolateRight: 'clamp' });
  return React.createElement(Img, {
    src: resolverSrc(src),
    style: {
      position: 'absolute', right, bottom, width: tamanho, height: 'auto', opacity: opacidade,
      filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))', zIndex: 5,
    },
  });
}

// Monograma "AS" tileado no fundo, bem fraco — pedido explícito
// ("marca d'água da logo e o monograma AS fraco"). SVG em data URI
// (mesma técnica do grão de VinhetaGrao) — texto, não imagem, pra não
// depender de nenhuma fonte carregada no momento de gerar o padrão.
function fundoComMonograma(corTexto) {
  // SEM pré-codificar corTexto: encodeURIComponent() no SVG inteiro já
  // escapa o '#' da cor corretamente (mesma técnica comprovada de
  // GRAO_DATA_URI, abaixo) — uma 1ª versão pré-codificava a cor E o
  // SVG inteiro (dupla codificação) e tentava desfazer com um
  // .replace() que não fazia o que parecia fazer. Achado só lendo de
  // novo o próprio código, antes de qualquer render.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
    <text x='18' y='120' font-family='Fraunces, serif' font-size='96' font-weight='600' fill='${corTexto}' opacity='0.05'>AS</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// React.memo — achado do simplify: `cores` nunca muda durante o
// vídeo, mas sem memo o Remotion (que recria a árvore inteira a cada
// quadro) reconstruía a string do monograma (encodeURIComponent de um
// SVG) em TODO quadro de TODO render (~900 na Versão A, ~1500 na B),
// um trabalho sempre igual que não precisa repetir.
const FundoBege = React.memo(function FundoBege({ cores }) {
  return React.createElement('div', {
    style: {
      position: 'absolute', inset: 0,
      // 2 camadas em UMA propriedade (backgroundImage), separadas por
      // vírgula — "background" (shorthand) seguido de "backgroundImage"
      // (longhand) como 2 propriedades React seria a mesma armadilha
      // do CSS puro: a 2ª sobrescreve a imagem da 1ª, perdendo o
      // gradiente (achado lendo de novo, antes de qualquer render).
      backgroundImage: `linear-gradient(145deg, ${cores.fundo} 0%, #F3E8D8 55%, ${cores.fundo} 100%), url("${fundoComMonograma(cores.texto)}")`,
      backgroundRepeat: 'no-repeat, repeat',
      backgroundSize: 'cover, 220px 220px',
      backgroundBlendMode: 'normal, multiply',
    },
  });
});

// ---------------------------------------------------------------
// Selo fixo do Tour — mesma pílula/posição (top:260,left:48) e visual
// de SeloAnimado nos Reels, mas um selo "de série" (não de peça): fica
// visível a vídeo inteiro, entrando 1x com o mesmo spring de entrada.
// ---------------------------------------------------------------
function SeloTour({ texto = 'Tour do Site', cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  return React.createElement(
    'div',
    {
      style: {
        // top:280 (não 64): ACHADO RELENDO, antes de qualquer render —
        // o comentário acima já dizia "top:260" (a área segura do
        // Reels, nada importante nos 250px do topo) mas o código tinha
        // ficado com 64, bem DENTRO da zona proibida. 280 (não 260)
        // porque este selo também tem padding vertical de 16px — o
        // TOPO da pílula (não o ponto top) é o que precisa ficar fora
        // dos 250px.
        position: 'absolute', top: 280, left: 48, zIndex: 20,
        transform: `scale(${0.85 + pop * 0.15}) translateY(${(1 - pop) * -14}px)`,
        opacity: pop,
        background: cores.destaque, color: '#FFF',
        boxShadow: '0 8px 22px rgba(62,46,34,0.28)',
        fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 30,
        letterSpacing: '0.02em', padding: '16px 30px', borderRadius: 999,
      },
    },
    texto
  );
}

// ---------------------------------------------------------------
// Legenda cinética — até 6 palavras, pop em sequência (karaokê),
// fonte Fraunces/Jost ≥56px (pedido explícito). Posição ajustável:
// no celular, fora da área segura do Reels (top 250/bottom 420); no
// desktop (paisagem), simplesmente perto do rodapé, centrada.
// ---------------------------------------------------------------
// bottom:460 (não 150) — ACHADO RELENDO, antes de qualquer render: a
// área segura pedida ("fora dos 420px de baixo") exige um bottom MAIOR
// que 420 (mais distante da borda), não menor — 150 deixava a legenda
// bem DENTRO da zona proibida. 460 (igual à folga usada no selo/marca
// d'água dos Reels, lá com bottom:430/440) garante a margem.
function LegendaCinetica({ texto, inicioFrame, duracao = 70, bottom = 460, cor = '#FFF', fonte = 'Jost, sans-serif', tamanho = 62 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < inicioFrame - 1 || frame > inicioFrame + duracao) return null;
  const palavras = texto.split(' ');
  const saida = interpolate(frame, [inicioFrame + duracao - 12, inicioFrame + duracao], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: 60, right: 60, bottom, zIndex: 15,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 16px',
        opacity: saida,
      },
    },
    palavras.map((p, i) => {
      const t = frame - inicioFrame - i * 5;
      const pop = spring({ frame: t, fps, config: { damping: 13, stiffness: 190 } });
      if (t < -1) return null;
      return React.createElement('span', {
        key: i,
        style: {
          opacity: pop, transform: `scale(${0.75 + pop * 0.25})`, display: 'inline-block',
          fontFamily: fonte, fontWeight: 600, fontSize: tamanho, color: cor,
          background: 'rgba(62,46,34,0.6)', padding: '8px 22px', borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        },
      }, p);
    })
  );
}

// ---------------------------------------------------------------
// Vinheta + grão — overlay idêntico (mesma fórmula) ao dos Reels.
// ---------------------------------------------------------------
const GRAO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
  <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;
const GRAO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(GRAO_SVG)}`;

function VinhetaGrao() {
  const frame = useCurrentFrame();
  const jx = (frame * 47) % 180;
  const jy = (frame * 83) % 180;
  return React.createElement(
    React.Fragment, null,
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(40,28,18,0.28) 100%)',
      },
    }),
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none',
        opacity: 0.045, mixBlendMode: 'overlay',
        backgroundImage: `url("${GRAO_DATA_URI}")`,
        backgroundPosition: `${-jx}px ${-jy}px`,
      },
    })
  );
}

// ---------------------------------------------------------------
// Coração (SVG) — mesmo motivo dos Reels: nunca o emoji 🤎 (contorno
// preto grosso no Windows, depende de fonte de emoji no Chromium).
// ---------------------------------------------------------------
const CORACAO_PATH = 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';
function Coracao({ tamanho = 32, cor = '#FFF' }) {
  return React.createElement('svg', { width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: cor }, React.createElement('path', { d: CORACAO_PATH }));
}

// ---------------------------------------------------------------
// Fecho Versão A: botão gummy "Link na bio" + @anasor.ceramica.
// ---------------------------------------------------------------
function FechoInstagram({ entradaFrame, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, opacity: pop, transform: `scale(${0.85 + pop * 0.15})` } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 20 } },
      React.createElement('div', {
        style: {
          padding: '26px 64px', borderRadius: 999, background: cores.destaque, color: '#FFF',
          fontFamily: 'Jost, sans-serif', fontWeight: 500, fontSize: 42,
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.28), 0 10px 0 ${cores.destaqueEscuro}`,
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%)',
        },
      }, 'Link na bio'),
      React.createElement(Coracao, { tamanho: 40, cor: cores.destaque })
    ),
    React.createElement('div', { style: { fontFamily: 'Jost, sans-serif', fontSize: 30, color: cores.texto } }, '@anasor.ceramica')
  );
}

// ---------------------------------------------------------------
// Fecho Versão B: endereço do site + nome, sem botão gummy (não é
// Instagram) — estilo "slide final de portfólio".
// ---------------------------------------------------------------
function FechoPortfolio({ entradaFrame, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, opacity: pop, transform: `translateY(${(1 - pop) * 20}px)` } },
    React.createElement('div', { style: { fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 56, color: cores.texto } }, 'anasorsobreira.com.br'),
    React.createElement('div', { style: { fontFamily: 'Jost, sans-serif', fontSize: 30, color: cores.secundaria, letterSpacing: '0.04em' } }, 'Desenvolvido por FabricioSobreira')
  );
}

// ---------------------------------------------------------------
// Faixa de tecnologias (Versão B) — rodapé fixo, ícone-texto em linha.
// ---------------------------------------------------------------
function FaixaTecnologias({ itens, cores }) {
  const frame = useCurrentFrame();
  const opacidade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 18, opacity: opacidade,
        display: 'flex', justifyContent: 'center', gap: 36, padding: '22px 0',
        background: 'rgba(62,46,34,0.82)', backdropFilter: 'blur(2px)',
      },
    },
    itens.map((texto, i) => React.createElement('span', {
      key: i, style: { fontFamily: 'Jost, sans-serif', fontSize: 22, color: '#FBF6EF', letterSpacing: '0.02em' },
    }, texto))
  );
}

// ---------------------------------------------------------------
// Destaque técnico (Versão B) — 1 frase em linguagem simples, pop de
// entrada. Faixa HORIZONTAL centralizada no TOPO (não mais encostada
// num lado) — ACHADO NA 1ª RODADA DE CRÍTICA VISUAL: com o mockup de
// desktop sozinho ("listagem", 1180px de largura num canvas de
// 1920px), a margem de cada lado (370px) era menor que o card
// (480px) — o texto ficava LITERALMENTE em cima do navegador
// (cobrindo a busca/carrinho). Centralizado no topo, acima de
// qualquer mockup (que começa por volta de y:171), nunca mais
// encosta em nada, em nenhuma cena (solo ou lado a lado). O antigo
// parâmetro `lado` (esquerda/direita) saiu daqui E de quem chama
// (roteiro-desktop.js, TourDesktop.js) — achado do simplify.
function DestaqueTecnico({ texto, inicioFrame, duracao = 150, cores }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - inicioFrame;
  if (t < -1 || t > duracao) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  const saida = interpolate(t, [duracao - 15, duracao], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', left: '50%', top: 54, zIndex: 16, maxWidth: 820,
        transform: `translateX(-50%) translateY(${(1 - pop) * -14}px)`,
        opacity: pop * saida, textAlign: 'center',
        fontFamily: 'Jost, sans-serif', fontWeight: 500, fontSize: 26, lineHeight: 1.4,
        color: cores.texto, background: 'rgba(251,246,239,0.92)', padding: '18px 34px',
        borderRadius: 16, boxShadow: '0 10px 30px rgba(62,46,34,0.18)',
        borderBottom: `4px solid ${cores.destaque}`,
      },
    },
    texto
  );
}

// ---------------------------------------------------------------
// Máscara circular de transição — idêntica aos Reels (clip-path wipe).
// ---------------------------------------------------------------
function MascaraCircular({ children, progresso }) {
  const raio = progresso * 140;
  return React.createElement('div', { style: { position: 'absolute', inset: 0, clipPath: `circle(${raio}% at 50% 50%)` } }, children);
}

// ---------------------------------------------------------------
// Dispositivo flutuante — câmera com zoom/pan (Ken Burns) + leve
// inclinação 3D + flutuação contínua (seno), aplicado ao GRUPO
// (moldura + vídeo), não ao vídeo cru: zoom no grupo mantém a tela do
// site nítida (ela só reamostra na escala final, 1x, não perde
// definição por estar "dentro" de uma foto).
// ---------------------------------------------------------------
function DispositivoFlutuante({ children, inicioFrame, duracaoFrames, de, para, inclinacaoBase = 6 }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicioFrame, inicioFrame + duracaoFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_CAMERA,
  });
  const escala = de.escala + (para.escala - de.escala) * t;
  const x = de.x + (para.x - de.x) * t;
  const y = de.y + (para.y - de.y) * t;
  const flutuar = Math.sin(frame / 42) * 0.7; // período ~8.8s a 30fps — lento, não compete com o movimento de câmera
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `perspective(1800px) rotateY(${inclinacaoBase + flutuar}deg) rotateX(${2 - flutuar * 0.6}deg) scale(${escala}) translate(${x}%, ${y}%)`,
      },
    },
    children
  );
}

// Moldura genérica de celular: cantos bem arredondados, borda escura
// fina, sem notch/Dynamic Island nem logotipo nenhum (pedido explícito
// — "moldura genérica, sem logotipos de marcas de celular").
function MolduraCelular({ src, largura = 460, altura = 950 }) {
  return React.createElement(
    'div',
    {
      style: {
        width: largura, height: altura, borderRadius: 54, background: '#141414',
        padding: 12, boxShadow: '0 50px 90px rgba(30,20,10,0.45), 0 10px 25px rgba(30,20,10,0.3)',
      },
    },
    React.createElement('div', { style: { width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: '#000' } },
      // SEM loop:true aqui: o <OffthreadVideo loop> do Remotion exige
      // durationInFrames explícito num <Sequence> (erro só visto
      // rodando: "requires a finite durationInFrames") — mais simples
      // e robusto garantir ANTES (em tour.js, com ffmpeg) que cada
      // clipe copiado pra public/ já tem quadros o bastante pra
      // qualquer cena que o use, nunca precisando repetir aqui.
      React.createElement(OffthreadVideo, { src: resolverSrc(src), style: { width: '100%', height: '100%', objectFit: 'cover' } })
    )
  );
}

// Janela de navegador genérica pro mockup de desktop: barra de topo
// com 3 bolinhas (sem nome de navegador nenhum escrito).
function MolduraDesktop({ src, largura = 920, altura = 575 }) {
  return React.createElement(
    'div',
    {
      style: {
        width: largura, height: altura, borderRadius: 16, background: '#1C1C1C', overflow: 'hidden',
        boxShadow: '0 50px 90px rgba(30,20,10,0.4), 0 10px 25px rgba(30,20,10,0.28)',
      },
    },
    React.createElement('div', { style: { height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: '#2A2A2A' } },
      ['#E5675A', '#E5B85A', '#5AB873'].map((cor, i) => React.createElement('div', { key: i, style: { width: 11, height: 11, borderRadius: '50%', background: cor } }))
    ),
    React.createElement('div', { style: { width: '100%', height: altura - 34, background: '#000' } },
      React.createElement(OffthreadVideo, { src: resolverSrc(src), style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' } })
    )
  );
}

module.exports = {
  EASE_CAMERA, resolverSrc,
  MarcaDagua, FundoBege, SeloTour, LegendaCinetica, VinhetaGrao,
  FechoInstagram, FechoPortfolio, FaixaTecnologias, DestaqueTecnico,
  MascaraCircular, DispositivoFlutuante, MolduraCelular, MolduraDesktop,
};
