var sys = require('pex-sys');
var glu = require('pex-glu');
var ThickLine = require('./ThickLine');
var gen = require('pex-gen');
var Color = require('pex-color').Color;
var Spline3D = require('pex-geom').Spline3D;
var Vec3 = require('pex-geom').Vec3;
var ThickLineBuilder = require('./ThickLineBuilder');
var random = require('pex-random');

sys.Window.create({
  init: function() {
    //var cube = new gen.Cube();
    //this.material = new materials.ShowNormals();

    var points = [];

    random.seed(0);
    for(var i=0; i<16; i++) {
      var r = 1 + 0.5*random.noise3(0, 0, i);
      var a = i/16 * Math.PI * 2;
      var p = new Vec3(
        r * Math.cos(a),
        r * Math.sin(a),
        0
      );
      points.push(p);
    }

    var lineBuilder = new ThickLineBuilder();
    lineBuilder.addPath(new Spline3D(points, true), Color.Red, Color.Black);
    lineBuilder.computeEdges();
    this.mesh = new glu.Mesh(lineBuilder, new ThickLine({ thickness: 0.1, pointSize: 10 }), { faces: true });

    var aspectRatio = this.width / this.height;
    this.camera = new glu.PerspectiveCamera(60, aspectRatio);
    this.arcball = new glu.Arcball(this, this.camera);
  },
  draw: function() {
    glu.clearColorAndDepth(Color.DarkGrey);
    glu.enableDepthReadAndWrite(true);

    this.mesh.draw(this.camera);
  }
});