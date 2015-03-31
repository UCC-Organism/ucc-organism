var R = require('ramda');
var glu = require('pex-glu');

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

  entitiesWithMesh.forEach(function(entity) {
    if (entity.mesh.geometry.vertices.length == 0) {
      return;
    }
    if (entity.lineWidth) {
      gl.lineWidth(entity.lineWidth);
    }
    entity.mesh.material.agentProxyTex = state.agentProxyTex;
    entity.mesh.draw(camera);
    if (entity.lineWidth) {
      gl.lineWidth(1);
    }
  })
}

module.exports = meshRendererSys;