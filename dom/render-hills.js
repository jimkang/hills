var d3 = require('d3-selection');
var hillRoot = d3.select('.hills');
var board = d3.select('.board');

const hillBottom = '\nL100,100 L0,100Z';

// This module assumes: viewBox="0 0 100 100"
// levelSpecs is an array in which each member is a levelSpec.
// A levelSpec is an array containing peak coords (each of which are 2-element arrays).
function renderHills({ levelSpecs = [['green', [50, 100]]] }) {
  console.log(levelSpecs);
  var width = +window.innerWidth;
  var height = +window.innerHeight;

  board.attr('width', width);
  board.attr('height', height);

  levelSpecs.forEach(renderHillLevel);
}

function renderHillLevel(levelSpec, level) {
  var color = levelSpec[0];
  var extremeCoords = levelSpec.slice(1);
  var bezierCurves = curvesFromExtremes(extremeCoords);
  renderCurvePoints(bezierCurves);
  console.log('bezierCurves', bezierCurves);

  var path = `M ${extremeCoords[0].join(',')} `;
  path += bezierCurves.map(pathStringForCurve).join('\n');
  path += hillBottom;

  console.log('path', path);
  hillRoot
    .append('path')
    .attr('d', path)
    .attr('transform', `translate(0, ${level * 20})`)
    .attr('fill', color);
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
