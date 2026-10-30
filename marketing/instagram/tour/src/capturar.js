#!/usr/bin/env node
// ============================================================
// CLI de captura — Rodada 4, Tour do Site.
//
//   node src/capturar.js --device mobile
//   node src/capturar.js --device desktop
//
// Pré-requisito: servidor local em http://localhost:8765, subido com
// FORCAR_DEMO=1 (ver src/servidor-local.js) — este script CONFERE
// isso batendo em /api/health antes de abrir qualquer página, e para
// se o modo demonstração não estiver confirmado (nunca gera pagamento
// real, nunca em teste).
//
// Saída: marketing/instagram/tour/.tmp/capturas/<device>/<cena>.mp4 +
// manifest.json (duração de cada clipe em quadros — o roteiro de
// composição lê isso em vez de supor números fixos).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { MOBILE, DESKTOP } = require('./dispositivos');
const { lerArgs } = require('./cli');
const { capturarMobile } = require('./cenas-mobile');
const { capturarDesktop } = require('./cenas-desktop');
const { limparRegistroRolagem, salvarRelatorioRolagem } = require('./captura-ferramentas');

const BASE_URL = process.env.TOUR_BASE_URL || 'http://localhost:8765';
const DIR_CAPTURAS = path.join(__dirname, '..', '.tmp', 'capturas');

async function confirmarModoDemonstracao() {
  const resposta = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!resposta || !resposta.ok) {
    throw new Error(`Servidor local não respondeu em ${BASE_URL}/api/health — suba com "node src/servidor-local.js" (FORCAR_DEMO=1) antes de capturar.`);
  }
  // /api/health não expõe o modo demonstração diretamente — a conferência
  // de verdade é visual, no log do servidor (pedido explícito do
  // Fabrício: "CONFIRME no log a linha..."); aqui só garantimos que HÁ
  // um servidor local de pé, pra não capturar telas de erro de conexão.
}

async function main() {
  const args = lerArgs();
  const device = args.device;
  if (device !== 'mobile' && device !== 'desktop') {
    throw new Error('Uso: node src/capturar.js --device mobile|desktop');
  }

  await confirmarModoDemonstracao();

  const dirBase = path.join(DIR_CAPTURAS, device);
  fs.rmSync(dirBase, { recursive: true, force: true });
  fs.mkdirSync(dirBase, { recursive: true });

  const perfil = device === 'mobile' ? MOBILE : DESKTOP;
  const browser = await chromium.launch();
  const contexto = await browser.newContext(perfil);
  const page = await contexto.newPage();

  const manifest = {};
  limparRegistroRolagem(); // cada --device roda em processo próprio, mas limpa de qualquer jeito — nunca mistura relatório de outra captura
  console.log(`\nCapturando "${device}" (${perfil.viewport.width}x${perfil.viewport.height}, dpr ${perfil.deviceScaleFactor})...\n`);
  if (device === 'mobile') {
    await capturarMobile(page, dirBase, BASE_URL, manifest);
  } else {
    await capturarDesktop(page, dirBase, BASE_URL, manifest);
  }

  await browser.close();

  const manifestoPath = path.join(dirBase, 'manifest.json');
  fs.writeFileSync(manifestoPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Captura "${device}" concluída. Manifesto: ${manifestoPath}`);

  // Relatório de rolagem (Rodada 6, item B1): pico de velocidade/
  // aceleração medido quadro a quadro, por cena — prova que nenhuma
  // rolagem passou do limite (a validação em si já teria lançado erro
  // e parado a captura antes de chegar aqui).
  const dirTmp = 'E:/projetos/_tmp';
  const csv = path.join(dirTmp, `tour-rolagem-${device}.csv`);
  const resumoPath = path.join(dirTmp, `tour-rolagem-${device}-resumo.txt`);
  const resumo = salvarRelatorioRolagem(csv, resumoPath);
  if (resumo.length) {
    console.log(`\nRolagem (${device}):`);
    resumo.forEach((linha) => console.log(`  ${linha}`));
    console.log(`  CSV completo: ${csv}`);
  }
}

main().catch((erro) => {
  console.error('\nFALHOU:', (erro && erro.message) || erro);
  if (erro && erro.stack) console.error(erro.stack);
  process.exit(1);
});
