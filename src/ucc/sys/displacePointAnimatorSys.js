var Time = require('pex-sys').Time;

function displacePointAnimatorSys(state) {
  state.map.strongDisplacePoints.forEach(function(point) {
    //not sure if i understand the max possible value here
    point.strength = 0.3 * (0.5 * Math.sin(Time.seconds + Math.PI * 2 * point.timeOffset));
  })
}


module.exports = displacePointAnimatorSys;