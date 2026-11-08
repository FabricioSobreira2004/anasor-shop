#!/usr/bin/env node
// ============================================================
// Mixagem da trilha de fundo (Rodada 10/v3) nos 2 Tours — trilha a
// -24/-28dB sob a voz, com DUCKING (sidechaincompress, a trilha abaixa
// quando a narração fala) pra nunca atrapalhar, fade-in 1s/fade-out
// 2s, loop sem corte brusco (stream_loop + atrim+fade cobre vídeos
// mais longos que a trilha-fonte, 95s). Resultado final normalizado
// pra ~-16 LUFS, pico ≤-1,5dBTP (mesma régua de narrar.js).
//
//   node mixar-musica-v3.js --video <com-voz.mp4> --musica <trilha.wav> --saida <final.mp4>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { FFMPEG, FFPROBE } = require('../reels/src/ffmpeg-path.js');

function lerArgs() {
  const args = process.argv.slice(2);
  const pegar = (b) => { const i = args.indexOf(b); return i >= 0 ? args[i + 1] : null; };
  return { video: pegar('--video'), musica: pegar('--musica'), saida: pegar('--saida') };
}

function duracaoSegundos(arquivo) {
  const out = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', arquivo]).toString().trim();
  return parseFloat(out);
}

function main() {
  const { video, musica, saida } = lerArgs();
  if (!video || !musica || !saida) {
    console.error('Uso: node mixar-musica-v3.js --video <com-voz.mp4> --musica <trilha.wav> --saida <final.mp4>');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });

  const duracaoVideo = duracaoSegundos(video);
  const fadeOutInicio = Math.max(0, duracaoVideo - 2).toFixed(3);

  const filtro =
    `[1:a]atrim=0:${duracaoVideo.toFixed(3)},asetpts=PTS-STARTPTS,` +
    `afade=t=in:st=0:d=1,afade=t=out:st=${fadeOutInicio}:d=2,volume=-26dB[musica];` +
    `[musica][0:a]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=450:makeup=1[musicaduck];` +
    `[musicaduck][0:a]amix=inputs=2:duration=first:normalize=0[mix];` +
    `[mix]loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;

  const saidaTmp = `${saida}.tmp.mp4`;
  execFileSync(FFMPEG, [
    '-y', '-i', video, '-stream_loop', '-1', '-i', musica,
    '-filter_complex', filtro,
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', saidaTmp,
  ], { stdio: 'inherit' });
  fs.renameSync(saidaTmp, saida);

  console.log(`✅ ${saida} (vídeo ${duracaoVideo.toFixed(1)}s, música -26dB + ducking + loudnorm -16 LUFS)`);
}

main();
