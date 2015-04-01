var R           = require('ramda');
var graph       = require('../../graph');
var random      = require('pex-random');
var config      = require('../../config');
var AgentModes  = require('../agents/agentModes');

function agentTargetNodeUpdaterSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));

  var exitNodes = state.map.selectedNodes.filter(R.where({roomType:'exit'}));
  var toiletNodes = state.map.selectedNodes.filter(R.where({roomType:'toilet'}));

  agents.forEach(function(agent, idx) {
    //if (idx == 0) console.log(agent)
    if (agent.state.targetMode) {
      agent.state.mode = agent.state.targetMode;
      agent.state.targetMode = AgentModes.None;
      agent.targetNode = null;
    }

    if (!agent.targetNode) {
      var targetNode = null;
      if (agent.state.mode == AgentModes.Classroom && agent.state.targetLocation) {
        targetNode = state.map.getSelectedNodeByRoomId(agent.state.targetLocation);
        agent.state.targetLocation = null;
      }
      else if (agent.state.mode == AgentModes.Roaming) {
        targetNode = random.element(state.map.selectedNodes); //TODO: should choose a corridor
      }
      else if (agent.state.mode == AgentModes.Away) {
        targetNode = random.element(exitNodes);
      }
      else if (agent.state.mode == AgentModes.Toilet) {
        if (toiletNodes.length > 0) {
          console.log('looking for toilets', toiletNodes.length)
          targetNode = random.element(toiletNodes);
          agent.state.mode = AgentModes.None;
        }
        else {
          agent.state.mode = AgentModes.Roaming;
        }
      }
      else if (agent.state.mode == AgentModes.Closet) {
      }
      else if (agent.state.mode == AgentModes.Lunch) {
        targetNode = state.map.getSelectedNodeByRoomId(agent.state.targetLocation);
        if (!targetNode) {
          targetNode = random.element(exitNodes);
        }
        agent.state.mode = AgentModes.Dead;
      }
      var path = null;

      if (!path && targetNode) {
        var closestNode = graph.findNearestNode(state.map.selectedNodes, agent.position);
        path = graph.findShortestPath(closestNode, targetNode);
      }
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