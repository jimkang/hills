var RouteState = require('route-state');
var handleError = require('handle-error-web');
var renderHills = require('./dom/render-hills');
var renderControls = require('./dom/render-controls');
var probable = require('probable');

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
  'rgb(255, 0, 198'
];

var maxNumberOfLevelsTable = probable.createTableFromSizes([
  [6, 3],
  [3, 10],
  [1, 20]
]);

var numberOfInflectionsFnTable = probable.createTableFromSizes([
  [7, () => 3 + probable.roll(3)],
  [1, () => 5 + probable.roll(3)]
]);

var routeState = RouteState({
  followRoute,
  windowObject: window
});

(function go() {
  window.onerror = reportTopLevelError;
  routeState.routeFromHash();
})();

function followRoute(routeDict) {
  if (!routeDict.levelSpecs) {
    let levelSpecs = [];
    let previousColorIndexes = [];
    let numberOfLevels = probable.rollDie(maxNumberOfLevelsTable.roll());
    for (let i = 0; i < numberOfLevels; ++i) {
      let colorIndex = pickColor(previousColorIndexes);
      previousColorIndexes.push(colorIndex);
      levelSpecs.push(generateLevelSpec(hillColors[colorIndex]));
    }
    routeState.addToRoute({ levelSpecs: levelSpecs.join('|') });
  } else {
    renderHills({
      levelSpecs: routeDict.levelSpecs.split('|').map(parseLevelSpec),
      debug: routeDict.debug,
      animatePairs: routeDict.animatePairs,
      extraCtrlPtSeparation: routeDict.extraCtrlPtSeparation
    });
  }
  renderControls({ onRoll });
}

function onRoll() {
  routeState.removeFromRoute('levelSpecs');
}

// Will modify chosenColorIndexes after it has chose a color.
// Assumes that adjacent indexes in hillColors are very similar.
function pickColor(previousIndexes) {
  var lastColorIndex;
  if (previousIndexes.length > 0) {
    lastColorIndex = previousIndexes[previousIndexes.length - 1];
  }
  var colorIndex;
  for (let j = 0; ; ++j) {
    colorIndex = probable.roll(hillColors.length);

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

// A level spec is an array. The first element is the color. The rest
// are the extremes in the hills.
function generateLevelSpec(color) {
  return `${color};${generateInflections().join(';')}`;
}

function generateInflections() {
  var numberOfInflections = numberOfInflectionsFnTable.roll()();
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

    let delta = minYSeparation + probable.roll(maxYSeparation - minYSeparation);
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
