var R = require('ramda');
var glu = require('pex-glu');
var Vec3 = require('pex-geom').Vec3;
var Vec2 = require('pex-geom').Vec2;
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

  glu.enableDepthReadAndWrite(false);
  glu.enableAlphaBlending(true);

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

    if (entity.mesh.material.program.uniforms["weakDisplacePoints[0]"]) {
      entity.mesh.material.uniforms.glowColor = new Vec3(config.glowColor.r, config.glowColor.g, config.glowColor.b); 
      var n = agents.length;
      if (n > config.maxDistortPoints) n = config.maxDistortPoints;

      for (var i = 0; i < n; i++) {
        entity.mesh.material.uniforms["weakDisplacePoints[" + i + "]"] = agents[i].position;
        var s = agents[i].life;
        entity.mesh.material.uniforms["weakDisplaceProps[" + i + "]"] = new Vec3(0.1 * s, 0.02 * s); // radius, strength
        entity.mesh.material.uniforms["glowColors[" + i + "]"] = agents[i].color;
      }

      entity.mesh.material.uniforms.maxWeakDisplacement = 0.006;
      entity.mesh.material.uniforms.numWeakDisplacePoints = n;
    }

    if (entity.mesh.material.program.uniforms["strongDisplacePoints[0]"]) {
      var numStrongDisplacePoints = state.map.strongDisplacePoints.length;
      for(var i = 0; i < numStrongDisplacePoints; i++) {
        entity.mesh.material.uniforms["strongDisplacePoints[" + i + "]"] = state.map.strongDisplacePoints[i].position;
        if (!entity.mesh.material.uniforms["strongDisplaceProps[" + i + "]"]) {
          entity.mesh.material.uniforms["strongDisplaceProps[" + i + "]"] = new Vec2();
        }
        entity.mesh.material.uniforms["strongDisplaceProps[" + i + "]"].x = state.map.strongDisplacePoints[i].radius;
        entity.mesh.material.uniforms["strongDisplaceProps[" + i + "]"].y = state.map.strongDisplacePoints[i].strength;
      }
      entity.mesh.material.uniforms.numStrongDisplacePoints = numStrongDisplacePoints;
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