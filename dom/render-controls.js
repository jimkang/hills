var d3 = require('d3-selection');
var rollButton = d3.select('#roll-hills-button');
var animateCheckbox = d3.select('#animate-checkbox');

function renderControls({
  onRoll,
  shouldTweenBetweenPairs,
  onShouldTweenChange
}) {
  rollButton.on('click.roll', null);
  rollButton.on('click.roll', onRoll);
  animateCheckbox.node().checked = shouldTweenBetweenPairs;
  animateCheckbox.on('change', onAnimateCheckboxChange);

  function onAnimateCheckboxChange() {
    onShouldTweenChange(animateCheckbox.node().checked);
  }
}

module.exports = renderControls;
