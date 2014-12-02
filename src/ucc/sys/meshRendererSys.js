var R = require('ramda');
var glu = require('pex-glu');

var Context = glu.Context;

var debugFilter = function(debugMode) {
  return function(o) {
    if (typeof o.debug == 'undefined') return true;
    else return o.debug == debugMode;
  }
}

var bioFilter = function(bioMode) {
  return function(o) {
    if (typeof o.bio == 'undefined') return true;
    else return o.bio == bioMode;
  }
}

var enabledFilter = function() {
  return function(o) {
    if (typeof o.enabled == 'undefined') return true;
    else return o.enabled;
  }
}

function meshRendererSys(state) {
  var camera = state.camera;
  var gl = Context.currentContext;

  var visibleEntities = state.entities
    .filter(debugFilter(state.debug))
    .filter(bioFilter(state.bio))
    .filter(enabledFilter());
  var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), visibleEntities);

  entitiesWithMesh.forEach(function(entity) {
    if (entity.mesh.geometry.vertices.length == 0) {
      return;
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