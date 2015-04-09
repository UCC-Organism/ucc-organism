var Time = require('pex-sys').Time;

function displacePointUpdaterSys(state) {
  state.map.strongDisplacePoints.forEach(function(point) {
    //WEAK ANIMATION
    //not sure if i understand the max possible value here
    point.strength = -0.1 + 0.1 * (0.5 * Math.sin(Time.seconds + Math.PI * 2 * point.timeOffset));

    var room = state.map.getRoomById(point.roomId);
    if (room && room.agentCount) {
      point.strength = 0.005 * room.agentCount;
    }
  })
}


module.exports = displacePointUpdaterSys;