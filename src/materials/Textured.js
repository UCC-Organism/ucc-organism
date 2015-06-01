var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Color = color.Color;
var merge = require('merge');

var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var TexturedGLSL   = glslify(__dirname + '/Textured.glsl', { transform: ['glslify-import'] });

function Textured(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(TexturedGLSL);
  var defaults = { pointSize: 1, scale: { x: 1, y: 1} };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

Textured.prototype = Object.create(Material.prototype);

module.exports = Textured;
