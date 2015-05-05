var R = require('ramda');
var log = require('debug')('ucc/energyUpdaterSys');
var Config = require('../../config');
var clamp = require('clamp');

function energyUpdaterSys(state) {
  var energyPathEntities = R.filter(R.where({ energyPath: R.identity }), state.entities);

  energyPathEntities.forEach(function(entity) {
    //var numTarget = entity.energyPath.getLength() * Config.energyPointsPerPathLength;
    var numTarget = 10;

    if (parseFloat(entity.multiplier)) {
      numTarget *= entity.multiplier;
    }
    else if (entity.multiplier == 'agents') {
      // base on num agents in room
      numTarget *= state.map.getRoomById(entity.startRoomId).agentCount * Config.energyAgentCountStrength;
    }
    else if (entity.multiplier == 'intensity') {
      numTarget *= Config.energyTypes[entity.energy].intensity * Config.energyIntensityStrength;
    }

    numTarget = clamp(numTarget, 0, Config.energyPointsMaxPerPath);

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