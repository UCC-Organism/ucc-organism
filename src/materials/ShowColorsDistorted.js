var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');

var ShowColorsDistortedGLSL = fs.readFileSync(__dirname + '/ShowColorsDistorted.glsl', 'utf8');

function ShowColorsDistorted(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsDistortedGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColorsDistorted.prototype = Object.create(Material.prototype);

module.exports = ShowColorsDistorted;