var R     = require('ramda');
var sys   = require('pex-sys');
var geom  = require('pex-geom');
var AgentModes = require('../agents/agentModes');
var Config = require('../../config');
var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentTargetNodeFollowerSys(state) {
  var targetFollowers = R.filter(R.where({ targetNode: R.identity }), state.entities);

  var tmpDir = new Vec3();
  targetFollowers.forEach(function(followerEntity, idx) {
    tmpDir.copy(followerEntity.targetNode.position).sub(followerEntity.position);
    var tmpDirLen = tmpDir.length();
    var speed = Config.agentSpeed * followerEntity.speed;
    if (followerEntity.mode == AgentModes.Classroom) {
      speed *= 2;
    }
    tmpDir.limit(speed * Time.delta / 10);
    followerEntity.force.add(tmpDir);
    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
  })
}

module.exports = agentTargetNodeFollowerSys;