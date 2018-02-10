var d3 = require('d3-selection');
var rollButton = d3.select('#roll-hills-button');

function renderControls({ onRoll }) {
  rollButton.on('click.roll', null);
  rollButton.on('click.roll', onRoll);
}

module.exports = renderControls;
