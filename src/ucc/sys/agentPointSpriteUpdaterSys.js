var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color     = require('pex-color').Color;

var AgentsMaterial = require('../../materials/Agents');
var Config              = require('../../config');

var Geometry            = geom.Geometry;
var Vec4                = geom.Vec4;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;

function agentPointSpriteUpdaterSys(state) {
  if (!state.pointSpriteMeshEntity) {
    var image = Platform.isPlask ? __dirname + '/../../../assets/agents_5.png' : 'assets/agents_5.png';
    var pointSpriteGeometry = new Geometry({ vertices: true, colors: true, normals: true, texCoords: true });
    pointSpriteGeometry.addAttrib("lineColors", "lineColor", []);
    pointSpriteGeometry.addAttrib("accentColors", "accentColor", []);
    pointSpriteGeometry.addAttrib("fillColors", "fillColor", []);
    var pointSpriteMaterial = new AgentsMaterial({ pointSize: 30 * state.DPI, texture: Texture2D.load(image, { flip: false }), texSize: new Vec2(1/10, 1/15), texOffset: new Vec2(1/10, 1/15) });
    state.pointSpriteMeshEntity = {
      agentMesh: true,
      mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
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
  vertices.length = entitiesWithPointSprite.length;
  colors.length = entitiesWithPointSprite.length;
  normals.length = entitiesWithPointSprite.length;
  texCoords.length = entitiesWithPointSprite.length;
  lineColors.length = entitiesWithPointSprite.length;
  fillColors.length = entitiesWithPointSprite.length;
  accentColors.length = entitiesWithPointSprite.length;

  var dir = new Vec3();
  entitiesWithPointSprite.forEach(function(entity, entityIndex) {
    if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
    else vertices[entityIndex] = entity.position.clone();
    if (colors[entityIndex]) colors[entityIndex].copy(entity.color || Color.White);
    else colors[entityIndex] = entity.color ? entity.color.clone() : Color.White;
    if (!normals[entityIndex]) normals[entityIndex] = new Vec3(0, 0, 0);
    if (!texCoords[entityIndex]) texCoords[entityIndex] = new Vec2(entity.agentIdNumber % 10, entity.typeIndex); //FIXME: agent type

    lineColors[entityIndex] = Config.agentLineColor;
    fillColors[entityIndex] = Config.agentFillColor;

    if (entity.typeIndex <= 7) // Student
    {
      accentColors[entityIndex] = Config.agentStudentColor;
    }
    else if (entity.typeIndex == 8)
    {
      accentColors[entityIndex] = Config.agentTeacherColor;
    }
    else if (entity.typeIndex == 9)
    {
      accentColors[entityIndex] = Config.agentResearcherColor;
    }
    else if (entity.typeIndex == 10)
    {
      accentColors[entityIndex] = Config.agentJanitorColor;
    }
    else if (entity.typeIndex == 11)
    {
      accentColors[entityIndex] = Config.agentCookColor;
    }

    if (Config.agentFillColorBasedOnAccentColor)
    {
      var c = accentColors[entityIndex];
      c = new Color(c.r, c.g, c.b, c.a);
      c.a = .5;
      fillColors[entityIndex] = c;
    }

    dir.copy(entity.prevPosition).sub(entity.position).normalize();
    var agentRotation = Math.atan2(-dir.z, dir.x) + Time.seconds * 1;
    normals[entityIndex].x = (normals[entityIndex].x * 5 + agentRotation) / 6;
  });

  vertices.dirty = true;
  colors.dirty = true;
  normals.dirty = true;
  texCoords.dirty = true;
}

module.exports = agentPointSpriteUpdaterSys;