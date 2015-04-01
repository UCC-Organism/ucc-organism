var R                 = require('ramda');
var geom              = require('pex-geom');
var glu               = require('pex-glu');
var materials         = require('pex-materials');
var color             = require('pex-color');
var gen               = require('pex-gen');
var random            = require('pex-random');
var sys               = require('pex-sys');

var delaunay          = require('../../geom/delaunay');
var voronoi           = require('../../geom/voronoi');
var graph             = require('../../graph');
var fn                = require('../../utils/fn');
var GeomUtils         = require('../../geom/GeomUtils');
var Rect              = require('../../geom/Rect');

var BoundingBoxHelper = require('../../helpers/BoundingBoxHelper');
var config            = require('../../config');

var Geometry          = geom.Geometry;
var BoundingBox       = geom.BoundingBox;
var Vec2              = geom.Vec2;
var Vec3              = geom.Vec3;
var Mesh              = glu.Mesh;
var SolidColor        = require('../../materials/SolidColor');
var ShowColors        = require('../../materials/ShowColors');
var Color             = color.Color;
var LineBuilder       = gen.LineBuilder;
var Time              = sys.Time;

var EPSILON = 0.0001;

//-----------------------------------------------------------------------------

var MapSys = {
  ready: false,
  cells: []
};

//-----------------------------------------------------------------------------

function vec3to2(v) {
  return new Vec2(v.x, v.y);
}

//-----------------------------------------------------------------------------

function vec2to3(v) {
  return new Vec3(v.x, v.y, 0);
}

//-----------------------------------------------------------------------------

function cloneVert(v) {
  return v.clone();
}

//-----------------------------------------------------------------------------

Vec3.prototype.setLength = function(len) {
  this.normalize().scale(len);
  return this;
}

//-----------------------------------------------------------------------------

function pointsToMesh(points, color) {
  color = color || Color.White;
  var lineBuilder = new LineBuilder();
  points.forEach(function(p) {
    lineBuilder.addCross(p, 0.003);
  })
  var mesh = new Mesh(lineBuilder, new SolidColor({ color : color }), { lines: true })
  return mesh;
}

//-----------------------------------------------------------------------------

function removeMapEntities(state) {
  //remove existing map meshes
  state.entities.filter(R.where({ map: true})).forEach(function(entity) {
    entity.mesh.material.program.dispose();
    entity.mesh.dispose();
    state.entities.splice(state.entities.indexOf(entity), 1);
  });
}

//-----------------------------------------------------------------------------

function centerCamera(state, floorBBox) {
  var target = floorBBox.getCenter();
  state.arcball.setTarget(target);
  var position = new Vec3(state.camera.target.x, state.camera.target.y + 0.001, state.camera.target.z  + state.cameraPosZ);
  state.arcball.setPosition(position);
  var distance = 1;

  //organism
  if (state.map.currentFloor == -1) {
    distance = 1;
  }
  //classrom
  else if (state.map.focusRoomId != null) {
    distance = 0.1;
    var roomNode = state.map.getSelectedNodeByRoomId(state.map.focusRoomId)
    if (roomNode) {
      target = roomNode.position;
      console.log(roomNode)
      state.arcball.setTarget(target);
      var position = new Vec3(state.camera.target.x, state.camera.target.y + 0.001, state.camera.target.z  + state.cameraPosZ);
      state.arcball.setPosition(position);
    }
  }
  //floor
  else {
    distance = 0.37;
  }

  state.camera.setUp(new Vec3(0, 0, -1));
  
  
  state.arcball.setDistance(distance);
}

//-----------------------------------------------------------------------------

function indexFinder(list) {
  return function(o) {
    return list.indexOf(o);
  }
}

//-----------------------------------------------------------------------------

function inRect(rect, accuracy) {
  return function(p) {
    return Math.abs(p.x - rect.min.x) < accuracy
       ||  Math.abs(p.x - rect.max.x) < accuracy
       ||  Math.abs(p.y - rect.min.y) < accuracy
       ||  Math.abs(p.y - rect.max.y) < accuracy;
  }
}

//-----------------------------------------------------------------------------

function voronoiCellsToEdges(cells) {
  var edges = R.unnest(cells.map(function(cell) {
    return cell.map(function(i, index) {
      return [i, cell[(index + 1) % cell.length ]].sort();
    })
  }))

  //finding unique edges

  //first sort by edge indices
  edges.sort(function(a, b) {
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    else return a[1] - b[1];
  })

  //skip edge if the previous edge is the same
  edges = edges.filter(function(edge, index, list) {
    if (index == 0) return true;
    if (list[index-1][0] == edge[0] && list[index-1][1] == edge[1]) return false;
    return true;
  })

  return edges;
}

//-----------------------------------------------------------------------------

function rebuildMap(state) {
  console.log('rebuildMap');

  removeMapEntities(state);

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

  var corridorEdgeVertices = R.flatten(corridorNodes.map(function(node) {
    return node.neighbors.map(function(neighborNode) {
      return [ node.position, neighborNode.position ];
    })
  }));

  var mapPointsGeometry = new Geometry({ vertices: pointVertices });
  var mapPointsMesh = new Mesh(mapPointsGeometry, new SolidColor({ pointSize: 5, color: Color.Red }), { points: true });

  var entrancePointsGeometry = new Geometry({ vertices: entrancePointVertices });
  var entrancePointsMesh = new Mesh(entrancePointsGeometry, new SolidColor({ pointSize: 10, color: Color.Yellow }), { points: true });

  var stairsPointsGeometry = new Geometry({ vertices: stairsPointVertices });
  var stairsPointsMesh = new Mesh(stairsPointsGeometry, new SolidColor({ pointSize: 10, color: Color.Orange }), { points: true });

  var corridorEdgesGeometry = new Geometry({ vertices: corridorEdgeVertices });
  var corridorEdgesMesh = new Mesh(corridorEdgesGeometry, new SolidColor({ pointSize: 2, color: Color.DarkGrey }), { lines: true });

  var roomVertexGroups = fn.groupBy(roomVertices, 'room');

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

  //add new entities
  state.entities.push({ map: true, debug: true, mesh: stairsPointsMesh });
  state.entities.push({ map: true, debug: true, mesh: corridorEdgesMesh });

  rebuildCells(state);
}

//-----------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------

function closestPoint(points, p) {
  var best = points.reduce(function(best, node, nodeIndex) {
    var dist = node.squareDistance(p);
    if (dist < best.distance) {
      best.node = node;
      best.index = nodeIndex;
      best.distance = dist;
    }
    return best;
  }, { index: -1, distance: Infinity, node: null });

  return best.node;
}

//-----------------------------------------------------------------------------

//assumes ordered points
function findUniquePoints(points) {
  return points.filter(function(p, i) {
    if (i == 0) return true;
    return points[i-1].distance(p) > EPSILON;
  });
}

//-----------------------------------------------------------------------------

function makeSpring(start, end) {
  return {
    start: start,
    end: end,
    startBase: start.dup(),
    length: start.squareDistance(end)
  }
}

//-----------------------------------------------------------------------------

function rebuildCells(state) {
  var selectedNodes = state.map.selectedNodes;
  MapSys.cells.length = 0;

  //all points
  //var points = selectedNodes.map(R.prop('position'));

  //only room points
  var roomNodes = selectedNodes.filter(R.where({ room: R.identity }));
  var points = R.pluck('position', roomNodes);

  //room centers
  var cellGroups = fn.groupBy(selectedNodes, 'room');
  var cellsRoomIds = Object.keys(cellGroups).filter(R.identity);
  var roomCenterPoints = cellsRoomIds.map(function(roomId) {
    return GeomUtils.centroid(R.pluck('position', cellGroups[roomId]));
  })
  points = roomCenterPoints.concat(points);

  //2d points

  var points2D = points.map(vec3to2);

  //boundary points

  var boundingRect = Rect.fromPoints(points2D);
  var center = boundingRect.getCenter();
  var size = boundingRect.getSize();
  var r = Math.max(size.x, size.y) / 2 * 1.5;
  for(var i=0; i<30; i++) {
    points2D.push(new Vec2(
      center.x + r * Math.cos(2 * Math.PI * i/30),
      center.y + r * Math.sin(2 * Math.PI * i/30)
    ))
  }

  //cells

  var voronoiCells = voronoi(points2D);

  voronoiCells.points = voronoiCells.points.map(vec2to3);

  //reject edge cells - cells that are touching the bounding box edge
  var boundingRect = Rect.fromPoints(voronoiCells.points);
  var borderPoints = voronoiCells.points.filter(inRect(boundingRect, EPSILON));
  var borderPointsIndices = borderPoints.map(indexFinder(voronoiCells.points));

  voronoiCells.cells = voronoiCells.cells.filter(function(cell, cellIndex) {
    var isRoom = cellIndex < cellsRoomIds.length;
    return isRoom || R.intersection(cell, borderPointsIndices).length == 0;
  })

  //if you reject cells you need to rebuild points too
  voronoiCells.edges = voronoiCellsToEdges(voronoiCells.cells);

  var voronoiPointsMeta = [];

  //add center points
  roomCenterPoints.forEach(function(p, cellIndex) {
    var roomId = cellsRoomIds[cellIndex] || -1;
    var room = state.map.roomsById[roomId];
    var roomType = room ? room.type : 'none';
    var roomFloor = room ? room.floor : -1;

    //skip empty cells
    if (roomType == 'empty') {
      return;
    }

    var newPointIndex = voronoiCells.points.length;

    //map central node to room id and type so we can reach it later
    var p3 = vec2to3(p);
    p3.roomId = roomId;
    p3.roomType = roomType;
    voronoiCells.points.push(p3);
    voronoiCells.cells[cellIndex].forEach(function(cellPointIndex) {
      voronoiCells.edges.push([cellPointIndex, newPointIndex]);
    })
  })

  //override map

  state.map.selectedNodes = voronoiCells.points.map(function(p, pindex) {
    return {
      id: pindex,
      roomId: p.roomId,
      roomType: p.roomType,
      position: p,
      neighbors: []
    }
  })

  voronoiCells.edges.forEach(function(edge) {
    state.map.selectedNodes[edge[0]].neighbors.push(state.map.selectedNodes[edge[1]])
    state.map.selectedNodes[edge[1]].neighbors.push(state.map.selectedNodes[edge[0]])
  })

  //cell blobs

  var cellGeometry = new Geometry({ vertices: true, colors: true, faces: false });
  var cellVertices = cellGeometry.vertices;
  var cellColors = cellGeometry.colors;

  var cellEdgeGeometry = new Geometry({ vertices: true, colors: true, edges: false });
  var cellEdgeVertices = cellEdgeGeometry.vertices;
  var cellEdgeColors = cellEdgeGeometry.colors;

  var debugNodesVertices = voronoiCells.points;
  var debugNodesColors = debugNodesVertices.map(function(p) {
    return p.roomId ? Color.Red : Color.Black;
  });
  var debugNodesGeometry = new Geometry({ vertices: debugNodesVertices, colors: debugNodesColors });

  //var lineBuilder = new LineBuilder();

  var focusRoomCenter = null;

  if (state.map.focusRoomId) {
    var selectedNodes = state.map.selectedNodes;
    var focusRoomNodes = selectedNodes.filter(R.where({ roomId: state.map.focusRoomId }));
    if (focusRoomNodes.length > 0) {
      focusRoomCenter = focusRoomNodes[0].position;
    }
  }

  voronoiCells.cells.forEach(function(cell, cellIndex) {
    var roomId = cellsRoomIds[cellIndex] || -1;
    var isRoom = roomId != -1;
    var roomType = state.map.roomsById[roomId] ? state.map.roomsById[roomId].type : 'none';

    //skip empty cells
    if (roomType == 'empty') {
      return;
    }

    var cellPoints = cell.map(function(i) { return voronoiCells.points[i] });

    // TODO: Make subdivision length dependentant on map overall complexity
    // On the biggest most complex maps too much subdivision will make total number of vertices exceed limit
    var splinePoints = GeomUtils.smoothCurve(cellPoints, 0.9, 20, true, 0.001);

    var center = GeomUtils.centroid(splinePoints);

    var cellCloseness = roomType != 'none' ? config.cellCloseness / 2 : config.cellCloseness;

    var cell = {
      vertices: [],
      basePos: [],
      center: center
    };

    MapSys.cells.push(cell);

    for(var i=0; i<splinePoints.length; i++) {
      var p = splinePoints[i];
      var np = splinePoints[(i+1)%splinePoints.length];
      var p2 = p.dup().add(center.dup().sub(p).setLength(cellCloseness));
      var np2 = np.dup().add(center.dup().sub(np).setLength(cellCloseness));
      var vidx = cellVertices.length;
      var eidx = cellEdgeVertices.length;

      var cellColor = config.cellColor;
      var cellCenterColor = config.cellCenterColor;
      var cellEdgeColor = config.cellEdgeColor;

      if (isRoom && roomType && roomType != 'none') {
        cellColor = config.roomTypes[roomType].color;
        cellCenterColor = config.roomTypes[roomType].centerColor;
        cellEdgeColor = config.roomTypes[roomType].edgeColor;
      }

      if (roomId == state.map.focusRoomId) {
        cellCenterColor = Color.Red;
        cellColor = Color.Red;
      }

      var c = Color.fromHSL(0, 1, 0.5);
      if (focusRoomCenter) {
        var dist = p.distance(focusRoomCenter);
        if (dist > 0.12) return; //FIXME: hardcoded
        dist = Math.floor(dist * 20)/20;
        c = Color.fromHSL(dist*2, 0.7, 0.5);
        cellColors.push(cellColor);
        cellColors.push(cellColor);
        cellColors.push(cellCenterColor);
      }
      else {
        cellColors.push(cellColor);
        cellColors.push(cellColor);
        cellColors.push(cellCenterColor);
      }

      cellVertices.push(p2);
      cellVertices.push(np2);
      cellVertices.push(center.dup());

      var e2 = p2.dup().add(new Vec3(0, 0, 0.0001));
      var ne2 = np2.dup().add(new Vec3(0, 0, 0.0001));
      cellEdgeVertices.push(e2);
      cellEdgeVertices.push(ne2);
      cellEdgeColors.push(cellEdgeColor);
      cellEdgeColors.push(cellEdgeColor);

      cell.vertices.push(p2);
      cell.vertices.push(np2);
      cell.vertices.push(e2);
      cell.vertices.push(ne2);
      cell.basePos.push(p2.dup());
      cell.basePos.push(np2.dup());
      cell.basePos.push(e2.dup());
      cell.basePos.push(ne2.dup());
    }
  })


  var cellEdgeMesh = new Mesh(cellEdgeGeometry, new ShowColors({pointSize:5}), { lines: true });
  var cellMesh = new Mesh(cellGeometry, new ShowColors(), { faces: true });
  var debugNodesMesh = new Mesh(debugNodesGeometry, new ShowColors({ pointSize: 10 }), { points: true });

  state.entities.unshift({ name: 'cellEdgeMesh', map: true, cell: true, mesh: cellEdgeMesh, lineWidth: config.cellEdgeWidth });
  state.entities.unshift({ name: 'cellMesh', map: true, cell: true, mesh: cellMesh });
  state.entities.unshift({ name: 'nodesDebug', map: true, node: true, debug: true, mesh: debugNodesMesh });

  var edgeMesh = new Mesh(new Geometry({ vertices: voronoiCells.points, edges: voronoiCells.edges}), new SolidColor({ color: config.corridorColor }), { lines: true });
  state.entities.unshift({ map: true, corridor: true, mesh: edgeMesh });

  var pointsMesh = new Mesh(new Geometry({ vertices: voronoiCells.points }), new SolidColor({ color: config.corridorColor, pointSize: 5 }), { points: true });
  state.entities.unshift({ map: true, node: true, mesh: pointsMesh });

  edgeMesh.geometry.baseVertices = edgeMesh.geometry.vertices.map(cloneVert);
  cellMesh.geometry.baseVertices = cellMesh.geometry.vertices.map(cloneVert);
  cellEdgeMesh.geometry.baseVertices = cellEdgeMesh.geometry.vertices.map(cloneVert);

  MapSys.edgeMesh = edgeMesh;
  MapSys.cellMesh = cellMesh;
  MapSys.cellEdgeMesh = cellEdgeMesh;

  var floorBBox = BoundingBox.fromPoints(cellMesh.geometry.vertices);

  centerCamera(state, floorBBox);

  console.log('rebuildMap', 'edgeMesh:', MapSys.edgeMesh.geometry.vertices.length, 'cellMesh:', MapSys.cellMesh.geometry.vertices.length, 'cellEdgeMesh:', MapSys.cellEdgeMesh.geometry.vertices.length)
}

//-----------------------------------------------------------------------------

function update(state) {
  if (!state.map.nodes.length) {
    return;
  }

  if (!MapSys.ready || state.map.dirty) {
    MapSys.ready = true;
    rebuildMap(state);
  }
}

module.exports = update;
