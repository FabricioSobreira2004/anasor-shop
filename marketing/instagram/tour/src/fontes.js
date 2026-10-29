// Carrega Fraunces + Jost de verdade (mesmas fontes do site, ver
// index.html) via @remotion/google-fonts — sem isso, o Chromium do
// render cairia num fallback silencioso (nem Fraunces nem Jost estão
// instaladas como fonte do Windows nesta máquina, conferido antes de
// escrever este arquivo). loadFont() já dispara o delayRender()
// interno do Remotion — só precisa ser chamado 1x, no entry point
// (src/index.js), antes de qualquer composição montar.
const { loadFont: loadFraunces } = require('@remotion/google-fonts/Fraunces');
const { loadFont: loadJost } = require('@remotion/google-fonts/Jost');

loadFraunces('normal', { weights: ['400', '500', '600'] });
loadJost('normal', { weights: ['400', '500', '600'] });
