var R     = require('ramda');
var sys   = require('pex-sys');
var geom  = require('pex-geom');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentPositionUpdaterSys(state) {
  var agents = R.filter(R.where({ targetNode: R.identity }), state.entities);

  var tmpDir = new Vec3();
  agents.forEach(function(followerEntity, idx) {
    followerEntity.prevPosition.copy(followerEntity.position);
    followerEntity.velocity.scale(0.9);
    followerEntity.velocity.add(followerEntity.force);
    followerEntity.position.add(followerEntity.velocity);
    followerEntity.force.scale(0);
  })
}

module.exports = agentPositionUpdaterSys;