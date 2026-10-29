#!/usr/bin/env node
// ============================================================
// Servidor local SÓ PARA CAPTURA (Rodada 4 — Tour do Site).
//
// `js/checkout.js` documenta que testar front+backend juntos, local,
// se faz com `vercel dev` (front e /api no mesmo endereço, como em
// produção). Não usamos isso aqui porque este repositório não está
// linkado a uma conta Vercel nesta máquina — `vercel dev` pediria
// login interativo, algo que só o Fabrício pode fazer (ver
// DECISOES.md). Este wrapper faz a MESMA coisa que `api/index.js` já
// faz na Vercel (reexportar o app Express de backend/server.js), só
// que aqui SOMOS NÓS quem adiciona o `express.static` da raiz do site
// — backend/server.js nunca serve HTML, só /api/* (ver server.js:
// não há nenhum express.static lá, de propósito).
//
// NÃO toca em backend/server.js, vercel.json nem api/index.js.
//
// Uso (PowerShell, dentro de marketing/instagram/tour):
//   $env:FORCAR_DEMO = '1'
//   node src/servidor-local.js
// Confirme a linha "🔒 MODO DEMONSTRAÇÃO FORÇADO" no log antes de
// abrir qualquer página. Porta 8765 (o próprio padrão de BASE_URL em
// server.js) — assim o checkout gera links consistentes.
const path = require('path');
const express = require('express');

if (process.env.FORCAR_DEMO !== '1') {
  console.error('❌ Rode com $env:FORCAR_DEMO=\'1\' antes — este servidor é só para captura, nunca para pagamento real.');
  process.exit(1);
}

const RAIZ = path.resolve(__dirname, '..', '..', '..', '..'); // anasor-shop
const apiApp = require(path.join(RAIZ, 'backend', 'server.js')); // mesma técnica de api/index.js — não chama app.listen() porque é require(), não execução direta

const app = express();
app.use(apiApp); // rotas /api/* já vêm prontas de dentro do app importado; o que não bater cai (next()) pro static abaixo
app.use(express.static(RAIZ));

const PORTA = Number(process.env.PORT) || 8765;
app.listen(PORTA, () => {
  console.log(`\n  Tour do Site — servidor de captura no ar em http://localhost:${PORTA}`);
  console.log('  (front-end estático da raiz + API de backend/server.js — só para captura, nunca publica nada)\n');
});
