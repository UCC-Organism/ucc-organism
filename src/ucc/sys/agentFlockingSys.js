var R           = require('ramda');
var sys         = require('pex-sys');
var geom        = require('pex-geom');
var Color       = require('pex-color').Color;
var Config      = require('../../config');
var AgentModes  = require('../agents/agentModes');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentFlockingSys(state) {
  var agents = R.filter(R.where({ force: R.identity }), state.entities);
  var debugLineBuilder = state.agentDebugInfoMeshEntity.mesh.geometry;

  var tmpDir = new Vec3();
  var up = new Vec3(0, 0, 1);
  var agentSize = Config.agentSpriteSize * state.DPI * 0.0003;
  var minDist = agentSize * 2;
  var minDistSqr = minDist * minDist;
  for(var i=0; i<agents.length; i++) {
    var agent = agents[i];
    for(var j=i+1; j<agents.length; j++) {
      anotherAgent = agents[j];
      var distSqr = agent.position.squareDistance(anotherAgent.position);
      if (distSqr < minDistSqr) {
        var dist = Math.sqrt(distSqr);
        if (dist > 0) {
          tmpDir.copy(agent.position).sub(anotherAgent.position);
          if (agent.mode == AgentModes.Studying || agent.mode == AgentModes.Eating) {
            //tmpDir.normalize().cross(up).scale(0.00001);
            //agent.force.add(tmpDir);
            //anotherAgent.force.add(tmpDir.scale(-2));
            console.log('repulsion')
            agent.force.add(tmpDir.scale(0.1));
          }
          else {
            //normal repulsion
            agent.force.add(tmpDir.scale(0.001));
          }
          debugLineBuilder.addLine(agent.position, anotherAgent.position, Color.White);
        }
      }

    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
    }
  }
}

module.exports = agentFlockingSys;