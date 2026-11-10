#!/usr/bin/env node
// Rodada 12 — testa as 4 configurações de síntese (A/B/C/D, ver
// configs-sintese-v5.js) no MESMO trecho de ~14s (conteúdo real do
// novo roteiro do tour-instagram, ver roteiro-v5-dados.js), mede o
// ritmo de cada uma (medir-ritmo.js) e escolhe a que passa nas metas
// — SEM depender de audição humana (pedido explícito, item 3).
//
// Metas (pedido): rajada média >=1,5s (mediana >=1,3s), pausa média
// dentro da fala <=0,30s, tempo total em pausa <=22%, wps 2,6-3,2.
// Entre as que passam, escolhe a de MAIOR length_scale (menos
// comprimida). Se nenhuma passar, escolhe a de melhor pontuação
// (soma das violações relativas) e registra a decisão pra documentar
// à mão em DECISOES.md.
const fs = require('fs');
const path = require('path');
const { CONFIGS_V5 } = require('./configs-sintese-v5.js');
const { sintetizarTrechoV5 } = require('./sintetizar-trecho-v5.js');
const { medirRitmo } = require('./medir-ritmo.js');

const DIR_SAIDA = 'E:/projetos/site-mae/narracao-amostras/fluidez';

// 50 palavras reais do começo do roteiro v5 do tour-instagram (3
// trechos concatenados) — representativo do texto de produção, não
// o parágrafo solto de narracao-amostras/ (que tem outra cadência).
const TEXTO_TESTE =
  'Vem conhecer o ateliê Anasor Cerâmica, e passeie pelas coleções de cerâmica e crochê no site. ' +
  'Cada peça de cerâmica é única, com estoque de uma só, feita à mão pela artesã. ' +
  'Toda peça tem fotos reais, vídeo e as medidas certinhas, pra você conhecer cada detalhe antes de comprar.';
const PALAVRAS_TESTE = TEXTO_TESTE.trim().split(/\s+/).filter(Boolean).length;

const METAS = {
  rajadaMediaS: 1.5, rajadaMedianaS: 1.3, pausaMediaMaxS: 0.30, pctPausaMax: 22, wpsMin: 2.6, wpsMax: 3.2,
};

function pontuarViolacoes(m) {
  let violacoes = 0;
  if (m.rajadaMediaS < METAS.rajadaMediaS) violacoes += (METAS.rajadaMediaS - m.rajadaMediaS) / METAS.rajadaMediaS;
  if (m.rajadaMedianaS < METAS.rajadaMedianaS) violacoes += (METAS.rajadaMedianaS - m.rajadaMedianaS) / METAS.rajadaMedianaS;
  if (m.pausaMediaS > METAS.pausaMediaMaxS) violacoes += (m.pausaMediaS - METAS.pausaMediaMaxS) / METAS.pausaMediaMaxS;
  if (m.pctTempoPausa > METAS.pctPausaMax) violacoes += (m.pctTempoPausa - METAS.pctPausaMax) / METAS.pctPausaMax;
  if (m.wps != null && m.wps < METAS.wpsMin) violacoes += (METAS.wpsMin - m.wps) / METAS.wpsMin;
  if (m.wps != null && m.wps > METAS.wpsMax) violacoes += (m.wps - METAS.wpsMax) / METAS.wpsMax;
  return violacoes;
}

function passaMetas(m) {
  return m.rajadaMediaS >= METAS.rajadaMediaS
    && m.rajadaMedianaS >= METAS.rajadaMedianaS
    && m.pausaMediaS <= METAS.pausaMediaMaxS
    && m.pctTempoPausa <= METAS.pctPausaMax
    && m.wps != null && m.wps >= METAS.wpsMin && m.wps <= METAS.wpsMax;
}

function main() {
  fs.mkdirSync(DIR_SAIDA, { recursive: true });
  const resultados = [];
  for (const [chave, config] of Object.entries(CONFIGS_V5)) {
    console.log(`\n=== Config ${chave}: ${config.nome} ===`);
    const { arquivo, duracao } = sintetizarTrechoV5(TEXTO_TESTE, config, `teste-fluidez-${chave}`);
    const destino = path.join(DIR_SAIDA, `config-${chave}.wav`);
    fs.copyFileSync(arquivo, destino);
    const m = medirRitmo({ arquivo: destino, palavras: PALAVRAS_TESTE, limiar: 0.02, minPausaS: 0.06 });
    const passou = passaMetas(m);
    const violacoes = pontuarViolacoes(m);
    console.log(`  duração=${duracao.toFixed(2)}s rajadas=${m.numRajadas} rajadaMedia=${m.rajadaMediaS}s rajadaMediana=${m.rajadaMedianaS}s`);
    console.log(`  pausaMedia=${m.pausaMediaS}s %pausa=${m.pctTempoPausa}% wps=${m.wps} -> ${passou ? 'PASSOU' : 'NÃO PASSOU'} (violações=${violacoes.toFixed(3)})`);
    resultados.push({ chave, config, metricas: m, passou, violacoes });
  }

  const aprovadas = resultados.filter((r) => r.passou);
  let escolhida;
  if (aprovadas.length > 0) {
    escolhida = aprovadas.reduce((melhor, r) => (r.config.lengthScale > melhor.config.lengthScale ? r : melhor), aprovadas[0]);
  } else {
    escolhida = resultados.reduce((melhor, r) => (r.violacoes < melhor.violacoes ? r : melhor), resultados[0]);
  }

  console.log('\n=== RESULTADO ===');
  for (const r of resultados) {
    console.log(`${r.chave}: ${r.passou ? 'PASSOU' : 'não passou'} | violações=${r.violacoes.toFixed(3)} | ${JSON.stringify(r.metricas)}`);
  }
  console.log(`\nEscolhida: ${escolhida.chave} (${escolhida.config.nome}) — ${aprovadas.length > 0 ? 'passou nas metas, maior length_scale entre as aprovadas' : 'nenhuma passou, melhor pontuação'}`);

  const relatorio = {
    textoTeste: TEXTO_TESTE, palavras: PALAVRAS_TESTE, metas: METAS,
    resultados: resultados.map((r) => ({ chave: r.chave, config: r.config, metricas: r.metricas, passou: r.passou, violacoes: r.violacoes })),
    escolhida: escolhida.chave,
  };
  fs.writeFileSync(path.join(DIR_SAIDA, 'resultado.json'), JSON.stringify(relatorio, null, 2), 'utf8');
  console.log(`\nSalvo: ${path.join(DIR_SAIDA, 'resultado.json')}`);
}

main();
