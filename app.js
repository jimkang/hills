var RouteState = require('route-state');
var handleError = require('handle-error-web');
var renderHills = require('./dom/render-hills');
var probable = require('probable');

var routeState = RouteState({
  followRoute: followRoute,
  windowObject: window
});

(function go() {
  window.onerror = reportTopLevelError;
  routeState.routeFromHash();
})();

function followRoute(routeDict) {
  if (!routeDict.levelSpecs) {
    let levelSpecs = [];
    let numberOfLevels = probable.rollDie(3);
    for (let i = 0; i < numberOfLevels; ++i) {
      levelSpecs.push(generateLevelSpec());
    }
    routeState.addToRoute({ levelSpecs: levelSpecs.join('|') });
  } else {
    renderHills({
      levelSpecs: routeDict.levelSpecs.split('|').map(parseLevelSpec)
    });
  }
}

// A level spec is an array. The first element is the color. The rest
// are the extremes in the hills.
function generateLevelSpec() {
  var spec = `${pickHillColor()};`;
  spec += generateInflections().join(';');
  return spec;
}

function pickHillColor() {
  return probable.pickFromArray(['#66b04b', '#267129', '#7cb420']);
}

function generateInflections() {
  var numberOfInflections = 3 + probable.roll(3);
  var inflections = [];
  var previousY = 0;
  var xPositions = [];
  const minY = 10;
  const maxYSeparation = 30;
  const minYSeparation = 10;
  const xSegmentSize = 100 / (numberOfInflections - 1);

  for (let k = 1; k < numberOfInflections - 1; ++k) {
    let jitter = probable.roll(11) - 5;
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
