var R = require('ramda');

function energyUpdaterSys(state) {
  var energyPathEntities = R.filter(R.where({ energyPath: R.identity }), state.entities);

  energyPathEntities.forEach(function(entity) {
    var numTarget = 10;

    if (parseFloat(entity.multiplier)) {
      numTarget *= entity.multiplier;
    } else {
      // base on num agents in room
      numTarget *= state.map.getRoomById(entity.startRoomId).agentCount * 2;
    }

    var num = entity.num || 0;

    if (num != numTarget) {
      if (num < numTarget) {
        num += 4;
        if (num > numTarget) num = numTarget;
      }
      else {
        num -= 4;
        if (num < 0) num = 0;
      }
    }

    entity.num = num;
  });
}

module.exports = energyUpdaterSys;