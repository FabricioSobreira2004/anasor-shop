// Perfis de dispositivo da captura (Rodada 4 — Tour do Site). Pedido
// explícito: celular iPhone 15 (393×852, deviceScaleFactor 3, toques
// reais) e desktop 1440×900 (deviceScaleFactor 2).
const { devices } = require('playwright');

const MOBILE = {
  ...devices['iPhone 15'],
  deviceScaleFactor: 3, // o preset do Playwright já costuma vir em 3, mas o pedido foi explícito — não depender do valor do preset mudar numa atualização
  viewport: { width: 393, height: 852 },
};

const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  isMobile: false,
  hasTouch: false,
};

const FPS = 30;

// Limite de velocidade de rolagem (px CSS/segundo) — pedido explícito
// da Rodada 6, item B: rolagem "humana e delicada", nunca um arrasto
// forçado. Validado por código (ver `validarVelocidade` em
// captura-ferramentas.js) com o scrollY real medido quadro a quadro,
// não só pela conta teórica.
const VELOCIDADE_MAX_PX_S = { mobile: 450, desktop: 600 };

// ---------------------------------------------------------------
// Fixtures de captura compartilhadas entre cenas-mobile.js e
// cenas-desktop.js (achado do simplify: estavam duplicadas em cada
// arquivo, ou um importava do outro sem necessidade).
// ---------------------------------------------------------------
// Produto usado na galeria/vídeo/medidas/upsell: id 32 (Kit 3 Xícaras
// de Café Terra Escura) — tem vídeo, 2 fotos extras e subcategoria
// ("Conjuntos Artesanais"), disponível (não é o vendido-de-exemplo).
const ID_PRODUTO_PRINCIPAL = 32;
// Peça vendida de exemplo (disponivel:false) já usada nos checks de
// produção do CLAUDE.md — mesma peça, sem precisar escolher outra.
const ID_PRODUTO_VENDIDO = 33;

const CPF_TESTE = '11144477735'; // algoritmicamente válido (checksum módulo 11 conferido à mão) — NUNCA de uma pessoa real
const CEP_TESTE = '01310100'; // Av. Paulista — endereço público conhecido, só pra ver o ViaCEP preencher a tela

module.exports = { MOBILE, DESKTOP, FPS, VELOCIDADE_MAX_PX_S, ID_PRODUTO_PRINCIPAL, ID_PRODUTO_VENDIDO, CPF_TESTE, CEP_TESTE };
