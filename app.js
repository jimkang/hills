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
      levelSpecs.push(generateExtremes().join(';'));
    }
    routeState.addToRoute({ levelSpecs: levelSpecs.join('|') });
  } else {
    renderHills({
      levelSpecs: routeDict.levelSpecs.split('|').map(parseLevelSpec)
    });
  }
}

function generateExtremes() {
  var numberOfExtremes = 3 + probable.roll(3);
  var extremes = [];
  var direction = probable.roll(2) === 0 ? -1 : 1;
  var previousY = 0;
  var xPositions = [];
  const minY = 10;
  const xSegmentSize = 100/(numberOfExtremes - 1);

  for (let k = 1; k < numberOfExtremes - 1; ++k) {
    let jitter = probable.roll(11) - 5;
    xPositions.push(~~(k * xSegmentSize) + jitter);
  }
  // xPositions.sort();
  xPositions.unshift(0);
  xPositions.push(100);

  for (let j = 0; j < numberOfExtremes; ++j) {
    let y = probable.roll(100 - minY) + minY;

    if (direction > 0) {
      y = previousY + probable.roll(100 - previousY);
    }
    else {
      y = probable.roll(previousY - minY) + minY;
    }
    previousY = y;
    direction *= -1;

    extremes.push(`${xPositions[j]},${y}`);
  }
  return extremes;
}

function parseLevelSpec(spec) {
  return spec.split(';').map(parseCoords);
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
