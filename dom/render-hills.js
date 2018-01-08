var d3 = require('d3-selection');
var outline = d3.select('.hill-outline');
var board = d3.select('.board');

// This module assumes: viewBox="0 0 100 100"
// levelSpecs is an array in which each member is a levelSpec.
// A levelSpec is an array containing peak coords (each of which are 2-element arrays).
function renderHills({ levelSpecs = [[[50, 100]]] }) {
  console.log(levelSpecs);
  var width = +window.innerWidth;
  var height = +window.innerHeight;

  board.attr('width', width);
  board.attr('height', height);

  levelSpecs.forEach(renderHillLevel);
}

function renderHillLevel(coords, level) {
  // peakCoords.sort(aIsToTheLeftOfB);
  // var coords = addInterstitials(extremeCoords);
  renderPoints(coords);
  console.log('coords', coords);

  var path = `M${coords[0].join(',')}`;

  for (let i = 0; i < coords.length - 2; i += 1) {
    // path += `S ${coords[i].join(',')} ${coords[i + 1].join(',')}\n`;
    path += `C ${coords[i][0]},${coords[i+1][1]}
      ${coords[i][0]},${coords[i+1][1]}
      ${coords[i+1].join(',')}\n`;
  }
  path += `\nL100,${coords[coords.length - 1][1]} L100,100 L0,100Z`;
  console.log('path', path);
  outline
    .append('path')
    .attr('d', path)
    .attr('transform', `translate(0, ${level * 10})`);
}

function addInterstitials(peakCoords) {
  var coords = [];
  for (var i = 0; i < peakCoords.length - 1; ++i) {
    coords.push(peakCoords[i]);
    coords.push(averagePoints(peakCoords[i], peakCoords[i + 1]));
  }
  coords.push(peakCoords[peakCoords.length - 1]);
  return coords;
}

function averagePoints(a, b) {
  return [(+a[0] + +b[0]) / 2, (+a[1] + +b[1]) / 2];
}

function renderHillLevelLinear(peakCoords, level) {
  // peakCoords.sort(aIsToTheLeftOfB);
  var path = 'M0,50\n';
  for (let i = 0; i < peakCoords.length; ++i) {
    path += 'L' + peakCoords[i].join(',') + ' ';
  }
  path += '\nL100,50 L100,100 L0,100Z';
  console.log(path);
  outline
    .append('path')
    .attr('d', path)
    // .attr(
    //   'd',
    //   `M0,40
    //   L20,20
    //   C40,0 80,0 100,20
    //   L100,100 L0,100Z`
    // )
    .attr('transform', `translate(0, ${level * 10})`);
}

function renderPoints(points) {
  var circles = outline.selectAll('circle').data(points);
  circles.enter().append('circle').attr('r', 2)
  .merge(circles)
    .attr('cx', point => point[0])
    .attr('cy', point => point[1]);
}

module.exports = renderHills;
