var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color               = require('pex-color').Color;

var AgentsMaterial      = require('../../materials/Agents');
var Config              = require('../../config');

var Geometry            = geom.Geometry;
var Vec4                = geom.Vec4;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;
var log                 = require('debug')('ucc/agentPointSpriteUpdaterSys');

Color.prototype.lerp = function(c, t) {
  this.r = this.r + (c.r - this.r) * t;
  this.g = this.g + (c.g - this.g) * t;
  this.b = this.b + (c.b - this.b) * t;
  this.a = this.a + (c.a - this.a) * t;
  return this;
}

function agentPointSpriteUpdaterSys(state) {
  if (!state.pointSpriteMeshEntity) {
    var image = Platform.isPlask ? __dirname + '/../../../assets/agents_6.png' : 'assets/agents_5.png';
    var pointSpriteGeometry = new Geometry({ vertices: true, colors: true, normals: true, texCoords: true });
    pointSpriteGeometry.addAttrib("lineColors", "lineColor", []);
    pointSpriteGeometry.addAttrib("accentColors", "accentColor", []);
    pointSpriteGeometry.addAttrib("fillColors", "fillColor", []);
    pointSpriteGeometry.addAttrib("scales", "scale", []);
    var pointSpriteMaterial = new AgentsMaterial({ pointSize: 30 * state.DPI, texture: Texture2D.load(image, { flip: false }), texSize: new Vec2(1/20, 1/20), texOffset: new Vec2(1/20, 1/20) });
    var agentMesh = new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } );
    agentMesh.position.z = 0.003;
    state.pointSpriteMeshEntity = {
      agentMesh: true,
      disableDepthTest: true,
      mesh: agentMesh
    }
    state.entities.push(state.pointSpriteMeshEntity);
  }

  var entitiesWithPointSprite = R.filter(R.where({ pointSize: R.identity }), state.entities);

  state.pointSpriteMeshEntity.mesh.material.uniforms.pointSize = Config.agentSpriteSize * state.DPI * state.zoom;

  var vertices = state.pointSpriteMeshEntity.mesh.geometry.vertices;
  var colors = state.pointSpriteMeshEntity.mesh.geometry.colors;
  var normals = state.pointSpriteMeshEntity.mesh.geometry.normals;
  var texCoords = state.pointSpriteMeshEntity.mesh.geometry.texCoords;
  var lineColors = state.pointSpriteMeshEntity.mesh.geometry.lineColors;
  var fillColors = state.pointSpriteMeshEntity.mesh.geometry.fillColors;
  var accentColors = state.pointSpriteMeshEntity.mesh.geometry.accentColors;
  var scales = state.pointSpriteMeshEntity.mesh.geometry.scales;
  vertices.length = entitiesWithPointSprite.length;
  colors.length = entitiesWithPointSprite.length;
  normals.length = entitiesWithPointSprite.length;
  texCoords.length = entitiesWithPointSprite.length;
  lineColors.length = entitiesWithPointSprite.length;
  fillColors.length = entitiesWithPointSprite.length;
  accentColors.length = entitiesWithPointSprite.length;
  scales.length = entitiesWithPointSprite.length;

  var dir = new Vec3();
  entitiesWithPointSprite.forEach(function(entity, entityIndex) {
    var color1 = Config.agentTypes[entity.type].colors[0];
    var color2 = Config.agentTypes[entity.type].colors[1];
    entity.color.copy(color1).lerp(color2, entity.random);

    if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
    else vertices[entityIndex] = entity.position.clone();
    if (!colors[entityIndex]) colors[entityIndex] = Color.White.clone();
    if (!normals[entityIndex]) normals[entityIndex] = new Vec3(0, 0, 0);
    if (!texCoords[entityIndex]) texCoords[entityIndex] = new Vec2();
    texCoords[entityIndex].x = entity.agentIdNumber % 10;
    texCoords[entityIndex].y = entity.typeIndex;

    lineColors[entityIndex] = Config.agentLineColor;
    fillColors[entityIndex] = Config.agentFillColor;
    colors[entityIndex] = entity.color;
    accentColors[entityIndex] = entity.color;

    /*
    if (Config.agentFillColorBasedOnAccentColor)
    {
      var c = accentColors[entityIndex];
      c = new Color(c.r, c.g, c.b, c.a);
      c.a = .5;
      fillColors[entityIndex] = c;
    }
    */

    scales[entityIndex] = entity.scale * entity.life;

    dir.copy(entity.prevPosition).sub(entity.position).normalize();
    entity.rotation = (entity.rotation * 5 + Math.atan2(-dir.z, dir.x) + Time.seconds * 1)/6;
    normals[entityIndex].x = entity.rotation;
  });

  vertices.dirty = true;
  colors.dirty = true;
  normals.dirty = true;
  texCoords.dirty = true;
  lineColors.dirty = true;
  fillColors.dirty = true;
  accentColors.dirty = true;
  scales.dirty = true;
}

module.exports = agentPointSpriteUpdaterSys;