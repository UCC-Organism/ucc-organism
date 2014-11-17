var R       = require('ramda');
var random  = require('pex-random');
var color   = require('pex-color');

var Color   = color.Color;

function agentSpawnSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  var selectedNodes = state.map.selectedNodes;

  if (selectedNodes.length == 0) return;

  for(var i=0; i<100 - agents.length; i++) {
    var position = random.element(selectedNodes).position;
    var color = Color.Red;
    state.entities.push({
      pointSize: 5,
      agent: true,
      position: position,
      prevPosition: position.dup(),
      color: color,
      targetNode: null,
    });
  }

  //if (!State.selectedNodes) return;
  //  if (agents.length >= State.maxNumAgents) return;
  //
  //  var selectedNodes = State.selectedNodes;
  //  var stairsNodes = selectedNodes.filter(function(node) {
  //    return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
  //      return sameFloorSoFar && (neighborNode.floor == node.floor);
  //    }, true)
  //  });
  //  var stairsPointVertices = stairsNodes.map(R.prop('position'));
  //
  //  if (stairsPointVertices.length == 0) return;
  //
  //  var colors = [
  //    new Color(181/255,  77/255, 243/255),
  //    new Color(206/255, 244/255,  62/255),
  //    new Color(0/255,  150/255, 250/255)
  //  ]
  //
  //  var position = geom.randomElement(stairsPointVertices).clone();
  //  var color = geom.randomElement(colors);
  //  State.entities.push({
  //    pointSize: 5,
  //    agent: true,
  //    position: position,
  //    prevPosition: position.dup(),
  //    color: color,
  //    targetNode: null,
  //  });
}

module.exports = agentSpawnSys;