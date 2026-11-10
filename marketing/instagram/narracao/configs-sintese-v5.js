// Configurações de síntese testadas na Rodada 12 (narração v5) — ver
// narracao-amostras/fluidez/ (áudios) e DECISOES.md (medição e
// escolha). Todas usam noise_scale 0,667 e noise_w 0,8 (variação
// natural de ritmo, pedido explícito) e sentence_silence curto
// (~0,15s) — só o length_scale/voz muda entre elas.
const path = require('path');

const PIPER_MODELOS = 'E:/projetos/_tmp/piper-modelos';

const CONFIGS_V5 = {
  A: {
    nome: 'A — jeff 0.7 (atual)', modelo: path.join(PIPER_MODELOS, 'pt_BR-jeff-medium.onnx'),
    lengthScale: 0.7, noiseScale: 0.667, noiseWScale: 0.8, sentenceSilence: 0.15,
  },
  B: {
    nome: 'B — jeff 0.85', modelo: path.join(PIPER_MODELOS, 'pt_BR-jeff-medium.onnx'),
    lengthScale: 0.85, noiseScale: 0.667, noiseWScale: 0.8, sentenceSilence: 0.15,
  },
  C: {
    nome: 'C — jeff 1.0', modelo: path.join(PIPER_MODELOS, 'pt_BR-jeff-medium.onnx'),
    lengthScale: 1.0, noiseScale: 0.667, noiseWScale: 0.8, sentenceSilence: 0.15,
  },
  D: {
    nome: 'D — faber 0.9', modelo: path.join(PIPER_MODELOS, 'pt_BR-faber-medium.onnx'),
    lengthScale: 0.9, noiseScale: 0.667, noiseWScale: 0.8, sentenceSilence: 0.15,
  },
};

// Medição real (teste-fluidez-v5.js, narracao-amostras/fluidez/resultado.json,
// Rodada 12): NENHUMA das 4 passou nas metas rígidas (rajada>=1,5s,
// pausa interna<=0,30s, <=22% do tempo em pausa, wps 2,6-3,2) — é
// comportamento do próprio modelo Piper (pausa prosódica entre
// cláusulas), mesmo achado já registrado na Rodada 9 pra jeff/0.7.
// D (faber 0.9) teve a MENOR pontuação de violação (3 das 5 métricas
// dentro da meta: pausa média 0,217s, %pausa 25,2%, wps 3,19) —
// escolhida como padrão. Ver DECISOES.md pro detalhe completo.
const CONFIG_PADRAO_V5 = 'D';

module.exports = { CONFIGS_V5, CONFIG_PADRAO_V5, PIPER_MODELOS };
