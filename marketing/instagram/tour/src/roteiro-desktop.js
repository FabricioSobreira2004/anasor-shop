// Roteiro da Versão B (portfólio/LinkedIn, 1920×1080) — ritmo mais
// lento que a Versão A de propósito (pedido: 45-60s, "linguagem de
// portfólio"). Durações FIXAS (não vêm do manifesto): uma cena pode
// durar mais que a captura bruta sem problema — tour.js (função
// copiarClipesParaPublic + calcularMinimosNecessarios) "estica" cada
// clipe com ffmpeg ANTES de copiá-lo pra public/, repetindo o próprio
// clipe até ter quadros o bastante pra cena mais longa que o usa — um
// print de tela quase estática repetindo é imperceptível. (Correção
// de comentário — achado do code-review: uma versão anterior deste
// comentário dizia "loop:true", mas esse caminho foi abandonado cedo
// nesta rodada — <OffthreadVideo loop> exige durationInFrames
// explícito — e NUNCA existiu em componentes.js.)
function montarRoteiroDesktop() {
  const cenas = [];
  let acc = 0;
  function push(nome, duracao, extra) {
    cenas.push({ nome, inicio: acc, duracao, ...extra });
    acc += duracao;
  }

  push('abertura', 90, { tipo: 'abertura' });
  // Faixa de tecnologias: persistente de 'home' até o fim de 'checkout'
  // (fora da abertura/fecho, que são só texto — a faixa competiria com
  // o próprio fecho, que já é texto de encerramento). Captura `acc`
  // aqui mesmo (fim da abertura) em vez de repetir "90" como número
  // mágico — achado do simplify: a 1ª versão tinha `fimFaixa = acc -
  // 300` copiando a duração do fecho (abaixo) por fora, podendo
  // desalinhar se uma das duas durações mudasse sem a outra.
  const inicioFaixa = acc;

  push('home', 240, {
    tipo: 'lado-a-lado', desktop: 'desktop-home', mobile: 'home-hero',
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.04, x: 0, y: -0.6 },
  });

  // 180 (não 270/300): a cena ganhou uma rolagem suave de verdade na
  // captura (Rodada 6, item B) — medido o clipe real (com o motor já
  // determinístico, ver DECISOES.md), dá 185 quadros (busca + rolagem
  // + hold). IMPORTANTE: esta duração precisa ser < ao clipe real,
  // nunca igual ou maior — `copiarClipesParaPublic` "estica" clipes
  // mais CURTOS que a cena repetindo o próprio clipe (`-stream_loop`),
  // o que é imperceptível pra uma cena ESTÁTICA (o uso original,
  // documentado acima), mas criaria um SALTO visível aqui (a rolagem
  // voltaria pro topo/busca vazia no meio da cena). 180 = 185 reais
  // − 5 quadros de margem, nunca estica.
  push('listagem', 180, {
    tipo: 'desktop-solo', desktop: 'desktop-listagem',
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.05, x: 0, y: -0.6 },
    destaques: [
      { texto: 'O preço de cada peça é recalculado no servidor — nunca só no que chega do navegador.', atraso: 20, duracao: 155 },
    ],
  });

  push('produto', 270, {
    tipo: 'lado-a-lado', desktop: 'desktop-produto', mobile: 'produto-galeria',
    de: { escala: 1.0, x: 0, y: 0.6 }, para: { escala: 1.05, x: 0, y: -0.6 },
  });

  push('checkout', 330, {
    tipo: 'lado-a-lado', desktop: 'desktop-checkout', mobile: 'checkout',
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.04, x: 0, y: -0.5 },
    destaques: [
      { texto: 'CEP e CPF são validados antes de seguir pro pagamento.', atraso: 15, duracao: 140 },
      { texto: 'Pedido pago avisa a Anasor por e-mail e Telegram, na hora.', atraso: 170, duracao: 140 },
    ],
  });

  const fimFaixa = acc; // fim de 'checkout', ANTES de empurrar o fecho — mesma ideia de inicioFaixa acima

  push('fecho', 300, {
    tipo: 'fecho',
    destaques: [
      { texto: 'Cada push no GitHub já publica a nova versão no ar.', atraso: 10, duracao: 130 },
    ],
  });

  return { cenas, duracaoTotal: acc, faixaTecnologias: { inicio: inicioFaixa, fim: fimFaixa } };
}

module.exports = { montarRoteiroDesktop };
