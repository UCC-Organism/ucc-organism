var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Color = color.Color;
var merge = require('merge');

var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var ShowColorsGLSL   = glslify(__dirname + '/ShowColors.glsl', { transform: ['glslify-import'] });

function ShowColors(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColors.prototype = Object.create(Material.prototype);

module.exports = ShowColors;
