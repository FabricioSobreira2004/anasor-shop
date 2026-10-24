// ============================================================
//  CPF, TELEFONE E NOME — validação e formatação (backend)
// ============================================================
//
//  POR QUE ESTE ARQUIVO EXISTE
//  ---------------------------------------------------------
//  A Anasor emite nota fiscal com os dados que o cliente digita no
//  checkout — então nome completo, CPF e telefone passaram a ser
//  OBRIGATÓRIOS e precisam ser checados no SERVIDOR (o navegador é só a
//  1ª camada: dá pra mandar qualquer coisa pro /api/checkout via curl).
//  As mesmas regras moram em js/checkout.js, pra UX; aqui é quem decide.
//  Um módulo só porque dois lugares usam: server.js (validar) e
//  pedido-email.js (mostrar o CPF/telefone formatados no e-mail).
// ============================================================

const soDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// CPF de verdade: 11 dígitos, não todos iguais (111.111.111-11 passa no
// cálculo mas não existe) e os 2 dígitos verificadores batem com o
// algoritmo público da Receita (módulo 11). Sem isto, um CPF digitado
// errado só seria descoberto na hora de emitir a nota.
function cpfValido(valor) {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digitoVerificador = (base) => {
    // pesos decrescentes (10..2 pro 1º dígito, 11..2 pro 2º)
    const soma = [...base].reduce((total, n, i) => total + Number(n) * (base.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digitoVerificador(d.slice(0, 9)) === Number(d[9]) && digitoVerificador(d.slice(0, 10)) === Number(d[10]);
}

// Só os dígitos do telefone, SEM o código do país: autopreenchimento e
// "colar" costumam trazer "+55 21 98722-2679" (13 dígitos), que senão
// seria recusado (achado do code-review). Só corta o 55 quando sobram
// dígitos demais pra um número nacional — 55 também é DDD de verdade
// (RS), e "55 9xxxx-xxxx" (11 dígitos) fica como está.
function normalizarTelefone(valor) {
  const d = soDigitos(valor);
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d;
}

// Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular, que
// sempre começa com 9 depois do DDD). DDD não começa com 0. Só a
// FORMA — não dá pra saber se o número existe.
function telefoneValido(valor) {
  const d = normalizarTelefone(valor);
  if (!/^[1-9]\d/.test(d)) return false;
  return d.length === 10 || (d.length === 11 && d[2] === '9');
}

// "Nome completo" = pelo menos 2 palavras com letra (nome + sobrenome).
// \p{L}: aceita acentos e nomes de qualquer idioma, recusa "Maria 2".
function nomeCompletoValido(valor) {
  const palavras = String(valor ?? '').trim().split(/\s+/).filter((p) => /\p{L}/u.test(p));
  return palavras.length >= 2;
}

// Separa "Maria da Silva" em { nome: 'Maria', sobrenome: 'da Silva' } —
// o payer da Preference do Mercado Pago tem os 2 campos separados.
function separarNome(nomeCompleto) {
  const partes = String(nomeCompleto ?? '').trim().split(/\s+/).filter(Boolean);
  return { nome: partes[0] || '', sobrenome: partes.slice(1).join(' ') };
}

// 12345678909 -> 123.456.789-09 (o formato que vai pra nota). Valor que
// não tem 11 dígitos volta como veio (melhor mostrar o que existe do
// que esconder).
function formatarCpf(valor) {
  const d = soDigitos(valor);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : String(valor ?? '').trim();
}

// 21987222679 -> (21) 98722-2679; 2133334444 -> (21) 3333-4444.
function formatarTelefone(valor) {
  const d = soDigitos(valor);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(valor ?? '').trim();
}

module.exports = { soDigitos, normalizarTelefone, cpfValido, telefoneValido, nomeCompletoValido, separarNome, formatarCpf, formatarTelefone };
