var EPSILON = 0.001;

function PointSet() {
  this.points = [];
}

PointSet.prototype.add = function(v) {
  for(var i=0; i<this.points.length; i++) {
    var p = this.points[i];
    if (p.distance(v) < EPSILON) return p;
  }
  this.points.push(v);
  return v;
}

module.exports = PointSet;