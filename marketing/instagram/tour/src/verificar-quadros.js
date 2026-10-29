#!/usr/bin/env node
// ============================================================
// Varredura de quadro BRANCO/CHAPADO (Rodada 5, item 1b). Usa o
// filtro `signalstats` do ffmpeg (1 passada só, sem extrair PNG por
// PNG) pra medir luminância média (YAVG) e desvio (YDIF, frame a
// frame) de CADA quadro do vídeo — um quadro "branco" tem YAVG muito
// alto (perto de 235-255) E quase nenhuma variação espacial (um jeito
// indireto de medir "chapado": aqui usamos YDIF, a diferença média
// pro quadro anterior, baixa também quando o quadro É uniforme por
// dentro, não só parado).
//
//   node src/verificar-quadros.js <caminho.mp4> [--regiao x,y,w,h]
//
// --regiao (opcional): limita a varredura a um retângulo (ex.: só a
// tela do celular dentro do quadro inteiro) — em pixels, canto
// superior esquerdo + largura/altura. Sem --regiao, varre o quadro
// inteiro.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG } = require('../../reels/src/ffmpeg-path');

const LIMIAR_BRANCO_YAVG = 235; // luma média acima disso = quase branco (range 0-255)
const LIMIAR_CHAPADO_YDIF = 1.5; // diferença média pro quadro anterior quase zero = nada mudando (hold num quadro só, ou quadro liso)

function lerArgs() {
  const [caminho, ...resto] = process.argv.slice(2);
  let regiao = null;
  const i = resto.indexOf('--regiao');
  if (i !== -1 && resto[i + 1]) {
    const [x, y, w, h] = resto[i + 1].split(',').map(Number);
    regiao = { x, y, w, h };
  }
  return { caminho, regiao };
}

function varrer(caminhoVideo, regiao) {
  // O ":" de um caminho absoluto do Windows (ex.: "E:\...") colide com
  // o separador de opções do filtro do ffmpeg — mesmo escapado
  // ("\:"), continuava falhando (achado rodando). Em vez de brigar com
  // o parser do filtro, roda o ffmpeg com CWD na própria pasta de
  // temporários e usa só o NOME do arquivo no filtro (sem caminho,
  // sem ":").
  const tmpDir = require('os').tmpdir();
  const nomeStats = `signalstats-${Date.now()}.log`;
  const statsFile = path.join(tmpDir, nomeStats);
  const caminhoVideoAbsoluto = path.resolve(caminhoVideo);
  const filtro = regiao
    ? `crop=${regiao.w}:${regiao.h}:${regiao.x}:${regiao.y},signalstats,metadata=print:file=${nomeStats}`
    : `signalstats,metadata=print:file=${nomeStats}`;
  execFileSync(FFMPEG, ['-y', '-i', caminhoVideoAbsoluto, '-vf', filtro, '-f', 'null', '-'], { stdio: 'ignore', cwd: tmpDir });

  const texto = fs.readFileSync(statsFile, 'utf8');
  fs.rmSync(statsFile, { force: true });

  // Formato de saída do metadata=print: blocos "frame:N pts:... \n
  // lavfi.signalstats.YAVG=...\nlavfi.signalstats.YDIF=...\n..." por
  // quadro, nessa ordem.
  const quadros = [];
  let atual = null;
  for (const linha of texto.split('\n')) {
    const mFrame = linha.match(/^frame:(\d+)/);
    if (mFrame) {
      if (atual) quadros.push(atual);
      atual = { frame: Number(mFrame[1]) };
      continue;
    }
    const mYavg = linha.match(/YAVG=([\d.]+)/);
    if (mYavg && atual) atual.yavg = Number(mYavg[1]);
    const mYdif = linha.match(/YDIF=([\d.]+)/);
    if (mYdif && atual) atual.ydif = Number(mYdif[1]);
  }
  if (atual) quadros.push(atual);
  return quadros;
}

function main() {
  const { caminho, regiao } = lerArgs();
  if (!caminho) throw new Error('Uso: node src/verificar-quadros.js <caminho.mp4> [--regiao x,y,w,h]');
  if (!fs.existsSync(caminho)) throw new Error(`Não existe: ${caminho}`);

  console.log(`Varrendo ${caminho}${regiao ? ` (região ${regiao.x},${regiao.y},${regiao.w}x${regiao.h})` : ' (quadro inteiro)'}...`);
  const quadros = varrer(caminho, regiao);
  console.log(`${quadros.length} quadros analisados.`);

  const suspeitos = quadros.filter((q) => q.yavg >= LIMIAR_BRANCO_YAVG && q.ydif <= LIMIAR_CHAPADO_YDIF);
  if (suspeitos.length === 0) {
    console.log(`✅ Nenhum quadro branco/chapado (YAVG≥${LIMIAR_BRANCO_YAVG} e YDIF≤${LIMIAR_CHAPADO_YDIF}).`);
    const piorYavg = quadros.reduce((a, b) => (b.yavg > a.yavg ? b : a));
    console.log(`   Maior YAVG visto: ${piorYavg.yavg.toFixed(1)} no quadro ${piorYavg.frame} (${(piorYavg.frame / 30).toFixed(2)}s a 30fps).`);
    return true;
  }

  console.log(`❌ ${suspeitos.length} quadro(s) suspeito(s) de branco/chapado:`);
  for (const s of suspeitos.slice(0, 20)) {
    console.log(`   quadro ${s.frame} (${(s.frame / 30).toFixed(2)}s) — YAVG=${s.yavg.toFixed(1)} YDIF=${s.ydif.toFixed(2)}`);
  }
  if (suspeitos.length > 20) console.log(`   ... e mais ${suspeitos.length - 20}.`);
  return false;
}

const ok = main();
process.exit(ok ? 0 : 1);
