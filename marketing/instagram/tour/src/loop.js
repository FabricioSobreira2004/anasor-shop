#!/usr/bin/env node
// ============================================================
// Loop curto (6-8s) do Tour do Site pro README do GitHub — GIF +
// MP4, a partir de um trecho do tour-instagram.mp4 já composto
// (Versão A). Pedido explícito da Rodada 4.
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
const DURACAO_S = 7; // dentro do pedido (6-8s): cobre home-hero + home-scroll + começo do card-selo

function main() {
  if (!fs.existsSync(ORIGEM)) {
    throw new Error(`"${ORIGEM}" não existe — rode "node tour.js --versao a" antes.`);
  }
  fs.mkdirSync(SAIDA, { recursive: true });

  const gif = path.join(SAIDA, 'tour-loop.gif');
  const mp4 = path.join(SAIDA, 'tour-loop.mp4');
  const paletaTmp = path.join(SAIDA, '_paleta-tmp.png');

  // GIF: 2 passos (gera paleta ótima, depois aplica) — padrão ffmpeg
  // pra GIF de qualidade sem pesar demais; 480px de largura (não os
  // 1080 originais) porque GIF não comprime como vídeo — na largura
  // cheia o arquivo ficaria enorme pra um preview de README.
  execFileSync(FFMPEG, [
    '-y', '-ss', String(INICIO_S), '-t', String(DURACAO_S), '-i', ORIGEM,
    '-vf', 'fps=15,scale=480:-1:flags=lanczos,palettegen', paletaTmp,
  ], { stdio: 'inherit' });
  execFileSync(FFMPEG, [
    '-y', '-ss', String(INICIO_S), '-t', String(DURACAO_S), '-i', ORIGEM, '-i', paletaTmp,
    '-lavfi', 'fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse', '-loop', '0', gif,
  ], { stdio: 'inherit' });
  fs.rmSync(paletaTmp, { force: true });

  // MP4 do mesmo trecho — menor e com mais qualidade que o GIF, pra
  // quem preferir incorporar vídeo em vez de GIF no README.
  execFileSync(FFMPEG, [
    '-y', '-ss', String(INICIO_S), '-t', String(DURACAO_S), '-i', ORIGEM,
    '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    mp4,
  ], { stdio: 'inherit' });

  const tamanhoGifMB = (fs.statSync(gif).size / 1024 / 1024).toFixed(2);
  const tamanhoMp4MB = (fs.statSync(mp4).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ tour-loop.gif (${tamanhoGifMB}MB) + tour-loop.mp4 (${tamanhoMp4MB}MB) em ${SAIDA}`);
}

main();
