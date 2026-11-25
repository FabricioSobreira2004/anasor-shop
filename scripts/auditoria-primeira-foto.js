// ============================================================
//  AUDITORIA — "a primeira foto de cada peça é sempre vertical 4:5"
// ============================================================
//
//  POR QUE ISTO EXISTE
//  ---------------------------------------------------------
//  Regra do catálogo (ver CLAUDE.md): a moldura principal da galeria
//  agora é uma caixa 4:5 (em pé) com object-fit:cover — ligada hoje só
//  nos Anjos de Luz (ver .galeria__principal--4x5, css/produto.css),
//  porque ligá-la pro catálogo inteiro SÓ é seguro quando a 1ª foto de
//  TODA peça já é vertical (cover corta o que não couber). Este script
//  é o jeito de CONFERIR isso sem abrir produto a produto na mão — ele
//  só LÊ e REPORTA, nunca modifica nada sozinho (reordenar/gerar uma
//  versão vertical continua sendo uma decisão visual, feita à mão,
//  conferindo cada recorte, como pede o CLAUDE.md).
//
//  COMO RODAR
//    node scripts/auditoria-primeira-foto.js
//  Precisa do ffprobe (parte do ffmpeg) instalado e no PATH.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const caminhoProdutos = path.join(RAIZ, 'js', 'produtos.js');

function carregarProdutos() {
  const codigo = fs.readFileSync(caminhoProdutos, 'utf-8');
  const sandbox = {};
  vm.createContext(sandbox);
  return vm.runInContext(codigo + '\n({ produtos });', sandbox, { filename: caminhoProdutos }).produtos;
}

// Lê só width/height do cabeçalho do arquivo — não decodifica a
// imagem inteira, então é rápido mesmo rodando no catálogo todo.
function dimensoes(caminhoRelativo) {
  const absoluto = path.join(RAIZ, caminhoRelativo);
  if (!fs.existsSync(absoluto)) return null;
  try {
    const saida = execFileSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0',
      absoluto,
    ], { encoding: 'utf-8' }).trim();
    const [w, h] = saida.split(',').map(Number);
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
  } catch {
    return null;
  }
}

function main() {
  const produtos = carregarProdutos();
  const horizontais = [];
  const semArquivo = [];

  for (const p of produtos) {
    const d = dimensoes(p.imagem);
    if (!d) { semArquivo.push({ id: p.id, nome: p.nome, imagem: p.imagem }); continue; }
    // "horizontal ou quadrada": w >= h não é 4:5 (em pé) de jeito nenhum
    if (d.w >= d.h) {
      const extrasVerticais = (p.imagensExtras || [])
        .map((src) => ({ src, d: dimensoes(src) }))
        .filter((e) => e.d && e.d.h > e.d.w);
      horizontais.push({
        id: p.id,
        nome: p.nome,
        imagem: p.imagem,
        dimensoes: `${d.w}x${d.h}`,
        temExtraVertical: extrasVerticais.length > 0,
        extrasVerticaisDisponiveis: extrasVerticais.map((e) => e.src),
      });
    }
  }

  console.log(`Total de peças no catálogo: ${produtos.length}`);
  console.log(`Primeira foto horizontal/quadrada: ${horizontais.length}\n`);
  horizontais.forEach((h) => {
    const acao = h.temExtraVertical
      ? `REORDENAR — já existe foto vertical entre as extras: ${h.extrasVerticaisDisponiveis.join(', ')}`
      : 'GERAR uma versão vertical (nenhuma extra vertical disponível)';
    console.log(`- id ${h.id} (${h.nome}) — ${h.dimensoes} — ${h.imagem}\n  ${acao}`);
  });

  if (semArquivo.length) {
    console.log(`\nAtenção — arquivo de imagem não encontrado (confira o caminho):`);
    semArquivo.forEach((s) => console.log(`- id ${s.id} (${s.nome}) — ${s.imagem}`));
  }
}

main();
