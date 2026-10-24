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
// URL do backend. String VAZIA de propósito: na Vercel, o backend
// (backend/server.js) roda como função serverless no MESMO domínio do
// front (ver vercel.json + api/index.js) — então "/api/checkout" já
// chega no lugar certo sem precisar de host nenhum na frente. Isso
// troca o endereço fixo "http://localhost:3001" que só funcionava
// rodando o backend solto em dev; pra testar front+backend juntos
// como na Vercel, local, usar "vercel dev" na raiz do projeto (ele
// serve o estático E a função /api no mesmo endereço, exatamente como
// em produção).
const API_BASE = '';

// Frete grátis para QUALQUER compra, em todo o Brasil (decisão do
// dono, Etapa 1: custo já embutido no preço das peças) — não existe
// mais limiar nenhum. REMOVIDO: a antiga constante LIMIAR_FRETE_GRATIS
// (200) e o "if" que só liberava frete grátis acima dela; ver
// montarResumo(), mais abaixo, onde "Grátis" agora é incondicional.

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

  document.querySelector('#checkout-subtotal').textContent = formatarPreco(subtotal);

  // FRETE: sempre grátis (decisão do dono, Etapa 1 — custo já embutido
  // no preço das peças, ver js/produtos.js). Incondicional agora: não
  // existe mais "A calcular" nem limiar por valor de compra.
  document.querySelector('#checkout-frete').innerHTML =
    '<span class="checkout-resumo__frete-gratis">Frete Grátis</span>';

  // total = subtotal (frete não soma nada, é sempre grátis)
  document.querySelector('#checkout-total').textContent = formatarPreco(subtotal);

  return { subtotal };
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
  // CAMPOS OBRIGATÓRIOS (Etapa 3, AJUSTADO — pedido explícito): nome,
  // e-mail, CEP, rua, número, bairro, cidade e UF — sem endereço
  // completo a Anasor não consegue enviar a peça (o CEP sozinho não
  // bastava de verdade). Só o complemento continua opcional (telefone
  // e CPF viraram obrigatórios, ver abaixo). Rua/bairro/cidade/UF chegam quase sempre PRONTOS pelo
  // autopreenchimento do ViaCEP (ver buscarEnderecoPorCep, mais
  // abaixo) — exigi-los não é o mesmo atrito de digitar tudo à mão.
  //
  // ATUALIZADO (nota fiscal): telefone e CPF passaram a ser
  // OBRIGATÓRIOS — a Anasor emite a nota com nome completo + CPF e
  // combina a entrega pelo WhatsApp. As MESMAS regras rodam no servidor
  // (backend/documentos.js); aqui é só pra pessoa ver o erro na hora.
  const obrigatorio = (formatoValido) => (v) => v.trim() !== '' && formatoValido(v);
  const textoLivre = (v) => v.trim().length > 0;

  // CPF real: 11 dígitos, não todos iguais e os 2 dígitos verificadores
  // conferem (módulo 11, algoritmo público da Receita). Mesmo cálculo de
  // cpfValido() em backend/documentos.js.
  function cpfValido(v) {
    const d = soDigitos(v);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const digitoVerificador = (base) => {
      const soma = [...base].reduce((total, n, i) => total + Number(n) * (base.length + 1 - i), 0);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    return digitoVerificador(d.slice(0, 9)) === Number(d[9]) && digitoVerificador(d.slice(0, 10)) === Number(d[10]);
  }

  const campos = [
    {
      el: form.querySelector('[name="nome"]'),
      erroEl: document.querySelector('#erro-nome'),
      // "nome COMPLETO": pelo menos 2 palavras com letra (nome +
      // sobrenome) — "Maria 2" não passa. OBRIGATÓRIO (vai na nota).
      valida: (v) => v.trim().split(/\s+/).filter((p) => /\p{L}/u.test(p)).length >= 2,
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
      // OBRIGATÓRIO: (XX) XXXX-XXXX (fixo) ou (XX) 9XXXX-XXXX (celular)
      // — o formato que formatarTelefone() produz; DDD não começa com 0.
      // Mesma regra de telefoneValido() em backend/documentos.js.
      valida: (v) => /^\([1-9]\d\) (\d{4}|9\d{4})-\d{4}$/.test(v.trim()),
      msg: 'Digite seu telefone/WhatsApp com DDD, ex.: (21) 98722-2679.',
    },
    {
      el: form.querySelector('[name="cpf"]'),
      erroEl: document.querySelector('#erro-cpf'),
      // OBRIGATÓRIO (vai na nota fiscal): formato 000.000.000-00 E
      // dígitos verificadores corretos — pega o erro de digitação aqui,
      // não na hora de emitir a nota.
      valida: (v) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v.trim()) && cpfValido(v),
      msg: 'CPF inválido. Confira os números (formato 000.000.000-00).',
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
      valida: obrigatorio(textoLivre),
      msg: 'Digite a rua ou avenida.',
    },
    {
      el: form.querySelector('[name="numero"]'),
      erroEl: document.querySelector('#erro-numero'),
      valida: obrigatorio(textoLivre),
      msg: 'Digite o número (ou "S/N").',
    },
    {
      el: form.querySelector('[name="complemento"]'),
      erroEl: document.querySelector('#erro-complemento'),
      // continua OPCIONAL: sempre válido, nunca trava o botão nem
      // mostra erro (nem todo endereço tem apto/bloco/referência).
      valida: () => true,
      msg: '',
    },
    {
      el: form.querySelector('[name="bairro"]'),
      erroEl: document.querySelector('#erro-bairro'),
      valida: obrigatorio(textoLivre),
      msg: 'Digite o bairro.',
    },
    {
      el: form.querySelector('[name="cidade"]'),
      erroEl: document.querySelector('#erro-cidade'),
      valida: obrigatorio(textoLivre),
      msg: 'Digite a cidade.',
    },
    {
      el: form.querySelector('[name="estado"]'),
      erroEl: document.querySelector('#erro-estado'),
      // volta a ser OBRIGATÓRIO (Etapa 3): a option vazia "--" não
      // passa (textoLivre rejeita string vazia).
      valida: obrigatorio(textoLivre),
      msg: 'Selecione o estado (UF).',
    },
  ];

  // mostra (ou limpa) o erro de UM campo — idêntico ao do form de
  // contato: "mostrar=false" só limpa, nunca exibe (usado enquanto a
  // pessoa ainda digita sem nunca ter saído do campo).
  function validarCampo(campo, mostrar) {
    const ok = campo.valida(campo.el.value);
    campo.el.classList.toggle('invalido', !ok && mostrar);
    // aria-invalid: leitor de tela anuncia "inválido" no próprio campo
    // (a mensagem em si já é lida pelo aria-describedby + aria-live do
    // <span> de erro, ver checkout.html)
    if (!ok && mostrar) campo.el.setAttribute('aria-invalid', 'true');
    else campo.el.removeAttribute('aria-invalid');
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

  // ---------- BUSCA AUTOMÁTICA DE ENDEREÇO (ViaCEP) ----------
  // Etapa 3, pedido explícito: ao completar os 8 dígitos do CEP,
  // busca rua/bairro/cidade/UF em https://viacep.com.br e preenche os
  // campos sozinho (continuam editáveis depois — a pessoa pode
  // corrigir se o CEP cobrir uma rua grande com numeração dividida,
  // por exemplo). "#cep-status" (checkout.html) é o <p> que mostra o
  // andamento — aria-live:polite já está nele, então cada mudança de
  // texto é anunciada por leitor de tela sem precisar de nada extra
  // aqui.
  const cepEl = form.querySelector('[name="cep"]');
  const cepStatusEl = document.querySelector('#cep-status');
  const camposPorNome = Object.fromEntries(
    campos.map((c) => [c.el.name, c])
  );

  // Preenche UM campo (se ele vier vazio OU com o MESMO valor que o
  // próprio ViaCEP já tinha preenchido antes — não sobrescreve texto
  // que a pessoa digitou/corrigiu à mão) e revalida. "valorAnterior"
  // guardado em cada <input> (data-preenchido-por-cep) é o que
  // diferencia "a pessoa editou" de "ainda é o que o CEP preencheu".
  // validarCampo(campo, true) — CORREÇÃO (achado do code-review): o
  // "true" (mostra erro se inválido) é de propósito, não um descuido —
  // alguns CEPs (ex.: de cidade pequena, sem bairro/logradouro
  // cadastrado) fazem o PRÓPRIO ViaCEP devolver "rua"/"bairro" VAZIOS
  // mesmo com sucesso; sem mostrar o erro nesse caso, o campo ficava
  // vazio, o botão continuava desabilitado, e a pessoa não tinha
  // NENHUMA pista do que faltava preencher. Pra quem preenche
  // normalmente (CEP com rua/bairro completos) isto não muda nada: o
  // campo fica válido, e validarCampo só mostra erro quando inválido.
  function preencherCampoAutomatico(nome, valor) {
    const campo = camposPorNome[nome];
    if (!campo) return;
    const el = campo.el;
    const vazio = el.value.trim() === '';
    const aindaOQueOCepPreencheu = el.dataset.preenchidoPorCep === el.value;
    if (vazio || aindaOQueOCepPreencheu) {
      el.value = valor;
      el.dataset.preenchidoPorCep = valor;
      validarCampo(campo, true);
    }
  }

  // Token de corrida: cada chamada nova invalida a anterior — se a
  // pessoa corrigir o CEP rápido (ex.: errou 1 dígito e já emendou a
  // correção), uma resposta antiga, mais lenta, que chegue DEPOIS da
  // mais nova não pode sobrescrever o que a busca mais recente já
  // preencheu.
  let tokenBuscaAtual = 0;

  // CORREÇÃO (achado do code-review): o campo CEP dispara a busca em
  // DOIS eventos (no 8º dígito via "input" E de novo ao sair do campo
  // via "blur") — digitar o último dígito e já dar Tab em seguida
  // (fluxo normal) dispara os dois quase juntos, ANTES do primeiro
  // "await" sequer resolver. Por isso "ultimoCepProcessado" é marcado
  // de forma SÍNCRONA, logo no início da função — ANTES do fetch, não
  // só depois de um sucesso: fecha a corrida (JS é single-thread; a 2ª
  // chamada roda até aqui antes do fetch da 1ª terminar, então já
  // encontra a marca). Em erro (CEP inexistente/falha de rede) a marca
  // é DESFEITA no fim, pra um evento seguinte poder tentar de novo.
  let ultimoCepProcessado = null;

  async function buscarEnderecoPorCep(cepFormatado) {
    const cepLimpo = soDigitos(cepFormatado);
    if (cepLimpo.length !== 8) return;
    if (cepLimpo === ultimoCepProcessado) return;
    ultimoCepProcessado = cepLimpo;

    const meuToken = ++tokenBuscaAtual;
    cepStatusEl.textContent = 'Buscando endereço...';

    let dados;
    try {
      // timeout manual (AbortController): sem isso, uma rede lenta/
      // instável deixaria "Buscando..." preso indefinidamente — 8s é
      // generoso pra uma API simples, sem travar a pessoa por muito
      // tempo numa conexão ruim.
      const controlador = new AbortController();
      const timeoutId = setTimeout(() => controlador.abort(), 8000);
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        signal: controlador.signal,
      });
      clearTimeout(timeoutId);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      dados = await resposta.json();
    } catch (erro) {
      if (meuToken !== tokenBuscaAtual) return; // uma busca mais nova já assumiu
      ultimoCepProcessado = null; // falhou: libera esta marca pra um evento seguinte poder tentar de novo
      console.error('Falha ao buscar CEP no ViaCEP:', erro);
      cepStatusEl.textContent =
        'Não foi possível buscar o endereço agora — preencha rua, bairro, cidade e UF manualmente.';
      return;
    }

    if (meuToken !== tokenBuscaAtual) return; // resposta antiga, já tem busca mais nova em andamento

    // ViaCEP devolve { erro: true } (sem outros campos) pra CEP
    // inexistente — formato válido (8 dígitos) não garante que o CEP
    // exista de verdade.
    if (dados.erro) {
      ultimoCepProcessado = null; // CEP inexistente: libera pra tentar de novo (mesmo motivo do catch acima)
      cepStatusEl.textContent = 'CEP não encontrado — confira o número ou preencha o endereço manualmente.';
      return;
    }

    preencherCampoAutomatico('rua', dados.logradouro || '');
    preencherCampoAutomatico('bairro', dados.bairro || '');
    preencherCampoAutomatico('cidade', dados.localidade || '');
    preencherCampoAutomatico('estado', dados.uf || '');
    atualizarBotao();

    // CORREÇÃO (achado do code-review): alguns CEPs (cidade pequena,
    // sem logradouro/bairro cadastrado) fazem o PRÓPRIO ViaCEP
    // devolver sucesso com "rua"/"bairro" VAZIOS — sem este aviso, o
    // único sinal de que algo falta seriam os campos em vermelho
    // (ver validarCampo(campo, true) em preencherCampoAutomatico,
    // acima), fáceis de não notar numa tela pequena. Mensagem só
    // aparece quando sobra algo pra completar; senão, status limpa
    // normalmente (endereço veio completo).
    const faltou = ['rua', 'bairro'].filter((nome) => camposPorNome[nome].el.value.trim() === '');
    cepStatusEl.textContent = faltou.length
      ? `Endereço encontrado, mas sem ${faltou.join(' e ')} cadastrado — complete manualmente.`
      : '';

    // foco automático no Número (pedido explícito): é o único campo
    // de endereço que o ViaCEP NUNCA preenche (CEP não tem esse
    // detalhe), então é sempre o próximo passo real da pessoa depois
    // da busca — só move o foco se o campo ainda estiver vazio (não
    // rouba o foco de quem já tinha preenchido e seguiu digitando
    // outra coisa) E SE o foco ainda estiver no próprio campo CEP
    // (CORREÇÃO, achado do code-review: numa rede lenta, a pessoa
    // pode dar Tab e já estar digitando em "Rua" quando a busca
    // responde — sem esta checagem, o foco pulava pro Número no meio
    // da digitação, espalhando as próximas teclas no campo errado).
    const numeroEl = camposPorNome.numero.el;
    if (numeroEl.value.trim() === '' && document.activeElement === cepEl) {
      numeroEl.focus();
    }
  }

  cepEl.addEventListener('blur', () => buscarEnderecoPorCep(cepEl.value));
  cepEl.addEventListener('input', () => {
    if (soDigitos(cepEl.value).length === 8) buscarEnderecoPorCep(cepEl.value);
  });

  atualizarBotao(); // começa desabilitado (form vazio)

  // Pagamento fora do ar (503 do backend): mensagem curta + botão do
  // WhatsApp logo abaixo, com as peças do carrinho já na mensagem — a
  // venda não se perde, vira conversa com a Anasor. O botão é criado
  // UMA vez só (um 2º clique em "Ir para Pagamento" não duplica).
  // WHATSAPP_NUMERO vem de js/main.js, carregado antes deste arquivo.
  function mostrarPagamentoIndisponivel() {
    erroEnvioEl.textContent = 'Pagamento indisponível no momento. Fale com a gente pelo WhatsApp.';
    if (document.querySelector('#whatsapp-pagamento-indisponivel')) return;
    const pecas = itensCarrinho.map((item) => item.nome).filter(Boolean).join(', ');
    const mensagem =
      'Olá, Anasor! Tentei finalizar uma compra no site, mas o pagamento estava indisponível.' +
      (pecas ? ` Peça(s): ${pecas}.` : '') +
      ' Pode me ajudar?';
    const link = document.createElement('a');
    link.id = 'whatsapp-pagamento-indisponivel';
    link.className = 'checkout-whatsapp';
    link.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '📱 Falar pelo WhatsApp';
    erroEnvioEl.after(link);
  }

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
        const erro = new Error(erroBody.erro || `O servidor recusou o pedido (HTTP ${resposta.status}).`);
        // 503 + "pagamento_indisponivel": o site está no ar, mas sem o
        // Mercado Pago configurado (ver o começo de POST /api/checkout
        // em backend/server.js). Não é falha de conexão — a saída certa
        // pro cliente é o WhatsApp, não "tente de novo".
        erro.pagamentoIndisponivel = resposta.status === 503 && erroBody.codigo === 'pagamento_indisponivel';
        // o backend explicou o problema (ex.: CEP inválido, peça já
        // vendida, Mercado Pago fora do ar): é ESSA frase que o cliente
        // precisa ler pra saber o que fazer — não o aviso de conexão
        erro.mensagemDoServidor = typeof erroBody.erro === 'string' ? erroBody.erro : '';
        throw erro;
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
      if (erro.pagamentoIndisponivel) {
        mostrarPagamentoIndisponivel();
      } else if (erro.mensagemDoServidor) {
        // textContent (nunca innerHTML): o texto vem da API
        erroEnvioEl.textContent = erro.mensagemDoServidor;
      } else {
        // sem resposta do servidor (rede caiu, função fora do ar). A dica
        // de "rodar o backend" só faz sentido pra quem desenvolve — no
        // site no ar o cliente via uma instrução de terminal (achado do
        // code-review).
        const emDesenvolvimento = ['localhost', '127.0.0.1'].includes(location.hostname);
        erroEnvioEl.textContent = emDesenvolvimento
          ? 'Não foi possível conectar ao servidor de pagamento agora. ' +
            'Verifique se o backend está rodando (cd backend && npm start) e tente de novo.'
          : 'Não foi possível conectar ao pagamento agora. Confira sua internet e tente de novo em instantes.';
      }
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = textoOriginal;
    }
  });
}
