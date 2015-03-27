var R           = require('ramda');
var random      = require('pex-random');
var color       = require('pex-color');
var Vec3        = require('pex-geom').Vec3;
var AgentModes  = require('../agents/agentModes');
var Config      = require('../../config');
var Log      = require('../../utils/log');

var Color       = color.Color;

/*
function spawnStudents(state, agents) {
  var aliveStudentAgents = R.filter(R.where({ studentId: R.identity }), agents);

  var aliveStudentsIds = R.map(R.prop('studentId'), aliveStudentAgents);
  var currentStudentsIds = R.map(R.prop('id'), state.activities.currentStudents);

  var studentsToSpawn = R.difference(currentStudentsIds, aliveStudentsIds);

  //console.log('spawnStudents', 'aliveStudentsIds:', aliveStudentsIds.length, 'currentStudentsIds:', currentStudentsIds.length, 'studentsToSpawn:', studentsToSpawn.length);

  var stairsNodes = state.map.selectedNodes.filter(function(node) {
    return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
      return sameFloorSoFar && (neighborNode.floor == node.floor);
    }, true)
  });

  stairsNodes = stairsNodes.filter(R.where({floor:1}));

  if (!stairsNodes.length) {
    stairsNodes = state.map.selectedNodes;
  }

  studentsToSpawn = studentsToSpawn.slice(0, 10);

  //if (studentsToSpawn.length == 0) {
    if (aliveStudentAgents.length < state.numRandomStudents) {
      var position = random.element(stairsNodes).position;
      studentsToSpawn = R.range(0, 10).map(function() {
        return 'temp' + random.int(0, 999999999);
      })
    }
  //}

  studentsToSpawn.forEach(function(studentId, studentIndex) {
    random.seed(Date.now() + studentIndex);
    var position = random.element(stairsNodes).position;
    var hues = [0, 0.4, 0.6];
    var color = Color.fromHSL(random.element(hues), 0.8, 0.7);
    color = Color.White;

    if (aliveStudentAgents.length < state.maxAgentCount) {
      var studentAgent = {
        pointSize: 3,
        agent: true,
        typeIndex: random.int(0, 10),
        mode: AgentModes.Wander,
        position: position.dup(),
        prevPosition: position.dup(),
        velocity: new Vec3(0, 0, 0),
        force: new Vec3(0, 0, 0),
        color: color,
        targetNode: null,
        studentId: studentId,
      };

      state.entities.push(studentAgent);
      aliveStudentAgents.push(studentAgent);
    }
  })
}
*/
function makeAgentEntity(props) {
  var studentAgent = {
    pointSize: 3,
    agent: true,
    typeIndex: random.int(0, 10),
    mode: AgentModes.Wander,
    position: props.position.dup(),
    prevPosition: props.position.dup(),
    velocity: new Vec3(0, 0, 0),
    force: new Vec3(0, 0, 0),
    color: Color.White,
    targetNode: null,
    agentId: props.id
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
      if (agent.location) {
        var room = state.map.getRoomById(agent.location);
        if (!room) {
          missingRooms.push(agent.location);
          return;
        }

        if ((room.floor == state.map.currentFloor) || (state.map.currentFloor == -1)) {
          position = R.find(R.where({ roomId: room.id }), state.map.selectedNodes).position;
          agent.entity = makeAgentEntity({ position: position, id: agent.id })
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


  //state.activities.current.forEach(function(activity) {
  //  activity.groups.map(function(groupId) {
  //    var group = state.groups.byId[groupId];
  //    if (!group) return;
  //    group.students.forEach(function(student) {
  //      if (aliveAgentsIds.indexOf(student.id) == -1) {
//
  //      }
  //    })
  //  }))
  //})

  //for(var i=0; i<100 - agents.length; i++) {
    
  //}

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