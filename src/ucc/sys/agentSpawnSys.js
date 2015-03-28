var R           = require('ramda');
var random      = require('pex-random');
var color       = require('pex-color');
var Vec3        = require('pex-geom').Vec3;
var AgentModes  = require('../agents/agentModes');
var Config      = require('../../config');
var Log      = require('../../utils/log');

var Color       = color.Color;

function makeAgentEntity(props) {
  var studentAgent = {
    agent: true,
    pointSize: 3,
    typeIndex: random.int(0, 10),
    mode: AgentModes.Wander,
    position: props.position.dup(),
    prevPosition: props.position.dup(),
    velocity: new Vec3(0, 0, 0),
    force: new Vec3(0, 0, 0),
    color: Color.White,
    targetNode: null,
    agentId: props.id,
    state: props.state
  };
  return studentAgent;
}

function spawnAgents(state) {
  var color = Color.White;

  var stairsNodes = state.map.selectedNodes.filter(function(node) {
    return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
      return sameFloorSoFar && (neighborNode.floor == node.floor);
    }, true)
  });
  stairsNodes = stairsNodes.filter(R.where({floor:1}));

  if (!stairsNodes.length) {
    stairsNodes = state.map.selectedNodes;
  }

  //for each agent:
  //    if !spawned
  //        room = agent.location
  //        if room.floor = current.floor
  //             if !agent.position
  //                  agent.position = random node
  //             agent.target = room.node
  //             entities add agent
  var missingRooms = [];
  state.agents.all.forEach(function(agent) {
    if (!agent.entity) {
      var position = random.element(stairsNodes).position;
      if (agent.targetLocation) {
        var room = state.map.getRoomById(agent.targetLocation);
        if (!room) {
          missingRooms.push(agent.targetLocation);
          return;
        }

        if ((room.floor == state.map.currentFloor) || (state.map.currentFloor == -1)) {
          //position = R.find(R.where({ roomId: room.id }), state.map.selectedNodes).position;
          agent.entity = makeAgentEntity({ position: position, id: agent.id, state: agent })
          state.entities.push(agent.entity);
        }
      }
    }
  })

  Log.once('ERR missing rooms "', R.uniq(missingRooms), '"')
}

function agentSpawnSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);

  spawnAgents(state, agents);
}

module.exports = agentSpawnSys;