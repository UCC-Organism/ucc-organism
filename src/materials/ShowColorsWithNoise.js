var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Color = color.Color;
var merge = require('merge');

var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var ShowColorsWithNoiseGLSL   = glslify(__dirname + '/ShowColorsWithNoise.glsl', { transform: ['glslify-import'] });


function ShowColorsWithNoise(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(ShowColorsWithNoiseGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColorsWithNoise.prototype = Object.create(Material.prototype);

module.exports = ShowColorsWithNoise;
