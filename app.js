var RouteState = require('route-state');
var handleError = require('handle-error-web');
var renderHills = require('./dom/render-hills');
var renderControls = require('./dom/render-controls');
var Probable = require('probable').createProbable;
var hsl = require('d3-color').hsl;
var seedrandom = require('seedrandom');
var sanzoCombos = require('./sanzo-hex-combos.json');

var randomId = require('@jimkang/randomid')();

const maxJitter = 5;
const minAdjacentColorIndexDist = 2;
const maxColorPickTries = 5;
const minNumberOfColorsBeforeRepeating = 5;

var hillColors = [
  '#66b04b',
  '#267129',
  '#7cb420',
  'rgb(255, 0, 154)',
  'rgb(255, 0, 111)',
  'rgb(255, 7, 69)',
  'rgb(255, 69, 16)',
  'rgb(255, 101, 0)',
  'rgb(226, 124, 0)',
  'rgb(191, 143, 0)',
  'rgb(152, 157, 0)',
  'rgb(106, 167, 0)',
  'rgb(24, 174, 0)',
  'rgb(0, 179, 10)',
  'rgb(0, 183, 77)',
  'rgb(0, 185, 124)',
  'rgb(0, 187, 170)',
  'rgb(143, 121, 255)',
  'rgb(213, 92, 255)',
  'rgb(255, 52, 240)',
  'rgb(255, 0, 198)'
];

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

  var maxNumberOfLevelsTable = probable.createTableFromSizes([
    [6, 3],
    [3, 10],
    [1, 20]
  ]);

  var numberOfInflectionsFnTable = probable.createTableFromSizes([
    [7, () => 3 + probable.roll(3)],
    [1, () => 5 + probable.roll(3)]
  ]);

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
    levelSpecs = [];
    let previousColorIndexes = [];
    let numberOfLevels = probable.rollDie(maxNumberOfLevelsTable.roll());

    if (minLevels > numberOfLevels) {
      numberOfLevels = minLevels;
    }
    if (shouldTweenBetweenPairs) {
      numberOfLevels *= 2;
    }
    let prevLevelInflectionCount = -1;

    let palette = hillColors;
    if (probable.roll(2) === 0) {
      palette = probable.pickFromArray(sanzoCombos);
    }

    for (let i = 0; i < numberOfLevels; ++i) {
      let hillColor;
      let colorIndex = pickColor(palette, previousColorIndexes);
      previousColorIndexes.push(colorIndex);
      hillColor = palette[colorIndex];

      let fadeLevel = 0;
      if (fadeBackLayers === 'yes') {
        fadeLevel = (numberOfLevels - i - 1) / numberOfLevels / 3;
      }
      let fixedNumberOfInflections = -1;
      if (shouldTweenBetweenPairs && i % 2 === 1) {
        fixedNumberOfInflections = prevLevelInflectionCount;
      }

      let { color, inflections } = generateLevelSpec(
        fade(fadeLevel, hillColor),
        fixedNumberOfInflections
      );
      levelSpecs.push(formatLevelSpec({ color, inflections }));
      prevLevelInflectionCount = inflections.length;
    }
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

  // Will modify chosenColorIndexes after it has chose a color.
  // Assumes that adjacent indexes in hillColors are very similar.
  function pickColor(palette, previousIndexes) {
    var lastColorIndex;
    if (previousIndexes.length > 0) {
      lastColorIndex = previousIndexes[previousIndexes.length - 1];
    }
    var colorIndex;
    for (let j = 0; ; ++j) {
      colorIndex = probable.roll(palette.length);

      if (j > maxColorPickTries) {
        // Just pick anything even if it might be too close to an existing color.
        console.log('Giving up after picking a new color after', j, 'tries.');
        break;
      }
      if (isNaN(lastColorIndex)) {
        break;
      } else if (
        Math.abs(colorIndex - lastColorIndex) >= minAdjacentColorIndexDist &&
        previousIndexes
          .slice(-1 * minNumberOfColorsBeforeRepeating)
          .indexOf(colorIndex) === -1
      ) {
        // This one is far enough away and has not been chosen before.
        break;
      }
    }
    return colorIndex;
  }

  function generateInflections(fixedNumberOfInflections = -1) {
    var numberOfInflections = fixedNumberOfInflections;
    if (numberOfInflections === -1) {
      numberOfInflections = numberOfInflectionsFnTable.roll()();
    }
    var inflections = [];
    var previousY = 0;
    var xPositions = [];
    const minY = 10;
    const maxYSeparation = 30;
    const minYSeparation = 10;
    const xSegmentSize = 100 / (numberOfInflections - 1);

    for (let k = 1; k < numberOfInflections - 1; ++k) {
      let jitter = probable.roll(maxJitter - (numberOfInflections - 3)) + 1;
      xPositions.push(~~(k * xSegmentSize) + jitter);
    }
    // xPositions.sort();
    xPositions.unshift(0);
    xPositions.push(100);

    for (let j = 0; j < numberOfInflections; ++j) {
      let y = probable.roll(100 - minY) + minY;

      let delta =
        minYSeparation + probable.roll(maxYSeparation - minYSeparation);
      delta *= probable.roll(2) === 0 ? -1 : 1;
      y = previousY + delta;
      if (y < 0) {
        y = previousY - delta;
      }
      previousY = y;

      inflections.push(`${xPositions[j]},${y}`);
    }
    return inflections;
  }

  // A level spec is an array. The first element is the color. The rest
  // are the extremes in the hills.
  function generateLevelSpec(color, fixedNumberOfInflections) {
    return {
      color,
      inflections: generateInflections(fixedNumberOfInflections)
    };
  }
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
function formatLevelSpec({ color, inflections }) {
  return `${color};${inflections.join(';')}`;
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

function fade(level, clrString) {
  var clr = hsl(clrString);
  clr.s -= level;
  clr.l -= level / 3;
  if (clr.l < 0.2) {
    clr.l = 0.2;
  }
  return clr.toString();
}

// function aIsToTheLeftOfB(a, b) {
//   return a[0] < b[0] ? -1 : 1;
// }
