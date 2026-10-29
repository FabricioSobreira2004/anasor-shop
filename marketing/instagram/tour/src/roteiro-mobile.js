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

  push('checkout', 'checkout', {
    de: { escala: 1.0, x: 0, y: 1 }, para: { escala: 1.06, x: 0, y: -1 },
    legendas: [
      { texto: 'O CEP preenche o endereço', atraso: 14, duracao: 55 },
      { texto: 'Compra segura pelo Mercado Pago', atraso: manifest.checkout.quadros - 58, duracao: 50 },
    ],
  });

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

  // Fecho gráfico (sem vídeo) — 120 quadros (4s a 30fps). Duração
  // escolhida também pra fechar o total da composição dentro de 30-40s
  // (pedido explícito) — sem este fecho, a soma dos clipes reais dava
  // ~29,7s, por baixo do mínimo.
  cenas.push({ nome: 'fecho', tipo: 'fecho', inicio: acc, duracao: 120 });
  acc += 120;

  return { cenas, duracaoTotal: acc };
}

module.exports = { montarRoteiroMobile };
