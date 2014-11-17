var geom          = require('pex-geom');
var glu           = require('pex-glu');
var gen           = require('pex-gen');
var materials     = require('pex-materials');
var random        = require('pex-random');
var color         = require('pex-color');
var R             = require('ramda');

var Vec3          = geom.Vec3;
var Mesh          = glu.Mesh;
var LineBuilder   = gen.LineBuilder;
var ShowColors    = materials.ShowColors;
var Color         = color.Color;

function agentDebugInfoUpdaterSys(state) {
  if (!state.agentDebugInfoMeshEntity) {
    var lineBuilder = new LineBuilder();
    lineBuilder.addLine(new Vec3(0, 0, 0), random.vec3());
    lineBuilder.addLine(new Vec3(0, 0, 0), random.vec3());
    lineBuilder.addLine(new Vec3(0, 0, 0), random.vec3());
    lineBuilder.addLine(new Vec3(0, 0, 0), random.vec3());
    var mesh = new Mesh(lineBuilder, new ShowColors(), { lines: true });
    state.agentDebugInfoMeshEntity = {
      mesh: mesh
    };
    state.entities.push(state.agentDebugInfoMeshEntity);
  }

  var lineBuilder = state.agentDebugInfoMeshEntity.mesh.geometry;
  lineBuilder.reset();

  if (state.debug) {
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);
    agents.forEach(function(agent) {
      if (agent.targetNode) {
        lineBuilder.addLine(agent.position, agent.targetNode.position, Color.Green);
      }
    })
  }
}

module.exports = agentDebugInfoUpdaterSys;