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
var Vec3 = geom.Vec3;
var BoundingBox = geom.BoundingBox;
var BoundingBoxHelper = require('./helpers/BoundingBoxHelper');

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
  camera: null,
  arcball: null,
  graph: null,
  nodes: null,
  selectedNodes: null,
  floors: [],
  currentFloor: 1,
  entities: [],
  mapCameraPosY: 0.40,
  //agents
  //energyParticles
  //map
  //rooms
  //corridors
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

    State.camera = new PerspectiveCamera(60, this.width / this.height);
    State.arcball = new Arcball(this, State.camera);

    var self = this;

    Q.all([
      loadJSON('data/map/layers.json'),
      loadJSON('data/map/nodes.client.json')
    ])
    .spread(this.initMap.bind(this))
    .done(function(e) {
      if (e) console.log(e);
    });

    this.initKeys();
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      switch(e.str) {
      }
      switch(e.keyCode) {
        case 123: this.setPrevMapFloor(); break;
        case 124: this.setNextMapFloor(); break;
      }
    }.bind(this));
  },
  renderSys: function(allEntities, camera) {
    var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), allEntities);

    entitiesWithMesh.forEach(function(entity) {
      entity.mesh.draw(camera);
    })
  },
  initMap: function(layersData, nodesData) {
    State.nodes = nodesData;
    State.selectedNodes = State.nodes;

    //Transform json data to real objects
    State.nodes.forEach(function(node) {
      //{x, y, z} to Vec3
      node.position = new Vec3(node.position.x, node.position.y, node.position.z);
      //Neighbor index to node reference
      node.neighbors = R.map(R.rPartial(R.prop, State.nodes), node.neighbors);
    });

    //Find unique floor ids
    State.floors = State.nodes.map(R.prop('floor'));
    State.floors.sort();
    State.floors = State.floors.filter(function(floor, i) {
      return floor != State.floors[i - 1];
    })

    State.currentFloor = State.floors[0];

    this.setMapFloor(State.currentFloor);
  },
  setPrevMapFloor: function() {
    var floorIndex = State.floors.indexOf(State.currentFloor);
    var prevFloorIndex = (floorIndex - 1 + State.floors.length) % State.floors.length;
    this.setMapFloor(State.floors[prevFloorIndex]);
  },
  setNextMapFloor: function() {
    var floorIndex = State.floors.indexOf(State.currentFloor);
    var nextFloorIndex = (floorIndex + 1) % State.floors.length;
    this.setMapFloor(State.floors[nextFloorIndex]);
  },
  setMapFloor: function(floorId) {
    State.currentFloor = floorId;

    if (floorId != -1) {
      State.selectedNodes = State.nodes.filter(function(node) {
        return node.floor == State.currentFloor;
      });
    }
    else {
      State.selectedNodes = State.nodes;
    }
    this.rebuildMap();
  },
  rebuildMap: function() {
    var nodes = State.nodes;
    var selectedNodes = State.selectedNodes;
    var corridorNodes = selectedNodes.filter(R.where({ room: R.not(R.identity) }));
    var entranceNodes = selectedNodes.filter(R.pipe(R.prop('neighbors'), R.prop('length'), R.rPartial(R.eq, 1)));
    var stairsNodes = selectedNodes.filter(function(node) {
      return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
        return sameFloorSoFar && (neighborNode.floor == node.floor);
      }, true)
    });

    var pointVertices = selectedNodes.map(R.prop('position'));
    var roomVertices = selectedNodes.filter(R.where({ room: R.identity }));
    var entrancePointVertices = entranceNodes.map(R.prop('position'));
    var stairsPointVertices = stairsNodes.map(R.prop('position'));

    var roomEdgeVertices = R.flatten(roomVertices.map(function(node) {
      return node.neighbors.filter(R.where({ room: R.identity })).map(function(neighborNode) {
        return [ node.position, neighborNode.position ];
      })
    }));

    var corridorEdgeVertices = R.flatten(corridorNodes.map(function(node) {
      return node.neighbors.map(function(neighborNode) {
        return [ node.position, neighborNode.position ];
      })
    }));

    var mapPointsGeometry = new Geometry({ vertices: pointVertices });
    var mapPointsMesh = new Mesh(mapPointsGeometry, new SolidColor({ pointSize: 5, color: Color.Red }), { points: true });

    var entrancePointsGeometry = new Geometry({ vertices: entrancePointVertices });
    var entrancePointsMesh = new Mesh(entrancePointsGeometry, new SolidColor({ pointSize: 10, color: Color.Yellow }), { points: true });

    var starisPointsGeometry = new Geometry({ vertices: stairsPointVertices });
    var starisPointsMesh = new Mesh(starisPointsGeometry, new SolidColor({ pointSize: 10, color: Color.Orange }), { points: true });

    var roomEdgesGeometry = new Geometry({ vertices: roomEdgeVertices });
    var roomEdgesMesh = new Mesh(roomEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.Green }), { lines: true });

    var corridorEdgesGeometry = new Geometry({ vertices: corridorEdgeVertices });
    var corridorEdgesMesh = new Mesh(corridorEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.Grey }), { lines: true });

    var floorBBox = BoundingBox.fromPoints(pointVertices);
    var floorBBoxHelper = new BoundingBoxHelper(floorBBox, Color.Yellow);

    //remove existing map meshes
    State.entities.filter(R.where({ map: true})).forEach(function(entity) {
      entity.mesh.material.program.dispose();
      entity.mesh.dispose();
      State.entities.splice(State.entities.indexOf(entity), 1);
    });

    //add new engities
    State.entities.push({ map: true, debug: true, mesh: mapPointsMesh });
    State.entities.push({ map: true, debug: true, mesh: entrancePointsMesh });
    State.entities.push({ map: true, debug: true, mesh: starisPointsMesh });
    State.entities.push({ map: true, debug: true, mesh: roomEdgesMesh });
    State.entities.push({ map: true, debug: true, mesh: corridorEdgesMesh });
    State.entities.push({ map: true, debug: true, mesh: floorBBoxHelper });

    //center camera on the new floor
    var target = floorBBox.getCenter();
    var position = new Vec3(State.camera.target.x, State.camera.target.y + State.mapCameraPosY, State.camera.target.z);
    State.camera.setUp(new Vec3(0, 0, -1));
    State.arcball.setPosition(position);
    State.arcball.setTarget(target);
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.renderSys(State.entities, State.camera);
  }
});
