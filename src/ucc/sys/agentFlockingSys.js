var R           = require('ramda');
var sys         = require('pex-sys');
var geom        = require('pex-geom');
var Color       = require('pex-color').Color;
var Config      = require('../../config');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentFlockingSys(state) {
  var agents = R.filter(R.where({ force: R.identity }), state.entities);
  var debugLineBuilder = state.agentDebugInfoMeshEntity.mesh.geometry;

  var tmpDir = new Vec3();
  var agentSize = Config.agentSpriteSize * state.DPI * state.zoom;
  var minDist = agentSize * 1.5;
  var minDistSqr = minDist * minDist;
  console.log('minDistSqr', minDistSqr)
  agents.forEach(function(agent) {
    agents.forEach(function(anotherAgent) {
      if (agent == anotherAgent) return;
      var distSqr = agent.position.squareDistance(anotherAgent.position);
      //if (distSqr < minDistSqr) {
      if (distSqr < 0.001) {
        tmpDir.copy(agent.position).sub(anotherAgent.position);
        //agent.force.add(tmpDir.scale(1/minDistSqr*0.01));
        debugLineBuilder.addLine(agent.position, anotherAgent.position, Color.Red);
      }

    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
    })
  })
}

module.exports = agentFlockingSys;