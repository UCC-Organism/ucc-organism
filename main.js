var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var Q = require('q');
var graph = require('./graph');
var R = require('ramda');

var Cube = gen.Cube;
var Mesh = glu.Mesh;
var ShowNormals = materials.ShowNormals;
var SolidColor = materials.SolidColor;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;
var IO = sys.IO;
var Geometry = geom.Geometry;

function loadTextFile(url) {
  var deferred = Q.defer();

  IO.loadTextFile(url, function(data) {
    if (data) deferred.resolve(data);
    else deferred.reject(new Error('Failed to load : ' + url));
  });

  return deferred.promise;
}

function loadJSON(url) {
  var deferred = Q.defer();
  loadTextFile(url)
  .then(function(data) {
    try {
      var json = JSON.parse(data);
      deferred.resolve(json);
    }
    catch(e) {
      deferred.reject(e);
    }
  })
  return deferred.promise;
}

var State = {
  graph: null
};

sys.Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false
  },
  init: function() {
    var cube = new Cube();

    this.camera = new PerspectiveCamera(60, this.width / this.height);
    this.arcball = new Arcball(this, this.camera);

    var self = this;

    Q.all([
      loadJSON('data/map/layers.json'),
      loadJSON('data/map/nodes.json')
    ])
    .spread(this.initMap.bind(this))
    .done(function(e) {
      if (e) console.log(e);
    })
  },
  initMap: function(layersData, nodesData) {
    State.graph = graph(nodesData.nodes, nodesData.connections);

    var pointVertices = nodesData.nodes.map(R.prop('position'))
    var mapPointsGeometry = new Geometry({ vertices: pointVertices });
    this.mapPointsMesh = new Mesh(mapPointsGeometry, new SolidColor({ pointSize: 2, color: Color.Red }), { points: true });

    var list = ['a', 'b', 'c'];
    var edges = [[0, 1], [1,2]];

    //1
    edges.map(function(edge) {
      return [ list[edge[0]], list[edge[1]] ];
    });

    //2
    edges.map(function(edge) {
      return edge.map(function(i) { return list[i]; });
    });

    //3
    R.map(function(edge) {
      return edge.map(function(i) { return list[i] });
    }, edges);

    //4
    R.map(function(edge) {
      return R.map(R.rPartial(R.prop, list), edge);
    }, edges);

    //5
    R.map(R.map(R.rPartial(R.prop, list)), edges);

    //R.flatten(nodesData.connections.map(function(edge) {
    //}))
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    if (this.mapPointsMesh) this.mapPointsMesh.draw(this.camera);
  }
});
