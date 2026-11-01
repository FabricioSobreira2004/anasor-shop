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
// Geometria do celular na Versão A — ACHADO NA RODADA 5 (item 1a): a
// legenda cinética (posição fixa) podia ficar coberta pelo celular
// quando o zoom/panorâmica da câmera crescia demais. Em vez de ajustar
// na tentativa-e-erro, calculei os limites aqui, 1 vez, e tanto o
// componente quanto o script de validação (src/validar-geometria.js)
// importam os MESMOS números — nunca podem desalinhar.
//
// Canvas 1080×1920, zonas seguras: nada importante nos 250px do topo
// nem nos 420px de baixo (útil só entre y:250 e y:1500). Os números
// abaixo foram ajustados RODANDO `src/validar-geometria.js` (não só
// na conta de cabeça — a 1ª tentativa, TOPO:280, parecia bater na
// conta mas o script achou 246px de topo em algumas cenas, abaixo dos
// 250 — margem de segurança insuficiente) até toda cena passar com
// folga. Esse script é a fonte de verdade — rode ele de novo depois
// de mexer em qualquer número aqui.
// Geometria AUMENTADA (Rodada 9, achado do Fabrício: "celular pequeno,
// inclinado, metade de baixo da tela vazia"). Era 400×760 a partir de
// y:300 — deixava quase 900px vazios abaixo do aparelho. Novos
// números CALCULADOS pela fórmula de validar-geometria.js (não
// chutados): zoom máx reduzido pra 1,015 (quase sem zoom-in) e
// translate máx pra 1% — com ALTURA 960, o pior caso do celular vai
// até y≈1245; CAPTION_TOP 1270 deixa 20px de gap + ~145px pra legenda
// de até 2 linhas em 42px (ver alturaMaximaLegendaEstimada, também
// atualizada pro tamanho real da legenda nova) — fundo da legenda em
// ~1415, ainda dentro da zona segura (<1500). Rode
// `src/validar-geometria.js` de novo depois de mexer aqui — é a fonte
// de verdade, não a conta de cabeça.
const LAYOUT_CELULAR = {
  TOPO: 268,
  LARGURA: 500,
  ALTURA: 960,
  CAMERA_ESCALA_MIN: 0.98,
  CAMERA_ESCALA_MAX: 1.015,
  CAMERA_TRANSLATE_MAX_PCT: 1.0,
  CAPTION_TOP: 1270,
};
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------------------------------------------------------------
// Marca d'água — mesma técnica de reels/src/componentes.js
// (MarcaDagua): recebe a logo JÁ pronta (data URI com fundo removido
// por luminância, calculada 1x em tour.js, em Node — igual reel.js).
// ---------------------------------------------------------------
// bottom:460 por padrão (não 56) — ACHADO NA RODADA 5 (item 1a): o
// padrão antigo deixava a marca d'água bem DENTRO dos 420px proibidos
// de baixo (a área da interface do Instagram) em TourMobile.js, que
// nunca passava um `bottom` próprio. TourDesktop.js sempre passa o
// seu (48/90), então só o padrão precisava mudar.
function MarcaDagua({ src, tamanho = 130, right = 56, bottom = 460 }) {
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
// top:LAYOUT_CELULAR.CAPTION_TOP (não mais `bottom`) — ACHADO NA
// RODADA 5 (item 1a): com `bottom` fixo, a legenda cresce PRA CIMA
// quando o texto quebra em mais de 1 linha — sem controle, podia
// crescer até alcançar o celular. Ancorada num `top` fixo, ABAIXO do
// pior caso do celular (ver LAYOUT_CELULAR), ela só cresce pra BAIXO,
// sempre numa faixa que já conferimos por código que nunca encosta no
// celular nem invade os 420px de baixo (src/validar-geometria.js).
// Fundo do texto a 78% de opacidade (não 60%) — ACHADO: a 60%, o
// contraste branco-sobre-fundo caía pra ~3,8:1 no pior caso (atrás de
// algo bem claro), ainda AA pra texto grande mas sem folga; 78% deixa
// margem confortável sem ficar "chapado" demais.
function LegendaCinetica({ texto, inicioFrame, duracao = 70, top = LAYOUT_CELULAR.CAPTION_TOP, cor = '#FFF', fonte = 'Jost, sans-serif', tamanho = 62 }) {
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
        position: 'absolute', left: 60, right: 60, top, zIndex: 15,
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
          background: 'rgba(62,46,34,0.78)', padding: '8px 22px', borderRadius: 14,
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

// Ícones de linha (Lucide, mesmo traço do site/Reels) só pra faixa de
// confiança do fecho rico — paths copiados de reels/src/icones.js
// (arquivo puro, sem React/Remotion — mas copiado, não importado,
// mesma razão de sempre: evitar cruzar pacotes, ver DECISOES.md).
const ICONE_CAMINHO = {
  truck: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2 M15 18H9 M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14',
  'shield-check': 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M9 12l2 2 4-4',
};
function IconeLinha({ nome, tamanho = 28, cor = 'currentColor' }) {
  return React.createElement('svg', {
    width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none', stroke: cor, strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  }, React.createElement('path', { d: ICONE_CAMINHO[nome] }));
}

// Retrato da Anasor em círculo com aro dourado e leve flutuação —
// usado nos 2 fechos ricos (Rodada 5, item 2). `tamanho` em px.
function RetratoAnasor({ src, tamanho = 260, cores }) {
  const frame = useCurrentFrame();
  const flutuar = Math.sin(frame / 50) * 6; // período ~10,5s — bem lento, só um "respirar"
  return React.createElement(
    'div',
    {
      style: {
        width: tamanho, height: tamanho, borderRadius: '50%', overflow: 'hidden',
        border: `5px solid ${cores.destaque}`,
        boxShadow: `0 0 0 3px rgba(251,246,239,0.9), 0 18px 40px rgba(30,20,10,0.35)`,
        transform: `translateY(${flutuar}px)`,
        flexShrink: 0,
      },
    },
    React.createElement(Img, {
      src: resolverSrc(src),
      // 50% 52% (não 50% 50%) — ACHADO NO 1º RENDER: a foto tem o
      // rosto da Anasor um pouco abaixo do centro vertical (pratos
      // decorativos acima dela ocupam a metade de cima) — centralizar
      // "no meio" deixava mais parede/prato que rosto dentro do
      // círculo. 52% desloca a janela visível pra baixo, enquadrando
      // o rosto melhor (acima disso corta o queixo).
      style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 52%' },
    })
  );
}

// Faixa de confiança compacta (frete grátis · compra segura) — só
// fatos reais do site, sem Pix nem prazo (pedido explícito).
function FaixaConfiancaMini({ entradaFrame, cores, corTexto }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const itens = [['truck', 'Frete grátis'], ['shield-check', 'Compra segura']];
  return React.createElement(
    'div',
    { style: { display: 'flex', gap: 44 } },
    itens.map(([icone, texto], i) => {
      const t = frame - entradaFrame - i * 5;
      const pop = spring({ frame: t, fps, config: { damping: 16, stiffness: 150 } });
      if (t < -1) return null;
      return React.createElement('div', {
        key: icone, style: { display: 'flex', alignItems: 'center', gap: 10, opacity: pop, transform: `translateY(${(1 - pop) * 14}px)` },
      },
        React.createElement(IconeLinha, { nome: icone, tamanho: 26, cor: corTexto }),
        React.createElement('span', { style: { fontFamily: 'Jost, sans-serif', fontSize: 24, color: corTexto } }, texto)
      );
    })
  );
}

// ---------------------------------------------------------------
// Fecho Versão A (RICO — Rodada 5, item 2): retrato da Anasor,
// "Peça única, feita à mão", botão gummy "pressionado", @handle
// GRANDE com coração, faixa de confiança real. Tudo dentro da área
// segura (nada nos 250px do topo/420px de baixo) — orçamento vertical
// conferido à mão (retrato 220 + vãos + botão + handle + faixa ≈
// 760px, cabe folgado nos ~1250px úteis entre as 2 zonas proibidas).
// ---------------------------------------------------------------
// Cascata de entrada (retrato → tagline → botão → handle → faixa) —
// cada elemento com seu próprio spring, ~12 quadros atrás do anterior,
// pra ficar com cara de "animação de entrada" de verdade (pedido
// explícito: 2,5-3,5s), não um fade só no grupo inteiro.
function popCascata(frame, entradaFrame, indice, fps) {
  return spring({ frame: frame - entradaFrame - indice * 12, fps, config: { damping: 15, stiffness: 150 } });
}

function FechoInstagram({ entradaFrame, cores, retratoUri }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pRetrato = popCascata(frame, entradaFrame, 0, fps);
  const pTagline = popCascata(frame, entradaFrame, 1, fps);
  const pBotao = popCascata(frame, entradaFrame, 2, fps);
  const pHandle = popCascata(frame, entradaFrame, 3, fps);
  // "Aperto" do botão gummy, pedido explícito — mesma linguagem do
  // :active do site (sombra "engolida") — dispara 1x, logo depois do
  // botão terminar de aparecer (entrada em cascata: ~4*12=48 quadros).
  const apertoFrame = entradaFrame + 50;
  const apertando = frame >= apertoFrame && frame < apertoFrame + 14;
  const af = apertando ? interpolate(frame, [apertoFrame, apertoFrame + 7, apertoFrame + 14], [0, 1, 0]) : 0;
  const sombraBotao = 10 - af * 10;

  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26 } },
    React.createElement('div', { style: { opacity: pRetrato, transform: `translateY(${(1 - pRetrato) * 24}px)` } },
      React.createElement(RetratoAnasor, { src: retratoUri, tamanho: 220, cores })),
    React.createElement('div', {
      style: {
        opacity: pTagline, transform: `translateY(${(1 - pTagline) * 20}px)`,
        fontFamily: 'Jost, sans-serif', fontSize: 26, color: cores.texto, display: 'flex', alignItems: 'center', gap: 10,
      },
    }, 'Peça única, feita à mão', React.createElement(Coracao, { tamanho: 22, cor: cores.destaque })),
    React.createElement('div', {
      style: {
        opacity: pBotao, transform: `translateY(${(1 - pBotao) * 20 + af * 5}px)`,
        padding: '24px 58px', borderRadius: 999, background: cores.destaque, color: '#FFF',
        fontFamily: 'Jost, sans-serif', fontWeight: 500, fontSize: 38,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.28), 0 ${sombraBotao}px 0 ${cores.destaqueEscuro}`,
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0) 55%)',
      },
    }, 'Link na bio'),
    React.createElement('div', {
      style: {
        opacity: pHandle, transform: `translateY(${(1 - pHandle) * 20}px)`,
        fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 48, color: cores.texto, display: 'flex', alignItems: 'center', gap: 14,
      },
    }, '@anasor.ceramica', React.createElement(Coracao, { tamanho: 36, cor: cores.destaque })),
    React.createElement(FaixaConfiancaMini, { entradaFrame: entradaFrame + 48, cores, corTexto: cores.texto })
  );
}

// ---------------------------------------------------------------
// Fecho Versão B (RICO, variante HORIZONTAL — Rodada 5, item 2):
// retrato à esquerda, texto à direita (endereço do site, tagline,
// faixa de confiança, crédito do desenvolvedor) — paisagem, não é
// Instagram (sem botão "Link na bio"/@handle).
// ---------------------------------------------------------------
function FechoPortfolio({ entradaFrame, cores, retratoUri }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - entradaFrame;
  if (t < -1) return null;
  const pop = spring({ frame: t, fps, config: { damping: 15, stiffness: 150 } });
  return React.createElement(
    'div',
    { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70, opacity: pop, transform: `translateY(${(1 - pop) * 20}px)` } },
    React.createElement(RetratoAnasor, { src: retratoUri, tamanho: 260, cores }),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' } },
      React.createElement('div', { style: { fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 56, color: cores.texto } }, 'anasorsobreira.com.br'),
      React.createElement('div', { style: { fontFamily: 'Jost, sans-serif', fontSize: 26, color: cores.texto, display: 'flex', alignItems: 'center', gap: 10 } },
        'Peça única, feita à mão', React.createElement(Coracao, { tamanho: 22, cor: cores.destaque })),
      React.createElement(FaixaConfiancaMini, { entradaFrame: entradaFrame + 20, cores, corTexto: cores.texto }),
      React.createElement('div', { style: { fontFamily: 'Jost, sans-serif', fontSize: 24, color: cores.secundaria, letterSpacing: '0.04em', marginTop: 8 } }, 'Desenvolvido por FabricioSobreira')
    )
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
// `ancoragem` (opcional, { top, largura }): quando presente, o grupo
// NÃO fica mais centralizado no canvas inteiro (zoom/panorâmica
// girando em torno do CENTRO DO CANVAS, difícil de prever) — vira uma
// caixa do tamanho do próprio conteúdo, ancorada num `top` fixo, que
// escala/gira em torno do PRÓPRIO centro. É isso que torna a
// geometria previsível o bastante pra provar por código que o celular
// nunca alcança a legenda (ver LAYOUT_CELULAR acima) — a câmera
// também é limitada aos mesmos `CAMERA_ESCALA_*`/`CAMERA_TRANSLATE_*`
// usados na conta, nunca ultrapassando o que foi validado. Sem
// `ancoragem`, mantém o comportamento antigo (usado pela Versão B,
// sem esse bug relatado).
function DispositivoFlutuante({ children, inicioFrame, duracaoFrames, de, para, inclinacaoBase = 6, ancoragem }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicioFrame, inicioFrame + duracaoFrames], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_CAMERA,
  });
  let escala = de.escala + (para.escala - de.escala) * t;
  let x = de.x + (para.x - de.x) * t;
  let y = de.y + (para.y - de.y) * t;
  if (ancoragem) {
    escala = clamp(escala, LAYOUT_CELULAR.CAMERA_ESCALA_MIN, LAYOUT_CELULAR.CAMERA_ESCALA_MAX);
    x = clamp(x, -LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT, LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT);
    y = clamp(y, -LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT, LAYOUT_CELULAR.CAMERA_TRANSLATE_MAX_PCT);
  }
  const flutuar = Math.sin(frame / 42) * 0.7; // período ~8.8s a 30fps — lento, não compete com o movimento de câmera
  const transformStyle = `perspective(1800px) rotateY(${inclinacaoBase + flutuar}deg) rotateX(${2 - flutuar * 0.6}deg) scale(${escala}) translate(${x}%, ${y}%)`;
  if (ancoragem) {
    return React.createElement(
      'div',
      { style: { position: 'absolute', left: '50%', top: ancoragem.top, width: ancoragem.largura, transform: `translateX(-50%) ${transformStyle}` } },
      children
    );
  }
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: transformStyle,
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
  EASE_CAMERA, resolverSrc, LAYOUT_CELULAR,
  MarcaDagua, FundoBege, SeloTour, LegendaCinetica, VinhetaGrao,
  FechoInstagram, FechoPortfolio, FaixaTecnologias, DestaqueTecnico,
  MascaraCircular, DispositivoFlutuante, MolduraCelular, MolduraDesktop,
};
