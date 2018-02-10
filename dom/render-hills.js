var d3 = require('d3-selection');
require('d3-transition');
var ease = require('d3-ease');
var hillRoot = d3.select('.hills');
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
    if (debug) {
      renderCurvePoints(bezierCurves);
      console.log('bezierCurves', bezierCurves);
    }

    var path = `M ${extremeCoords[0].join(',')} `;
    path += bezierCurves.map(pathStringForCurve).join('\n');
    path += `\nL${width},${height} L0,${width}Z`;

    if (debug) {
      console.log('path', path);
    }
    return hillRoot
      .append('path')
      .attr('d', path)
      .attr(
        'transform',
        `translate(0, ${(level + 1) * ~~(100 / levelSpecs.length)})`
      )
      .attr('fill', color);
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
      coordsScaledTo100[0] / 100 * width,
      coordsScaledTo100[1] / 100 * height
    ];
  }
}

function pathStringForCurve(curve) {
  return `C ${curve.srcCtrlPt.join(',')}
  ${curve.destCtrlPt.join(',')}
  ${curve.dest.join(',')}`;
}

function renderCurvePoints(curves) {
  var circles = hillRoot
    .selectAll('.curve-dest')
    .data(curves.map(curve => curve.dest));
  circles
    .enter()
    .append('circle')
    .attr('r', 2)
    .classed('curve-dest', true)
    .merge(circles)
    .attr('cx', point => point[0])
    .attr('cy', point => point[1]);

  var controlCircles = hillRoot
    .selectAll('.curve-control')
    .data(
      curves
        .map(curve => curve.srcCtrlPt)
        .concat(curves.map(curve => curve.destCtrlPt))
    );
  controlCircles
    .enter()
    .append('circle')
    .attr('r', 1)
    .classed('curve-control', true)
    .merge(controlCircles)
    .attr('cx', point => point[0])
    .attr('cy', point => point[1]);
}

// Assumes extremes are sorted by x values, ascending.
function curvesFromExtremes(extremes) {
  var curves = [];
  for (var i = 1; i < extremes.length; ++i) {
    let dest = extremes[i];
    let src = extremes[i - 1];
    let xDistToPrev = dest[0] - src[0];

    curves.push({
      srcCtrlPt: [src[0] + xDistToPrev / 2, src[1]],
      destCtrlPt: [dest[0] - xDistToPrev / 2, dest[1]],
      dest
    });
  }
  return curves;
}

module.exports = renderHills;
