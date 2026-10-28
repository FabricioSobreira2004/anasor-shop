// ============================================================
// Monta E:\projetos\site-mae\kit-postagem\ — uma pasta por dia do
// calendário de 30 dias (marketing/instagram/calendario-30-dias.md),
// cada uma com a mídia pronta (copiada de instagram-posts\/reels\,
// nunca movida — os originais de site-mae continuam intactos),
// legenda.txt pronta pra colar (texto + hashtags, igual ao formato de
// legendas.md), info.txt (horário sugerido + alt text) e, pros dias
// sem mídia ainda, um PENDENTE.md explicando o que falta gravar.
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

// Mesmo parser de legendas.md usado em gerar-posts.js (duplicado aqui
// de propósito: scripts independentes, sem import entre pastas/arquivos
// que não compartilham dependência — ver comentário equivalente lá).
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
// `prontos`: arquivos de origem já gerados nesta rodada (post-NN = carrossel
// de feed em instagram-posts\, nome.mp4 = Reel em reels\). `pendente`:
// não há mídia ainda (bastidores/prova social reais) — a legenda já sai
// pronta mesmo assim, só falta a peça de mídia.
const DIAS = [
  { dia: 1, semana: 1, diaSemana: 'Segunda', formato: 'Reels', tema: 'Quem faz: apresentação da Anasor e da conta nova', legenda: 29,
    pendente: 'Vídeo da Anasor se apresentando (rosto/voz dela) — roteiro R10 em reels-ideias.md. Nenhuma ferramenta deste projeto substitui isso.' },
  { dia: 3, semana: 1, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Prato Melodia da Primavera', legenda: 1, post: 'post-01', produtoId: 1 },
  { dia: 5, semana: 1, diaSemana: 'Sexta', formato: 'Reels', tema: 'Peça: Caneca Surpresa Gatinho', legenda: 3, reel: 'r1-caneca-surpresa-gatinho', produtoId: 20 },
  { dia: 7, semana: 1, diaSemana: 'Domingo', formato: 'Foto/Carrossel', tema: 'Encomenda: viu e já tinha sido vendida?', legenda: 6, post: 'post-13', produtoId: 33 },
  { dia: 8, semana: 2, diaSemana: 'Segunda', formato: 'Reels', tema: 'Bastidores: do barro ao prato', legenda: 2,
    pendente: 'Filmagem real do torno (roteiro R2 em reels-ideias.md) — cena de barro/mãos modelando, não existe ainda.' },
  { dia: 10, semana: 2, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Vaso Escultórico Silhueta e Poesia', legenda: 5, post: 'post-02', produtoId: 6 },
  { dia: 12, semana: 2, diaSemana: 'Sexta', formato: 'Reels (trocado por Carrossel)', tema: 'Cuidados: como lavar sua cerâmica', legenda: 4, post: 'post-11',
    nota: 'O calendário pedia Reels (roteiro R8) — ainda não existe filmagem própria de "como lavar" pra virar Reel. Carrossel "Cuidados com a peça" (mesmos fatos, mesma legenda nº4) cobre o conteúdo até lá.' },
  { dia: 14, semana: 2, diaSemana: 'Domingo', formato: 'Foto/Carrossel', tema: 'Prova social: chegou!', legenda: 8,
    pendente: 'Depoimento REAL de uma cliente, com autorização dela pra publicar (a legenda já tem o espaço reservado "[entre colchetes]").' },
  { dia: 15, semana: 3, diaSemana: 'Segunda', formato: 'Reels', tema: 'Bastidores: a pintura', legenda: 10,
    pendente: 'Filmagem real da pintura à mão (roteiro R3 em reels-ideias.md).' },
  { dia: 17, semana: 3, diaSemana: 'Quarta', formato: 'Carrossel', tema: 'Peça: Prato Pavão Real', legenda: 9, post: 'post-03', produtoId: 5 },
  { dia: 19, semana: 3, diaSemana: 'Sexta', formato: 'Reels', tema: 'Encomenda: como funciona', legenda: 19,
    pendente: 'Reel próprio (roteiro R5) ainda não existe. O carrossel "Encomende a sua" (post-13, dia 7) já cobre os mesmos 4 passos em formato de feed — pode servir de referência de conteúdo até o Reel ser gravado/roteirizado.' },
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

function horarioPara(formato) {
  return formato.startsWith('Reels') ? HORARIO_SUGERIDO.Reels : HORARIO_SUGERIDO.default;
}

function copiarArquivo(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
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
    `Horário sugerido: ${horarioPara(diaInfo.formato)} (referência geral de uso do Instagram — esta conta ainda não tem Insights próprios; ajuste assim que houver histórico)`,
  ];
  if (diaInfo.produtoId) {
    linhas.push(`Peça: id ${diaInfo.produtoId} em js/produtos.js — CONFIRA no site antes de postar: ainda disponível? preço igual ao da legenda?`);
  }
  if (diaInfo.nota) linhas.push(`\nNota: ${diaInfo.nota}`);
  return linhas.join('\n') + '\n';
}

function montarChecklistTxt() {
  return `Antes de publicar:
[ ] A peça ainda está disponível no site? (js/produtos.js ou o próprio site)
[ ] O preço na legenda ainda bate com o preço do site?
[ ] O link da bio está correto? (https://anasor-sobreira.vercel.app/links)
[ ] Se é prova social: o depoimento é real e tem autorização da cliente?
`;
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

  for (const diaInfo of DIAS) {
    const legenda = legendas[diaInfo.legenda];
    if (!legenda) {
      console.warn(`dia ${diaInfo.dia}: legenda nº${diaInfo.legenda} não encontrada em legendas.md — pulado.`);
      continue;
    }
    const pastaDia = path.join(SAIDA, nomePasta(diaInfo));
    fs.mkdirSync(pastaDia, { recursive: true });

    fs.writeFileSync(path.join(pastaDia, 'legenda.txt'), montarLegendaTxt(legenda));
    fs.writeFileSync(path.join(pastaDia, 'info.txt'), montarInfoTxt(diaInfo, legenda));
    fs.writeFileSync(path.join(pastaDia, 'checklist-antes-de-postar.txt'), montarChecklistTxt());

    // Dia que TINHA PENDENTE.md numa rodada anterior e ganhou mídia de
    // verdade nesta (alguém editou DIAS, ou a filmagem real chegou):
    // tira o aviso velho, senão ele fica mentindo que ainda falta algo.
    const pendenteAntigo = path.join(pastaDia, 'PENDENTE.md');
    if ((diaInfo.post || diaInfo.reel) && fs.existsSync(pendenteAntigo)) fs.rmSync(pendenteAntigo);

    if (diaInfo.post) {
      // Carrossel: copia TODOS os slides do post + o .md (traz o alt
      // text de cada slide, já escrito por gerar-posts.js) + sua Story.
      const arquivos = fs.readdirSync(POSTS_DIR).filter((f) => f.startsWith(`${diaInfo.post}-`) || f === `${diaInfo.post}.md`);
      arquivos.forEach((f) => copiarArquivo(path.join(POSTS_DIR, f), path.join(pastaDia, f)));
      const storyFile = `${diaInfo.post}-story-capa.png`;
      const storyPath = path.join(POSTS_DIR, 'stories', storyFile);
      if (fs.existsSync(storyPath)) copiarArquivo(storyPath, path.join(pastaDia, 'story', storyFile));
      prontos++;
    } else if (diaInfo.reel) {
      copiarArquivo(path.join(REELS_DIR, `${diaInfo.reel}.mp4`), path.join(pastaDia, `${diaInfo.reel}.mp4`));
      prontos++;
    } else if (diaInfo.pendente) {
      fs.writeFileSync(path.join(pastaDia, 'PENDENTE.md'), `# Falta gravar\n\n${diaInfo.pendente}\n\nA legenda (legenda.txt) já está pronta — só falta a mídia.\n`);
      pendentes++;
    }

    console.log(`dia-${String(diaInfo.dia).padStart(2, '0')}: ${diaInfo.tema} — ${diaInfo.post || diaInfo.reel || 'PENDENTE'}`);
  }

  console.log(`\nPronto: ${SAIDA}`);
  console.log(`${prontos} dias com mídia pronta, ${pendentes} dias pendentes (sem mídia ainda).`);
}

main();
