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

  if (state.showLabels) {
    state.map.rooms.forEach(function(room) {
     var roomNode = R.find(R.where({roomId: room.id}), state.map.selectedNodes);
     if (roomNode) {
        var name = room.id;
        if (name.indexOf('room') == 0) name = room.type;
        state.debugText.drawText(name + ' / ' + room.agentCount, roomNode.position);
     }
   })
  }
}

module.exports = roomInfoUpdaterSys;
