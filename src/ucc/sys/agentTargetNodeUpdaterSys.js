var R           = require('ramda');
var graph       = require('../../graph');
var random      = require('pex-random');
var config      = require('../../config');
var AgentModes  = require('../agents/AgentModes');

function agentTargetNodeUpdaterSys(state) {
  //var selectedNodes = State.selectedNodes;

  var agents = R.filter(R.where({ agent: R.identity }), state.entities);

  var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));
  var studentAgentsWithNoTarget = agentsWithNoTarget.filter(R.prop('studentId'));

  if (state.verbose) console.log('agentTargetNodeUpdaterSys agents:', agents.length, 'studentAgentsWithNoTarget:', studentAgentsWithNoTarget.length);

  var studentAgentIdMap = {};
  studentAgentsWithNoTarget.forEach(function(studentAgent) {
    studentAgentIdMap[studentAgent.studentId] = studentAgent;
  });

  state.activities.current.forEach(function(activity) {
    var location = activity.locations[0];
    if (!location) return;
    var activityLocationNodes = state.map.nodes.filter(R.where({ room: location }));
    activity.groups.forEach(function(groupId) {
      var group = state.groups.byId[groupId];
        if (!group) return;
        group.students.forEach(function(student) {
          var studentAgent = studentAgentIdMap[student.id];

          if (!studentAgent) return;

          if ( config.programmeColors[group.programme]) {
            studentAgent.color = config.programmeColors[group.programme].primary;
          }
          else {
            studentAgent.color = config.programmeColors.default.primary;
          }

          var targetNode = random.element(activityLocationNodes);
          //targetNode = state.map.selectedNodes[0];
          var closestNode = graph.findNearestNode(state.map.selectedNodes, studentAgent.position);
          var path = graph.findShortestPath(closestNode, targetNode);

          if (!path) {
            //No path found, try next time
            studentAgent.targetNodeList = [];
            studentAgent.targetNode = null;
          }
          else {
            studentAgent.targetNodeList = path;
            studentAgent.targetNode = studentAgent.targetNodeList.shift();
          }

        })
    })
  })

  //agents with nothing to do anymore, they should go out and dissapear
  var studentAgentsWithNoTarget2 = agents.filter(R.not(R.prop('targetNode')));
  var rooms = state.map.selectedNodes.filter(R.where({ roomType: 'classroom'}));

  studentAgentsWithNoTarget2.forEach(function(agent, agentIndex) {
    random.seed(Date.now() + agentIndex);
    var targetNode;

    var path;

    if (agent.mode == AgentModes.Wander) {
      targetNode = random.element(state.map.selectedNodes);
    }
    else if (agent.mode == AgentModes.Classroom) {
      targetNode = rooms[agent.typeIndex];
      if (targetNode.position.distance(agent.position) < 0.1) {
        agent.mode = AgentModes.Study;
      }
    }
    else if (agent.mode == AgentModes.Study) {
      targetNode = { position: rooms[agent.typeIndex].position.dup() };
      targetNode.position.x += random.float(-0.01, 0.01);
      targetNode.position.y += random.float(-0.01, 0.01);

      path = [ targetNode ];
    }

    var closestNode = graph.findNearestNode(state.map.selectedNodes, agent.position);
    if (!path && targetNode) path = graph.findShortestPath(closestNode, targetNode);

    if (!path) {
      //No path found, try next time
      agent.targetNodeList = [];
      agent.targetNode = null;
    }
    else {
      agent.targetNodeList = path;
      agent.targetNode = agent.targetNodeList.shift();
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