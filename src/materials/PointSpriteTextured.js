var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var Vec3 = geom.Vec3;
var Vec2 = geom.Vec2;
var merge = require('merge');
var fs = require('fs');

var PointSpriteTexturedGLSL = fs.readFileSync(__dirname + '/PointSpriteTextured.glsl', 'utf8');

function PointSpriteTextured(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(PointSpriteTexturedGLSL);
  var defaults = {
    alpha: 1,
    texSize: new Vec2(1, 1),
    texOffset: new Vec2(0, 0)
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

PointSpriteTextured.prototype = Object.create(Material.prototype);

module.exports = PointSpriteTextured;
