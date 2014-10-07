var geom = require('pex-geom');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');

var Mesh = glu.Mesh;
var Geometry = geom.Geometry;
var Vec3 = geom.Vec3;
var SolidColor = materials.SolidColor;
var Color = color.Color;
var Cube = gen.Cube;

function BoundingBoxHelper(boundingBox, color) {
  color = color || Color.Red;

  var size = boundingBox.getSize();
  var center = boundingBox.getCenter();

  var g = new Cube(size.x, size.y, size.z);
  g.computeEdges();

  Mesh.call(this, g, new SolidColor(), { lines: true });

  this.position.copy(center);
}

BoundingBoxHelper.prototype = Object.create(Mesh.prototype);

module.exports = BoundingBoxHelper;