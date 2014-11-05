//var glu = require('pex-glu');
//var materials = require('pex-materials');
//var color = require('pex-color');
//var gen = require('pex-gen');
//var geom = require('pex-geom');
//var gen = require('pex-gen');
//var graph = require('./graph');
//var R = require('ramda');
//var Promise = require('bluebird');
//var remap = require('re-map');
//
//var BoundingBoxHelper = require('./helpers/BoundingBoxHelper');
//var GeomUtils = require('./geom/GeomUtils');
//var IOUtils = require('./sys/IOUtils');
//var Crayon = require('./lib/crayons');
//var fn = require('./utils/fn');


var Promise           = require('bluebird');
var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');

//CES
var meshRendererSys   = require('./ucc/sys/meshRendererSys');
var mapBuilderSys     = require('./ucc/sys/mapBuilderSys');

//Stores
var MapStore          = require('./ucc/stores/MapStore');
var ActivityStore     = require('./ucc/stores/ActivityStore');
var GroupsStore       = require('./ucc/stores/GroupStore');

var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;

//var Cube = gen.Cube;
//var Mesh = glu.Mesh;
//var ShowNormals = materials.ShowNormals;
//var SolidColor = materials.SolidColor;
//var ShowColors = materials.ShowColors;
//var Color = color.Color;
//var Platform = sys.Platform;
//var IO = sys.IO;
//var Geometry = geom.Geometry;
//var Vec3 = geom.Vec3;
//var LineBuilder = gen.LineBuilder;
//var BoundingBox = geom.BoundingBox;
//
//
//var ScreenImage = glu.ScreenImage;
//var Texture2D = glu.Texture2D;
//var PointSpriteTextured = require('./materials/PointSpriteTextured')

//var VK_LEFT = Platform.isPlask ? 123 : 37;
//var VK_RIGHT = Platform.isPlask ? 124 : 39;
//
//var notNull = R.identity;

//var Style = {
//  groupColors: {
//    'default': new Color(1,1,1,1),
//    'spl'    : new Color(1,1,1,1),
//    'pmu'    : new Color(1,1,1,1),
//    'fys'    : new Color(1,1,1,1),
//    'nor'    : new Color(1,1,1,1),
//    'PE1'    : new Color(1,1,1,1),
//    'PNE'    : new Color(1,1,1,1)
//  }
//}

var State = {
  //scene
  bgColor: new Color(0.1, 0.1, 0.12, 1.0),
  camera: null,
  cameraPosY: 0.40,
  arcball: null,

  //entities
  entities: [],

  //stores
  map: null,

  //state
  currentTime: 0,
  debug: true

  //graph: null,
  //nodes: [],
  //selectedNodes: [],
  //floors: [],
  //currentFloor: 6,
  //
  
  //pointSpriteMeshEntity: null,
  //agentDebugInfoMeshEntity: null,
  //agentSpeed: 0.02,
  //maxNumAgents: 100,
  //minNodeDistance: 0.01,
  //debugMode: false,
  //

  
};

var DPI = Platform.isPlask ? 2 : 1;


sys.Window.create({
  settings: {
    width: 1280 * DPI,
    height: 720 * DPI,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: DPI,
  },
  init: function() {
    this.initLibs();
    this.initScene();
    this.initStores();
  },
  initLibs: function() {
    Promise.longStackTraces();
    random.seed(0);
  },
  initScene: function() {
    State.camera = new PerspectiveCamera(60, this.width / this.height);
    State.arcball = new Arcball(this, State.camera);
  },
  initStores: function() {
    Promise.all([
      MapStore.init()
    ])
    .spread(function(map) {
      State.map = map;
    })
    .catch(function(e) {
      console.log(e.stack)
    })
  },
  /*
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
  */
  setPrevMapFloor: function() {
    /*
    var floorIndex = State.floors.indexOf(State.currentFloor);
    var prevFloorIndex = (floorIndex - 1 + State.floors.length) % State.floors.length;
    this.setMapFloor(State.floors[prevFloorIndex]);
    */
  },
  setNextMapFloor: function() {
    /*
    var floorIndex = State.floors.indexOf(State.currentFloor);
    var nextFloorIndex = (floorIndex + 1) % State.floors.length;
    this.setMapFloor(State.floors[nextFloorIndex]);
    */
  },
  setMapFloor: function(floorId) {
    /*
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
    */
  },
  rebuildCells: function() {
    /*
    var nodesOnThisFloor = State.nodes.filter(R.where({ floor: State.currentFloor }));
    if (State.currentFloor == -1) {
      nodesOnThisFloor = State.nodes;
    }
    var cellGroups = fn.groupBy(nodesOnThisFloor, 'room');
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
    */
  },
  rebuildCorridors: function() {
    /*
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
              //lineBuilder.addLine(p.dup().sub(right), p.dup().add(right));
            });
            lineBuilder.addLine(node.position, neighborNode.position);
          }
        }
      })
    })
    var mesh = new Mesh(lineBuilder, new SolidColor({ color: Color.White }), { lines: true });
    State.entities.push({ map: true, mesh: mesh });
    */
  },
  killAllAgents: function() {
    /*/
    var agents = R.filter(R.where({ agent: R.identity }), State.entities);

    agents.forEach(function(agent) {
      State.entities.splice(State.entities.indexOf(agent), 1);
    })
    */
  },
  agentSpawnSys: function(allEntities) {
    /*
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

    var colors = [
      new Color(181/255,  77/255, 243/255),
      new Color(206/255, 244/255,  62/255),
      new Color(0/255,  150/255, 250/255)
    ]

    var position = geom.randomElement(stairsPointVertices).clone();
    var color = geom.randomElement(colors);
    State.entities.push({
      pointSize: 5,
      agent: true,
      position: position,
      prevPosition: position.dup(),
      color: color,
      targetNode: null,
    });
    */
  },
  agentTargetNodeUpdaterSys: function(allEntities) {
    /*
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
    */
  },
  agentTargetNodeFollowerSys: function(allEntities) {
    /*
    var targetFollowers = R.filter(R.where({ targetNode: R.identity }), allEntities);
    var tmpDir = new Vec3();
    targetFollowers.forEach(function(followerEntity) {
      tmpDir.copy(followerEntity.targetNode.position).sub(followerEntity.position);
      tmpDir.normalize().scale(State.agentSpeed * Time.delta);
      followerEntity.prevPosition.copy(followerEntity.position);
      followerEntity.position.add(tmpDir);
    })
    */
  },
  pointSpriteUpdaterSys: function(allEntities, camera) {
    /*
    if (!State.pointSpriteMeshEntity) {
      var pointSpriteGeometry = new Geometry({ vertices: true, colors: true, normals: true });
      var pointSpriteMaterial = new PointSpriteTextured({ pointSize: 20 * DPI, texture: Texture2D.load('assets/U2.png') });
      State.pointSpriteMeshEntity = {
        mesh: new Mesh(pointSpriteGeometry, pointSpriteMaterial, { points: true } )
      }
      State.entities.push(State.pointSpriteMeshEntity);
    }
    var entitiesWithPointSprite = R.filter(R.where({ pointSize: R.identity }), allEntities);

    var vertices = State.pointSpriteMeshEntity.mesh.geometry.vertices;
    var colors = State.pointSpriteMeshEntity.mesh.geometry.colors;
    var normals = State.pointSpriteMeshEntity.mesh.geometry.normals;
    vertices.length = entitiesWithPointSprite.length;
    colors.length = entitiesWithPointSprite.length;
    normals.length = entitiesWithPointSprite.length;

    var dir = new Vec3();
    entitiesWithPointSprite.forEach(function(entity, entityIndex) {
      if (vertices[entityIndex]) vertices[entityIndex].copy(entity.position);
      else vertices[entityIndex] = entity.position.clone();
      if (colors[entityIndex]) colors[entityIndex].copy(entity.color || Color.White);
      else colors[entityIndex] = entity.color ? entity.color.clone() : Color.White;
      if (!normals[entityIndex]) normals[entityIndex] = new Vec3(0, 0, 0);

      dir.copy(entity.prevPosition).sub(entity.position).normalize();
      var agentRotation = Math.atan2(-dir.z, dir.x);
      normals[entityIndex].x = (normals[entityIndex].x * 5 + agentRotation) / 6;
    });

    vertices.dirty = true;
    colors.dirty = true;
    normals.dirty = true;
    */
  },
  agentDebugInfoUpdaterSys: function(allEntities) {
    /*
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
    */
  },
  //updateUI: function() {
  //  if (Time.frameNumber % 2 == 0) {
  //    var x = remap(State.currentTime, State.activtiesStartTime, State.activtiesEndTime, 0, State.crayon.canvas.width);
  //    State.crayon.fill([255, 255, 255, 255]).rect(x, 0, 2, 5 * DPI);
  //    State.uiTexture.update(State.canvas);
  //  }
  //},
  update: function() {
    State.currentTime += Time.delta * 100000;

    //this.updateUI();
  },
  draw: function() {
    this.update();

    glu.clearColorAndDepth(State.bgColor);
    glu.enableDepthReadAndWrite(true);

    //this.agentSpawnSys(State.entities);
    //this.agentTargetNodeUpdaterSys(State.entities);
    //this.agentTargetNodeFollowerSys(State.entities);
    //this.agentDebugInfoUpdaterSys(State.entities);
    //this.pointSpriteUpdaterSys(State.entities, State.camera);

    //glu.enableDepthReadAndWrite(false);
    //glu.enableAlphaBlending(true);

    mapBuilderSys(State);
    meshRendererSys(State);

    //glu.enableAlphaBlending();
    //State.ui.draw();
  }
});
