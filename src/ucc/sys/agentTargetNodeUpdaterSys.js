var R      = require('ramda');
var graph  = require('../../graph');
var random = require('pex-random');

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
    activity.groups.forEach(function(groupId) {
      var group = state.groups.byId[groupId];
        if (!group) return;
        group.students.forEach(function(student) {
          var studentAgent = studentAgentIdMap[student.id];

          if (!studentAgent) return;

          var targetNode = random.element(state.map.selectedNodes);
          targetNode = state.map.selectedNodes[0];
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


  var agentsWithTarget = agents.filter(R.prop('targetNode'));
  agentsWithTarget.forEach(function(agentEntity) {
    var dist = agentEntity.position.distance(agentEntity.targetNode.position);
    if (dist < state.minNodeDistance) {
      if (agentEntity.targetNodeList.length > 0) {
        agentEntity.targetNode = agentEntity.targetNodeList.shift();
      }
      else {
        //agentEntity.targetNode = null;
      }
    }
  })
}

module.exports = agentTargetNodeUpdaterSys;