var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var geom = require('pex-geom');
var gen = require('pex-gen');
var graph = require('./graph');
var R = require('ramda');
var Promise = require('bluebird');

var BoundingBoxHelper = require('./helpers/BoundingBoxHelper');
var GeomUtils = require('./geom/GeomUtils');
var IOUtils = require('./sys/IOUtils');

//CES systems
var meshRendererSys = require('./ucc/sys/meshRendererSys');

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
var Platform = sys.Platform;
var Time = sys.Time;

var VK_LEFT = Platform.isPlask ? 123 : 37;
var VK_RIGHT = Platform.isPlask ? 124 : 39;

var groupBy = function(list, prop) {
  var groups = {};
  list.forEach(function(item) {
    var value = item[prop];
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
  })
  return groups;
}

var notNull = R.identity;

var State = {
  camera: null,
  arcball: null,
  graph: null,
  nodes: [],
  selectedNodes: [],
  floors: [],
  currentFloor: 6,
  mapCameraPosY: 0.40,
  entities: [],
  pointSpriteMeshEntity: null,
  agentDebugInfoMeshEntity: null,
  agentSpeed: 0.02,
  maxNumAgents: 100,
  minNodeDistance: 0.01,
  debugMode: false,
  bgColor: new Color(0.1, 0.1, 0.12, 1.0)
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

    geom.randomSeed(0);

    State.camera = new PerspectiveCamera(60, this.width / this.height);
    State.arcball = new Arcball(this, State.camera);

    var self = this;

    this.initGroups();

    Promise.all([
      IOUtils.loadJSON('data/map/layers.json'),
      IOUtils.loadJSON('data/map/nodes.client.json')
    ])
    .spread(this.initMap.bind(this))
    .done(function(e) {
      if (e) console.log(e);
    });

    this.initKeys();

    if (Platform.isBrowser) {
      setInterval(this.setNextMapFloor.bind(this), 10000);
    }
  },
  initGroups: function() {
    IOUtils.loadJSON('data/static/groups_bundle.json')
    .then(function(groups) {
      var students = R.flatten(groups.map(R.prop('students')));
      var uniqueStudents = R.uniq(students.map(R.prop('id')));
      var programmes = R.uniq(R.flatten(groups.map(R.prop('programme'))));
      var groupNames = R.uniq(R.flatten(groups.map(R.prop('name'))));
      groupNames = R.uniq(groupNames.map(function(name) {
        return name.slice(0, 3);
      }))
    })
    .catch(console.log)
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      switch(e.str) {
        case ' ': this.killAllAgents(); break;
        case 'd': State.debugMode = !State.debugMode; break;
      }
      switch(e.keyCode) {
        case VK_LEFT: this.setPrevMapFloor(); break;
        case VK_RIGHT: this.setNextMapFloor(); break;
      }
    }.bind(this));
  },
  initMap: function(layersData, nodesData) {
    State.nodes = nodesData.nodes;
    State.rooms = nodesData.rooms;
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
    var position = new Vec3(State.camera.target.x, State.camera.target.y + State.mapCameraPosY, State.camera.target.z + 0.01);
    State.camera.setUp(new Vec3(0, 0, -1));
    State.arcball.setPosition(position);
    State.arcball.setTarget(target);

    this.rebuildCells();
    this.rebuildCorridors();
  },
  rebuildCells: function() {
    var nodesOnThisFloor = State.nodes.filter(R.where({ floor: State.currentFloor }));
    var cellGroups = groupBy(nodesOnThisFloor, 'room');
    var cellNodes = Object.keys(cellGroups).filter(notNull).map(function(roomId) {
      return cellGroups[roomId];
    });
    var cellMaterial = new SolidColor();
    var cellMeshes = cellNodes.map(function(nodes) {
      nodes = graph.orderNodes(nodes);
      var points = nodes.map(R.prop('position'));
      var lineBuilder = new LineBuilder();
      //add little turbulence to room corners
      points.forEach(function(p) {
        p.x += (Math.random() - 0.5) * 0.001;
        p.y += (Math.random() - 0.5) * 0.001;
      })
      points = GeomUtils.computeBSpline(points);
      for(var i=0; i<points.length; i++) {
        var p = points[i];
        var np = points[(i+1)%points.length];
        lineBuilder.addLine(p, np);
      }
      var mesh = new Mesh(lineBuilder, cellMaterial, { lines: true })
      State.entities.push({ map: true, mesh: mesh });
    })
  },
  rebuildCorridors: function() {
    var selectedNodes = State.selectedNodes;
    var corridorNodes = selectedNodes.filter(R.where({ room: R.not(R.identity) }));

    var lineBuilder = new LineBuilder();

    var addedConnections = {};
    function connectionHash(nodeA, nodeB) {
      if (nodeA.id <= nodeB.id) return nodeA.id + '-' + nodeB.id;
      else return nodeB.id + '-' + nodeA.id;
    }

    var up = new Vec3(0, 1, 0);
    var right = new Vec3(0, 0, 0);

    corridorNodes.forEach(function(node) {
      node.neighbors.forEach(function(neighborNode) {
        if (neighborNode.floor == node.floor) {
          var hash = connectionHash(node, neighborNode);
          if (!addedConnections[hash]) {
            addedConnections[hash] = true;
            var forward = neighborNode.position.dup().sub(node.position).normalize();
            right.asCross(forward, up);
            right.scale(0.003);
            var subPoints = GeomUtils.resampleLine(node.position, neighborNode.position, { distance: 0.01 })
            subPoints.forEach(function(p) {
              lineBuilder.addLine(p.dup().sub(right), p.dup().add(right));
            });
          }
        }
      })
    })
    console.log('lineBuilder.points', lineBuilder.vertices.length);
    var mesh = new Mesh(lineBuilder, new SolidColor({ color: Color.Blue }), { lines: true });
    State.entities.push({ map: true, mesh: mesh });
  },
  killAllAgents: function() {
    var agents = R.filter(R.where({ agent: R.identity }), State.entities);

    agents.forEach(function(agent) {
      State.entities.splice(State.entities.indexOf(agent), 1);
    })
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
    State.entities.push({
      pointSize: 5,
      agent: true,
      position: position,
      color: color,
      targetNode: null,
    });
  },
  agentTargetNodeUpdaterSys: function(allEntities) {
    var selectedNodes = State.selectedNodes;

    var agents = R.filter(R.where({ agent: R.identity }), allEntities);

    var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));
    agentsWithNoTarget.forEach(function(agentEntity) {
      var targetNode = geom.randomElement(selectedNodes);
      var closestNode = graph.findNearestNode(State.selectedNodes, agentEntity.position);
      var path = graph.findShortestPath(closestNode, targetNode);
      if (!path) {
        //No path found, try next time
        agentEntity.targetNodeList = [];
        agentEntity.targetNode = null;
      }
      else {
        agentEntity.targetNodeList = path;
        agentEntity.targetNode = agentEntity.targetNodeList.shift();
      }
    });

    var agentsWithTarget = agents.filter(R.prop('targetNode'));
    agentsWithTarget.forEach(function(agentEntity) {
      if (agentEntity.position.distance(agentEntity.targetNode.position) < State.minNodeDistance) {
        if (agentEntity.targetNodeList.length > 0) {
          agentEntity.targetNode = agentEntity.targetNodeList.shift();
        }
        else {
          agentEntity.targetNode = null;
        }
      }
    })
  },
  agentTargetNodeFollowerSys: function(allEntities) {
    var targetFollowers = R.filter(R.where({ targetNode: R.identity }), allEntities);
    var tmpDir = new Vec3();
    targetFollowers.forEach(function(followerEntity) {
      tmpDir.copy(followerEntity.targetNode.position).sub(followerEntity.position);
      tmpDir.normalize().scale(State.agentSpeed * Time.delta);
      followerEntity.position.add(tmpDir);
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

    if (State.debugMode) {
      var agents = R.filter(R.where({ agent: R.identity }), allEntities);
      agents.forEach(function(agent) {
        if (agent.targetNode) {
          lineBuilder.addLine(agent.position, agent.targetNode.position, Color.White);
        }
      })
    }
  },
  draw: function() {
    glu.clearColorAndDepth(State.bgColor);
    glu.enableDepthReadAndWrite(true);

    this.agentSpawnSys(State.entities);
    this.agentTargetNodeUpdaterSys(State.entities);
    this.agentTargetNodeFollowerSys(State.entities);
    this.agentDebugInfoUpdaterSys(State.entities);
    this.pointSpriteUpdaterSys(State.entities, State.camera);

    meshRendererSys(State.entities, State);
  }
});
