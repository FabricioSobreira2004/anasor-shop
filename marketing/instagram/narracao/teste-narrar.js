// ============================================================
//  TESTE LOCAL — narrar.js, checagem de ritmo (sem sintetizar voz)
// ============================================================
//
//  Etapa 3d da code-review (2026-10-31, "notebook do pai"): antes,
//  uma voz sem wpsReferencia própria (cadu/edresson) marcava
//  okRitmo=true SEMPRE — a checagem era pulada de verdade pra essas
//  vozes, não só "sem dado pra comparar". calcularFaixaRitmo() agora
//  sempre compara: usa a referência da própria voz quando existe,
//  senão cai pra referência da voz PADRÃO (jeff/0.7, a escolhida pelo
//  Fabrício — sempre tem wpsReferencia medida).
//
//  Não precisa de ffmpeg/Piper/SAPI — é só a conta de faixa de ritmo.
//      node marketing/instagram/narracao/teste-narrar.js
// ============================================================

const assert = require('node:assert/strict');
const { calcularFaixaRitmo, VOZES, VOZ_PADRAO } = require('./narrar.js');
const { criarRunner } = require('./teste-util.js');

const { teste, finalizar } = criarRunner();

teste('voz SEM wpsReferencia própria cai pra referência da voz padrão (jeff/0.7), não pula a checagem', () => {
  const vozSemReferencia = VOZES.cadu;
  assert.equal(vozSemReferencia.wpsReferencia, null, 'pré-condição: cadu não tem wpsReferencia própria neste catálogo');

  const referenciaPadrao = VOZES[VOZ_PADRAO].wpsReferencia;

  // wps bem dentro da faixa do padrão (jeff/0.7) deve passar.
  const dentro = calcularFaixaRitmo(vozSemReferencia, referenciaPadrao);
  assert.equal(dentro.okRitmo, true, 'wps igual à referência padrão devia passar');
  assert.equal(dentro.usouReferenciaPropria, false);

  // wps MUITO fora da faixa do padrão (ex.: o dobro) tem que FALHAR —
  // com o bug antigo, isto passava sempre (okRitmo hardcoded true).
  const fora = calcularFaixaRitmo(vozSemReferencia, referenciaPadrao * 2);
  assert.equal(fora.okRitmo, false, 'wps o dobro da referência padrão devia falhar, não passar silenciosamente');
});

teste('voz COM wpsReferencia própria usa a própria referência, não a padrão', () => {
  const vozComReferencia = VOZES.faber;
  assert.equal(typeof vozComReferencia.wpsReferencia, 'number', 'pré-condição: faber tem wpsReferencia própria');

  const r = calcularFaixaRitmo(vozComReferencia, vozComReferencia.wpsReferencia);
  assert.equal(r.okRitmo, true);
  assert.equal(r.usouReferenciaPropria, true);

  // Faixa calculada deve vir da referência do FABER, não da do jeff
  // (são valores bem diferentes — ritmos 0.4 vs 0.7 de vozes distintas).
  assert.notEqual(r.faixa[0], VOZES[VOZ_PADRAO].wpsReferencia * 0.85);
});

teste('a voz padrão (jeff/0.7) sempre tem wpsReferencia própria — nunca cai no próprio fallback', () => {
  assert.equal(typeof VOZES[VOZ_PADRAO].wpsReferencia, 'number');
});

finalizar();
