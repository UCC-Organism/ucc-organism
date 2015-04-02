var R = require('ramda');
var glu = require('pex-glu');
var Vec3 = require('pex-geom').Vec3;
var config = require('../../config');
var Time = require('pex-sys').Time;

var Context = glu.Context;

function makeFilter(property, value) {
  return function(o) {
    if (typeof o[property] == 'undefined') return true;
    else return o[property] == value;
  }
}

function meshRendererSys(state) {
  var camera = state.camera;
  var gl = Context.currentContext;

  var visibleEntities = state.entities
    .filter(makeFilter('debug', state.debug))
    .filter(makeFilter('cell', state.showCells))
    .filter(makeFilter('agentMesh', state.showAgents))
    .filter(makeFilter('energyMesh', state.showEnergy))
    .filter(makeFilter('corridor', state.showCorridors))
    .filter(makeFilter('node', state.showNodes))
    .filter(makeFilter('enabled', true));
  var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), visibleEntities);

  var agents = R.filter(R.where({ agent: true }), visibleEntities);

  entitiesWithMesh.forEach(function(entity) {
    if (entity.mesh.geometry.vertices.length == 0) {
      return;
    }

    if (entity.mesh.material.program.uniforms.time) {
      entity.mesh.material.uniforms.time = Time.seconds;
    }
    if (entity.mesh.material.program.uniforms.sway) {
      entity.mesh.material.uniforms.sway = state.sway;
    }
    if (entity.mesh.material.program.uniforms["distortPoints[0]"])
    {
      entity.mesh.material.uniforms.glowColor = new Vec3(config.glowColor.r, config.glowColor.g, config.glowColor.b); 
      var n = agents.length;
      if (n > config.maxDistortPoints) n = config.maxDistortPoints;

      for (var i = 0; i < n; i++)
      {
         entity.mesh.material.uniforms["distortPoints[" + i + "]"] = agents[i].position;
      }

      entity.mesh.material.uniforms.numAgents = n;
    }

    glu.enableDepthReadAndWrite(true, true);
    if (entity.disableDepthTest) {
      glu.enableDepthReadAndWrite(false, true);
    }

    if (entity.lineWidth) {
      gl.lineWidth(entity.lineWidth);
    }
    entity.mesh.draw(camera);
    if (entity.lineWidth) {
      gl.lineWidth(1);
    }
  })
}

module.exports = meshRendererSys;