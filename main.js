var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var gen = require('pex-gen');
var Q = require('q');
var graph = require('./graph');
var R = require('ramda');

var Cube = gen.Cube;
var Mesh = glu.Mesh;
var ShowNormals = materials.ShowNormals;
var SolidColor = materials.SolidColor;
var ShowColors = materials.ShowColors;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;
var IO = sys.IO;
var Geometry = geom.Geometry;
var Vec3 = geom.Vec3;
var LineBuilder = gen.LineBuilder;
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
  nodes: [],
  selectedNodes: [],
  floors: [],
  currentFloor: 1,
  mapCameraPosY: 0.40,
  entities: [],
  pointSpriteMeshEntity: null,
  agentDebugInfoMeshEntity: null,
  maxNumAgents: 10
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
    });
    State.floors.unshift('-1');

    State.currentFloor = State.floors[1]; //skip first global floor '-1'

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
    var roomEdgesMesh = new Mesh(roomEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.Cyan }), { lines: true });

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
  agentSpawnSys: function(allEntities) {
    var agents = R.filter(R.where({ agent: R.identity }), allEntities);

    if (!State.selectedNodes) return;
    if (agents.length >= State.maxNumAgents) return;

    var selectedNodes = State.selectedNodes;
    var stairsNodes = selectedNodes.filter(function(node) {
      return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
        return sameFloorSoFar && (neighborNode.floor == node.floor);
      }, true)
    });
    var stairsPointVertices = stairsNodes.map(R.prop('position'));

    if (stairsPointVertices.length == 0) return;

    var position = geom.randomElement(stairsPointVertices).clone();
    var color = Color.White;
    State.entities.push({ agent: true, pointSize: 5, position: position,  color: color, target: null });
  },
  agentTargetNodeUpdaterSys: function(allEntities) {
    var selectedNodes = State.selectedNodes;

    var agents = R.filter(R.where({ agent: R.identity }), allEntities);
    var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));

    agentsWithNoTarget.forEach(function(agentEntity) {
      agentEntity.targetNode = geom.randomElement(selectedNodes);
    })
  },
  agentTargetNodeFollowerSys: function(allEntities) {
    var targetFollowers = R.filter(R.where({ targetNode: R.identity }), allEntities);
    targetFollowers.forEach(function(followerEntity) {
      followerEntity.position.lerp(followerEntity.targetNode.position, 0.01);
    })
  },
  pointSpriteUpdaterSys: function(allEntities, camera) {
    if (!State.pointSpriteMeshEntity) {
      var pointSpriteGeometry = new Geometry({ vertices: true, colors: true });
      var pointSpriteMaterial = new ShowColors({ pointSize: 10, color: Color.White });
      State.pointSpriteMeshEntity = {
        mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
      }
      State.entities.push(State.pointSpriteMeshEntity);
    }
    var entitiesWithPointSprite = R.filter(R.where({ pointSize: R.identity }), allEntities);

    var vertices = State.pointSpriteMeshEntity.mesh.geometry.vertices;
    var colors = State.pointSpriteMeshEntity.mesh.geometry.colors;
    vertices.length = entitiesWithPointSprite.length;
    colors.length = entitiesWithPointSprite.length;

    entitiesWithPointSprite.forEach(function(entity, entityIndex) {
      if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
      else vertices[entityIndex] = entity.position.clone();
      if (colors[entityIndex]) colors[entityIndex].copy(entity.color || Color.White);
      else colors[entityIndex] = entity.color ? entity.color.clone() : Color.White;
    });

    vertices.dirty = true;
    colors.dirty = true;
  },
  agentDebugInfoUpdaterSys: function(allEntities) {
    if (!State.agentDebugInfoMeshEntity) {
      var lineBuilder = new LineBuilder();
      lineBuilder.addLine(new Vec3(0, 0, 0), geom.randomVec3());
      lineBuilder.addLine(new Vec3(0, 0, 0), geom.randomVec3());
      lineBuilder.addLine(new Vec3(0, 0, 0), geom.randomVec3());
      lineBuilder.addLine(new Vec3(0, 0, 0), geom.randomVec3());
      var mesh = new Mesh(lineBuilder, new ShowColors(), { lines: true });
      State.agentDebugInfoMeshEntity = {
        mesh: mesh
      };
      State.entities.push(State.agentDebugInfoMeshEntity);
    }

    var lineBuilder = State.agentDebugInfoMeshEntity.mesh.geometry;
    lineBuilder.reset();

    var agents = R.filter(R.where({ agent: R.identity }), allEntities);
    agents.forEach(function(agent) {
      if (agent.targetNode) lineBuilder.addLine(agent.position, agent.targetNode.position, Color.White);
    })
  },
  meshRendererSys: function(allEntities, camera) {
    var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), allEntities);

    entitiesWithMesh.forEach(function(entity) {
      entity.mesh.draw(camera);
    })
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    this.agentSpawnSys(State.entities);
    this.agentTargetNodeUpdaterSys(State.entities);
    this.agentTargetNodeFollowerSys(State.entities);
    this.agentDebugInfoUpdaterSys(State.entities);
    this.pointSpriteUpdaterSys(State.entities, State.camera);
    this.meshRendererSys(State.entities, State.camera);
  }
});
