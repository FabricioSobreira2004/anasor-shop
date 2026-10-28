#!/usr/bin/env node
// ============================================================
// Motor de Reels — CLI orientado a dados.
//
//   npm run reel -- --nome r1-caneca-surpresa-gatinho
//   npm run reel -- --id 8 --template apresentacao
//   npm run reel -- --ids 39,43,38 --template colecao
//
// --nome usa um roteiro PRONTO de src/roteiros.js (os 6 desta rodada).
// --id/--template monta um roteiro PADRÃO na hora (abertura + vídeo +
// foto + CTA) pra qualquer peça disponível de js/produtos.js — é o
// "comando do tipo npm run reel -- --id 8 --template apresentacao"
// pedido na rodada.
//
// Saída: E:\projetos\site-mae\reels\<nome>.mp4 (1080x1920, 30fps,
// H.264 High, yuv420p, faststart, sem áudio) + os quadros de
// conferência em reels\_conferencia\<nome>-N.png.
// ============================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { chromium } = require('playwright');
const { FFMPEG, FFPROBE } = require('./src/ffmpeg-path');
const { ROTEIROS, montarCenas, duracaoTotal, FPS } = require('./src/roteiros');

const RAIZ = path.resolve(__dirname, '..', '..', '..'); // anasor-shop
const PUBLIC_DIR = path.join(__dirname, 'public'); // staticFile() do Remotion — regenerado a cada rodada
const SAIDA = path.resolve(RAIZ, '..', 'site-mae', 'reels');
const SAIDA_CONFERENCIA = path.join(SAIDA, '_conferencia');

// ---- CLI ----
function lerArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const chave = argv[i].slice(2);
      const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[chave] = valor;
    }
  }
  return args;
}

// ---- Dados do site (mesma técnica de marketing/instagram/gerar-posts.js) ----
function carregarProdutos() {
  const src = fs.readFileSync(path.join(RAIZ, 'js', 'produtos.js'), 'utf8');
  return new Function(`${src}; return produtos;`)();
}

function lerVariaveisCss() {
  const css = fs.readFileSync(path.join(RAIZ, 'css', 'style.css'), 'utf8');
  const pegar = (nome) => {
    const m = css.match(new RegExp(`--${nome}:\\s*((?:url\\(|#)[^;]+);`));
    if (!m) throw new Error(`Variável --${nome} não encontrada em style.css`);
    return m[1].trim();
  };
  return {
    fundo: pegar('cor-fundo'),
    texto: pegar('cor-texto'),
    destaque: pegar('cor-destaque'),
    destaqueEscuro: pegar('cor-destaque-escuro'),
    secundaria: pegar('cor-secundaria'),
  };
}

// Mesma prioridade/cores de js/main.js (SELOS_PECA) e de
// marketing/instagram/gerar-posts.js — ver comentário lá sobre por que
// é relido aqui em vez de importado (main.js é script de navegador).
function montarSelos(v) {
  return {
    'mais-vendido': { label: 'Mais Vendido', bg: '#D9B06A', cor: v.texto },
    assinada: { label: 'Peça Assinada', bg: v.destaque, cor: '#FFF' },
    queridinho: { label: 'Queridinha do Ateliê', bg: v.fundo, cor: v.destaque, contorno: v.destaque },
    novidade: { label: 'Novidade', bg: v.secundaria, cor: '#FFF' },
  };
}
function seloDoProduto(produto, v) {
  const selos = montarSelos(v);
  const presentes = new Set([].concat(produto.selo || []));
  const chave = Object.keys(selos).find((k) => presentes.has(k));
  if (chave) return selos[chave];
  return { label: 'Peça única, feita à mão', bg: 'rgba(251,246,239,0.95)', cor: v.texto, coracao: true };
}

const nomeCurto = (nome) => nome.split(' — ')[0];

// ---- Assets: copia só o que esta renderização precisa pra public/
// (staticFile do Remotion exige um publicDir — copiar em vez de
// apontar pra RAIZ inteira evita expor o repo inteiro ao bundler e
// mantém o cache pequeno). Nunca escreve nada em RAIZ nem em site-mae
// (fora os arquivos finais de saída).
// ----
// Devolve o caminho RELATIVO (ex.: "img/produtos/x.jpg") — não uma URL
// pronta: staticFile() precisa rodar no BUNDLE (browser), onde
// window.remotion_staticBase existe de verdade. Chamado daqui (Node),
// staticFile() não quebra, mas devolve a URL errada (sem o prefixo que
// o bundle usa pra servir estático) — descoberto só testando: a
// primeira versão deste script chamava staticFile() aqui e todo
// Img/OffthreadVideo dava 404. Por isso os componentes (componentes.js)
// é que chamam staticFile(), já dentro do bundle.
function copiarParaPublic(caminhoAbsoluto) {
  const relativo = path.relative(RAIZ, caminhoAbsoluto);
  if (relativo.startsWith('..') || path.isAbsolute(relativo)) {
    // produtos.js só deveria apontar pra dentro do próprio repo — se
    // isso mudar um dia, falhar alto aqui é melhor que copiar o
    // arquivo pra fora de public/ (e o staticFile() correspondente
    // nunca mais achar o arquivo) em silêncio.
    throw new Error(`"${caminhoAbsoluto}" está fora de ${RAIZ} — produtos.js só pode referenciar arquivos do próprio repositório`);
  }
  const destino = path.join(PUBLIC_DIR, relativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(caminhoAbsoluto, destino);
  return relativo.split(path.sep).join('/');
}

function reverterVideo(relativo) {
  const origem = path.join(PUBLIC_DIR, relativo);
  const destinoRelativo = relativo.replace(/\.mp4$/, '-reverso.mp4');
  const destino = path.join(PUBLIC_DIR, destinoRelativo);
  // -an: o vídeo-fonte não tem narração (só ambiente, se tiver áudio
  // algum) e o Reel final não leva áudio mesmo (pedido explícito: a
  // música é escolhida no Instagram) — não vale a pena reverter áudio.
  execFileSync(FFMPEG, ['-y', '-i', origem, '-vf', 'reverse', '-an', destino], { stdio: 'inherit' });
  return destinoRelativo;
}

// Marca d'água com fundo removido por luminância — mesma técnica (e
// mesmos limiares) de marketing/instagram/gerar-posts.js
// (removerFundoLogo). Duplicada aqui de propósito: reels/ é uma pasta
// própria (package.json à parte, pedido explícito), sem depender de
// marketing/instagram/gerar-posts.js nem importar através dela.
async function gerarLogoTransparente(pagina) {
  const jpg = fs.readFileSync(path.join(RAIZ, 'img', 'institucional', 'logo-anasor.jpg'));
  const uri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  return pagina.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const CORTE_TOTAL = 250;
    const CORTE_INICIO = 228;
    for (let i = 0; i < d.length; i += 4) {
      const luminancia = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luminancia >= CORTE_TOTAL) d[i + 3] = 0;
      else if (luminancia > CORTE_INICIO) d[i + 3] = Math.round(255 * (CORTE_TOTAL - luminancia) / (CORTE_TOTAL - CORTE_INICIO));
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }, uri);
}

// ---- Roteiro padrão (--id/--template sem um roteiro pronto) ----
// `temVideo`: 26 das 43 peças disponíveis hoje não têm videoUrl em
// produtos.js (conferido na hora de escrever isto) — "qualquer peça
// disponível" (pedido explícito) só é verdade se o roteiro padrão
// também funcionar sem vídeo, não só pras que têm.
function roteiroPadrao(template, temVideo) {
  const curto = template === 'detalhes' ? 30 : 55;
  const cenaMeio = temVideo
    ? {
        tipo: 'video', duracao: 170, src: { video: 'principal' }, fundo: { foto: 'principal' },
        legendas: [{ palavras: ['Feita', 'à', 'mão,', 'peça', 'única'], atraso: 10, duracao: 110 }],
      }
    : {
        tipo: 'foto', duracao: 140, src: { foto: 'principal' },
        de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.12, x: 0, y: -1 },
        legendas: [{ palavras: ['Feita', 'à', 'mão,', 'peça', 'única'], atraso: 10, duracao: 90 }],
      };
  return () => montarCenas([
    { tipo: 'titulo', duracao: curto, src: { foto: 'principal' } },
    cenaMeio,
    {
      tipo: 'foto', duracao: 90, src: { extra: 0 },
      de: { escala: 1.05, x: 0, y: 0 }, para: { escala: 1.0, x: 0, y: -1 },
      legendas: [{ palavras: ['Frete', 'grátis', 'para', 'todo', 'o', 'Brasil'], atraso: 8, duracao: 65 }],
    },
    { tipo: 'cta', duracao: 90 },
  ]);
}

// ---- Resolve os caminhos simbólicos de uma cena pros caminhos reais
// (já copiados pra public/, prontos pra staticFile()) ----
function resolverCena(cena, ctx) {
  const nova = { ...cena };
  if (cena.src) {
    if (cena.src.foto === 'principal') nova.src = ctx.fotoPrincipal;
    else if (cena.src.extra != null) nova.src = ctx.fotosExtras[cena.src.extra] || ctx.fotoPrincipal;
    else if (cena.src.video === 'principal') nova.src = ctx.video;
  }
  if (cena.fundo && cena.fundo.foto === 'principal') nova.fundo = ctx.fotoPrincipal;
  return nova;
}

async function montarContextoProduto(produtos, produtoId, v) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) throw new Error(`Produto id ${produtoId} não encontrado em produtos.js`);
  if (produto.disponivel === false) throw new Error(`Produto ${produto.nome} está indisponível — escolha outro id`);
  const fotoPrincipal = copiarParaPublic(path.join(RAIZ, produto.imagem));
  const fotosExtras = (produto.imagensExtras || []).map((f) => copiarParaPublic(path.join(RAIZ, f)));
  const video = produto.videoUrl ? copiarParaPublic(path.join(RAIZ, produto.videoUrl)) : null;
  return {
    produto, fotoPrincipal, fotosExtras, video,
    nomeCurto: nomeCurto(produto.nome),
    selo: seloDoProduto(produto, v),
  };
}

async function main() {
  const args = lerArgs();
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(SAIDA, { recursive: true });
  fs.mkdirSync(SAIDA_CONFERENCIA, { recursive: true });

  const produtos = carregarProdutos();
  const v = lerVariaveisCss();

  const browser = await chromium.launch();
  const pagina = await browser.newPage();
  const logoUri = await gerarLogoTransparente(pagina);
  await browser.close();

  let nome, template, props;

  if (args.nome) {
    const roteiro = ROTEIROS[args.nome];
    if (!roteiro) throw new Error(`Roteiro "${args.nome}" não existe em src/roteiros.js. Opções: ${Object.keys(ROTEIROS).join(', ')}`);
    nome = args.nome;
    template = roteiro.template;

    if (template === 'colecao') {
      const pecas = [];
      for (const id of roteiro.pecaIds) {
        pecas.push(await montarContextoProduto(produtos, id, v));
      }
      const cenasCruas = roteiro.cenas(pecas);
      const cenas = cenasCruas.map((c) => {
        if (c.tipo !== 'peca') return c;
        const peca = pecas[c.src.produtoIndice];
        return { ...c, src: peca.fotoPrincipal };
      });
      props = { template, cores: v, logoUri, cenas, fps: FPS, duracaoTotal: duracaoTotal(cenas) };
    } else {
      const ctx = await montarContextoProduto(produtos, roteiro.produtoId, v);
      if (roteiro.reverterVideo && ctx.video) {
        ctx.video = reverterVideo(ctx.video);
      }
      const cenasCruas = roteiro.cenas();
      const cenas = cenasCruas.map((c) => resolverCena(c, ctx));
      props = {
        template, cores: v, logoUri, fps: FPS,
        produto: { nomeCurto: ctx.nomeCurto },
        selo: ctx.selo,
        cenas,
        duracaoTotal: duracaoTotal(cenas),
      };
    }
  } else if (args.id) {
    template = args.template || 'apresentacao';
    if (template === 'colecao') throw new Error('Para --template colecao use --ids (lista) em vez de --id');
    const produtoId = Number(args.id);
    const ctx = await montarContextoProduto(produtos, produtoId, v);
    nome = args.saida || `peca-${produtoId}-${template}`;
    const cenasCruas = roteiroPadrao(template, Boolean(ctx.video))();
    const cenas = cenasCruas.map((c) => resolverCena(c, ctx));
    props = {
      template, cores: v, logoUri, fps: FPS,
      produto: { nomeCurto: ctx.nomeCurto },
      selo: ctx.selo,
      cenas,
      duracaoTotal: duracaoTotal(cenas),
    };
  } else if (args.ids) {
    template = 'colecao';
    const ids = String(args.ids).split(',').map(Number);
    nome = args.saida || `colecao-${ids.join('-')}`;
    const pecas = [];
    for (const id of ids) pecas.push(await montarContextoProduto(produtos, id, v));
    const cenas = montarCenas([
      ...pecas.map((p) => ({ tipo: 'peca', duracao: 100, src: p.fotoPrincipal, nome: p.nomeCurto })),
      { tipo: 'cta', duracao: 90, titulo: 'Peças únicas' },
    ]);
    props = { template, cores: v, logoUri, cenas, fps: FPS, duracaoTotal: duracaoTotal(cenas) };
  } else {
    throw new Error('Uso: npm run reel -- --nome <roteiro>  OU  --id <id> --template <apresentacao|detalhes>  OU  --ids <id,id,id>');
  }

  console.log(`\nRenderizando "${nome}" (template: ${template}, ${(props.duracaoTotal / FPS).toFixed(1)}s, ${props.duracaoTotal} frames)...`);

  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, 'src', 'index.js'),
    publicDir: PUBLIC_DIR,
  });

  const composition = await selectComposition({ serveUrl: bundleLocation, id: 'Reel', inputProps: props });

  const saidaBruta = path.join(SAIDA, `_bruto-${nome}.mp4`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: saidaBruta,
    inputProps: props,
    pixelFormat: 'yuv420p',
    crf: 20,
    x264Preset: 'slow',
    logLevel: 'verbose',
  });

  // Passo final em ffmpeg: garante perfil High, yuv420p, sem áudio e
  // faststart (moov no início do arquivo — toca assim que abre no
  // Instagram, sem esperar baixar o arquivo inteiro). Reencoda (não
  // -c:v copy) porque "-profile:v high" exige recodificar.
  const saidaFinal = path.join(SAIDA, `${nome}.mp4`);
  execFileSync(FFMPEG, [
    '-y', '-i', saidaBruta,
    '-an',
    '-c:v', 'libx264', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    // sem -color_range tv, o libx264 herda o "full range" do vídeo de
    // origem (produto filmado em sRGB/pc) e o ffprobe relata
    // "yuvj420p" em vez de "yuv420p" — mesmo subsampling 4:2:0, mas
    // não bate com o pedido explícito ("yuv420p").
    '-crf', '20', '-preset', 'slow',
    '-movflags', '+faststart',
    saidaFinal,
  ], { stdio: 'inherit' });
  fs.rmSync(saidaBruta);

  // Quadros de conferência: início, 25%, 50%, 75%, fim
  const duracaoS = props.duracaoTotal / FPS;
  // 0.98 (não 0.999) no último ponto: "-ss" pertinho demais do fim
  // (ex.: a 13.49s de um vídeo de 13.50s) às vezes não acha quadro
  // nenhum depois do seek e o ffmpeg não escreve nada, sem erro — foi
  // o que aconteceu testando com 0.999 (só saíam 4 dos 5 quadros).
  const pontos = [0, 0.25, 0.5, 0.75, 0.98];
  for (const [i, p] of pontos.entries()) {
    const t = Math.max(0, p * duracaoS).toFixed(2);
    const arquivo = path.join(SAIDA_CONFERENCIA, `${nome}-${i + 1}.png`);
    execFileSync(FFMPEG, ['-y', '-ss', t, '-i', saidaFinal, '-frames:v', '1', '-update', '1', arquivo], { stdio: 'inherit' });
    if (!fs.existsSync(arquivo)) throw new Error(`Quadro de conferência ${i + 1} (t=${t}s) não foi gerado`);
  }

  const infoRaw = execFileSync(FFPROBE, [
    '-v', 'error', '-show_entries', 'format=duration,size', '-show_entries', 'stream=width,height,avg_frame_rate,codec_name,pix_fmt,profile',
    '-of', 'json', saidaFinal,
  ]).toString();
  const info = JSON.parse(infoRaw);
  const streamVideo = info.streams.find((s) => s.codec_name === 'h264') || info.streams[0];
  const tamanhoMB = (Number(info.format.size) / 1024 / 1024).toFixed(1);
  const [fpsNum, fpsDen] = streamVideo.avg_frame_rate.split('/').map(Number);
  const fpsReal = (fpsNum / fpsDen).toFixed(2);
  console.log(`\n✅ ${nome}.mp4`);
  console.log(`   ${streamVideo.width}x${streamVideo.height} · ${streamVideo.codec_name} ${streamVideo.profile} · ${streamVideo.pix_fmt} · ${fpsReal}fps · ${Number(info.format.duration).toFixed(1)}s · ${tamanhoMB}MB`);
  console.log(`   Saída: ${saidaFinal}`);
  console.log(`   Quadros de conferência: ${SAIDA_CONFERENCIA}`);
}

main().catch((erro) => {
  // console.error(erro) direto às vezes trava formatando o objeto de
  // erro do @remotion/renderer (tem referências grandes/circulares) —
  // imprimir só mensagem+stack é sempre seguro.
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
