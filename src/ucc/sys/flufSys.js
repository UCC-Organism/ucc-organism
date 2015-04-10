var R                   = require('ramda');
var geom                = require('pex-geom');
var glu                 = require('pex-glu');
var random              = require('pex-random');
var sys                 = require('pex-sys');
var Color               = require('pex-color').Color;

var AgentsMaterial      = require('../../materials/Fluf');
var Config              = require('../../config');

var Geometry            = geom.Geometry;
var Vec4                = geom.Vec4;
var Vec3                = geom.Vec3;
var Vec2                = geom.Vec2;
var Texture2D           = glu.Texture2D;
var Mesh                = glu.Mesh;
var Platform            = sys.Platform;
var Time                = sys.Time;

function flufSys(state) {
  if (!state.flufMeshEntity) {
    var image = Platform.isPlask ? __dirname + '/../../../assets/dirt_sprites.png' : 'assets/dirt_sprites.png';
    var flufGeometry = new Geometry({ vertices: true, colors: true, normals: true, texCoords: true });
    flufGeometry.addAttrib("lineColors", "lineColor", []);
    flufGeometry.addAttrib("accentColors", "accentColor", []);
    flufGeometry.addAttrib("fillColors", "fillColor", []);
    flufGeometry.addAttrib("scales", "scale", []);
    var flufMaterial = new AgentsMaterial({ pointSize: 30 * state.DPI, texture: Texture2D.load(image, { flip: false }), texSize: new Vec2(1/7, 1/7), texOffset: new Vec2(1/7, 1/7) });
    state.flufMeshEntity = {
      agentMesh: true,
      disableDepthTest: false,
      enableAlphaBlending: true,
      mesh: new Mesh(flufGeometry, flufMaterial, { points: true } )
    }
    state.entities.push(state.flufMeshEntity);

    state.dirts = R.range(0, 200).map(function() {
      var entity = {
        rotation: random.float(0, 1),
        color: Color.White,
        position: new Vec3(random.float(-1.0, 0.0), random.float(-1.0, 0.0), -0.10)
      };
      entity.prevPosition = entity.position.dup();
      return entity;
    })

    //state.dirts = [];
  }

  var dirts = state.dirts;

  state.flufMeshEntity.mesh.material.uniforms.pointSize = Config.agentSpriteSize * state.DPI * state.zoom;
  state.flufMeshEntity.mesh.material.uniforms.alpha = 0.5;

  var vertices = state.flufMeshEntity.mesh.geometry.vertices;
  var colors = state.flufMeshEntity.mesh.geometry.colors;
  var normals = state.flufMeshEntity.mesh.geometry.normals;
  var texCoords = state.flufMeshEntity.mesh.geometry.texCoords;
  var lineColors = state.flufMeshEntity.mesh.geometry.lineColors;
  var fillColors = state.flufMeshEntity.mesh.geometry.fillColors;
  var accentColors = state.flufMeshEntity.mesh.geometry.accentColors;
  var scales = state.flufMeshEntity.mesh.geometry.scales;
  vertices.length = dirts.length;
  colors.length = dirts.length;
  normals.length = dirts.length;
  texCoords.length = dirts.length;
  lineColors.length = dirts.length;
  fillColors.length = dirts.length;
  accentColors.length = dirts.length;
  scales.length = dirts.length;

  var dir = new Vec3();
  dirts.forEach(function(entity, entityIndex) {
    if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
    else vertices[entityIndex] = entity.position.clone();
    if (colors[entityIndex]) colors[entityIndex].copy(entity.color || Color.White);
    else colors[entityIndex] = entity.color ? entity.color.clone() : Color.White;
    if (!normals[entityIndex]) normals[entityIndex] = new Vec3(0, 0, 0);
    if (!texCoords[entityIndex]) texCoords[entityIndex] = new Vec2(random.int(0, 7), random.int(0, 7));

    lineColors[entityIndex] = Config.agentLineColor;
    fillColors[entityIndex] = Config.agentFillColor;
    accentColors[entityIndex] = entity.color;

    if (Config.agentFillColorBasedOnAccentColor)
    {
      var c = accentColors[entityIndex];
      c = new Color(c.r, c.g, c.b, c.a);
      c.a = .5;
      fillColors[entityIndex] = c;
    }

    if (!scales[entityIndex]) scales[entityIndex] = random.float(0.1, 1.0);

    dir.copy(entity.prevPosition).sub(entity.position).normalize();
    var agentRotation = Math.atan2(-dir.z, dir.x) + Time.seconds / 100;
    normals[entityIndex].x = entity.rotation + (normals[entityIndex].x * 5 + agentRotation) / 6;
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

module.exports = flufSys;