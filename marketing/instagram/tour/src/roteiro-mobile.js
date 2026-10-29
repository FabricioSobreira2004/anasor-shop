// Roteiro da Versão A (Instagram, 1080×1920) — monta a lista de cenas
// a partir do manifesto de captura (duração REAL de cada clipe, não um
// número chutado) e das 6 legendas pedidas + o convite da peça vendida.
// Nenhuma legenda cita preço fixo nem Pix (pedido explícito).
function montarRoteiroMobile(manifest) {
  const cenas = [];
  let acc = 0;
  function push(nome, clipe, extra) {
    const quadros = manifest[clipe].quadros;
    cenas.push({ nome, clipe, inicio: acc, duracao: quadros, ...extra });
    acc += quadros;
  }

  push('home-hero', 'home-hero', {
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.07, x: 0, y: -1 },
    legendas: [{ texto: 'Escolha sua peça única', atraso: 10, duracao: manifest['home-hero'].quadros - 12 }],
  });
  push('home-scroll', 'home-scroll-carrosseis', {
    de: { escala: 1.07, x: 0, y: -1 }, para: { escala: 1.0, x: 0, y: 0 },
  });
  push('card-selo', 'card-selo', {
    de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.1, x: 0, y: -1 },
  });

  push('produto-galeria', 'produto-galeria', {
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.06, x: 0, y: -1 },
    legendas: [{ texto: 'Fotos, vídeo e medidas', atraso: 6, duracao: 60 }],
  });
  push('produto-video', 'produto-video', {
    de: { escala: 1.06, x: 0, y: -1 }, para: { escala: 1.0, x: 0, y: 1 },
  });
  push('produto-medidas', 'produto-medidas', {
    de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.08, x: 0, y: -1 },
  });
  push('produto-upsell', 'produto-upsell', {
    de: { escala: 1.08, x: 0, y: -1 }, para: { escala: 1.0, x: 0, y: 0 },
  });

  push('carrinho', 'adicionar-carrinho', {
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.05, x: 0, y: 0 },
    legendas: [{ texto: 'Carrinho lateral', atraso: 16, duracao: 60 }],
  });

  // 2 legendas sequenciais nesta cena — ACHADO NA RODADA 5 (crítica
  // visual): os números fixos antigos (atraso 14+duração 55, depois
  // atraso "quadros-58"+duração 50) se SOBREPUNHAM por 39 quadros
  // sempre que o clipe de checkout tivesse menos de ~108 quadros (o
  // capturado tem 88) — as 2 legendas apareciam ao mesmo tempo,
  // "fantasmas" uma por cima da outra. Calculado a partir da duração
  // REAL do clipe, dividindo o tempo disponível em 2 pedaços iguais
  // com um vão entre eles — nunca mais se sobrepõe, não importa
  // quanto o clipe durar.
  (() => {
    const total = manifest.checkout.quadros;
    const vao = 6;
    const folga = 12; // 6 antes da 1ª, 6 depois da 2ª
    const cada = Math.max(20, Math.floor((total - vao - folga) / 2));
    push('checkout', 'checkout', {
      de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.06, x: 0, y: -1 },
      legendas: [
        { texto: 'O CEP preenche o endereço', atraso: 6, duracao: cada },
        { texto: 'Compra segura pelo Mercado Pago', atraso: 6 + cada + vao, duracao: cada },
      ],
    });
  })();

  push('vendida-secao', 'vendida-secao', {
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.06, x: 0, y: -1 },
    legendas: [{ texto: 'Já encontraram um lar · Encomende a sua', atraso: 10, duracao: manifest['vendida-secao'].quadros - 12 }],
  });
  push('vendida-produto', 'vendida-produto', {
    de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.05, x: 0, y: 0 },
  });

  push('links', 'links', {
    de: { escala: 1.0, x: 0, y: 0 }, para: { escala: 1.05, x: 0, y: -1 },
    legendas: [{ texto: 'Frete grátis para todo o Brasil', atraso: 10, duracao: manifest.links.quadros - 12 }],
  });

  // Fecho gráfico (sem vídeo) — 150 quadros (5s a 30fps). Aumentado de
  // 120 pra 150 na Rodada 5 (item 2, fechamento rico): a cascata de
  // entrada (retrato → tagline → botão → handle → faixa) sozinha já
  // usa uns 73 quadros — 150 deixa ~2,5s de "hold" depois de tudo
  // aparecido, sem cortar a faixa de confiança antes da hora.
  cenas.push({ nome: 'fecho', tipo: 'fecho', inicio: acc, duracao: 150 });
  acc += 150;

  return { cenas, duracaoTotal: acc };
}

module.exports = { montarRoteiroMobile };
