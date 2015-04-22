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
    if (agent.state.targetMode) {
      agent.state.mode = agent.state.targetMode;
      agent.state.targetMode = AgentModes.None;
      agent.targetNode = null;
    }

    if (!agent.targetNode) {
      if (agent.prevTargetNode && agent.prevTargetNode.roomType == 'exit') {
        agent.state.mode = AgentModes.Dead;
      }

      var targetNode = null;
      if (agent.state.mode == AgentModes.Classroom && agent.state.targetLocation) {
        targetNode = state.map.getSelectedNodeByRoomId(agent.state.targetLocation);
        if (!targetNode) {
          agent.state.mode = AgentModes.None;
          targetNode = random.element(exitNodes);
        }
        agent.state.location = agent.state.targetLocation;
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
          agent.state.mode = AgentModes.None;
          targetNode = random.element(exitNodes);
          agent.state.location = null;
        }
        else {
          agent.state.location = agent.state.targetLocation;
        }
        agent.state.targetLocation = null;
      }
      var path = null;

      if (!path && targetNode) {
        var closestNode = graph.findNearestNode(state.map.selectedNodes, agent.position);
        path = graph.findShortestPath(closestNode, targetNode);
        if (path) {
          path.push(targetNode);
        }
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
  agentsWithTarget.forEach(function(agent) {
    var dist = agent.position.distance(agent.targetNode.position);
    if (dist < state.minNodeDistance) {
      if (agent.targetNodeList.length > 0) {
        agent.prevTargetNode = agent.targetNode;
        agent.targetNode = agent.targetNodeList.shift();
      }
      else {
        agent.targetNode = null;
        if (agent.state.mode == AgentModes.Lunch) {
          agent.state.mode = AgentModes.Eating;
        }
        if (agent.state.mode == AgentModes.Classroom) {
          agent.state.mode = AgentModes.Studying;
        }
      }
    }
  })
}

module.exports = agentTargetNodeUpdaterSys;