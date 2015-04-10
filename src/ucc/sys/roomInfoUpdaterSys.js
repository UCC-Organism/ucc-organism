var AgentModes  = require('../agents/agentModes');
var R = require('ramda');

function roomInfoUpdaterSys(state) {
  var agents = R.filter(R.where({ force: R.identity }), state.entities);

  state.map.rooms.forEach(function(room) {
    room.agentCount = 0;
  })

  agents.forEach(function(agent) {
    if (agent.state.mode == AgentModes.Studying || agent.state.mode == AgentModes.Eating) {
      var room = state.map.getRoomById(agent.state.location);
      if (room) {
        room.agentCount++;
      }
    }
  })

  state.map.strongDisplacePoints.forEach(function(point) {
    var room = state.map.getRoomById(point.roomId);
    if (room) {
      state.debugText.drawText(point.roomId + ' / ' + room.agentCount, point.position);
    }
  });
}

module.exports = roomInfoUpdaterSys;