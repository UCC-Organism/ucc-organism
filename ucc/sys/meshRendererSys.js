var R = require('ramda');

var debugFilter = function(debugMode) {
  return function(o) {
    if (typeof o.debug == 'undefined') return true;
    else return o.debug == debugMode;
  }
}

function meshRendererSys(entities, state) {
  var camera = state.camera;

  var visibleEntities = entities.filter(debugFilter(state.debugMode));
  var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), visibleEntities);

  entitiesWithMesh.forEach(function(entity) {
    entity.mesh.draw(camera);
  })
}

module.exports = meshRendererSys;