// Registra as 2 composições do Tour do Site — duração vem dos
// inputProps (calculateMetadata), igual ao motor de Reels: cada
// versão tem duração diferente (A ~31s, B ~55s).
const React = require('react');
const { Composition } = require('remotion');
const { TourMobile } = require('./templates/TourMobile');
const { TourDesktop } = require('./templates/TourDesktop');

function metadataMobile({ props }) {
  return { durationInFrames: props.duracaoTotal, fps: props.fps || 30, width: 1080, height: 1920 };
}
function metadataDesktop({ props }) {
  return { durationInFrames: props.duracaoTotal, fps: props.fps || 30, width: 1920, height: 1080 };
}

function RemotionRoot() {
  return React.createElement(
    React.Fragment, null,
    React.createElement(Composition, {
      id: 'TourMobile', component: TourMobile,
      durationInFrames: 900, fps: 30, width: 1080, height: 1920,
      calculateMetadata: metadataMobile,
    }),
    React.createElement(Composition, {
      id: 'TourDesktop', component: TourDesktop,
      durationInFrames: 1500, fps: 30, width: 1920, height: 1080,
      calculateMetadata: metadataDesktop,
    })
  );
}

module.exports = { RemotionRoot };
