// Registra a ÚNICA composição "Reel" — duração/fps/resolução vêm dos
// inputProps (calculateMetadata), porque cada roteiro tem duração
// diferente (12-20s, ver roteiros.js). "template" escolhe o motor:
// apresentacao/detalhes usam o mesmo renderer (Apresentacao.jsx — a
// diferença entre os dois está na FORMA do roteiro, não no código);
// colecao usa Colecao.jsx (estrutura diferente: várias peças, não uma);
// conteudo usa Conteudo.jsx (Reels de motion graphics puro, sem foto/
// vídeo de peça nenhuma — rodada 3).
const React = require('react');
const { Composition } = require('remotion');
const { Apresentacao } = require('./templates/Apresentacao');
const { Colecao } = require('./templates/Colecao');
const { Conteudo } = require('./templates/Conteudo');

function Reel(props) {
  if (props.template === 'colecao') {
    return React.createElement(Colecao, props);
  }
  if (props.template === 'conteudo') {
    return React.createElement(Conteudo, props);
  }
  return React.createElement(Apresentacao, props);
}

function calculateMetadata({ props }) {
  return {
    durationInFrames: props.duracaoTotal,
    fps: props.fps || 30,
    width: 1080,
    height: 1920,
  };
}

function RemotionRoot() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {
      id: 'Reel',
      component: Reel,
      durationInFrames: 450,
      fps: 30,
      width: 1080,
      height: 1920,
      calculateMetadata,
    })
  );
}

module.exports = { RemotionRoot };
