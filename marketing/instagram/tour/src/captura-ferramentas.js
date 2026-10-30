// ============================================================
// Ferramentas de captura quadro a quadro (Rodada 4 — Tour do Site).
//
// Por quê quadro a quadro em vez de page.video() do Playwright: o
// gravador padrão reamostra pra um fps fixo DEPOIS (vídeo de baixa
// qualidade, pedido explícito pra evitar) e não dá controle sobre
// rolagem/vídeo embutido sincronizados com o frame exato. Aqui cada
// frame é um screenshot PNG tirado com o DOM num estado conhecido
// (scrollTop/scrollLeft definidos à mão, ou o <video> pausado no
// currentTime exato) — determinístico: rodar 2x gera os MESMOS
// frames, não depende da velocidade da máquina.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG } = require('../../reels/src/ffmpeg-path'); // util puro (sem React/Remotion) — seguro reaproveitar entre pacotes, ver DECISOES.md
const { FPS } = require('./dispositivos');

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Gerador pseudo-aleatório SEMEADO (mulberry32 + hash FNV-1a da
// semente) — a rolagem em arrastos (Rodada 6) varia o tamanho de cada
// arrasto e a duração de cada pausa com "aleatoriedade", mas usar
// `Math.random()` de verdade quebraria a promessa deste arquivo (ver
// comentário do topo): "rodar 2x gera os MESMOS frames". Semeado pelo
// rótulo da cena (dispositivo+nome), a MESMA cena sempre produz a
// MESMA sequência de arrastos/pausas — determinístico de novo, só que
// com variação (não repete o mesmo tamanho toda vez) entre cenas
// diferentes.
function criarRng(semente) {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let estado = h >>> 0;
  return function rng() {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------
// Rolagem "humana e delicada" — Rodada 6, item B. Problema relatado:
// a rolagem passava rápida demais, como um arrasto forçado. Antes,
// `rolarPagina`/`rolarElemento` faziam 1 rolagem CONTÍNUA do início ao
// fim da cena, num nº de quadros fixo (ex.: 60) independente da
// distância real — quanto maior a distância, maior a velocidade de
// pico, sem limite nenhum.
//
// Agora a rolagem é uma SEQUÊNCIA de arrastos curtos (200-380px CSS,
// 0,9-1,5s cada) com pausa entre eles (0,6-1,2s, "pra ler") — nunca 1
// arrasto longo. Dentro de cada arrasto, o perfil de velocidade é um
// TRAPÉZIO com rampas em seno (sobe suave, mantém, desce suave — nunca
// 0 a máximo instantaneamente) em vez da curva cúbica usada antes: a
// cúbica tem pico de velocidade = 3x a velocidade média (rápida demais
// no meio do gesto pra caber nos limites pedidos); o trapézio com
// rampa de 25% em seno tem pico ≈1,22x a média — é isso que permite um
// arrasto de 300px em ~1,1s sem passar de 450px/s no celular.
//
// EASE_TRAPEZIO_K é esse fator pico/média — usado por
// `duracaoParaDistancia` pra calcular, ANTES de rolar, quanto tempo um
// arrasto de X pixels precisa pra nunca passar do limite de velocidade
// — e por `validarVelocidade` (depois) pra provar por código, com o
// scrollY DE VERDADE registrado quadro a quadro, que o limite não foi
// violado (não só confiar na conta teórica).
const FRACAO_RAMPA = 0.25;
const EASE_TRAPEZIO_K = 1 / (1 - 2 * FRACAO_RAMPA + (4 * FRACAO_RAMPA) / Math.PI); // ≈1,222

function easeTrapezioSuave(t, e = FRACAO_RAMPA) {
  const vmax = EASE_TRAPEZIO_K;
  if (t <= e) {
    return vmax * ((2 * e) / Math.PI) * (1 - Math.cos((Math.PI * t) / (2 * e)));
  }
  if (t >= 1 - e) {
    const posAteRampa = vmax * ((2 * e) / Math.PI) + vmax * (1 - 2 * e);
    const tt = t - (1 - e);
    return posAteRampa + vmax * ((2 * e) / Math.PI) * Math.sin((Math.PI * tt) / (2 * e));
  }
  const posAposRampaEntrada = vmax * ((2 * e) / Math.PI);
  return posAposRampaEntrada + vmax * (t - e);
}

// MARGEM_ARREDONDAMENTO: achado rodando a captura de verdade — a
// conta teórica (K*distância/duração = pico) bate perfeita num mundo
// contínuo, mas `scrollTo` só aceita px INTEIRO e cada quadro vira 1
// frame discreto a 30fps; testado numericamente (ver DECISOES.md),
// alguns pares distância/duração reais mediam até 480px/s pra um
// limite de 450 — o arredondamento de posição (±1px) sobre um Δt de
// 1/30s já vale ±30px/s de ruído sozinho. Calcular a duração visando
// 85% do limite real (nunca o limite exato) absorve esse ruído sem
// mudar o limite que de fato importa pro vídeo: a validação abaixo
// continua conferindo contra o limite VERDADEIRO (450/600), não
// contra os 85%.
const MARGEM_ARREDONDAMENTO = 0.85;

// Pausa "pra ler"/"pra assimilar" entre arrastos e depois de toques —
// ponto médio fixo de 0,6-1,2s (pedido explícito), não sorteado;
// 1 constante só, usada em `arrastarCarrossel` e `tocarComIndicador`
// (achado do simplify: estava duplicada, 2 declarações locais do
// mesmo valor com o mesmo comentário).
const PAUSA_S = 0.9;

// Duração (segundos) que um arrasto de `distanciaPx` precisa pra NUNCA
// passar de `velocidadeMaxPxS` de pico, considerando o perfil acima —
// sempre dentro de 0,9-1,5s (pedido explícito). Com os tamanhos de
// arrasto usados aqui (200-380px) e os limites pedidos (≥450px/s), o
// piso de 0,9s nunca deixa a duração MÍNIMA necessária passar de 1,5s
// — não precisa encurtar a distância pra caber.
function duracaoParaDistancia(distanciaPx, velocidadeMaxPxS) {
  const minima = (distanciaPx * EASE_TRAPEZIO_K) / (velocidadeMaxPxS * MARGEM_ARREDONDAMENTO);
  return Math.min(1.5, Math.max(0.9, minima));
}

// Registro GLOBAL de rolagem (posição real por quadro, com rótulo de
// dispositivo/cena) — alimentado por `rolarEmArrastos`/
// `rolarElementoEmArrastos`, consumido por `salvarRelatorioRolagem`
// (chamado pelo CLI de captura ao final) pra gerar o CSV/resumo com o
// pico de velocidade de cada vídeo, pedido explícito da Rodada 6.
const REGISTRO_ROLAGEM = [];

// Falha a geração (lança erro) se o próprio scrollY medido quadro a
// quadro mostrar velocidade acima do limite — prova por código, não
// só pela conta teórica de `duracaoParaDistancia` (que assume o
// browser respeita o scrollTo no quadro exato; aqui confirmamos).
// Tolerância de 5%: arredondamento de px inteiro quadro a quadro pode
// gerar ruído de alguns px/s sem significado nenhum de "rolagem
// brusca".
function validarVelocidade(amostras, velocidadeMaxPxS, rotulo) {
  let pico = 0;
  for (let i = 1; i < amostras.length; i++) {
    const dt = amostras[i].t - amostras[i - 1].t;
    if (dt <= 0) continue;
    const v = Math.abs(amostras[i].pos - amostras[i - 1].pos) / dt;
    if (v > pico) pico = v;
  }
  if (pico > velocidadeMaxPxS * 1.05) {
    throw new Error(`Rolagem de "${rotulo}" passou do limite: pico medido ${pico.toFixed(0)}px/s > ${velocidadeMaxPxS}px/s permitido.`);
  }
  return pico;
}

// Contador de frames compartilhado entre as funções de uma cena —
// objeto (não número) só pra passar por referência sem o chamador
// precisar reatribuir a variável a cada chamada.
function novoContador() {
  return { n: 0 };
}

function caminhoFrame(dir, n) {
  return path.join(dir, `f${String(n).padStart(5, '0')}.png`);
}

async function tirarFoto(page, dir, contador) {
  const arquivo = caminhoFrame(dir, contador.n);
  await page.screenshot({ path: arquivo });
  contador.n++;
  return arquivo;
}

// "Hold" estático: 1 screenshot real + cópias de arquivo pras demais —
// muito mais rápido que repetir page.screenshot() quando a tela não
// está mudando (abertura, fechos, pausas de leitura).
async function manterFoto(page, dir, contador, quadros) {
  if (quadros <= 0) return;
  const base = await tirarFoto(page, dir, contador);
  for (let i = 1; i < quadros; i++) {
    fs.copyFileSync(base, caminhoFrame(dir, contador.n));
    contador.n++;
  }
}

// Mesmo "hold", mas registrando a posição constante no log de rolagem
// (pausas "pra ler" DENTRO de um gesto de rolagem contam como
// velocidade zero no relatório, não ficam de fora dele).
async function manterFotoComRegistro(page, dir, contador, quadros, posicaoAtual, { rotulo, dispositivo, cena, tempoBaseS, fps }) {
  await manterFoto(page, dir, contador, quadros);
  for (let i = 1; i <= quadros; i++) {
    REGISTRO_ROLAGEM.push({ dispositivo, cena, rotulo, t: tempoBaseS + i / fps, pos: posicaoAtual });
  }
}

// 1 arrasto (perfil trapézio-seno) de `de` a `para`, numa propriedade
// qualquer do DOM (scrollY da janela ou scrollLeft de um elemento) via
// `aplicar(valor)` — o laço de frames que `rolarEmArrastos()` (janela)
// e `arrastarCarrossel()` (elemento) chamam cada um dentro do seu
// próprio laço de arrastos, em vez de duplicar o cálculo de easing.
async function arrasto(page, dir, contador, { de, para, duracaoS, fps, aplicar, registrar }) {
  const quadros = Math.max(1, Math.round(duracaoS * fps));
  for (let i = 1; i <= quadros; i++) {
    const t = i / quadros;
    const prog = easeTrapezioSuave(t);
    const valor = Math.round(de + (para - de) * prog);
    await aplicar(valor, t, i, quadros);
    await tirarFoto(page, dir, contador);
    if (registrar) registrar(valor, i / fps);
  }
  return { quadros };
}

// Rola a JANELA (scrollY) de `de` a `para` em arrastos curtos com
// pausa entre eles — nunca 1 rolagem contínua e longa. `velocidadeMaxPxS`
// é o limite medido/validado por código (450 celular, 600 desktop,
// pedido explícito); `dispositivo`/`cena` só rotulam o relatório.
async function rolarEmArrastos(page, dir, contador, { de, para, velocidadeMaxPxS, dispositivo, cena, fps = FPS, distanciaMaximaPx = 400 }) {
  const rotulo = `${dispositivo}/${cena}`;
  const rng = criarRng(rotulo); // determinístico: mesma cena, mesma sequência de arrastos/pausas sempre
  // Teto de distância (achado capturando de verdade — Rodada 6): a
  // Home tem quase 13.000px de altura no mobile (hero + várias
  // vitrines/carrosséis empilhados); um alvo em % da altura total da
  // página (ex. "22% da altura") ou um elemento que por acaso está
  // longe vira uma rolagem de MILHARES de px — mesmo delicada, uma
  // cena só comia 34s (quase o vídeo inteiro). 400 (depois de 2
  // ajustes — 900 dava 65s, 550 ainda dava ~49,5s): 400px cabe quase
  // sempre num arrasto só, o suficiente pras 6 cenas com rolagem do
  // tour-instagram ficarem dentro do teto de 45s pedido, com alguma
  // margem (ver DECISOES.md pela conta). Nenhum arrasto
  // nesta função anda mais que `distanciaMaximaPx` do ponto de
  // partida, mesmo que o alvo pedido esteja mais longe — "delicado"
  // também significa não insistir em alcançar qualquer distância a
  // qualquer custo de tempo.
  const direcaoBruta = Math.sign(para - de) || 1;
  const distanciaPedida = Math.abs(para - de);
  const alvo = de + direcaoBruta * Math.min(distanciaPedida, distanciaMaximaPx);

  const direcao = direcaoBruta;
  let atual = de;
  let tempoAcumuladoS = 0;
  const inicioIndice = REGISTRO_ROLAGEM.length;

  while (Math.abs(alvo - atual) > 1) {
    const restante = Math.abs(alvo - atual);
    const tamanhoArrasto = Math.min(restante, 200 + rng() * 180); // 200-380px, ou o que faltar se for menos
    const proximo = atual + direcao * tamanhoArrasto;
    const duracaoS = duracaoParaDistancia(tamanhoArrasto, velocidadeMaxPxS);

    const { quadros } = await arrasto(page, dir, contador, {
      de: atual, para: proximo, duracaoS, fps,
      aplicar: (y) => page.evaluate((y) => window.scrollTo(0, y), y),
      registrar: (valor, tQuadro) => REGISTRO_ROLAGEM.push({ dispositivo, cena, rotulo, t: tempoAcumuladoS + tQuadro, pos: valor }),
    });
    tempoAcumuladoS += quadros / fps;
    atual = proximo;

    if (Math.abs(alvo - atual) > 1) {
      const pausaS = 0.6 + rng() * 0.6;
      const quadrosPausa = Math.max(1, Math.round(pausaS * fps));
      await manterFotoComRegistro(page, dir, contador, quadrosPausa, atual, { rotulo, dispositivo, cena, tempoBaseS: tempoAcumuladoS, fps });
      tempoAcumuladoS += quadrosPausa / fps;
    }
  }

  return validarVelocidade(REGISTRO_ROLAGEM.slice(inicioIndice), velocidadeMaxPxS, rotulo);
}

// Mesma ideia, rolando um ELEMENTO horizontal (carrossel) em vez da
// janela — 1 arrasto só (0,7-1,0s, pedido explícito para carrosséis,
// mais curto que o de página inteira), com o indicador de toque
// acompanhando o dedo: aparece nos primeiros ~15% do gesto, segue o
// `x` em tempo real, some nos últimos ~15%. Pausa (0,6-1,2s) depois.
// Acha, dos elementos que casam com `seletor`, o PRIMEIRO que está
// visível na tela e rola de verdade (scrollWidth > clientWidth) —
// mesmo critério que `cenas-mobile.js` usava antes de decidir SE
// chamava esta função, só que agora fica dentro dela: achado do
// code-review — antes, o chamador conferia a visibilidade com
// `els.find(...)` mas esta função reconsultava com `querySelector`
// simples (sempre o 1º elemento do DOM, não necessariamente o
// visível) — se o 1º `.carrossel-viewport` da página não fosse o
// visível, o arrasto mexia num elemento fora da tela, sem mudança
// nenhuma visível no vídeo. Devolve `null` se nenhum estiver visível
// (chamador decide o que fazer — manter o quadro, por exemplo).
async function arrastarCarrossel(page, seletor, dir, contador, { distanciaPx, velocidadeMaxPxS, dispositivo, cena, fps = FPS }) {
  const achado = await page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel));
    const idx = els.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0 && el.scrollWidth > el.clientWidth + 20;
    });
    if (idx === -1) return null;
    const el = els[idx];
    const r = el.getBoundingClientRect();
    return { idx, de: el.scrollLeft, y: r.top + r.height / 2 };
  }, seletor);
  if (!achado) return null;
  const { idx, de, y } = achado;

  const rotulo = `${dispositivo}/${cena}-carrossel`;
  const inicioIndice = REGISTRO_ROLAGEM.length;
  const para = de + distanciaPx;
  const duracaoS = Math.min(1.0, Math.max(0.7, duracaoParaDistancia(Math.abs(distanciaPx), velocidadeMaxPxS)));
  let tempoAcumuladoS = 0;

  const xInicial = page.viewportSize().width * 0.8; // sem round-trip ao browser — já temos o viewport local (achado de eficiência)
  const { quadros } = await arrasto(page, dir, contador, {
    de, para, duracaoS, fps,
    aplicar: async (valor, t) => {
      // mesmo `idx` do elemento achado acima — nunca o "1º que casa
      // com o seletor" de novo, sempre o MESMO elemento visível.
      await page.evaluate(([sel, i, x]) => { document.querySelectorAll(sel)[i].scrollLeft = x; }, [seletor, idx, valor]);
      const opacidade = t < 0.15 ? t / 0.15 : (t > 0.85 ? (1 - t) / 0.15 : 1);
      const xDedo = xInicial - (valor - de);
      await moverIndicadorToque(page, xDedo, y, 0.9, opacidade);
    },
    registrar: (valor, tQuadro) => REGISTRO_ROLAGEM.push({ dispositivo, cena, rotulo, t: tempoAcumuladoS + tQuadro, pos: valor }),
  });
  tempoAcumuladoS += quadros / fps;
  await moverIndicadorToque(page, xInicial, y, 0, 0);

  await manterFotoComRegistro(page, dir, contador, Math.max(1, Math.round(PAUSA_S * fps)), para, { rotulo, dispositivo, cena, tempoBaseS: tempoAcumuladoS, fps });

  return validarVelocidade(REGISTRO_ROLAGEM.slice(inicioIndice), velocidadeMaxPxS, rotulo);
}

function limparRegistroRolagem() {
  REGISTRO_ROLAGEM.length = 0;
}

// CSV (1 linha por quadro medido) + resumo (pico de velocidade/
// aceleração por rótulo) — pedido explícito da Rodada 6, item B1.
function salvarRelatorioRolagem(caminhoCsv, caminhoResumo) {
  const linhasCsv = ['dispositivo,cena,t_s,posicao_px,velocidade_px_s,aceleracao_px_s2'];
  // 1 passada só pra agrupar por rótulo (achado do simplify: a versão
  // anterior varria REGISTRO_ROLAGEM inteiro 1x por rótulo distinto —
  // O(rótulos × amostras) à toa).
  const porRotulo = new Map();
  for (const a of REGISTRO_ROLAGEM) {
    if (!porRotulo.has(a.rotulo)) porRotulo.set(a.rotulo, []);
    porRotulo.get(a.rotulo).push(a);
  }

  const resumo = [];
  for (const [rotulo, amostras] of porRotulo) {
    let picoV = 0;
    let picoA = 0;
    let vAnterior = 0;
    for (let i = 0; i < amostras.length; i++) {
      const a = amostras[i];
      let v = 0;
      let acel = 0;
      if (i > 0) {
        const dt = a.t - amostras[i - 1].t;
        if (dt > 0) {
          v = (a.pos - amostras[i - 1].pos) / dt;
          acel = (v - vAnterior) / dt;
        }
      }
      picoV = Math.max(picoV, Math.abs(v));
      picoA = Math.max(picoA, Math.abs(acel));
      vAnterior = v;
      linhasCsv.push(`${a.dispositivo},${a.cena},${a.t.toFixed(3)},${a.pos},${v.toFixed(1)},${acel.toFixed(1)}`);
    }
    resumo.push(`${rotulo}: pico ${picoV.toFixed(0)}px/s, aceleração pico ${picoA.toFixed(0)}px/s² (${amostras.length} quadros medidos)`);
  }

  fs.mkdirSync(path.dirname(caminhoCsv), { recursive: true });
  fs.writeFileSync(caminhoCsv, linhasCsv.join('\n') + '\n', 'utf8');
  fs.writeFileSync(caminhoResumo, resumo.join('\n') + '\n', 'utf8');
  return resumo;
}

// ---- Indicador de toque: um círculo que aparece, "pisca" no ponto
// tocado e some — injetado como DOM real (aparece no screenshot,
// diferente de desenhar por cima da imagem depois). ----
async function instalarIndicadorToque(page) {
  await page.evaluate(() => {
    if (document.getElementById('__tourToque')) return;
    const el = document.createElement('div');
    el.id = '__tourToque';
    Object.assign(el.style, {
      position: 'fixed', width: '72px', height: '72px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.0)', border: '4px solid rgba(255,255,255,0.95)',
      boxShadow: '0 0 0 6px rgba(201,138,74,0.35)',
      pointerEvents: 'none', zIndex: '2147483647', left: '0px', top: '0px',
      transform: 'translate(-50%,-50%) scale(0)', opacity: '0', transition: 'none',
    });
    document.documentElement.appendChild(el);
  });
}

async function moverIndicadorToque(page, x, y, escala, opacidade) {
  await page.evaluate(([x, y, escala, opacidade]) => {
    const el = document.getElementById('__tourToque');
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%,-50%) scale(${escala})`;
    el.style.opacity = String(opacidade);
  }, [x, y, escala, opacidade]);
}

// Toque "real": usa page.touchscreen (dispara touchstart/end de
// verdade no Chromium, equivalente ao que um device físico manda —
// só funciona em contexto com hasTouch:true, ou seja, device mobile)
// — e, em paralelo, anima o indicador visual por alguns frames pra
// quem está vendo o vídeo entender que ali foi um toque. Pressão de
// ~150ms (pedido explícito, Rodada 6): quadrosAntes/quadrosDepois a
// 30fps somam ~150ms de "aperto" visível (o pico de escala, no meio).
// Pausa de 0,6-1,2s antes e depois do gesto (pedido explícito) — sem
// isso, os toques ficavam "em cima" da cena, sem tempo pra assimilar.
async function tocarComIndicador(page, dir, contador, { x, y, quadrosAntes = 3, quadrosPressao, quadrosDepois = 3, pausaAntes = true, pausaDepois = true, fps = FPS }) {
  const pressao = quadrosPressao != null ? quadrosPressao : Math.max(1, Math.round(0.15 * fps)); // ~150ms "pressionado", pedido explícito
  if (pausaAntes) await manterFoto(page, dir, contador, Math.round(PAUSA_S * fps));
  await moverIndicadorToque(page, x, y, 0.4, 0);
  for (let i = 1; i <= quadrosAntes; i++) {
    const t = i / quadrosAntes;
    await moverIndicadorToque(page, x, y, 0.4 + 0.6 * t, t);
    await tirarFoto(page, dir, contador);
  }
  await page.touchscreen.tap(x, y);
  // Mantém o círculo "pressionado" (escala cheia, opacidade cheia) por
  // ~150ms antes de começar a soltar — antes disso, o toque e o
  // "soltar" aconteciam praticamente no mesmo instante, rápido demais
  // pra ler como um toque real.
  for (let i = 0; i < pressao; i++) {
    await tirarFoto(page, dir, contador);
  }
  for (let i = 1; i <= quadrosDepois; i++) {
    const t = i / quadrosDepois;
    await moverIndicadorToque(page, x, y, 1 + t * 0.5, 1 - t);
    await tirarFoto(page, dir, contador);
  }
  await moverIndicadorToque(page, x, y, 0, 0);
  if (pausaDepois) await manterFoto(page, dir, contador, Math.round(PAUSA_S * fps));
}

// Espera um <video> tocar e captura `quadros` frames reais dele, no
// RITMO do próprio vídeo (seta currentTime e espera chegar lá) — não
// no relógio de parede: roda igual numa máquina rápida ou lenta.
async function capturarVideo(page, seletorVideo, dir, contador, { quadros, fps }) {
  await page.evaluate((sel) => {
    const v = document.querySelector(sel);
    v.currentTime = 0;
    v.play().catch(() => {}); // alguns navegadores rejeitam play() sem gesto; aqui já houve um toque real antes (ver cena)
  }, seletorVideo);
  for (let i = 0; i < quadros; i++) {
    const alvo = i / fps;
    await page.waitForFunction(
      ([sel, alvo]) => {
        const v = document.querySelector(sel);
        return v && (v.currentTime >= alvo || v.ended);
      },
      [seletorVideo, alvo],
      { timeout: 4000 }
    ).catch(() => {}); // vídeo mais curto que o pedido: mantém o que já tem, a cena que chamou decide se segura o último quadro
    await tirarFoto(page, dir, contador);
  }
}

// Espera um campo de texto deixar de estar vazio (preenchimento
// assíncrono, ex.: ViaCEP) — usado em vez de esperar um tempo fixo,
// que seria mais lento OU falharia numa rede mais lenta que o previsto.
async function esperarCampoPreenchido(page, seletor, { timeout = 5000 } = {}) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && el.value && el.value.trim().length > 0;
    },
    seletor,
    { timeout }
  );
}

// Codifica a sequência de PNGs de uma cena num .mp4 (H.264, perto de
// lossless — é material de trabalho pro Remotion, não o entregável
// final; o passo de ffmpeg final de qualidade/perfil roda só 1x, no
// vídeo COMPOSTO, em tour.js) e apaga os PNGs (controla o uso de disco
// — ver nota do disco C: no README).
function codificarCena(dir, destinoMp4, fps) {
  fs.mkdirSync(path.dirname(destinoMp4), { recursive: true });
  execFileSync(FFMPEG, [
    '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.png'),
    // "pad" (não "scale"): o libx264 exige largura/altura PARES — o
    // iPhone 15 a dpr 3 dá 393*3=1179 (ÍMPAR) — descoberto só rodando
    // (ffmpeg falhava com "width not divisible by 2"). Preenche 1px
    // transparente/preto em vez de redimensionar, pra não distorcer
    // nem perder 1px real de conteúdo.
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    destinoMp4,
  ], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
}

// Fábrica da função "cena(nome, fn)" usada por cenas-mobile.js e
// cenas-desktop.js — era duplicada quase igual nos 2 arquivos (achado
// do code-review). Cada chamada: cria a pasta de frames, roda `fn`
// com um contador novo, codifica em .mp4, registra no manifesto e
// loga — `tag` só muda o prefixo do log ("[mobile]"/"[desktop]").
function criarFabricaCena(tag, dirBase, manifest) {
  return async function cena(nome, fn) {
    const dir = path.join(dirBase, nome);
    fs.mkdirSync(dir, { recursive: true });
    const c = novoContador();
    await fn(dir, c);
    const clipe = path.join(dirBase, `${nome}.mp4`);
    codificarCena(dir, clipe, FPS);
    manifest[nome] = { arquivo: clipe, quadros: c.n, fps: FPS };
    console.log(`  [${tag}] ${nome}: ${c.n} quadros (${(c.n / FPS).toFixed(1)}s) -> ${clipe}`);
  };
}

module.exports = {
  easeInOutCubic, easeOutExpo, easeTrapezioSuave, novoContador,
  tirarFoto, manterFoto, manterFotoComRegistro,
  rolarEmArrastos, arrastarCarrossel,
  limparRegistroRolagem, salvarRelatorioRolagem, duracaoParaDistancia, EASE_TRAPEZIO_K,
  instalarIndicadorToque, moverIndicadorToque, tocarComIndicador,
  capturarVideo, esperarCampoPreenchido, codificarCena, criarFabricaCena,
};
