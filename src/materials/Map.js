var Color     = require('pex-color').Color;
var Context   = require('pex-glu').Context;
var Material  = require('pex-glu').Material;
var merge     = require('merge');

var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var MapGLSL   = glslify(__dirname + '/Map.glsl', { transform: ['glslify-import'] });
var MapHiResGLSL   = glslify(__dirname + '/MapHiRes.glsl', { transform: ['glslify-import'] });

function Map(uniforms, hires) {
  this.gl = Context.currentContext;
  var program = new Program(hires ? MapGLSL : MapHiResGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

Map.prototype = Object.create(Material.prototype);

module.exports = Map;
