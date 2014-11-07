var R = require('ramda');

var debugFilter = function(debugMode) {
  return function(o) {
    if (typeof o.debug == 'undefined') return true;
    else return o.debug == debugMode;
  }
}

function meshRendererSys(state) {
  var camera = state.camera;

  var visibleEntities = state.entities.filter(debugFilter(state.debugMode));
  var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), visibleEntities);

  entitiesWithMesh = state.entities;

  entitiesWithMesh.forEach(function(entity) {
    if (entity.mesh.geometry.vertices.length == 0) {
      return;
    }
    entity.mesh.draw(camera);
  })
}

module.exports = meshRendererSys;