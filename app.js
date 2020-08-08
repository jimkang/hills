var RouteState = require('route-state');
var handleError = require('handle-error-web');
var renderHills = require('./dom/render-hills');
var renderControls = require('./dom/render-controls');
var Probable = require('probable').createProbable;
var seedrandom = require('seedrandom');
var { version } = require('./package.json');
var generateLevelSpecs = require('./generate-level-specs');

var randomId = require('@jimkang/randomid')();

var sanzoSwatch4Colors = [
  '#c0a9b3',
  '#ca92a8',
  '#b984af',
  '#bf5892',
  '#9a72aa',
  '#a36aa5',
  '#80719e',
  '#66629c',
  '#6450a1',
  '#84565b',
  '#70727c',
  '#8c4c62',
  '#704357',
  '#7a4456',
  '#713b4c',
  '#4f4086',
  '#59256a',
  '#501345',
  '#4e1d4c'
];

var routeState = RouteState({
  followRoute,
  windowObject: window
});

(function go() {
  window.onerror = reportTopLevelError;
  document.getElementById('version-info').textContent = version;
  routeState.routeFromHash();
})();

function followRoute({
  showHillLines,
  levelSpecs,
  fadeBackLayers,
  debug,
  extraCtrlPtSeparation,
  tweenBetweenPairs,
  tweenLengthMS = 5000,
  seed,
  minLevels
}) {
  if (isNaN(tweenLengthMS)) {
    tweenLengthMS = 5000;
  }
  const shouldTweenBetweenPairs = tweenBetweenPairs === 'yes';

  if (!seed) {
    //routeState.addToRoute({ seed: new Date().toISOString() });
    // Going to try using the seed as a name here.
    let seed = randomId(4);
    seed = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    routeState.addToRoute({ seed });
  }

  var probable = Probable({ random: seedrandom(seed) });

  if (!showHillLines) {
    routeState.addToRoute({
      showHillLines: probable.roll(5) == 0 ? 'yes' : 'no'
    });
    return;
  }

  if (!levelSpecs) {
    if (!fadeBackLayers) {
      routeState.addToRoute({
        fadeBackLayers: probable.roll(10) > 0 ? 'yes' : 'no'
      });
      return;
    }
    levelSpecs = generateLevelSpecs({
      probable,
      fadeBackLayers,
      minLevels,
      shouldTweenBetweenPairs
    });
    routeState.addToRoute({ levelSpecs: levelSpecs.join('|') });
  } else {
    let bgColor = 'black';
    if (probable.roll(2) === 0) {
      bgColor = probable.pickFromArray(sanzoSwatch4Colors);
    }

    renderHills({
      levelSpecs: levelSpecs.split('|').map(parseLevelSpec),
      debug,
      tweenBetweenPairs: tweenBetweenPairs === 'yes',
      extraCtrlPtSeparation,
      showHillLines: showHillLines === 'yes',
      tweenLengthMS,
      bgColor
    });
  }
  renderControls({ onRoll, shouldTweenBetweenPairs, onShouldTweenChange });
}

function onRoll() {
  routeState.removeFromRoute('fadeBackLayers', false);
  routeState.removeFromRoute('showHillLines', false);
  routeState.removeFromRoute('levelSpecs', false);
  routeState.removeFromRoute('seed');
}

function onShouldTweenChange(shouldTween) {
  if (shouldTween) {
    routeState.addToRoute({ tweenBetweenPairs: 'yes' });
  } else {
    routeState.removeFromRoute('tweenBetweenPairs');
  }
}

function parseLevelSpec(spec) {
  var parts = spec.split(';');
  return [parts[0]].concat(parts.slice(1).map(parseCoords));
}

function parseCoords(coords) {
  return coords.split(',').map(parseToNumber);
}

function parseToNumber(n) {
  return parseInt(n, 10);
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

// function aIsToTheLeftOfB(a, b) {
//   return a[0] < b[0] ? -1 : 1;
// }
