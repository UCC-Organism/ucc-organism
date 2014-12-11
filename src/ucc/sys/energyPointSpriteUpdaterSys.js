var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color               = require('pex-color').Color;
var Cube                = require('pex-gen').Cube;

var ShowColors = require('pex-materials').ShowColors;
var SolidColor = require('pex-materials').SolidColor;

var Geometry            = geom.Geometry;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;

function energyPointSpriteUpdaterSys(state) {
  if (!state.energyPointSpriteMeshEntity) {
    var pointSpriteGeometry = new Geometry({ vertices: true, colors: true });
    var pointSpriteMaterial = new ShowColors({ pointSize: 3 * state.DPI });
    state.energyPointSpriteMeshEntity = {
      name: 'energyPointSpriteMeshEntity', mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
    }
    state.entities.unshift(state.energyPointSpriteMeshEntity);
  }

  var vertices = state.energyPointSpriteMeshEntity.mesh.geometry.vertices;
  var colors = state.energyPointSpriteMeshEntity.mesh.geometry.colors;

  vertices.length = 0;
  colors.length = 0;

  var energyPathEntities = R.filter(R.where({ energyPath: R.identity }), state.entities);

  random.seed(0)

  energyPathEntities.forEach(function(entity) {
    for(var i=0; i<50; i++) {
      var p = entity.energyPath.getPointAt((random.float() + Time.seconds/10) % 1);
      if (p) {
        vertices.push(p);
        colors.push(entity.color)
      }
    }
  })

  vertices.dirty = true;
  colors.dirty = true;
}

module.exports = energyPointSpriteUpdaterSys;