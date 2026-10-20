// ============================================================
//  CHECKOUT (checkout.html)
// ============================================================
//
//  O FLUXO DESTA PÁGINA HOJE (Mercado Pago SEM credenciais ainda):
//    1. Lê o carrinho do localStorage — a MESMA fonte de dados do
//       mini-carrinho (lerCarrinho(), CHAVE_CARRINHO, formatarPreco()
//       e renderBreadcrumb() vêm de js/main.js, carregado ANTES deste
//       arquivo — é por isso que dá pra usar essas funções direto
//       aqui, sem importar nada: são scripts "clássicos" no mesmo
//       escopo global, mesmo esquema já usado em produto.js/ceramica.js).
//    2. Monta o resumo do pedido (itens, subtotal, frete, total).
//    3. Valida o formulário de dados do cliente EM TEMPO REAL, no
//       MESMO padrão do formulário de contato da Home (blur mostra o
//       erro, input some com ele quando o valor fica válido — ver a
//       seção "VALIDAÇÃO EM TEMPO REAL DO FORMULÁRIO DE CONTATO" em
//       js/main.js; a lógica aqui é irmã daquela, não importada dela,
//       porque os campos/regras são bem diferentes).
//    4. No submit, envia { cliente, endereco, itens } pro backend
//       (POST /api/checkout). O backend recalcula o total sozinho
//       (NUNCA confia no preço vindo do navegador) e devolve um
//       "checkout_url" — HOJE um link FAKE pra pedido-pendente.html
//       (ver o TODO grande em backend/server.js). Quando o Mercado
//       Pago estiver configurado de verdade, esse MESMO endpoint passa
//       a devolver o link real da Preference da API do MP — nada aqui
//       no front precisa mudar quando isso acontecer.
// ============================================================


// ---------- CONFIG ----------
// URL do backend. Fixa por enquanto (ambiente de desenvolvimento local,
// backend rodando com "cd backend && npm start" na porta 3001 — ver
// backend/server.js). Quando o site for pro ar, isso precisa vir de
// uma configuração de build/deploy (mesmo domínio via proxy reverso,
// ou um valor injetado no HTML na hora do deploy) — TODO.
const API_BASE = 'http://localhost:3001';

// Mesmo limiar de frete grátis já anunciado na barra do topo e nos
// selos de confiança do site ("Frete Grátis para todo o Brasil em
// compras acima de R$ 200") — um valor só, comentado aqui, em vez de
// espalhar "200" solto por vários arquivos. Precisa estar declarado
// AQUI (antes do bloco "if/else" logo abaixo, que já chama
// montarResumo()) — "const" não sobe pro topo do jeito que "function"
// sobe; declarar isso lá embaixo, perto de montarResumo(), quebraria
// com "Cannot access before initialization".
const LIMIAR_FRETE_GRATIS = 200;

const vazioEl = document.querySelector('#checkout-vazio');
const conteudoEl = document.querySelector('#checkout-conteudo');
const form = document.querySelector('#form-checkout');

// breadcrumb sempre aparece, tenha carrinho ou não
renderBreadcrumb(document.querySelector('#breadcrumb'), [
  { rotulo: 'Home', href: 'index.html' },
  { rotulo: 'Checkout' },
]);

const carrinho = lerCarrinho(); // vem de js/main.js

// ---------- CARRINHO VAZIO: nada pra revisar nem pagar ----------
// Mesma ideia do "produto não encontrado" em produto.html: os dois
// blocos nascem "hidden" no HTML e o JS decide qual mostrar, evitando
// piscar o formulário vazio antes de sabermos se há itens ou não.
if (carrinho.length === 0) {
  vazioEl.hidden = false;
} else {
  conteudoEl.hidden = false;
  montarResumo(carrinho);
  ligarValidacaoForm(carrinho);
}


// ============================================================
//  RESUMO DO PEDIDO (coluna direita)
// ============================================================
// (LIMIAR_FRETE_GRATIS é declarado lá em cima, na seção CONFIG — ver
// o comentário lá explicando por quê.)
function montarResumo(itens) {
  const listaEl = document.querySelector('#checkout-itens');

  listaEl.innerHTML = itens
    .map((item) => {
      // A imagem vem do PRÓPRIO item salvo no carrinho (ver
      // adicionarAoCarrinho, js/main.js) — mesma correção aplicada em
      // renderMiniCarrinho(). O find() no array "produtos" fica só de
      // FALLBACK, pra itens salvos no localStorage antes dessa
      // correção (sem "imagem" gravada ainda) — e AGORA também serve
      // pra buscar "precoOriginal" (ver abaixo), que nunca é salvo no
      // carrinho (só o preço já cobrado, "item.preco", é gravado ali).
      const prod = produtos.find((p) => String(p.id) === String(item.id));
      const foto = item.imagem || prod?.imagem || '';

      // DESCONTO (pedido item 4: "se o produto tiver precoOriginal,
      // mostre preço riscado + selo"). Comparo prod.precoOriginal com
      // item.preco (o valor REALMENTE cobrado, travado no momento em
      // que a peça entrou no carrinho) — de propósito NÃO reaproveito
      // estaEmPromocao()/descontoPercentual() (main.js) como estão,
      // porque aquelas comparam com prod.preco, o preço ATUAL do
      // catálogo. Se a promoção tiver mudado (ou terminado) entre o
      // item entrar no carrinho e a pessoa chegar no checkout, prod.preco
      // já não seria mais igual a item.preco, e o desconto mostrado
      // aqui ficaria errado. Calculando em cima de item.preco, o "de/
      // por" exibido é sempre fiel ao que a pessoa efetivamente vai
      // pagar por ESTE pedido, não ao estado atual (possivelmente
      // diferente) do catálogo.
      const precoOriginal =
        prod && typeof prod.precoOriginal === 'number' && prod.precoOriginal > item.preco
          ? prod.precoOriginal
          : null;
      const percentualOff = precoOriginal
        ? Math.round((1 - item.preco / precoOriginal) * 100)
        : null;

      const subtotalItem = item.preco * item.quantidade;
      return `
        <li class="checkout-resumo__item">
          <img src="${foto}" alt="" loading="lazy">
          <div class="checkout-resumo__item-info">
            <p class="checkout-resumo__item-nome">${item.nome}</p>
            <p class="checkout-resumo__item-qtd">
              ${item.quantidade} &times;
              ${precoOriginal ? `<s class="checkout-resumo__item-preco-original">${formatarPreco(precoOriginal)}</s>` : ''}
              ${formatarPreco(item.preco)}
              ${precoOriginal ? `<span class="checkout-resumo__item-off">${percentualOff}% OFF</span>` : ''}
            </p>
          </div>
          <strong>${formatarPreco(subtotalItem)}</strong>
        </li>`;
    })
    .join('');

  const subtotal = itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  const freteGratis = subtotal >= LIMIAR_FRETE_GRATIS;

  document.querySelector('#checkout-subtotal').textContent = formatarPreco(subtotal);

  // FRETE: ≥ R$200 -> aplica a promoção já anunciada no site (grátis).
  // Abaixo disso, ainda NÃO calculamos frete de verdade (isso depende
  // de uma integração futura com Correios/transportadora a partir do
  // CEP) — em vez de inventar um valor, mostramos um placeholder
  // honesto. TODO: quando essa integração existir, trocar o texto
  // "A calcular" por um valor real assim que o campo CEP for validado,
  // e SOMAR esse valor no total abaixo.
  document.querySelector('#checkout-frete').innerHTML = freteGratis
    ? '<span class="checkout-resumo__frete-gratis">Frete Grátis</span>'
    : '<span class="checkout-resumo__frete-calcular">A calcular</span>';

  // total exibido = só o subtotal por enquanto: o frete "a calcular"
  // conscientemente NÃO soma nada ainda (seria inventar um número).
  document.querySelector('#checkout-total').textContent = formatarPreco(subtotal);

  return { subtotal, freteGratis };
}


// ============================================================
//  FORMULÁRIO DE DADOS DO CLIENTE (coluna esquerda)
// ============================================================
function ligarValidacaoForm(itensCarrinho) {
  const botaoEnviar = document.querySelector('#btn-finalizar-pedido');
  const erroEnvioEl = document.querySelector('#erro-envio-pedido');

  // ---------- MÁSCARAS (formatação ao digitar) ----------
  // Cada uma recebe o valor CRU do campo e devolve o texto já
  // pontuado. Trabalham só com os DÍGITOS (soDigitos) pra não
  // importar se a pessoa colou o valor já formatado, com espaços etc.
  const soDigitos = (v) => v.replace(/\D/g, '');

  function formatarCPF(v) {
    const d = soDigitos(v).slice(0, 11);
    const partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
    let resultado = partes.join('.');
    const digitosVerificadores = d.slice(9, 11);
    if (digitosVerificadores) resultado += `-${digitosVerificadores}`;
    return resultado;
  }

  function formatarCEP(v) {
    const d = soDigitos(v).slice(0, 8);
    const parte1 = d.slice(0, 5);
    const parte2 = d.slice(5, 8);
    return parte2 ? `${parte1}-${parte2}` : parte1;
  }

  function formatarTelefone(v) {
    const d = soDigitos(v).slice(0, 11);
    if (d.length === 0) return '';
    const ddd = d.slice(0, 2);
    const resto = d.slice(2);
    if (d.length <= 2) return `(${ddd}`;
    if (resto.length <= 4) return `(${ddd}) ${resto}`;
    // fixo = 8 dígitos depois do DDD (bloco 4+4); celular = 9 (5+4).
    // Decidimos pelo TOTAL de dígitos já digitados, não por uma opção
    // marcada em algum lugar — assim o campo reagе sozinho conforme a
    // pessoa digita um número de celular (11) ou fixo (10).
    const tamanhoPrimeiroBloco = d.length > 10 ? 5 : 4;
    const bloco1 = resto.slice(0, tamanhoPrimeiroBloco);
    const bloco2 = resto.slice(tamanhoPrimeiroBloco);
    return bloco2 ? `(${ddd}) ${bloco1}-${bloco2}` : `(${ddd}) ${bloco1}`;
  }

  // Liga uma máscara a um campo: a cada tecla, reformata o valor.
  // LIMITAÇÃO CONHECIDA: o cursor sempre vai pro FIM do texto depois
  // de reformatar (em vez de manter a posição exata onde a pessoa
  // estava digitando). Pra estes campos curtos (CPF/CEP/telefone),
  // digitados quase sempre "para frente", isso é imperceptível na
  // prática; resolver direito exigiria uma biblioteca de máscara —
  // fora de escopo por agora.
  function aplicarMascara(nomeCampo, formatar) {
    const el = form.querySelector(`[name="${nomeCampo}"]`);
    el.addEventListener('input', () => {
      el.value = formatar(el.value);
    });
  }

  aplicarMascara('cpf', formatarCPF);
  aplicarMascara('cep', formatarCEP);
  aplicarMascara('telefone', formatarTelefone);

  // ---------- REGRAS DE VALIDAÇÃO ----------
  // Mesmo formato do form de contato (js/main.js): cada campo tem o
  // elemento, o <span> de erro, uma função "valida" e a mensagem.
  //
  // CAMPOS OBRIGATÓRIOS agora são só 3: nome, e-mail e CEP (pedido
  // explícito — o resto vira atrito sem necessidade real hoje: o
  // backend não usa telefone/CPF pra nada ainda, e o endereço
  // detalhado só serve pra entrega, que por enquanto é combinada
  // "manualmente" mesmo, então o CEP sozinho já é suficiente pra
  // seguir o pedido). Os demais continuam com uma REGRA DE FORMATO
  // (a mesma de antes) mas agora só entram em vigor se a pessoa
  // digitou algo: vazio passa reto (campo opcional, ninguém é
  // obrigado a preencher), preenchido ERRADO continua acusando erro —
  // não faz sentido aceitar um "CPF" ou "CEP" mal formado só porque o
  // campo virou opcional; opcional é sobre PRECISAR preencher, não
  // sobre aceitar qualquer coisa quando a pessoa preenche.
  const opcional = (formatoValido) => (v) => v.trim() === '' || formatoValido(v);

  const campos = [
    {
      el: form.querySelector('[name="nome"]'),
      erroEl: document.querySelector('#erro-nome'),
      // "nome COMPLETO": exige pelo menos um espaço (nome + sobrenome),
      // não só qualquer texto não-vazio. OBRIGATÓRIO.
      valida: (v) => v.trim().split(/\s+/).filter(Boolean).length >= 2,
      msg: 'Digite seu nome completo (nome e sobrenome).',
    },
    {
      el: form.querySelector('[name="email"]'),
      erroEl: document.querySelector('#erro-email'),
      // mesma regex "boa o suficiente" do form de contato — não cobre
      // todo e-mail exótico, mas barra os erros óbvios. OBRIGATÓRIO.
      valida: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: 'Digite um e-mail válido (ex.: nome@email.com).',
    },
    {
      el: form.querySelector('[name="telefone"]'),
      erroEl: document.querySelector('#erro-telefone'),
      // OPCIONAL: aceita (XX) XXXX-XXXX (fixo) OU (XX) XXXXX-XXXX
      // (celular) — é exatamente o formato que formatarTelefone() produz.
      valida: opcional((v) => /^\(\d{2}\) \d{4,5}-\d{4}$/.test(v.trim())),
      msg: 'Digite um telefone válido, com DDD (ou deixe em branco).',
    },
    {
      el: form.querySelector('[name="cpf"]'),
      erroEl: document.querySelector('#erro-cpf'),
      // OPCIONAL. Quando preenchido, só o FORMATO (3-3-3-2 dígitos com
      // pontuação) é validado aqui.
      // TODO: validar o DÍGITO VERIFICADOR de verdade — os 2 últimos
      // números são calculados a partir dos 9 primeiros por um
      // algoritmo público (módulo 11); vale a pena implementar quando
      // o CPF passar a ser usado pra algo que exija ele ser real de
      // fato (ex.: emissão de nota fiscal), não só formatado.
      valida: opcional((v) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v.trim())),
      msg: 'Digite um CPF válido, no formato 000.000.000-00 (ou deixe em branco).',
    },
    {
      el: form.querySelector('[name="cep"]'),
      erroEl: document.querySelector('#erro-cep'),
      // OBRIGATÓRIO — é o único dado de endereço que continua
      // bloqueando o envio (necessário pra calcular frete/entrega).
      valida: (v) => /^\d{5}-\d{3}$/.test(v.trim()),
      msg: 'Digite um CEP válido, no formato 00000-000.',
    },
    {
      el: form.querySelector('[name="rua"]'),
      erroEl: document.querySelector('#erro-rua'),
      // OPCIONAL: sem regra de formato pra "texto livre" — só passa a
      // exigir NÃO-VAZIO se a pessoa começar a preencher e apagar tudo
      // de novo, o que já é coberto por opcional() (vazio = válido).
      valida: opcional((v) => v.trim().length > 0),
      msg: 'Digite a rua ou avenida (ou deixe em branco).',
    },
    {
      el: form.querySelector('[name="numero"]'),
      erroEl: document.querySelector('#erro-numero'),
      valida: opcional((v) => v.trim().length > 0),
      msg: 'Digite o número (ou "S/N"), ou deixe em branco.',
    },
    {
      el: form.querySelector('[name="complemento"]'),
      erroEl: document.querySelector('#erro-complemento'),
      // já era OPCIONAL antes desta mudança: sempre válido, nunca
      // trava o botão nem mostra erro.
      valida: () => true,
      msg: '',
    },
    {
      el: form.querySelector('[name="bairro"]'),
      erroEl: document.querySelector('#erro-bairro'),
      valida: opcional((v) => v.trim().length > 0),
      msg: 'Digite o bairro (ou deixe em branco).',
    },
    {
      el: form.querySelector('[name="cidade"]'),
      erroEl: document.querySelector('#erro-cidade'),
      valida: opcional((v) => v.trim().length > 0),
      msg: 'Digite a cidade (ou deixe em branco).',
    },
    {
      el: form.querySelector('[name="estado"]'),
      erroEl: document.querySelector('#erro-estado'),
      // ANTES exigia "v !== ''" (a option vazia "--" travava o envio —
      // UF era obrigatória). Agora vira sempre válido: não escolher UF
      // não deve mais bloquear o formulário, igual aos outros campos
      // de endereço. Não dá pra usar o helper opcional() aqui (ele
      // testa string vazia; um <select> sem opção marcada TAMBÉM é
      // ""), mas o resultado é o mesmo: sempre passa.
      valida: () => true,
      msg: '',
    },
  ];

  // mostra (ou limpa) o erro de UM campo — idêntico ao do form de
  // contato: "mostrar=false" só limpa, nunca exibe (usado enquanto a
  // pessoa ainda digita sem nunca ter saído do campo).
  function validarCampo(campo, mostrar) {
    const ok = campo.valida(campo.el.value);
    campo.el.classList.toggle('invalido', !ok && mostrar);
    campo.erroEl.textContent = !ok && mostrar ? campo.msg : '';
    return ok;
  }

  function formValido() {
    return campos.every((c) => c.valida(c.el.value));
  }

  function atualizarBotao() {
    botaoEnviar.disabled = !formValido();
  }

  campos.forEach((campo) => {
    // <select> não tem "digitar", então usamos "change" no lugar de
    // "input" pra ele — o resto do comportamento (blur mostra erro) é
    // igual pros dois tipos de campo.
    const eventoDigitar = campo.el.tagName === 'SELECT' ? 'change' : 'input';

    campo.el.addEventListener('blur', () => {
      validarCampo(campo, true);
      atualizarBotao();
    });
    campo.el.addEventListener(eventoDigitar, () => {
      if (campo.el.classList.contains('invalido')) {
        validarCampo(campo, true);
      }
      atualizarBotao();
    });
  });

  atualizarBotao(); // começa desabilitado (form vazio)

  // ---------- ENVIO: manda pro backend, que devolve o link de pagamento ----------
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // nunca deixa o navegador recarregar a página

    // revalida tudo mostrando erros (defesa caso o "disabled" seja
    // burlado, ex.: reativado via devtools)
    const tudoOk = campos.map((campo) => validarCampo(campo, true)).every(Boolean);
    if (!tudoOk) return;

    const valorDe = (nome) => form.querySelector(`[name="${nome}"]`).value.trim();

    const payload = {
      cliente: {
        nome: valorDe('nome'),
        email: valorDe('email'),
        telefone: valorDe('telefone'),
        cpf: valorDe('cpf'),
      },
      endereco: {
        cep: valorDe('cep'),
        rua: valorDe('rua'),
        numero: valorDe('numero'),
        complemento: valorDe('complemento'), // pode vir vazio, é opcional
        bairro: valorDe('bairro'),
        cidade: valorDe('cidade'),
        estado: valorDe('estado'),
      },
      // só id + quantidade: o PREÇO não viaja daqui — o backend
      // recalcula tudo a partir do próprio catálogo dele (nunca confia
      // no preço vindo do navegador, que poderia ter sido adulterado).
      itens: itensCarrinho.map((item) => ({ id: item.id, quantidade: item.quantidade })),
    };

    erroEnvioEl.textContent = '';
    botaoEnviar.disabled = true;
    const textoOriginal = botaoEnviar.textContent;
    botaoEnviar.textContent = 'Processando...';

    try {
      const resposta = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        // o backend respondeu, mas com erro (ex.: 400 por item inválido)
        const erroBody = await resposta.json().catch(() => ({}));
        throw new Error(erroBody.erro || `O servidor recusou o pedido (HTTP ${resposta.status}).`);
      }

      const dados = await resposta.json();
      if (!dados.checkout_url) {
        throw new Error('O servidor não devolveu um link de pagamento.');
      }

      // Vai pro Mercado Pago. HOJE esse link é FAKE (aponta pra
      // pedido-pendente.html — ver TODO em backend/server.js); quando
      // o MP estiver configurado, o backend passa a devolver o link
      // real da Preference da API dele, e esta linha nem precisa mudar.
      window.location.href = dados.checkout_url;
    } catch (erro) {
      console.error('Erro ao iniciar o checkout:', erro);
      erroEnvioEl.textContent =
        'Não foi possível conectar ao servidor de pagamento agora. ' +
        'Verifique se o backend está rodando (cd backend && npm start) e tente de novo.';
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = textoOriginal;
    }
  });
}
