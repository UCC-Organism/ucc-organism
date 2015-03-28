var R           = require('ramda');
var graph       = require('../../graph');
var random      = require('pex-random');
var config      = require('../../config');
var AgentModes  = require('../agents/agentModes');

function agentTargetNodeUpdaterSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));

  console.log('agentTargetNodeUpdaterSys', agents.length)

  agents.forEach(function(agent, idx) {
    //if (idx == 0) console.log(agent)
    if (agent.state.targetMode) {
      agent.state.mode = agent.state.targetMode;
      agent.state.targetMode = AgentModes.None;
      agent.targetNode = null;
    }

    if (!agent.targetNode) {
      if (agent.state.targetLocation) {
        var targetNode = R.find(R.where({ roomId: agent.state.targetLocation }), state.map.selectedNodes);
        var path = null;

        var closestNode = graph.findNearestNode(state.map.selectedNodes, agent.position);
        if (!path && targetNode) path = graph.findShortestPath(closestNode, targetNode);
        if (!path) {
          //TODO: print warnign and change mode to wander
          //No path found, try next time
          agent.targetNodeList = [];
          agent.targetNode = null;
        }
        else {
          agent.targetNodeList = path;
          agent.targetNode = agent.targetNodeList.shift();
        }
      }
    }
  })

  var agentsWithTarget = agents.filter(R.prop('targetNode'));
  agentsWithTarget.forEach(function(agentEntity) {
    var dist = agentEntity.position.distance(agentEntity.targetNode.position);
    if (dist < state.minNodeDistance) {
      if (agentEntity.targetNodeList.length > 0) {
        agentEntity.targetNode = agentEntity.targetNodeList.shift();
      }
      else {
        agentEntity.targetNode = null;
      }
    }
  })
}

module.exports = agentTargetNodeUpdaterSys;