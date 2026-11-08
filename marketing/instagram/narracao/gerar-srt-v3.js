#!/usr/bin/env node
// ============================================================
// Gera SÓ o .srt (sem queimar nada) a partir do sidecar de
// narrar-tour-v3.js — usado pelo tour-portfolio (Rodada 10/v3, pedido
// explícito: "NÃO queime legenda, os balões da tela já existem; gere
// só o .srt"). Blocos de 3-6 palavras, mesma lógica de agrupamento de
// tour/legendar-overlay-v3.js (duplicada aqui de propósito — este
// script não depende do Remotion/bundler, só de fs/path, pra não
// precisar do node_modules da pasta tour/).
//
//   node gerar-srt-v3.js --json <sidecar.json> --saida <saida.srt>
const fs = require('fs');
const path = require('path');
const { agruparBlocos } = require('../tour/src/blocos-legenda.js');

function lerArgs() {
  const args = process.argv.slice(2);
  const pegar = (b) => { const i = args.indexOf(b); return i >= 0 ? args[i + 1] : null; };
  return { json: pegar('--json'), saida: pegar('--saida') };
}

const pad = (n, l = 2) => String(n).padStart(l, '0');
function decompor(segundos, unidadesPorSegundo) {
  let total = Math.round(segundos * unidadesPorSegundo);
  const frac = total % unidadesPorSegundo;
  total = Math.floor(total / unidadesPorSegundo);
  const s = total % 60;
  total = Math.floor(total / 60);
  const m = total % 60;
  const h = Math.floor(total / 60);
  return { h, m, s, frac };
}
function tempoSrt(segundos) {
  const { h, m, s, frac } = decompor(segundos, 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(frac, 3)}`;
}

function main() {
  const { json, saida } = lerArgs();
  if (!json || !saida) {
    console.error('Uso: node gerar-srt-v3.js --json <sidecar.json> --saida <saida.srt>');
    process.exit(1);
  }
  const dados = JSON.parse(fs.readFileSync(json, 'utf8'));
  const blocos = agruparBlocos(dados.palavras);
  const linhas = blocos.map((b, i) => `${i + 1}\n${tempoSrt(b.inicio)} --> ${tempoSrt(b.fim)}\n${b.palavras.map((p) => p.texto).join(' ')}\n`);
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, linhas.join('\n'), 'utf8');
  console.log(`✅ ${saida} — ${blocos.length} blocos`);
}

main();
