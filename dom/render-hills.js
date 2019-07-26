var d3 = require('d3-selection');
require('d3-transition');
var ease = require('d3-ease');
var hillRoot = d3.select('.hills');
var debugLayer = d3.select('#debug-layer');
var board = d3.select('.board');

// This module assumes: viewBox="0 0 100 100"
// levelSpecs is an array in which each member is a levelSpec.
// A levelSpec is an array containing peak coords (each of which are 2-element arrays).
function renderHills({
  levelSpecs = [['green', [50, 100]]],
  debug,
  animatePairs
}) {
  // console.log(levelSpecs);
  var width = +window.innerWidth;
  var height = +window.innerHeight;

  if (width < height) {
    // Avoid a vertical rectangle aspect ratio.
    height = width;
  }

  board.attr('width', width);
  board.attr('height', height);
  board.attr('viewBox', `0 0 ${width} ${height}`);

  hillRoot.selectAll('*').remove();
  debugLayer.selectAll('*').remove();

  if (animatePairs && levelSpecs.length === 2) {
    let hillPath = renderHillLevel(levelSpecs[0], 0);
    renderHillTransition(levelSpecs[1], hillPath);
  } else {
    levelSpecs.forEach(renderHillLevel);
  }

  function renderHillLevel(levelSpec, level) {
    var color = levelSpec[0];
    var extremeCoords = levelSpec.slice(1).map(scaleToViewBox);
    var bezierCurves = curvesFromExtremes(extremeCoords);

    const rootTranslate = `translate(0, ${(level + 1) *
      ~~(100 / levelSpecs.length)})`;

    if (debug) {
      renderCurvePoints(debugLayer, bezierCurves, rootTranslate);
      console.log('bezierCurves', bezierCurves);
    }

    var path = `M ${extremeCoords[0].join(',')} `;
    path += bezierCurves.map(pathStringForCurve).join('\n');
    path += `\nL${width},${height} L0,${width}Z`;

    if (debug) {
      console.log('path', path);
    }
    var hillPaths = hillRoot
      .append('path')
      .attr('d', path)
      .attr('transform', rootTranslate)
      .attr('fill', color);

    if (debug) {
      hillPaths.classed('debug', true);
    }
    return hillPaths;
  }

  function renderHillTransition(transitionSpec, hillPath) {
    var transitionBezierCurves = curvesFromExtremes(transitionSpec.slice(1));
    var color = transitionSpec[0];
    var extremeCoords = transitionSpec.slice(1).map(scaleToViewBox);
    var transitionPath = `M ${extremeCoords[0].join(',')} `;
    transitionPath += transitionBezierCurves.map(pathStringForCurve).join('\n');
    transitionPath += `\nL${width},${height} L0,${width}Z`;
    hillPath
      .transition()
      .duration(1000)
      .ease(ease.easeLinear)
      .attr('d', transitionPath)
      .attr('fill', color);
  }

  function scaleToViewBox(coordsScaledTo100) {
    return [
      roundToTwo((coordsScaledTo100[0] / 100) * width),
      roundToTwo((coordsScaledTo100[1] / 100) * height)
    ];
  }
}

function roundToTwo(n) {
  return +n.toFixed(2);
}

function pathStringForCurve(curve) {
  return `C ${curve.srcCtrlPt.join(',')}
  ${curve.destCtrlPt.join(',')}
  ${curve.dest.join(',')}`;
}

function renderCurvePoints(root, curves, rootTranslate) {
  root.attr('transform', rootTranslate);
  renderLines(
    root,
    curves.map(curve => [curve.src, curve.srcCtrlPt]),
    'curve-start-control-line'
  );
  renderLines(
    root,
    curves.map(curve => [curve.destCtrlPt, curve.dest]),
    'curve-end-control-line'
  );
  renderDots(root, curves.map(curve => curve.src), 'curve-src', 50);
  renderDots(root, curves.map(curve => curve.dest), 'curve-dest', 40);
  renderDots(
    root,
    curves.map(curve => curve.srcCtrlPt),
    'curve-start-control',
    20
  );
  renderDots(
    root,
    curves.map(curve => curve.destCtrlPt),
    'curve-end-control',
    20
  );
}

function renderDots(root, data, className, r) {
  var dots = root.selectAll('.' + className).data(data, getPointId);

  dots
    .enter()
    .append('circle')
    .attr('r', r)
    .classed(className, true)
    .merge(dots)
    .attr('cx', point => point[0])
    .attr('cy', point => point[1]);
}

function renderLines(root, data, className) {
  var lines = root.selectAll('.' + className).data(data, getLineId);

  //lines.exit().remove();

  lines
    .enter()
    .append('line')
    .classed(className, true)
    .merge(lines)
    .attr('x1', points => points[0][0])
    .attr('y1', points => points[0][1])
    .attr('x2', points => points[1][0])
    .attr('y2', points => points[1][1]);
}

// Assumes extremes are sorted by x values, ascending.
function curvesFromExtremes(extremes) {
  var curves = [];
  for (var i = 1; i < extremes.length; ++i) {
    let dest = extremes[i];
    let src = extremes[i - 1];
    let xDistToPrev = dest[0] - src[0];

    curves.push({
      src,
      srcCtrlPt: [roundToTwo(src[0] + xDistToPrev / 2), src[1]],
      destCtrlPt: [roundToTwo(dest[0] - xDistToPrev / 2), dest[1]],
      dest
    });
  }
  return curves;
}

function getPointId(point) {
  return `point_${point[0]}_${point[1]}`;
}

function getLineId(line) {
  return `line_${line[0][0]}_${line[0][1]}_to_${line[1][0]}_${line[1][1]}`;
}

module.exports = renderHills;
