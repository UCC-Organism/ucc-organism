var R         = require('ramda');
var glu       = require('pex-glu');
var Vec2      = require('pex-geom').Vec2;
var Vec3      = require('pex-geom').Vec3;
var Vec4      = require('pex-geom').Vec4;
var Time      = require('pex-sys').Time;
var Platform  = require('pex-sys').Platform;
var Config    = require('../../config');

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
    .filter(makeFilter('agentTarget', state.showAgentTargets))
    .filter(makeFilter('node', state.showNodes))
    .filter(makeFilter('enabled', true));
  var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), visibleEntities);

  var agents = R.filter(R.where({ agent: true }), visibleEntities);

  glu.enableDepthReadAndWrite(false);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  entitiesWithMesh.forEach(function(entity) {
    if (entity.mesh.geometry.vertices.length == 0) {
      return;
    }

    var program = entity.mesh.material.program;
    var uniforms = entity.mesh.material.uniforms;

    if (program.uniforms.time) {
      uniforms.time = Time.seconds;
    }

    if (program.uniforms.sway) {
      uniforms.sway = state.sway;
    }

    if (program.uniforms["weakDisplacePoints[0]"]) {
      var maxN = Platform.isPlask ? Config.maxWeakDistortPointsPlask : Config.maxWeakDistortPoints;
      var n = Math.min(maxN, agents.length);

      for (var i = 0; i < n; i++) {
        var weakPoint = uniforms["weakDisplacePoints[" + i + "]"];
        if (!weakPoint) {
          weakPoint = uniforms["weakDisplacePoints[" + i + "]"] = new Vec4();
        }
        var agent = agents[i];
        weakPoint.x = agent.position.x;
        weakPoint.y = agent.position.y;
        weakPoint.z = 0.10 * agent.life;
        weakPoint.w = 0.02 * agent.life;
        uniforms["glowColors[" + i + "]"] = agent.color;
      }

      uniforms.maxWeakDisplacement = 0.006;
      uniforms.numWeakDisplacePoints = n;
    }

    if (program.uniforms["strongDisplacePoints[0]"]) {
      var n = state.map.strongDisplacePoints.length;
      if (n > Config.maxStrongDistortPoints) n = Config.maxStrongDistortPoints;

      var strongDisplacePoints = state.map.strongDisplacePoints;
      for(var i = 0; i < n; i++) {
        var strongPoint = uniforms["strongDisplacePoints[" + i + "]"];
        if (!strongPoint) {
          strongPoint = uniforms["strongDisplacePoints[" + i + "]"] = new Vec4();
        }
        var strongDisplacePoint = strongDisplacePoints[i];
        strongPoint.x = strongDisplacePoint.position.x;
        strongPoint.y = strongDisplacePoint.position.y;
        strongPoint.z = strongDisplacePoint.radius;
        strongPoint.w = strongDisplacePoint.strength;
      }
      entity.mesh.material.uniforms.numStrongDisplacePoints = n;
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
