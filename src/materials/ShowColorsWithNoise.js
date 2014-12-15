var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');

var ShowColorsWithNoiseGLSL = fs.readFileSync(__dirname + '/ShowColorsWithNoise.glsl', 'utf8');

function ShowColorsWithNoise(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsWithNoiseGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColorsWithNoise.prototype = Object.create(Material.prototype);

module.exports = ShowColorsWithNoise;