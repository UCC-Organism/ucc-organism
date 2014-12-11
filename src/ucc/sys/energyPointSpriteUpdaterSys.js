var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color               = require('pex-color');
var Cube = require('pex-gen').Cube;

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
    var pointSpriteGeometry = new Geometry({ vertices: true });
    var pointSpriteMaterial = new SolidColor({ pointSize: 10 });
    state.energyPointSpriteMeshEntity = {
      name: 'energyPointSpriteMeshEntity', mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
    }
    state.entities.push(state.energyPointSpriteMeshEntity);
  }

  var vertices = state.energyPointSpriteMeshEntity.mesh.geometry.vertices;
  //var colors = state.energyPointSpriteMeshEntity.mesh.geometry.colors;

  //vertices.length = 0;
  //colors.length = 0;

  var energyPaths = R.filter(R.where({ energyPath: R.identity }), state.entities);

  energyPaths.forEach(function(engeryPath) {
    for(var i=0; i<5; i++) {
      var p = engeryPath.energyPath.getPointAt(random.float());
      //var p = engeryPath.energyPath.points[0];
      if (p) {
        //vertices.push(new Vec3(0, 0, 0));
        //vertices.push(p);
        //colors.push(Color.Blue);
      }
    }
  })

  //vertices.push(new Vec3(0, 0, 0))

  /*
  var vertices = state.energyPointSpriteMeshEntity.mesh.geometry.vertices;
  var colors = state.energyPointSpriteMeshEntity.mesh.geometry.colors;
  var normals = state.energyPointSpriteMeshEntity.mesh.geometry.normals;
  var texCoords = state.energyPointSpriteMeshEntity.mesh.geometry.texCoords;
  vertices.length = entitiesWithPointSprite.length;
  colors.length = entitiesWithPointSprite.length;
  normals.length = entitiesWithPointSprite.length;
  texCoords.length = entitiesWithPointSprite.length;

  var dir = new Vec3();
  entitiesWithPointSprite.forEach(function(entity, entityIndex) {
    if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
    else vertices[entityIndex] = entity.position.clone();
    if (colors[entityIndex]) colors[entityIndex].copy(entity.color || Color.White);
    else colors[entityIndex] = entity.color ? entity.color.clone() : Color.White;
    if (!normals[entityIndex]) normals[entityIndex] = new Vec3(0, 0, 0);
    if (!texCoords[entityIndex]) texCoords[entityIndex] = new Vec2(random.int(0, 14), random.int(0, 8));

    dir.copy(entity.prevPosition).sub(entity.position).normalize();
    var agentRotation = Math.atan2(-dir.z, dir.x) + Time.seconds * 1;
    normals[entityIndex].x = (normals[entityIndex].x * 5 + agentRotation) / 6;
  });

  normals.dirty = true;
  texCoords.dirty = true;

  */
  vertices.dirty = true;
  //colors.dirty = true;
}

module.exports = energyPointSpriteUpdaterSys;