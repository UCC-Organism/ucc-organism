var R           = require('ramda');
var random      = require('pex-random');
var color       = require('pex-color');
var Vec3        = require('pex-geom').Vec3;
var AgentModes  = require('../agents/agentModes');
var Config      = require('../../config');
var log         = require('debug')('ucc/agentSpawnSys');
var clamp       = require('clamp');
var remap       = require('re-map');

var Color       = color.Color;

var loggedMissingRooms = [];

function makeAgentEntity(props) {

  var scale = 1;

  var programme = props.state.programme;

  if (programme == "Teacher")
  {
    scale = random.float(1.2, 1.8);
  }
  else if (programme == "Researcher" || programme == "Janitor" || programme == "Cook" || programme == "Admin")
  {
    scale = random.float(1.0, 1.5);
  }
  else // Student
  {
    var age = clamp(props.state.age, 20, 40);
    scale = remap(age, 20, 40, 0.5, 1.5);
  }

  var agent = {
    agent: true,
    pointSize: 3,
    type: '',
    mode: AgentModes.Wander,
    position: props.position.dup(),
    prevPosition: props.position.dup(),
    velocity: new Vec3(0, 0, 0),
    force: new Vec3(0, 0, 0),
    rotation: 0,
    color: Color.White,
    targetNode: null,
    agentId: props.id,
    agentIdNumber: parseInt(props.id.replace(/[a-zA-Z]/g,'')),
    state: props.state,
    speed: random.float(0.3, 1),
    scale: scale,
    life: 0
  };

  random.seed(agent.agentIdNumber);
  agent.random = random.float();

  return agent;
}

function getAgentTypeForProgramme(programme) {
  var keys = R.keys(Config.agentTypes)
  var values = R.values(Config.agentTypes);
  var index = R.findIndex(R.where({ programme: programme }), values);
  var type = 'unknown';
  if (index != -1) {
    type = keys[index];
  }
  return type;
}

function spawnAgents(state) {
  var color = Color.White;

  var exitNodes = state.map.getSelectedNodesByRoomType('exit');

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
          if (state.client && state.client.enabled) {
            setTimeout(function() {
              state.client.getAgentInfo(agent.id).then(function(agentInfo) {
                agent.gender = agentInfo.gender;
                agent.age = agentInfo.age || 20;
                agent.programme = agentInfo.programme;
              })
            }, random.int(100, 5000));
          }
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
          agent.entity.type = getAgentTypeForProgramme(agent.programme);
          agent.entity.typeIndex = R.keys(Config.agentTypes).indexOf(agent.entity.type);
          agent.entity.color = Color.White.clone();

          if (Config.agentFillColorBasedOnAccentColor)
          {
            var c = agent.entity.color.clone();
            c.a = .5;
            agent.entity.colorFill = c;
          }

          if (Config.agentInvertFillAndLineColorBasedOnGender && agent.gender == 0)
          {
            var cl = agent.entity.colorLines;
            agent.entity.colorLines = agent.entity.colorFill;
            agent.entity.colorFill = cl;
          }


          if (agent.entity.type !== 'unknown') {
            state.entities.push(agent.entity);
          }
          else {
            log('ERR: spawnAgents: Unknown programme: "' + agent.programme + '"')
          }
        }
      }
    }
  })

  missingRooms = R.uniq(missingRooms).filter(function(room) {
    return missingRooms.indexOf(room) == -1;
  });
  if (missingRooms.length > 0) {
    loggedMissingRooms = loggedMissingRooms.concat(missingRooms);
    log('ERR missing rooms "', missingRooms, '"')
  }
}

function agentSpawnSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);

  spawnAgents(state, agents);
}

module.exports = agentSpawnSys;
