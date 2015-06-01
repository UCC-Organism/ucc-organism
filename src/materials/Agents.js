var glu = require('pex-glu');
var color = require('pex-color');
var geom = require('pex-geom');
var Context = glu.Context;
var Material = glu.Material;
var Color = color.Color;
var Vec3 = geom.Vec3;
var Vec2 = geom.Vec2;
var merge = require('merge');
var Program   = require('../glu/Program');
var glslify   = require('glslify-promise');

var AgentsGLSL   = glslify(__dirname + '/Agents.glsl', { transform: ['glslify-import'] });

function PointSpriteTextured(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(AgentsGLSL);
  var defaults = {
    alpha: 1,
    texSize: new Vec2(1, 1),
    texOffset: new Vec2(0, 0)
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

PointSpriteTextured.prototype = Object.create(Material.prototype);

module.exports = PointSpriteTextured;
