var R           = require('ramda');
var random      = require('pex-random');
var color       = require('pex-color');
var Vec3        = require('pex-geom').Vec3;
var AgentModes  = require('../agents/agentModes');
var Config      = require('../../config');
var Log         = require('../../utils/log');

var Color       = color.Color;

function makeAgentEntity(props) {

  var scale = 1;

  console.log(props);

  var prog = props.state.programme;

  if (prog == "Teacher")
  {
    scale = random.float(1.2, 1.8);
  }
  else if (prog == "Researcher" || prog == "Janitor" || prog == "Cook" || prog == "Admin")
  {
    scale = random.float(1.0, 1.5);
  }
  else // Student
  {
    scale = .5 + (((props.state.age - 15.0) / 15.0) * 1.0);
  }

  var studentAgent = {
    agent: true,
    pointSize: 3,
    typeIndex: 0,
    mode: AgentModes.Wander,
    position: props.position.dup(),
    prevPosition: props.position.dup(),
    velocity: new Vec3(0, 0, 0),
    force: new Vec3(0, 0, 0),
    color: Color.White,
    targetNode: null,
    agentId: props.id,
    agentIdNumber: parseInt(props.id.replace(/[a-zA-Z]/g,'')),
    state: props.state,
    speed: random.float(0.3, 1),
    scale: scale,
    life: 0
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

  var exitNodes = state.map.selectedNodes.filter(R.where({roomType:'exit'}));

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
      if (!agent.programme) {
        if (!agent.programmeRequest) {
          agent.programmeRequest = true;
          state.client.getAgentInfo(agent.id).then(function(agentInfo) {
            agent.programme = agentInfo.programme;
          })
        }
        return;
      }
      var spawnNode = random.element(exitNodes);
      if (!spawnNode) spawnNode = random.element(state.map.selectedNodes)
      var position = spawnNode.position;
      if (agent.targetLocation) {
        var room = state.map.getRoomById(agent.targetLocation);
        if (!room) {
          missingRooms.push(agent.targetLocation);
          return;
        }

        if ((room.floor == state.map.currentFloor) || (state.map.currentFloor == -1)) {
          //position = R.find(R.where({ roomId: room.id }), state.map.selectedNodes).position;
          agent.entity = makeAgentEntity({ position: position, id: agent.id, state: agent })
          agent.entity.typeIndex = Config.agentTypeGroups.indexOf(agent.programme);
          var c1 = Config.agentTypeColors[agent.entity.typeIndex][0];
          var c2 = Config.agentTypeColors[agent.entity.typeIndex][1];
          agent.entity.color = new Color(random.float(c1.r, c2.r), random.float(c1.g, c2.g), random.float(c1.b, c2.b));
          if (agent.entity.typeIndex !== -1) {
            state.entities.push(agent.entity);
          }
          else {
            console.log('ERR: spawnAgents: Unknown programme: "' + agent.programme + '"')
          }
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