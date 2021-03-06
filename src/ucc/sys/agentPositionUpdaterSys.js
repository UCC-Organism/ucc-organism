var R     = require('ramda');
var sys   = require('pex-sys');
var geom  = require('pex-geom');
var Config = require('../../config');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentPositionUpdaterSys(state) {
  var agents = R.filter(R.where({ targetNode: R.identity }), state.entities);

  var tmpDir = new Vec3();
  agents.forEach(function(followerEntity, idx) {
    followerEntity.prevPosition.copy(followerEntity.position);
    followerEntity.velocity.scale(0.9);
    followerEntity.force.limit(Config.agentSpeed * Time.delta / 10);
    followerEntity.velocity.add(followerEntity.force);
    if (followerEntity.life >= 1) {
      followerEntity.position.add(followerEntity.velocity);
    }
    followerEntity.force.scale(0);
  })
}

module.exports = agentPositionUpdaterSys;