var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');

var MapGLSL = fs.readFileSync(__dirname + '/Map.glsl', 'utf8');
var displaceVert = fs.readFileSync(__dirname + '/displace.vert', 'utf8');

function ShowColors(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(displaceVert, MapGLSL);
  var defaults = { pointSize: 1 };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

ShowColors.prototype = Object.create(Material.prototype);

module.exports = ShowColors;