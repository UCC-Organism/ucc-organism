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

var log                 = require('debug')('ucc/agentFlockingSys');

var Time  = sys.Time;
var Vec3  = geom.Vec3;

function agentFlockingSys(state) {
  var agents = R.filter(R.where({ force: R.identity }), state.entities);
  if (!state.agentInteractionsMeshEntity) {
    var lineBuilder = new LineBuilder();
    lineBuilder.addLine(new Vec3(0, 0, 0), new Vec3(0,0,0));
    var image = Platform.isPlask ? __dirname + '/../../../assets/lasers.png' : 'assets/lasers.png';
    var mesh = new Mesh(lineBuilder, new Textured({ scale: new Vec2(200, 1), offset: new Vec2(0, 0), texture: Texture2D.load(image, { repeat: true })}), { lines: true });
    mesh.position.z = 0.001;
    state.agentInteractionsMeshEntity = {
      disableDepthTest: true,
      lineWidth: 2 * state.DPI,
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
  var repulsionDist = Config.repulsionDistance;
  var repulsionDistSqr = repulsionDist * repulsionDist;
  var interactionDist = Config.interactionDistance;
  var interactionDistSqr = interactionDist * interactionDist;
  var minInteractionDist = Config.interactionDistance * 0.1;
  var minInteractionDistSqr = minInteractionDist * minInteractionDist;

  for(var k=0; k<Config.agentInteractions.length; k++) {
    Config.agentInteractions[k].count = 0;
  }

  var lines = this.lines = this.lines || [];
  var numLines = 0;

  for(var i=0; i<agents.length; i++) {
    var agent = agents[i];

    for(var j=i+1; j<agents.length; j++) {
      anotherAgent = agents[j];
      var distSqr = agent.position.squareDistance(anotherAgent.position);
      if (distSqr < repulsionDistSqr) {
        var dist = Math.sqrt(distSqr);
        if (dist > 0) {
          tmpDir.copy(agent.position).sub(anotherAgent.position);
          if (agent.mode == AgentModes.Studying || agent.mode == AgentModes.Eating) {
            tmpDir.normalize().cross(up).scale(0.01);
            agent.force.add(tmpDir);
            anotherAgent.force.add(tmpDir.scale(-2));
            agent.force.add(tmpDir.scale(0.1));
          }
          else if (agent.state.mode == AgentModes.Away
            || anotherAgent.state.mode == AgentModes.Away
            || agent.state.mode == AgentModes.None
            || anotherAgent.state.mode == AgentModes.None) {
            //no repulsion
          }
          else {
            //normal repulsion
            agent.force.add(tmpDir.scale(0.001 * Config.repulsionStrengthInCorridor));
          }
        }
      }

      if (distSqr < interactionDistSqr && distSqr > minInteractionDistSqr) {
        for(var k=0; k<Config.agentInteractions.length; k++) {
          var interaction = Config.agentInteractions[k];
          if (interaction.count > Config.maxInteractionsCount) continue;
          var from1, from2, to1, to2;
          from1 = (interaction.from == agent.type);
          from2 = (interaction.from == 'student') && Config.agentTypes[agent.type].student;
          to1 = (interaction.to == anotherAgent.type)
          to2 = (interaction.to == 'student') && Config.agentTypes[anotherAgent.type].student;
          if ((from1 || from2) && (to1 || to2)) {
            if (!lines[numLines]) lines[numLines] = [];
            lines[numLines][0] = agent.position;
            lines[numLines][1] = anotherAgent.position;
            lines[numLines][2] = Config.energyTypes[interaction.energy].color;
            lines[numLines][3] = distSqr
            numLines++;
            break;
          }
          from1 = (interaction.from == anotherAgent.type);
          from2 = (interaction.from == 'student') && Config.agentTypes[anotherAgent.type].student;
          to1 = (interaction.to == agent.type)
          to2 = (interaction.to == 'student') && Config.agentTypes[agent.type].student;
          if ((from1 || from2) && (to1 || to2)) {
            if (!lines[numLines]) lines[numLines] = [];
            lines[numLines][0] = agent.position;
            lines[numLines][1] = anotherAgent.position;
            lines[numLines][2] = Config.energyTypes[interaction.energy].color;
            lines[numLines][3] = distSqr
            numLines++;
            break;
          }
        }
      }

    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
    }
  }

  for(var i=0; i<numLines; i++) {
    lineBuilder.addLine(lines[i][0], lines[i][1], lines[i][2]);
  }
}

module.exports = agentFlockingSys;
