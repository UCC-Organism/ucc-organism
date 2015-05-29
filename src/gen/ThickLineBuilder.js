var geom = require('pex-geom');
var Vec3 = geom.Vec3;
var Vec2 = geom.Vec3;
var Geometry = geom.Geometry;
var Color = require('pex-color').Color;
var getNormals = require('polyline-normals');

function ThickLineBuilder() {
  Geometry.call(this, { vertices: true, normals: true, colors: true, texCoords: true, faces: true })
}

ThickLineBuilder.prototype = Object.create(Geometry.prototype);

//assumes XY path
ThickLineBuilder.prototype.addPath = function(path, color, color2, numSamples, showPoints) {
  numSamples = numSamples || path.points.length;
  color = color || { r: 1, g: 1, b: 1, a: 1 };
  color2 = color2 || { r: 1, g: 1, b: 1, a: 1 };
  showPoints = showPoints || false;

  var points = [];
  var polyline2D = [];
  for(var i=1; i<numSamples; i++) {
    var point;
    if (path.points.length == numSamples) {
      point = path.getPoint(i/(numSamples-1));
    }
    else {
      point = path.getPointAt(i/(numSamples-1));
    }
    polyline2D.push([point.x, point.y]);
    points.push(point)
  }

  var normals = getNormals(polyline2D, true);

  points.forEach(function(p, pointIndex) {
    var normal = normals[pointIndex][0];
    var meterLength = normals[pointIndex][1];

    this.vertices.push(p);
    this.normals.push(new Vec3(normal[0]*meterLength, normal[1]*meterLength, 0))
    this.colors.push(color);
    this.texCoords.push(new Vec2(pointIndex/points.length, 0));

    this.vertices.push(p);
    this.normals.push(new Vec3(-normal[0]*meterLength, -normal[1]*meterLength, 0))
    this.colors.push(color2);
    this.texCoords.push(new Vec2(pointIndex/points.length, 1));

    if (pointIndex < points.length - 1) {
      this.faces.push([pointIndex*2, pointIndex*2 + 1, pointIndex*2 + 3])
      this.faces.push([pointIndex*2, pointIndex*2 + 3, pointIndex*2 + 2])
    }
    else {
      this.faces.push([pointIndex*2, pointIndex*2 + 1, 1])
      this.faces.push([pointIndex*2, 1, 0])
    }
  }.bind(this))

  return this;
}

module.exports = ThickLineBuilder;