var R           = require('ramda');
var sys         = require('pex-sys');
var geom        = require('pex-geom');
var Color       = require('pex-color').Color;
var Vec2       = require('pex-geom').Vec2;
var Config      = require('../../config');
var AgentModes  = require('../agents/agentModes');
var LineBuilder   = require('../../gen/LineBuilder');
var Mesh   = require('pex-glu').Mesh;
var Textured    = require('../../materials/Textured');
var Texture2D = require('pex-glu').Texture2D;
var Platform = require('pex-sys').Platform;

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentFlockingSys(state) {
  var agents = R.filter(R.where({ force: R.identity }), state.entities);
  if (!state.agentInteractionsMeshEntity) {
    var lineBuilder = new LineBuilder();
    lineBuilder.addLine(new Vec3(0, 0, 0), new Vec3(0,0,0));
    var image = Platform.isPlask ? __dirname + '/../../../assets/lasers.png' : 'assets/lasers.png';
    var mesh = new Mesh(lineBuilder, new Textured({ scale: new Vec2(3000, 1), offset: new Vec2(0, 0), texture: Texture2D.load(image, { repeat: true, nearest: true })}), { lines: true });
    mesh.position.z = 0.002;
    state.agentInteractionsMeshEntity = {
      disableDepthTest: true,
      lineWidth: 4,
      mesh: mesh
    };
    state.entities.push(state.agentInteractionsMeshEntity);
  }

  var lineBuilder = state.agentInteractionsMeshEntity.mesh.geometry;
  var material = state.agentInteractionsMeshEntity.mesh.material;
  lineBuilder.reset();

  material.uniforms.offset.x = Time.seconds;

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
            tmpDir.normalize().cross(up).scale(0.00001);
            agent.force.add(tmpDir);
            anotherAgent.force.add(tmpDir.scale(-2));
            agent.force.add(tmpDir.scale(0.1));
          }
          else {
            //normal repulsion
            agent.force.add(tmpDir.scale(0.001));
          }

          var energy;
          if (agent.type == 'teacher' || anotherAgent.type == 'teacher') {
            energy = Config.energyTypes.knowledge;
          }
          else {
            energy = Config.energyTypes.social;
          }
          lineBuilder.addLine(agent.position, anotherAgent.position, energy.color);
        }
      }

    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
    }
  }
}

module.exports = agentFlockingSys;