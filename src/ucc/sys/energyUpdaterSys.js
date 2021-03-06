var R = require('ramda');
var log = require('debug')('ucc/energyUpdaterSys');
var Config = require('../../config');
var clamp = require('clamp');
var Time = require('pex-sys').Time;

function energyUpdaterSys(state) {
  var energyPathEntities = R.filter(R.where({ energyPath: R.identity }), state.entities);

  energyPathEntities.forEach(function(entity) {
    //var numTarget = entity.energyPath.getLength() * Config.energyPointsPerPathLength;
    var numTarget = 10;

    var emittance = Config.energyTypes[entity.energy].emittance;

    if (parseFloat(entity.multiplier)) {
      numTarget *= entity.multiplier;
    }
    else if (entity.multiplier == 'agents') {
      // base on num agents in room
      numTarget *= emittance * state.map.getRoomById(entity.startRoomId).agentCount * Config.energyAgentCountStrength;
    }
    else if (entity.multiplier == 'intensity') {
      var intensity = Config.energyTypes[entity.energy].intensity;
      var pulse = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (entity.random + Time.seconds / Config.energyPulseDuration));
      numTarget *= pulse * emittance * intensity * Config.energyIntensityStrength;
    }

    numTarget = clamp(numTarget, 0, Config.energyPointsMaxPerPath);

    if (state.map.currentFloor == -1) {
      numTarget /= 2;
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
