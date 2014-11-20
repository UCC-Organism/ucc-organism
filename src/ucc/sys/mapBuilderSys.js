var R                 = require('ramda');
var geom              = require('pex-geom');
var glu               = require('pex-glu');
var materials         = require('pex-materials');
var color             = require('pex-color');
var gen               = require('pex-gen');
var random            = require('pex-random');

var delaunay          = require('../../geom/delaunay');
var voronoi           = require('../../geom/voronoi');
var graph             = require('../../graph');
var fn                = require('../../utils/fn');
var GeomUtils         = require('../../geom/GeomUtils');
var Rect              = require('../../geom/Rect');

var BoundingBoxHelper = require('../../helpers/BoundingBoxHelper');

var Geometry          = geom.Geometry;
var BoundingBox       = geom.BoundingBox;
var Vec2              = geom.Vec2;
var Vec3              = geom.Vec3;
var Mesh              = glu.Mesh;
var SolidColor        = materials.SolidColor;
var ShowColors        = materials.ShowColors;
var Color             = color.Color;
var LineBuilder       = gen.LineBuilder;

var EPSILON = 0.001;

function mapBuilderSys(state) {
  if (!state.map.nodes.length || !state.map.selectedNodes.length) {
    return;
  }

  if (state.map.dirty) {
    rebuildMap(state);
  }
  else {
    updateMap(state);
  }
}

function updateMap(state) {
  var roomEntities = state.entities.filter(R.where({ room: R.identity }));
  roomEntities.forEach(function(roomEntity) {
    if (state.activities.currentLocations.indexOf(roomEntity.room) != -1) {
      roomEntity.mesh.material.uniforms.color = Color.White;
    }
    else {
      roomEntity.mesh.material.uniforms.color = Color.Grey;
    }
  })
}

function rebuildMap(state) {

  state.map.dirty = false;

  var nodes = state.map.nodes;
  var selectedNodes = state.map.selectedNodes;
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

  var roomVertexGroups = fn.groupBy(roomVertices, 'room');

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
  var corridorEdgesMesh = new Mesh(corridorEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.DarkGrey }), { lines: true });

  var floorBBox = BoundingBox.fromPoints(pointVertices);
  var floorBBoxHelper = new BoundingBoxHelper(floorBBox, Color.Yellow);

  //remove existing map meshes
  state.entities.filter(R.where({ map: true})).forEach(function(entity) {
    entity.mesh.material.program.dispose();
    entity.mesh.dispose();
    state.entities.splice(state.entities.indexOf(entity), 1);
  });

  //add new entities
  //state.entities.push({ map: true, debug: true, mesh: mapPointsMesh });
  //state.entities.push({ map: true, debug: true, mesh: entrancePointsMesh });
  //state.entities.push({ map: true, debug: true, mesh: starisPointsMesh });
  //state.entities.push({ map: true, debug: true, mesh: roomEdgesMesh });
  state.entities.push({ map: true, debug: true, mesh: corridorEdgesMesh });
  //state.entities.push({ map: true, debug: true, mesh: floorBBoxHelper });

  Object.keys(roomVertexGroups).forEach(function(roomId) {
    var roomVertices = roomVertexGroups[roomId];

    var roomEdges = R.flatten(roomVertices.map(function(node) {
      return node.neighbors.filter(R.where({ room: R.identity })).map(function(neighborNode) {
        return [ node.position, neighborNode.position ];
      })
    }));
    var g = new Geometry({ vertices: roomEdges });
    var m = new Mesh(g, new SolidColor({ pointSize: 2, color: Color.Cyan }), { lines: true });
    state.entities.push({ map: true, debug: true, room: roomId, mesh: m });
  })

  //center camera on the new floor
  var target = floorBBox.getCenter();
  var position = new Vec3(state.camera.target.x, state.camera.target.y + 0.001, state.camera.target.z  + state.cameraPosZ);
  state.camera.setUp(new Vec3(0, 0, -1));
  state.arcball.setPosition(position);
  state.arcball.setTarget(target);

  //var roomGeometry = new Geometry({ vertices: true });
  //roomGeometry.vertices.push(new Vec3(0, 0, 0));
  //roomGeometry.vertices.push(new Vec3(1, 0, 0));
  //roomGeometry.vertices.push(new Vec3(0, 0, 1));
  //var roomMesh = new Mesh(roomGeometry, new SolidColor({ color: Color.Red }));
  //state.entities.push({ map: true, debug: true, mesh: roomMesh });

  rebuildCells(state);
  //this.rebuildCorridors();
}

function pointsToMesh(points, color) {
  color = color || Color.White;
  var lineBuilder = new LineBuilder();
  points.forEach(function(p) {
    lineBuilder.addCross(p, 0.003);
  })
  var mesh = new Mesh(lineBuilder, new SolidColor({ color : color }), { lines: true })
  return mesh;
}

function vec3to2(v) {
  return new Vec2(v.x, v.y);
}

function vec2to3(v) {
  return new Vec3(v.x, v.y, 0);
}

function orderEdges(edges) {
  var sortedEdges = [];
  sortedEdges.push(edges.shift());
  while(edges.length > 0) {
    var lastEdge = sortedEdges[sortedEdges.length-1];
    var split = false;
    for(var i=0; i<edges.length; i++) {
      var edge = edges[i];
      if (lastEdge[1].distance(edge[0]) < EPSILON) {
        sortedEdges.push(edge);
        edges.splice(i, 1);
        split = true;
        break;
      }
      if (lastEdge[1].distance(edge[1]) < EPSILON) {
        sortedEdges.push(edge.reverse());
        edges.splice(i, 1);
        split = true;
        break;
      }
    }
    if (!split) {
      break;
    }
  }
  sortedEdges = sortedEdges.reverse().map(function(edge) {
    return edge.reverse();
  })
  while(edges.length > 0) {
    var lastEdge = sortedEdges[sortedEdges.length-1];
    var split = false;
    for(var i=0; i<edges.length; i++) {
      var edge = edges[i];
      if (lastEdge[1].distance(edge[0]) < EPSILON) {
        sortedEdges.push(edge);
        edges.splice(i, 1);
        split = true;
        break;
      }
      if (lastEdge[1].distance(edge[1]) < EPSILON) {
        sortedEdges.push(edge.reverse());
        edges.splice(i, 1);
        split = true;
        break;
      }
    }
    if (!split) {
      break;
    }
  }


  return sortedEdges;
}

function rebuildCells(state) {
  var selectedNodes = state.map.selectedNodes;

  var points = selectedNodes.map(R.prop('position'));
  var roomCenterPoints = [];

  //points = [];

  //room centers
  var cellGroups = fn.groupBy(selectedNodes, 'room');
  var cellMeshes = Object.keys(cellGroups).filter(R.identity).map(function(roomId) {
    var nodes = cellGroups[roomId];
    var cellPoints = nodes.map(R.prop('position'));
    var center = cellPoints.reduce(function(center, p) {
      return center.add(p);
    }, new Vec3(0, 0, 0)).scale(1/cellPoints.length);
    points.push(center);
    roomCenterPoints.push(center);
  });

  //corridors

  var addedConnections = {};
  function connectionHash(nodeA, nodeB) {
    if (nodeA.id <= nodeB.id) return nodeA.id + '-' + nodeB.id;
    else return nodeB.id + '-' + nodeA.id;
  }

  var up = new Vec3(0, 1, 0);
  var right = new Vec3(0, 0, 0);

  var connections = [];
  var corridorNodes = selectedNodes.filter(R.where({ room: R.not(R.identity) }));
  corridorNodes.forEach(function(node) {
    node.neighbors.forEach(function(neighborNode) {
      if (neighborNode.floor == node.floor) {
        var hash = connectionHash(node, neighborNode);
        if (!addedConnections[hash]) {
          addedConnections[hash] = true;
          connections.push([node, neighborNode]);
        }
      }
    });
  });

  var added = {};

  connections.forEach(function(connection) {
    var a = connection[0].position;
    var b = connection[1].position;
    var dir = b.dup().sub(a);
    var len = dir.length();
    dir.normalize();
    var d = 0.01;
    if (len > 0) {
      for(var i=d; i<len; i+=d) {
        var c = dir.dup().scale(i).add(a);
        for(var j=0; j<3; j++) {
          g = c.dup();
          g.x += random.float(-d/2, d/2);
          g.y += random.float(-d/2, d/2);
          points.push(g);
        }
      }
    }
  })

  //cells

  var points2D = points.map(vec3to2);

  var boundingRect = Rect.fromPoints(points2D);
  var center = boundingRect.getCenter();
  var size = boundingRect.getSize();
  var r = Math.max(size.x, size.y) / 2;
  for(var i=0; i<30; i++) {
    points2D.push(new Vec2(
      center.x + r * Math.cos(2 * Math.PI * i/30),
      center.y + r * Math.sin(2 * Math.PI * i/30)
    ))
  }

  var cells = voronoi(points2D);
  var cellPoints2 = R.flatten(cells);

  //state.entities.push({ map: true, mesh: pointsToMesh(points) });
  var cellPoints3 = cellPoints2.map(vec2to3).map(function(p) { p.z = points[0].z; return p; })

  var blobsGeometry = new Geometry({ vertices: true, colors: true, faces: true });
  var vertices = blobsGeometry.vertices;
  var faces = blobsGeometry.faces;
  var colors = blobsGeometry.colors;

  var roomCellsGeometry = new Geometry({ vertices: true, colors: true, faces: true });
  var roomCellsVertices = roomCellsGeometry.vertices;
  var roomCellsFaces = roomCellsGeometry.faces;
  var roomCellsColors = roomCellsGeometry.colors;

  var lineBuilder = new LineBuilder();
  cells.forEach(function(cell, cellIndex) {
    //if (cellIndex > 0) return;
    var start = vec2to3(cell[0][0]);
    var end = vec2to3(cell[cell.length-1][1]);
    var dist = start.distance(end);

    cell.forEach(function(edge) {
      edge[0] = vec2to3(edge[0]);
      edge[1] = vec2to3(edge[1]);
    })

    cell = orderEdges(cell);

    var isRoom = false;
    var roomId;
    var isEdgeCell = false;

    var cellPoint = points[cellIndex];
    var roomIndex = roomCenterPoints.indexOf(cellPoint);
    if (roomIndex != -1) {
      isRoom = true;
      roomId = Object.keys(cellGroups).filter(R.identity)[roomIndex];
    }

    if (cell[0][0].distance(cell[cell.length-1][1]) > 0.001) {
      //return;
      isEdgeCell = true;
    }

    //var cellColor = room ? Color.fromHSV(0.2, 0.9, 0.5, 0.1) : Color.fromHSV(0.5, 0.8, 0.3, 0.1);
    //var cellColorEdge = room ? Color.fromHSV(0.2, 0.9, 0.4, 1) : Color.fromHSV(0.5, 0.8, 0.4, 1);
    var cellColorEdge = isEdgeCell ? Color.fromHSV(0.5, 0.8, 0.4, 0.5) : Color.fromHSV(0.5, 0.8, 0.4, 1);
    var cellColor = isRoom ? Color.fromHSV(0.2, 0.2, 0.9, 0.2) : Color.fromHSV(0.5, 0.2, 0.9, 0.03);

    cell.forEach(function(edge, edgeIndex) {
      //if (edgeIndex > 0) return;
      var a = (edge[0]);
      a.z = points[0].z;
      var b = (edge[1]);
      b.z = points[0].z;
      lineBuilder.addLine(a, b, Color.fromHSV(0.4, 0.2, 0.9));
    })

    cell = R.flatten(cell);
    var uniquePoints = cell.filter(function(p, i) {
      if (i == 0) return true;
      return cell[i-1].distance(p) > EPSILON;
    });

    var splinePoints = GeomUtils.smoothCurve(uniquePoints, 0.9, 3);

    var center = GeomUtils.center3(splinePoints);

    var cellCloseness = 0.2;

    for(var i=0; i<splinePoints.length; i++) {
      var p = splinePoints[i];
      var np = splinePoints[(i+1)%splinePoints.length];
      var p2 = p.dup().add(center.dup().sub(p).scale(cellCloseness));
      var np2 = np.dup().add(center.dup().sub(np).scale(cellCloseness));
      if (isRoom) {
        var n = roomCellsVertices.length;
        roomCellsVertices.push(p2);
        roomCellsVertices.push(np2);
        roomCellsVertices.push(center);
        roomCellsColors.push(cellColor);
        roomCellsColors.push(cellColor);
        roomCellsColors.push(cellColor);
        roomCellsFaces.push([n, n+1, n+2]);
      }
      else {
        var n = vertices.length;
        vertices.push(p2);
        vertices.push(np2);
        vertices.push(center);
        colors.push(cellColor);
        colors.push(cellColor);
        colors.push(cellColor);
        faces.push([n, n+1, n+2]);
      }
      lineBuilder.addLine(p2, np2, cellColorEdge);
    }

    //lineBuilder.addLine(cell[0][0], cell[cell.length-1][1], Color.Red);
  })

  var edgeMesh = new Mesh(lineBuilder, new ShowColors(), { lines: true });
  var blobsMesh = new Mesh(blobsGeometry, new ShowColors(), { faces: true });
  var roomCellsMesh = new Mesh(roomCellsGeometry, new ShowColors(), { faces: true });

  state.entities.push({ map: true, bio: true, mesh: edgeMesh });
  state.entities.push({ map: true, bio: true, mesh: blobsMesh });
  state.entities.push({ map: true, bio: true, mesh: roomCellsMesh });
  //state.entities.push({ map: true, mesh: pointsToMesh(cellPoints3) });
  state.entities.push({ map: true, bio: true, mesh: pointsToMesh(roomCenterPoints, Color.Yellow) });
  //state.entities.push({ map: true, mesh: pointsToMesh(points, Color.Yellow) });
}


module.exports = mapBuilderSys;