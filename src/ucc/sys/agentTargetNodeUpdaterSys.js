var R = require('ramda');

function agentTargetNodeUpdaterSys(state) {
  //var selectedNodes = State.selectedNodes;

  var agents = R.filter(R.where({ agent: R.identity }), state.entities);

  var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));

  if (state.debug) console.log('agentTargetNodeUpdaterSys agents:', agents.length, 'agentsWithNoTarget:', agentsWithNoTarget.length);

  //agentsWithNoTarget.forEach(function(agentEntity) {
  //  var targetNode = geom.randomElement(selectedNodes);
  //  var closestNode = graph.findNearestNode(State.selectedNodes, agentEntity.position);
  //  var path = graph.findShortestPath(closestNode, targetNode);
  //  if (!path) {
  //    //No path found, try next time
  //    agentEntity.targetNodeList = [];
  //    agentEntity.targetNode = null;
  //  }
  //  else {
  //    agentEntity.targetNodeList = path;
  //    agentEntity.targetNode = agentEntity.targetNodeList.shift();
  //  }
  //});

  //var agentsWithTarget = agents.filter(R.prop('targetNode'));
  //agentsWithTarget.forEach(function(agentEntity) {
  //  if (agentEntity.position.distance(agentEntity.targetNode.position) < State.minNodeDistance) {
  //    if (agentEntity.targetNodeList.length > 0) {
  //      agentEntity.targetNode = agentEntity.targetNodeList.shift();
  //    }
  //    else {
  //      agentEntity.targetNode = null;
  //    }
  //  }
  //})
//}
}

module.exports = agentTargetNodeUpdaterSys;