var geom = require('pex-geom');

var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;

var GeomUtils = {};

// How's that for a function name?
function NurbsGenPointsFastUnweightedUniformCurve3(cps, num, out) {
  var np = cps.length >> 1;
  var a = 3, b = np, step = (b - a) / num;

  var p = 0;
  for (var j = 0, u = a; j < num; ++j, u += step) {
    var num_x = 0, num_y = 0, den = 0;
    for (var i = (u - 3) >> 0, k = 0; k < 4 && i < np; ++k, ++i) {
      var i1 = i+1, i2 = i1+1, i3 = i2+1, i4 = i3+1;
      var v = ((u - (i)) /3) * (((u - (i)) /2) * (((u - (i)) ) * (i <= u && u < i1 ? 1 : 0) + ((i2 - u) ) * (i1 <= u && u < i2 ? 1 : 0)) + ((i3 - u) /2) * (((u - (i1)) ) * (i1 <= u && u < i2 ? 1 : 0) + ((i3 - u) ) * (i2 <= u && u < i3 ? 1 : 0))) + ((i4 - u) /3) * (((u - (i1)) /2) * (((u - (i1)) ) * (i1 <= u && u < i2 ? 1 : 0) + ((i3 - u) ) * (i2 <= u && u < i3 ? 1 : 0)) + ((i4 - u) /2) * (((u - (i2)) ) * (i2 <= u && u < i3 ? 1 : 0) + ((i4 - u) ) * (i3 <= u && u < i4 ? 1 : 0)));
      num_x += v * cps[i*2];
      num_y += v * cps[i*2+1];
      den   += v;
    }
    out[p++] = num_x/den;
    out[p++] = num_y/den;
  }
  return p;
}

function NurbsGenPointsFastUnweightedUniformCurve2(cps, num, out) {
  var np = cps.length >> 1;
  var a = 2, b = np, step = (b - a) / num;

  var p = 0;
  for (var j = 0, u = a; j < num; ++j, u += step) {
    var num_x = 0, num_y = 0, den = 0;
    for (var i = (u - 2) >> 0, k = 0; k < 3 && i < np; ++k, ++i) {
      var i1 = i+1, i2 = i1+1, i3 = i2+1;
      var v = ((u - (i)) /2) * (((u - (i)) ) * (i <= u && u < i1 ? 1 : 0) + ((i2 - u) ) * (i1 <= u && u < i2 ? 1 : 0)) + ((i3 - u) /2) * (((u - (i1)) ) * (i1 <= u && u < i2 ? 1 : 0) + ((i3 - u) ) * (i2 <= u && u < i3 ? 1 : 0));
      num_x += v * cps[i*2];
      num_y += v * cps[i*2+1];
      den   += v;
    }
    out[p++] = num_x/den;
    out[p++] = num_y/den;
  }
  return p;
}

GeomUtils.computeBSpline = function(points) {
  var result = [];

  var nurb_cps = [ ];  // Flat list of xys
  for (var i = 0, il = points.length; i < il; ++i) nurb_cps.push(points[i].x, points[i].z);

  for (var i = 0; i < 4; ++i) nurb_cps.push(nurb_cps[i]);

  var nurb_tess_points = [ ];
  NurbsGenPointsFastUnweightedUniformCurve2(nurb_cps, points.length * 5, nurb_tess_points);
  // Close the line loop for kPolyonPointMode
  nurb_tess_points.push(nurb_tess_points[0], nurb_tess_points[1]);

  for(var i=0; i<nurb_tess_points.length; i+=2) {
    result.push(new Vec3(nurb_tess_points[i], points[0].y, nurb_tess_points[i+1]))
  }

  return result;
}

GeomUtils.smoothCurve = function(points, c, n, adaptive, subdivisionLength) {
  n = n || 10;
  c = (typeof(c) == 'undefined') ? 1 : c;
  var spline = [];
  function deCasteljau(points, t) {
    var newPoints = [];
    for(var i=0; i<points.length-1; i++) {
      newPoints.push(points[i] + (points[i+1] - points[i]) * t);
    }
    if (newPoints.length > 1)
      return deCasteljau(newPoints, t);
    else
      return newPoints[0];
  }
  for(var i=0; i<points.length; i++) {
    var p0 = points[(i-1 + points.length) % points.length];
    var p1 = points[(i-0 + points.length) % points.length];
    var p2 = points[(i+1 + points.length) % points.length];

    if (adaptive)
    {
      var dist = p0.distance(p1);
      n = Math.ceil(dist / subdivisionLength);
    }

    for(var j=0; j<n; j++) {
      var t = j/n;

      var x = deCasteljau([(p0.x + p1.x)/2, (p0.x + p1.x)/2 * (1-c) + p1.x * c, (p1.x + p2.x)/2 * (1-c) + p1.x * c, (p1.x + p2.x)/2], t);
      var y = deCasteljau([(p0.y + p1.y)/2, (p0.y + p1.y)/2 * (1-c) + p1.y * c, (p1.y + p2.y)/2 * (1-c) + p1.y * c, (p1.y + p2.y)/2], t);
      var z = deCasteljau([(p0.z + p1.z)/2, (p0.z + p1.z)/2 * (1-c) + p1.z * c, (p1.z + p2.z)/2 * (1-c) + p1.z * c, (p1.z + p2.z)/2], t);
      spline.push(new Vec3(x, y, z));
    }
  }
  return spline;
}

GeomUtils.resampleLine = function(a, b, options) {
  var diff = b.dup().sub(a);
  if (options.numPoints) {
    throw new Error('GeomUtils.resampleLine not implemented for numPoints');
  }
  else if (options.distance) {
    var len = diff.length();
    var points = [];
    if (len > 0) {
      var dist = 0;
      var diffN = diff.dup().scale(1/len);
      while(dist < len) {
        points.push(diffN.dup().scale(dist).add(a));
        dist += options.distance;
      }
      points.push(b);
    }
    return points;
  }
  else {
    throw new Error('GeomUtils.resampleLine needs options with numPoints or distance');
  }
}

//Alternative centroid implementation (slower)
//  return points.reduce(function(center, p) {
//    return center.add(p);
//  }, new Vec3(0, 0, 0)).scale(1/points.length);
GeomUtils.centroid = function(points) {
  var sum = new Vec3(0, 0, 0);
  for(var i=0; i<points.length; i++) {
    sum.add(points[i]);
  }
  sum.scale(1/points.length);
  return sum;
}

module.exports = GeomUtils;