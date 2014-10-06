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
    var pointVertices = nodesData.nodes.map(R.prop('position'))

    var validEdges = nodesData.connections.filter(function(edge) {
      return edge[0] >= 0 && edge[1] >= 0 && edge[0] < pointVertices.length && edge[1] < pointVertices.length;
    });

    State.graph = graph(pointVertices, validEdges);

    var edgesVertices = R.map(
      R.rPartial( R.prop, pointVertices ),
      R.flatten( validEdges )
    );

    var propChecker = function(name, value) {
      return R.pipe(R.prop(name), R.rPartial(R.eq, value))
    }
    var verticesChecker = function(vertices, checker) {
      return function(edge) {
        return edge.map(function(i) { return vertices[i]}).filter(checker).length == edge.length;
      }
    }

    var selectedFloorVertices = nodesData.nodes.filter(propChecker('layerId', 1)).map(R.prop('position'))
    var selectedFloorEdges = validEdges.filter(verticesChecker(nodesData.nodes, propChecker('layerId', 1)));
    var selectedFloorEdgesVertices = R.map(
      R.rPartial( R.prop, pointVertices ),
      R.flatten( selectedFloorEdges )
    );

    var mapPointsGeometry = new Geometry({ vertices: pointVertices });
    this.mapPointsMesh = new Mesh(mapPointsGeometry, new SolidColor({ pointSize: 5, color: Color.Red }), { points: true });

    var mapEdgesGeometry = new Geometry({ vertices: edgesVertices });
    this.mapEdgesMesh = new Mesh(mapEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.Green }), { lines: true });
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    if (this.mapPointsMesh) this.mapPointsMesh.draw(this.camera);
    if (this.mapEdgesMesh) this.mapEdgesMesh.draw(this.camera);
  }
});
