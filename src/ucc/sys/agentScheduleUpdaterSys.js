var R     = require('ramda');
var sys   = require('pex-sys');
var geom  = require('pex-geom');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentScheduleUpdaterSys(state) {
  var agents = R.filter(R.where({ targetNode: R.identity }), state.entities);
}

module.exports = agentScheduleUpdaterSys;