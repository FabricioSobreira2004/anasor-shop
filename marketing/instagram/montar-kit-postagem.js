// ============================================================
// Monta E:\projetos\site-mae\kit-postagem\ — uma pasta por dia do
// calendário de 30 dias (marketing/instagram/calendario-30-dias.md),
// cada uma com a mídia pronta (COPIADA de instagram-posts\/reels\,
// nunca movida — os originais de site-mae continuam intactos),
// legenda.txt pronta pra colar (texto + hashtags, igual ao formato de
// legendas.md), info.txt (tema/horário sugerido/peça — o alt text de
// cada slide já vem dentro do post-NN.md copiado junto, escrito por
// gerar-posts.js, não duplicado aqui) e, pros dias sem mídia ainda, um
// PENDENTE.md explicando o que falta gravar.
//
// Rodar DEPOIS de gerar-posts.js e dos renders de reel.js (lê os
// arquivos que eles já deixaram em site-mae, não gera nada do zero):
//   node montar-kit-postagem.js
// ============================================================

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');
const SITE_MAE = path.resolve(RAIZ, '..', 'site-mae');
const POSTS_DIR = path.join(SITE_MAE, 'instagram-posts');
const REELS_DIR = path.join(SITE_MAE, 'reels');
const SAIDA = path.join(SITE_MAE, 'kit-postagem');

// Parser de legendas.md PRÓPRIO deste script — parecido com o de
// gerar-posts.js (mesma ideia: split por "### "), mas NÃO é o mesmo
// código nem lê os mesmos campos (este aceita qualquer legenda, não só
// as de peça com preço; normaliza \r\n, o outro não precisa porque o
// regex dele não ancora no fim da linha). Um ajuste num dos dois NÃO
// corrige o outro automaticamente — são duas implementações, não uma
// compartilhada.
function carregarLegendas() {
  // \r\n -> \n: o arquivo está salvo com final de linha do Windows
  // (CRLF) neste checkout — sem normalizar, o \r sobra no fim de cada
  // título lido (split('\n') só corta no \n) e quebra o regex de
  // título/hashtags logo abaixo ($ não "pula" um \r, só um fim de
  // string de verdade — \r conta como quebra de linha pro '.' do regex).
  const md = fs.readFileSync(path.join(__dirname, 'legendas.md'), 'utf8').replace(/\r\n/g, '\n');
  return md.split(/\n### /).slice(1).map((bloco) => {
    const [titulo, ...resto] = bloco.split('\n');
    const corpo = resto.join('\n').split(/\n---/)[0].trim();
    const m = titulo.match(/^(\d+)\.\s+(\S+)\s+(.+)$/u);
    return m ? { numero: Number(m[1]), emoji: m[2], titulo: m[3].trim(), corpo } : null;
  }).filter(Boolean).reduce((acc, l) => { acc[l.numero] = l; return acc; }, {});
}

// ---- Os 17 dias do calendário (marketing/instagram/calendario-30-dias.md) ----
// TRANSCRITO à mão a partir do calendário (não parseado do .md): se o
// calendário mudar — peça trocada, dia reordenado, roteiro novo — isso
// AQUI precisa ser atualizado também, nada sincroniza sozinho.
// `prontos`: arquivos de origem já gerados nesta rodada (post-NN = carrossel
// de feed em instagram-posts\, nome.mp4 = Reel em reels\). `pendente`:
// não há mídia ainda (bastidores/prova social reais) — a legenda já sai
// pronta mesmo assim, só falta a peça de mídia.
const DIAS = [
  { dia: 1, semana: 1, diaSemana: 'Segunda', formato: 'Reels', tema: 'Quem faz: apresentação da Anasor e da conta nova', legenda: 29,
    pendente: 'Vídeo da Anasor se apresentando (rosto/voz dela) — roteiro R10 em reels-ideias.md. Nenhuma ferramenta deste projeto substitui isso.' },
  { dia: 3, semana: 1, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Prato Melodia da Primavera', legenda: 1, post: 'post-01', produtoId: 1 },
  { dia: 5, semana: 1, diaSemana: 'Sexta', formato: 'Reels', tema: 'Peça: Caneca Surpresa Gatinho', legenda: 3, reel: 'r1-caneca-surpresa-gatinho', produtoId: 20 },
  // produtoId 33 é a peça VENDIDA de exemplo (o post inteiro é sobre
  // isso) — vendidaDeProposito:true troca o aviso genérico "confira se
  // ainda está disponível" por um que não contradiz o próprio post.
  { dia: 7, semana: 1, diaSemana: 'Domingo', formato: 'Foto/Carrossel', tema: 'Encomenda: viu e já tinha sido vendida?', legenda: 6, post: 'post-13', produtoId: 33, vendidaDeProposito: true },
  { dia: 8, semana: 2, diaSemana: 'Segunda', formato: 'Reels', tema: 'Bastidores: do barro ao prato', legenda: 2,
    pendente: 'Filmagem real do torno (roteiro R2 em reels-ideias.md) — cena de barro/mãos modelando, não existe ainda.' },
  { dia: 10, semana: 2, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Vaso Escultórico Silhueta e Poesia', legenda: 5, post: 'post-02', produtoId: 6 },
  // Reel de CONTEÚDO (cuidados-conteudo.mp4, motion graphics puro — ver
  // reels/src/roteiros.js) no lugar do carrossel: cobre o formato Reels
  // que o calendário pedia (roteiro R8 nunca existiu como filmagem
  // própria, e não precisa mais — o Reel de conteúdo preenche o mesmo
  // papel). post-11 (carrossel) continua pronto na Reserva, se um dia
  // fizer sentido postar os dois.
  { dia: 12, semana: 2, diaSemana: 'Sexta', formato: 'Reels', tema: 'Cuidados: como lavar sua cerâmica', legenda: 4, reel: 'cuidados-conteudo' },
  { dia: 14, semana: 2, diaSemana: 'Domingo', formato: 'Foto/Carrossel', tema: 'Prova social: chegou!', legenda: 8,
    pendente: 'Depoimento REAL de uma cliente, com autorização dela pra publicar (a legenda já tem o espaço reservado "[entre colchetes]").' },
  { dia: 15, semana: 3, diaSemana: 'Segunda', formato: 'Reels', tema: 'Bastidores: a pintura', legenda: 10,
    pendente: 'Filmagem real da pintura à mão (roteiro R3 em reels-ideias.md).' },
  { dia: 17, semana: 3, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Prato Pavão Real', legenda: 9, post: 'post-03', produtoId: 5 },
  // Reel de CONTEÚDO (encomenda-conteudo.mp4) — os mesmos 4 passos da
  // legenda nº19, em motion graphics, sem prazo nem preço fixo.
  { dia: 19, semana: 3, diaSemana: 'Sexta', formato: 'Reels', tema: 'Encomenda: como funciona', legenda: 19, reel: 'encomenda-conteudo' },
  { dia: 21, semana: 3, diaSemana: 'Domingo', formato: 'Foto', tema: 'Peça: Boleira Jardim de Morangos', legenda: 13, post: 'post-04', produtoId: 24 },
  { dia: 22, semana: 4, diaSemana: 'Segunda', formato: 'Reels', tema: 'Bastidores: a queima', legenda: 16,
    pendente: 'Filmagem real do forno/queima (roteiro R4 em reels-ideias.md).' },
  { dia: 24, semana: 4, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Kit Jogo de Chá Pétala', legenda: 7, post: 'post-05', produtoId: 17 },
  { dia: 26, semana: 4, diaSemana: 'Sexta', formato: 'Reels', tema: 'Peça: Kit 4 Casinhas de Fada', legenda: 20, reel: 'r7-casinhas-de-fada', produtoId: 36 },
  { dia: 28, semana: 4, diaSemana: 'Domingo', formato: 'Foto/Carrossel', tema: 'Prova social: por que peça única?', legenda: 17,
    pendente: 'Depoimento REAL de uma cliente, com autorização (espaço reservado na legenda). O carrossel "Peça única: o que significa" (post-12) é conteúdo de reserva com tema parecido, mas NÃO é prova social de verdade — não substitui o depoimento.' },
  { dia: 29, semana: 5, diaSemana: 'Segunda', formato: 'Reels', tema: 'Peça: Caneca Surpresa Cachorrinho', legenda: 26, reel: 'caneca-surpresa-cachorrinho', produtoId: 19 },
];

const HORARIO_SUGERIDO = { Reels: '19h', default: '12h' };
// Sem dado de audiência real (conta nova) — horários de referência geral
// de uso do Instagram, não um número tirado de Insights desta conta.

// Pelo `diaInfo.reel` (o que REALMENTE vai ser postado), não pelo texto
// de `formato` — achado do code-review: um dia com `formato` dizendo
// "Reels" mas na prática virando `post` (carrossel) pegava 19h (horário
// de Reels) em vez de 12h. Hoje nenhum dia está nessa situação, mas o
// texto de `formato` é só descritivo, não confiável pra essa decisão.
function horarioPara(diaInfo) {
  return diaInfo.reel ? HORARIO_SUGERIDO.Reels : HORARIO_SUGERIDO.default;
}

// Devolve null (não lança) se a origem não existir — quem chama decide
// o que fazer; ver main(), que registra o dia como PROBLEMA em vez de
// travar o loop inteiro e deixar os dias seguintes sem processar.
function copiarArquivo(origem, destino) {
  if (!fs.existsSync(origem)) return null;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
  return destino;
}

function montarLegendaTxt(legenda) {
  // Formato IDÊNTICO ao de legendas.md (corpo já inclui as hashtags no
  // fim) — abre o .txt, Ctrl+A, Ctrl+C, cola direto no Instagram.
  return `${legenda.corpo}\n`;
}

function montarInfoTxt(diaInfo, legenda) {
  const linhas = [
    `Dia ${diaInfo.dia} (semana ${diaInfo.semana}, ${diaInfo.diaSemana}) — ${diaInfo.formato}`,
    `Tema: ${diaInfo.tema}`,
    `Legenda nº ${legenda.numero} de legendas.md`,
    `Horário sugerido: ${horarioPara(diaInfo)} (referência geral de uso do Instagram — esta conta ainda não tem Insights próprios; ajuste assim que houver histórico)`,
  ];
  if (diaInfo.produtoId && diaInfo.vendidaDeProposito) {
    linhas.push(`Peça: id ${diaInfo.produtoId} em js/produtos.js — ESTA peça está (e deve continuar) marcada "disponivel: false": o post É sobre ela ter sido vendida. Confira só se ela ainda existe no catálogo (não foi apagada) e se o texto da legenda ainda bate com o nome dela.`);
  } else if (diaInfo.produtoId) {
    linhas.push(`Peça: id ${diaInfo.produtoId} em js/produtos.js — CONFIRA no site antes de postar: ainda disponível? preço igual ao da legenda?`);
  }
  if (diaInfo.nota) linhas.push(`\nNota: ${diaInfo.nota}`);
  return linhas.join('\n') + '\n';
}

function montarChecklistTxt(diaInfo) {
  const linhaDisponibilidade = diaInfo.vendidaDeProposito
    ? '[ ] A peça ainda existe no catálogo (não foi apagada)? Ela DEVE continuar "disponivel: false" — o post é sobre isso.'
    : '[ ] A peça ainda está disponível no site? (js/produtos.js ou o próprio site)';
  // citaPix: pedido explícito (rodada 3) — nenhum dos 17 dias do
  // calendário cita Pix hoje (só o conteúdo de reserva "Como comprar"),
  // mas o flag existe pra qualquer dia futuro que citar.
  const linhaPix = diaInfo.citaPix
    ? '[ ] Pix: a chave está cadastrada no Mercado Pago e o Pix aparece de verdade no checkout? (confira em checkout.html, ou pedindo pra alguém simular uma compra)\n'
    : '';
  return `Antes de publicar:
${linhaDisponibilidade}
[ ] O preço na legenda ainda bate com o preço do site?
[ ] O link da bio está correto? (https://anasor-sobreira.vercel.app/links)
[ ] Se é prova social: o depoimento é real e tem autorização da cliente?
${linhaPix}`;
}

function nomePasta(diaInfo) {
  const slug = diaInfo.tema
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acento
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    .slice(0, 40);
  return `dia-${String(diaInfo.dia).padStart(2, '0')}-${slug}`;
}

function main() {
  const legendas = carregarLegendas();
  fs.mkdirSync(SAIDA, { recursive: true });

  let prontos = 0;
  let pendentes = 0;
  let problemas = 0;

  for (const diaInfo of DIAS) {
    const legenda = legendas[diaInfo.legenda];
    if (!legenda) {
      console.warn(`dia ${diaInfo.dia}: legenda nº${diaInfo.legenda} não encontrada em legendas.md — pulado.`);
      continue;
    }
    const prefixo = `dia-${String(diaInfo.dia).padStart(2, '0')}-`;

    // Limpa QUALQUER pasta antiga deste dia antes de escrever — não só
    // a de nome atual. Cobre 2 casos: `tema` mudou (o slug do nome da
    // pasta muda junto, senão a pasta velha ficava órfã, com mídia
    // desatualizada, sem nada indicando que não é mais a corrente) e
    // post/reel trocou (a mídia antiga ficaria junto da nova, sem
    // indicar qual vale). Um dia = uma pasta, sempre do zero.
    if (fs.existsSync(SAIDA)) {
      for (const nome of fs.readdirSync(SAIDA)) {
        if (nome.startsWith(prefixo)) fs.rmSync(path.join(SAIDA, nome), { recursive: true, force: true });
      }
    }

    const pastaDia = path.join(SAIDA, nomePasta(diaInfo));
    fs.mkdirSync(pastaDia, { recursive: true });

    fs.writeFileSync(path.join(pastaDia, 'legenda.txt'), montarLegendaTxt(legenda));
    fs.writeFileSync(path.join(pastaDia, 'info.txt'), montarInfoTxt(diaInfo, legenda));
    fs.writeFileSync(path.join(pastaDia, 'checklist-antes-de-postar.txt'), montarChecklistTxt(diaInfo));

    let status = 'PENDENTE';

    if (diaInfo.post) {
      // Carrossel: copia TODOS os slides do post + o .md (traz o alt
      // text de cada slide, já escrito por gerar-posts.js) + sua Story.
      const arquivos = fs.readdirSync(POSTS_DIR).filter((f) => f.startsWith(`${diaInfo.post}-`) || f === `${diaInfo.post}.md`);
      if (arquivos.length === 0) {
        // Fonte sumiu/foi renomeada: NÃO conta como pronto nem trava o
        // loop — grava um aviso explícito na própria pasta e segue pro
        // próximo dia (achado do code-review: antes isso contava
        // silenciosamente como "pronto" com a pasta vazia).
        fs.writeFileSync(path.join(pastaDia, 'PROBLEMA.md'), `# Mídia não encontrada\n\nEsperava os arquivos de "${diaInfo.post}" em ${POSTS_DIR}, mas nenhum foi achado. Rode gerar-posts.js de novo (ou corrija o nome em DIAS, dentro deste script) e rode montar-kit-postagem.js outra vez.\n`);
        status = 'PROBLEMA';
        problemas++;
      } else {
        arquivos.forEach((f) => copiarArquivo(path.join(POSTS_DIR, f), path.join(pastaDia, f)));
        const storyFile = `${diaInfo.post}-story-capa.png`;
        const storyPath = path.join(POSTS_DIR, 'stories', storyFile);
        if (fs.existsSync(storyPath)) copiarArquivo(storyPath, path.join(pastaDia, 'story', storyFile));
        status = diaInfo.post;
        prontos++;
      }
    } else if (diaInfo.reel) {
      const copiado = copiarArquivo(path.join(REELS_DIR, `${diaInfo.reel}.mp4`), path.join(pastaDia, `${diaInfo.reel}.mp4`));
      if (!copiado) {
        fs.writeFileSync(path.join(pastaDia, 'PROBLEMA.md'), `# Mídia não encontrada\n\nEsperava "${diaInfo.reel}.mp4" em ${REELS_DIR}, mas o arquivo não existe. Rode reel.js de novo (ou corrija o nome em DIAS, dentro deste script) e rode montar-kit-postagem.js outra vez.\n`);
        status = 'PROBLEMA';
        problemas++;
      } else {
        status = diaInfo.reel;
        prontos++;
      }
    } else if (diaInfo.pendente) {
      fs.writeFileSync(path.join(pastaDia, 'PENDENTE.md'), `# Falta gravar\n\n${diaInfo.pendente}\n\nA legenda (legenda.txt) já está pronta — só falta a mídia.\n`);
      pendentes++;
    }

    console.log(`dia-${String(diaInfo.dia).padStart(2, '0')}: ${diaInfo.tema} — ${status}`);
  }

  console.log(`\nPronto: ${SAIDA}`);
  console.log(`${prontos} dias com mídia pronta, ${pendentes} dias pendentes (sem mídia ainda), ${problemas} com problema (mídia esperada mas não encontrada).`);
}

main();
