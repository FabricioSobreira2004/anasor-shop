require('./fontes'); // Fraunces + Jost (ver fontes.js) — ANTES de registrar a raiz
const { registerRoot } = require('remotion');
const { RemotionRoot } = require('./Root');

registerRoot(RemotionRoot);
