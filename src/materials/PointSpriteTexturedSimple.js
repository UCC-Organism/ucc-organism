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

var PointSpriteTexturedSimpleGLSL = fs.readFileSync(__dirname + '/PointSpriteTexturedSimple.glsl', 'utf8');

function PointSpriteTexturedSimple(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(PointSpriteTexturedSimpleGLSL);
  var defaults = {
    alpha: 1
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

PointSpriteTexturedSimple.prototype = Object.create(Material.prototype);

module.exports = PointSpriteTexturedSimple;
