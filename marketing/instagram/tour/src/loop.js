#!/usr/bin/env node
// ============================================================
// Loop curto (8-10s) do Tour do Site pro README do GitHub — GIF +
// MP4, a partir de um trecho do tour-instagram.mp4 já composto
// (Versão A). Pedido explícito da Rodada 4; refeito na Rodada 6
// (item B2) pra virar um LOOP PERFEITO: antes era só um corte reto
// de um trecho (pulava no fim, voltando pro início com um "salto"
// visível). Agora é METADE ARRASTO + METADE o MESMO ARRASTO AO
// CONTRÁRIO (bumerangue) — o vídeo "desce com delicadeza e volta",
// terminando exatamente no quadro em que começou: sem pulo nenhum
// voltando ao início.
//
//   node src/loop.js
// ============================================================
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG } = require('../../reels/src/ffmpeg-path');

const RAIZ = path.resolve(__dirname, '..', '..', '..', '..');
const SAIDA = path.resolve(RAIZ, '..', 'site-mae', 'tour');
const ORIGEM = path.join(SAIDA, 'tour-instagram.mp4');
const INICIO_S = 1.0; // pula o 1º segundo (entrada do selo/legenda ainda abrindo)
const METADE_S = 4.5; // ida; a volta (reverse) soma outra metade igual — total 9s, dentro de 8-10s pedido

function main() {
  if (!fs.existsSync(ORIGEM)) {
    throw new Error(`"${ORIGEM}" não existe — rode "node tour.js --versao a" antes.`);
  }
  fs.mkdirSync(SAIDA, { recursive: true });

  const gif = path.join(SAIDA, 'tour-loop.gif');
  const mp4 = path.join(SAIDA, 'tour-loop.mp4');
  const paletaTmp = path.join(SAIDA, '_paleta-tmp.png');
  // Bumerangue: separa o trecho em [a] (ida) e [r] (o mesmo trecho
  // revertido), concatena ida+volta — o último quadro da volta é
  // IDÊNTICO ao primeiro quadro da ida (é o mesmo quadro, só
  // percorrido ao contrário), por isso o loop fecha sem salto.
  const filtroBumerangue = `[0:v]trim=start=${INICIO_S}:duration=${METADE_S},setpts=PTS-STARTPTS,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[saida]`;

  // GIF: 2 passos (gera paleta ótima, depois aplica) — 480px de
  // largura (não os 1080 originais) porque GIF não comprime como
  // vídeo — na largura cheia o arquivo ficaria enorme pra um preview
  // de README.
  execFileSync(FFMPEG, [
    '-y', '-i', ORIGEM,
    '-filter_complex', `${filtroBumerangue};[saida]fps=15,scale=480:-1:flags=lanczos,palettegen`,
    paletaTmp,
  ], { stdio: 'inherit' });
  execFileSync(FFMPEG, [
    '-y', '-i', ORIGEM, '-i', paletaTmp,
    '-filter_complex', `${filtroBumerangue};[saida]fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    '-loop', '0', gif,
  ], { stdio: 'inherit' });
  fs.rmSync(paletaTmp, { force: true });

  // MP4 do mesmo trecho — menor e com mais qualidade que o GIF, pra
  // quem preferir incorporar vídeo em vez de GIF no README.
  execFileSync(FFMPEG, [
    '-y', '-i', ORIGEM,
    '-filter_complex', filtroBumerangue, '-map', '[saida]',
    '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    mp4,
  ], { stdio: 'inherit' });

  const tamanhoGifMB = (fs.statSync(gif).size / 1024 / 1024).toFixed(2);
  const tamanhoMp4MB = (fs.statSync(mp4).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ tour-loop.gif (${tamanhoGifMB}MB) + tour-loop.mp4 (${tamanhoMp4MB}MB) em ${SAIDA}`);
}

main();
