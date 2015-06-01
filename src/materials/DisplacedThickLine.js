var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');

var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var DisplacedThickLineGLSL   = glslify(__dirname + '/DisplacedThickLine.glsl', { transform: ['glslify-import'] });

function DisplacedThickLine(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(DisplacedThickLineGLSL);
  var defaults = {
    color: Color.create(1, 1, 1, 1),
    pointSize: 1,
    premultiplied: 0
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

DisplacedThickLine.prototype = Object.create(Material.prototype);

module.exports = DisplacedThickLine;
