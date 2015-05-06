var Time = require('pex-sys').Time;
var Config = require('../../config');

function displacePointUpdaterSys(state) {
  state.map.strongDisplacePoints.forEach(function(point) {
    //WEAK ANIMATION
    //not sure if i understand the max possible value here
    var room = state.map.getRoomById(point.roomId);
    if (room) {
      point.targetStrength = -0.1 + 0.2 * (0.5 * Math.sin(Time.seconds + Math.PI * 2 * point.timeOffset));
      if (room.agentCount) {
        point.targetStrength = 0.005 * room.agentCount;
      }
      //avoid popping
    }
    else if (point.energy) {
      var intensity = Config.energyTypes[point.energy].intensity;
      point.targetStrength = intensity * point.maxStrength * (0.5 + 0.5 * Math.sin(Time.seconds + Math.PI * 2 * point.timeOffset));
    }
    else {
      point.targetStrength = point.maxStrength * (0.5 + 0.5 * Math.sin(Time.seconds + Math.PI * 2 * point.timeOffset));
    }
    point.strength += (point.targetStrength - point.strength) * 0.01;
  })
}


module.exports = displacePointUpdaterSys;