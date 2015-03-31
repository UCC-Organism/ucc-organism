var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');
var Vec2 = require('pex-geom').Vec2;

var ShowColorsDistortedGLSL = fs.readFileSync(__dirname + '/ShowColorsDistorted.glsl', 'utf8');

function ShowColorsDistorted(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsDistortedGLSL);
  var defaults = { pointSize: 1, windowSize: new Vec2(1, 1) };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColorsDistorted.prototype = Object.create(Material.prototype);

module.exports = ShowColorsDistorted;