var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color               = require('pex-color').Color;
var Cube                = require('pex-gen').Cube;

var ShowColorsWithNoise = require('../../materials/ShowColorsWithNoise');
var Config              = require('../../config');

var Geometry            = geom.Geometry;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;

function removeEntities(state) {
  //remove existing map meshes
  state.entities.filter(R.where({ energyPointSpriteMeshEntity: true })).forEach(function(entity) {
    if (entity.mesh) {
      entity.mesh.material.program.dispose();
      entity.mesh.dispose();
    }
    state.entities.splice(state.entities.indexOf(entity), 1);
  });

  state.energyPointSpriteMeshEntity = null;
}


function energyPointSpriteUpdaterSys(state) {
  if (state.map.dirty) {
    removeEntities(state);
  }

  if (!state.energyPointSpriteMeshEntity) {
    var pointSpriteGeometry = new Geometry({ vertices: true, colors: true, texCoords: true });
    var pointSpriteMaterial = new ShowColorsWithNoise({ pointSize: 1 * state.DPI });
    state.energyPointSpriteMeshEntity = {
      name: 'energyPointSpriteMeshEntity', energyPointSpriteMeshEntity: true, energyMesh: true, mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
    }
    state.entities.unshift(state.energyPointSpriteMeshEntity);
  }

  var vertices = state.energyPointSpriteMeshEntity.mesh.geometry.vertices;
  var colors = state.energyPointSpriteMeshEntity.mesh.geometry.colors;
  var texCoords = state.energyPointSpriteMeshEntity.mesh.geometry.texCoords;

  state.energyPointSpriteMeshEntity.mesh.material.uniforms.pointSize = Config.energySpriteSize * state.DPI * state.zoom;

  vertices.length = 0;
  colors.length = 0;
  texCoords.length = 0;

  var energyPathEntities = R.filter(R.where({ energyPath: R.identity }), state.entities);

  random.seed(0)

  energyPathEntities.forEach(function(entity) {
    for(var i=0; i<50; i++) {
      var t = random.float();
      var len = entity.energyPath.getLength();
      var speed = random.float(0.005/len, 0.01/len);
      var p = entity.energyPath.getPointAt((t + Time.seconds * speed) % 1);
      if (p) {
        vertices.push(p);
        colors.push(entity.color)
        texCoords.push(new Vec2(t, i/5));
      }
    }
  })

  vertices.dirty = true;
  colors.dirty = true;
  texCoords.dirty = true;
}

module.exports = energyPointSpriteUpdaterSys;