var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');

var PointSpriteTextured = require('../../materials/PointSpriteTextured')

var Geometry            = geom.Geometry;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;

function pointSpriteUpdaterSys(state) {
  if (!state.pointSpriteMeshEntity) {
    var image = Platform.isPlask ? '../assets/agents_1.png' : 'assets/B1.png';
    var pointSpriteGeometry = new Geometry({ vertices: true, colors: true, normals: true, texCoords: true });
    var pointSpriteMaterial = new PointSpriteTextured({ pointSize: 20 * state.DPI, texture: Texture2D.load(image), texSize: new Vec2(0.1, 1), texOffset: new Vec2(0.1, 0) });
    state.pointSpriteMeshEntity = {
      mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
    }
    state.entities.push(state.pointSpriteMeshEntity);
  }

  var entitiesWithPointSprite = R.filter(R.where({ pointSize: R.identity }), state.entities);

  var vertices = state.pointSpriteMeshEntity.mesh.geometry.vertices;
  var colors = state.pointSpriteMeshEntity.mesh.geometry.colors;
  var normals = state.pointSpriteMeshEntity.mesh.geometry.normals;
  var texCoords = state.pointSpriteMeshEntity.mesh.geometry.texCoords;
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
    if (!texCoords[entityIndex]) texCoords[entityIndex] = new Vec2(random.int(0, 10), 0);

    dir.copy(entity.prevPosition).sub(entity.position).normalize();
    var agentRotation = Math.atan2(-dir.z, dir.x) + Time.seconds * 10;
    normals[entityIndex].x = (normals[entityIndex].x * 5 + agentRotation) / 6;
  });

  vertices.dirty = true;
  colors.dirty = true;
  normals.dirty = true;
  texCoords.dirty = true;
}

module.exports = pointSpriteUpdaterSys;