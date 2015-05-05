var R                 = require('ramda');
var geom              = require('pex-geom');
var glu               = require('pex-glu');
var materials         = require('pex-materials');
var color             = require('pex-color');
var gen               = require('pex-gen');
var random            = require('pex-random');
var sys               = require('pex-sys');
var gen               = require('pex-gen');

var delaunay          = require('../../geom/delaunay');
var voronoi           = require('../../geom/voronoi');
var graph             = require('../../graph');
var fn                = require('../../utils/fn');
var GeomUtils         = require('../../geom/GeomUtils');
var Rect              = require('../../geom/Rect');

var BoundingBoxHelper = require('../../helpers/BoundingBoxHelper');
var Config            = require('../../config');
var hull              = require('hull.js');

var Platform          = sys.Platform;
var Material          = glu.Material;
var Program           = glu.Program;
var Geometry          = geom.Geometry;
var BoundingBox       = geom.BoundingBox;
var Vec2              = geom.Vec2;
var Vec3              = geom.Vec3;
var Spline3D          = geom.Spline3D;
var Mesh              = glu.Mesh;
var SolidColor        = require('../../materials/SolidColor');
var SolidColorOrig    = materials.SolidColor;
var MapMaterial       = require('../../materials/Map');
var Color             = color.Color;
var LineBuilder       = gen.LineBuilder;
var Time              = sys.Time;
var AddCircleExt      = require('../../geom/LineBuilderAddCircle');
var Plane             = gen.Plane;

var log               = require('debug')('ucc/mapSys');

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
  var mesh = new Mesh(lineBuilder, new SolidColorOrig({ color : color }), { lines: true })
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
  }
  //classrom
  else if (state.map.focusRoomId != null) {
    distance = 0.1;
    var roomNode = state.map.getSelectedNodeByRoomId(state.map.focusRoomId)
    if (roomNode) {
      target = roomNode.position;
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
}

//-----------------------------------------------------------------------------

function updateCamera(state) {
  if (state.map.dirty) {
    state.cameraRotation = Math.PI/2;
  }
  state.cameraRotation += Time.delta/Config.cameraRotationDuration;
  if (state.cameraRotationOverride) {
    state.cameraRotation = state.cameraRotationOverride * Math.PI / 180;
  }
  state.cameraTilt = Config.cameraMaxTilt/10 * Math.cos(2*Math.PI*Time.seconds/Config.cameraTiltDuration);
  if (state.cameraTiltOverride) {
    state.cameraTilt = state.cameraTiltOverride/10;
  }
  if (state.cameraDistanceOverride) {
    state.cameraDistance = state.cameraDistanceOverride;
  }
  state.arcball.setOrientation(new Vec3(0, state.cameraTilt, 1))
  state.arcball.setDistance(state.cameraDistance);
  state.camera.setUp(new Vec3(Math.cos(state.cameraRotation), Math.sin(state.cameraRotation)));
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
  log('rebuildMap');

  removeMapEntities(state);

  var selectedNodes = state.map.selectedNodes;
  var corridorNodes = selectedNodes.filter(R.where({ room: R.not(R.identity) }));
  var entranceNodes = selectedNodes.filter(R.pipe(R.prop('neighbors'), R.prop('length'), R.rPartial(R.eq, 1)));
  var stairsNodes = selectedNodes.filter(function(node) {
    return !node.neighbors.reduce(function(sameFloorSoFar, neighborNode) {
      return sameFloorSoFar && (neighborNode.floor == node.floor);
    }, true)
  });

  state.map.strongDisplacePoints.length = 0;
  var displaceNodes = selectedNodes.filter(R.where({ displacePoint: true }));
  displaceNodes.forEach(function(node) {
    state.map.strongDisplacePoints.push({
      roomId: '',
      timeOffset: random.float(0, 1),
      position: node.position,
      radius: node.displaceRadius * 4,
      strength: node.displaceStrength / 4,
      maxStrength: node.displaceStrength / 4
    })
  })

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
  var mapPointsMesh = new Mesh(mapPointsGeometry, new SolidColorOrig({ pointSize: 5, color: Color.Red }), { points: true });

  var entrancePointsGeometry = new Geometry({ vertices: entrancePointVertices });
  var entrancePointsMesh = new Mesh(entrancePointsGeometry, new SolidColorOrig({ pointSize: 10, color: Color.Yellow }), { points: true });

  var stairsPointsGeometry = new Geometry({ vertices: stairsPointVertices });
  var stairsPointsMesh = new Mesh(stairsPointsGeometry, new SolidColorOrig({ pointSize: 10, color: Color.Orange }), { points: true });

  var corridorEdgesGeometry = new Geometry({ vertices: corridorEdgeVertices });
  var corridorEdgesMesh = new Mesh(corridorEdgesGeometry, new SolidColorOrig({ pointSize: 2, color: Color.DarkGrey }), { lines: true });

  var roomVertexGroups = fn.groupBy(roomVertices, 'room');

  Object.keys(roomVertexGroups).forEach(function(roomId) {
    var roomVertices = roomVertexGroups[roomId];

    var roomEdges = R.flatten(roomVertices.map(function(node) {
      return node.neighbors.filter(R.where({ room: R.identity })).map(function(neighborNode) {
        return [ node.position, neighborNode.position ];
      })
    }));
    var g = new Geometry({ vertices: roomEdges });
    var m = new Mesh(g, new SolidColorOrig({ pointSize: 2, color: Color.fromHSL(0.6, 0.5, 0.5, 0.5) }), { lines: true });
    state.entities.push({ map: true, debug: true, room: roomId, mesh: m, lineWidth: 3, disableDepthTest: true });
  })

  //add new entities
  state.entities.push({ map: true, debug: true, mesh: stairsPointsMesh });
  state.entities.push({ map: true, debug: true, mesh: corridorEdgesMesh, lineWidth: 3, disableDepthTest: true });

  rebuildCells(state);
}

//-----------------------------------------------------------------------------

function buildVoronoiCells(state, points, roomCenterPoints, cellsRoomIds, defaultRoomType) {
  points = roomCenterPoints.concat(points);
  //2d points

  var points2D = points.map(vec3to2);

  log('buildVoronoiCells ' + defaultRoomType)

  //boundary points

  var boundingRect = Rect.fromPoints(points2D);
  var center = boundingRect.getCenter();
  var size = boundingRect.getSize();
  var r = Math.max(size.x, size.y) / 2 * 1.5;

  var numBorderPoints = 30;

  // add extra points around
  for(var i=0; i<numBorderPoints; i++) {
    points2D.push(new Vec2(
      center.x + r * Math.cos(2 * Math.PI * i/30),
      center.y + r * Math.sin(2 * Math.PI * i/30)
    ))
  }

  var voronoiCells = voronoi(points2D);

  voronoiCells.points = voronoiCells.points.map(vec2to3);

  //reject edge cells - cells that are touching the bounding box edge
  var boundingRect = Rect.fromPoints(voronoiCells.points);
  var borderPoints = voronoiCells.points.filter(inRect(boundingRect, EPSILON));

  for(var cellIndex=0; cellIndex<voronoiCells.cells.length; cellIndex++) {
    var isRoom = cellIndex < cellsRoomIds.length;
    var cell = voronoiCells.cells[cellIndex];
    var keep = true;
    for(var i=0; i<cell.length; i++) {
      //outside point
      if (cell[i] > voronoiCells.points.length - numBorderPoints) {
        keep = false;
      }
    }
    if (isRoom) keep = true;
    if (!keep) {
      voronoiCells.cells.splice(cellIndex, 1);
      cellIndex--;
    }
  }

  //if you reject cells you need to rebuild points too
  voronoiCells.edges = voronoiCellsToEdges(voronoiCells.cells);

  voronoiCells.points.splice(voronoiCells.points.length - numBorderPoints, numBorderPoints);

  //add center points
  roomCenterPoints.forEach(function(p, cellIndex) {
    var roomId = cellsRoomIds[cellIndex] || -1;
    var room = state.map.roomsById[roomId];
    var roomType = room ? room.type : (defaultRoomType || 'none');
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

  if (defaultRoomType) {
    voronoiCells.cells.forEach(function(cell) {
      cell.roomType = defaultRoomType;
    })
  }

  voronoiCells.points.forEach(function(p) {
    p.neighbors = 0;
  })

  voronoiCells.edges.forEach(function(edge) {
    voronoiCells.points[edge[0]].neighbors++;
    voronoiCells.points[edge[1]].neighbors++;
  })

  return voronoiCells;
}

//-----------------------------------------------------------------------------

function closestPoint(p, points) {
  var minDist = Infinity;
  var result = null;
  for(var i=0; i<points.length; i++) {
    var distSq = p.squareDistance(points[i]);
    if (distSq <= minDist) {
      minDist = distSq;
      result = points[i];
    }
  }
  return result;
}

//-----------------------------------------------------------------------------

function rebuildCells(state) {
  var selectedNodes = state.map.selectedNodes;
  MapSys.cells.length = 0;

  //all points
  //var points = selectedNodes.map(R.prop('position'));

  var membranes = [];

  //only room points
  var roomNodes = selectedNodes.filter(R.where({ room: R.identity }));
  var roomPoints = R.pluck('position', roomNodes);

  var cellGroups = fn.groupBy(selectedNodes, 'room');
  var cellsRoomIds = Object.keys(cellGroups).filter(R.identity);
  var roomCenterPoints = cellsRoomIds.map(function(roomId) {
    return GeomUtils.centroid(R.pluck('position', cellGroups[roomId]));
  })
  var voronoiCells = buildVoronoiCells(state, roomPoints, roomCenterPoints, cellsRoomIds);

  var floorBBox = BoundingBox.fromPoints(voronoiCells.points);
  var floorBBoxCenter = floorBBox.getCenter();

  membranes.push(voronoiCells.points.filter(function(p) { return p.neighbors == 2 || p.neighbors == 3; }).map(function(p) { return p.dup() }))

  Config.societyBlobs.forEach(function(societyBlob) {
    var numbers = R.range(0, societyBlob.numCells);
    var centerPoints = numbers.map(function() {
      return random.vec3(societyBlob.radius).add(societyBlob.center);
    })
    var numExistingPoints = voronoiCells.points.length;
    var socialCells = buildVoronoiCells(state, [], centerPoints, numbers, societyBlob.roomType);
    membranes.push(socialCells.points.filter(function(p) { return p.neighbors == 2 || p.neighbors == 3; }).map(function(p) { return p.dup() }))

    var p1 = socialCells.points[0];
    var p2 = socialCells.points[3];
    var p3 = socialCells.points[5];
    var cp1 = closestPoint(socialCells.points[0], voronoiCells.points);
    var cp2 = closestPoint(socialCells.points[3], voronoiCells.points);
    var cp3 = closestPoint(socialCells.points[5], voronoiCells.points);
    var cp1i = voronoiCells.points.indexOf(cp1)
    var cp2i = voronoiCells.points.indexOf(cp2)
    var cp3i = voronoiCells.points.indexOf(cp3)

    socialCells.points.forEach(function(p) {
      voronoiCells.points.push(p);
    })
    socialCells.edges.forEach(function(e) {
      e[0] += numExistingPoints;
      e[1] += numExistingPoints;
      voronoiCells.edges.push(e);
    })
    socialCells.cells.forEach(function(cell) {
      for(var i=0; i<cell.length; i++) {
        cell[i] += numExistingPoints;
      }
      voronoiCells.cells.push(cell);
    })

    socialCells.points.forEach(function(p) {
      p.centerDistance = p.distance(floorBBoxCenter);
    })
    socialCells.points.sort(function(a, b) {
      return a.centerDistance - b.centerDistance;
    })

    var e1 = [cp1i, voronoiCells.points.indexOf(p1)];
    var e2 = [cp2i, voronoiCells.points.indexOf(p2)];
    var e3 = [cp2i, voronoiCells.points.indexOf(p3)];
    voronoiCells.edges.push(e1, e2, e3)
  })

  //add displacement point for that room

    //var displaceRadius = voronoiCells.cells[cellIndex].reduce(function(r, cellPointIndex) {
    //  return Math.max(r, p.distance(voronoiCells.points[cellPointIndex]));
    //}, 0)

    //state.map.strongDisplacePoints.push({
    //  roomId: roomId,
    //  timeOffset: random.float(0, 1),
    //  position: p3,
    //  radius: displaceRadius * 3,
    //  strength: displaceRadius,
    //  maxStrength: displaceRadius
    //})

  //override map

  state.map.selectedNodes = voronoiCells.points.map(function(p, pindex) {
    return {
      id: pindex,
      roomId: p.roomId,
      roomType: p.roomType,
      external: p.external ? true : false,
      externalType: p.externalType,
      position: p,
      neighbors: [],
    }
  })

  log('EXTERNAL voronoiCells.points', voronoiCells.points.filter(R.where({ external: true })).length);

  voronoiCells.edges.forEach(function(edge) {
    state.map.selectedNodes[edge[0]].neighbors.push(state.map.selectedNodes[edge[1]])
    state.map.selectedNodes[edge[1]].neighbors.push(state.map.selectedNodes[edge[0]])
  })

  //cell blobs

  var cellGeometry = new Geometry({ vertices: true, colors: true, normals: true, faces: false });
  var cellVertices = cellGeometry.vertices;
  var cellColors = cellGeometry.colors;
  var cellNormals = cellGeometry.normals;

  var cellEdgeGeometry = new Geometry({ vertices: true, colors: true, normals: true, edges: false });
  var cellEdgeVertices = cellEdgeGeometry.vertices;
  var cellEdgeColors = cellEdgeGeometry.colors;
  var cellEdgeNormals = cellEdgeGeometry.normals;

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

  var isWholeOrganism = state.map.currentFloor == -1;
  var adaptive = isWholeOrganism ? false : true;
  var numSteps = isWholeOrganism ? 2 : 0;

  voronoiCells.cells.forEach(function(cell, cellIndex) {
    var roomId = cellsRoomIds[cellIndex] || -1;
    var isRoom = roomId != -1;
    var roomType = state.map.roomsById[roomId] ? state.map.roomsById[roomId].type : 'none';

    if (cell.roomType) {
      isRoom = true;
      roomType = cell.roomType;
    }

    //skip empty cells
    if (roomType == 'empty') {
      return;
    }

    var cellPoints = cell.map(function(i) { return voronoiCells.points[i] });

    var splinePoints = GeomUtils.smoothCurve(cellPoints, 0.9, numSteps, adaptive, 0.001);

    var center = GeomUtils.centroid(splinePoints);

    var cellCloseness = roomType != 'none' ? Config.cellCloseness / 2 : Config.cellCloseness;
    if (isWholeOrganism) cellCloseness *= 2;

    var cell = {
      vertices: [],
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

      var cellColor = Config.roomTypes.cell.color;
      var cellCenterColor = Config.roomTypes.cell.centerColor;
      var cellEdgeColor = Config.roomTypes.cell.edgeColor;

      if (isRoom && roomType && roomType != 'none') {
        if (!Config.roomTypes[roomType]) {
          log('missing room type', roomType, '' + Config.roomTypes[roomType]);
          continue;
        }
        cellColor = Config.roomTypes[roomType].color;
        cellCenterColor = Config.roomTypes[roomType].centerColor;
        cellEdgeColor = Config.roomTypes[roomType].edgeColor;
      }

      if (roomId == state.map.focusRoomId) {
        cellCenterColor = Color.Red;
        cellColor = Color.Red;
      }

      var c = Color.fromHSL(0, 1, 0.5);
      if (focusRoomCenter) {
        var dist = p.distance(focusRoomCenter);
        //if (dist > 0.12) return; //FIXME: hardcoded
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

      cellNormals.push(new Vec3(isRoom ? 1 : 0, 0, 0));
      cellNormals.push(new Vec3(isRoom ? 1 : 0, 0, 0));
      cellNormals.push(new Vec3(isRoom ? 1 : 0, 0, 0));

      var e2 = p2.dup().add(new Vec3(0, 0, 0.0001));
      var ne2 = np2.dup().add(new Vec3(0, 0, 0.0001));
      cellEdgeVertices.push(e2);
      cellEdgeVertices.push(ne2);
      cellEdgeColors.push(cellEdgeColor);
      cellEdgeColors.push(cellEdgeColor);
      cellEdgeNormals.push(new Vec3(isRoom ? 1 : 0, 0, 0));
      cellEdgeNormals.push(new Vec3(isRoom ? 1 : 0, 0, 0));

      cell.vertices.push(p2);
      cell.vertices.push(np2);
      cell.vertices.push(e2);
      cell.vertices.push(ne2);
    }
  })

  var displacePointsCircles = new LineBuilder();
  state.map.strongDisplacePoints.forEach(function(displacePoint) {
    displacePointsCircles.addCircle(displacePoint.position, displacePoint.radius, 16, 'x', 'y');
  });
  var displacePointsCirclesMesh = new Mesh(displacePointsCircles, new SolidColorOrig({ pointSize: 10, color: Color.Red }), { lines: true });
  state.entities.push({ map: true, debug: true, mesh: displacePointsCirclesMesh, lineWidth: 1, disableDepthTest: true });

  var cellMaterial = new MapMaterial({ pointSize: 5});

  membranes.forEach(function(membranePoints) {
    var membraneCenter = GeomUtils.centroid(membranePoints);
    membranePoints = hull(membranePoints, 10, ['.x', '.y']).map(vec2to3);
    membranePoints.forEach(function(p) {
      p.sub(membraneCenter).scale(1.1).add(membraneCenter);
    })

    var membraneGeometry = new LineBuilder();
    membraneGeometry.addPath(new Spline3D(membranePoints, true), Config.membraneColor, membranePoints.length*2)
    membraneGeometry.addAttrib('normals', 'normal', membraneGeometry.vertices.map(function(v) { return new Vec3(1, 0, 0)}))

    var membraneMesh = new Mesh(membraneGeometry, cellMaterial, { lines: true });
    state.entities.push({ name: 'membraneMesh', map: true, cell: true, mesh: membraneMesh, lineWidth: 10 });
  })

  //var membranePoints = R.pluck('position', state.map.selectedNodes.filter(function(node) {
  //  return node.neighbors.length >= 2 && node.neighbors.length <= 3;
  //}));

  //TODO: Temporary dynamic shader
  //var materialsPath = Platform.isPlask ? __dirname + '/../../materials' : 'http://192.168.0.5/var-uccorganism/ucc-organism/src/materials';
  //var cellMaterial = new Material(Program.load(materialsPath + '/Map.glsl', null, { autoreload: true }), { pointSize: 5});

  var cellEdgeMesh = new Mesh(cellEdgeGeometry, cellMaterial, { lines: true });
  var cellMesh = new Mesh(cellGeometry, cellMaterial, { faces: true });
  var debugNodesMesh = new Mesh(debugNodesGeometry, new SolidColorOrig({ color: Color.Red, pointSize: 5 }), { points: true });

  state.entities.unshift({ name: 'cellEdgeMesh', map: true, cell: true, mesh: cellEdgeMesh, lineWidth: Config.cellEdgeWidth });
  state.entities.unshift({ name: 'cellMesh', map: true, cell: true, mesh: cellMesh });
  state.entities.unshift({ name: 'nodesDebug', map: true, node: true, debug: true, mesh: debugNodesMesh });

  var edgeMesh = new Mesh(new Geometry({ vertices: voronoiCells.points, edges: voronoiCells.edges}), new SolidColorOrig({ color: Color.Pink }), { lines: true });
  state.entities.unshift({ map: true, corridor: true, debug: true, mesh: edgeMesh, lineWidth: 2 });

  centerCamera(state, floorBBox);

  var corridorBg = new Plane(floorBBox.getSize().x * 1.4, floorBBox.getSize().y * 1.2, 14, 14, 'x', 'y');
  corridorBg.addAttrib('colors', 'color', corridorBg.vertices.map(function() { return Config.bgColor}));
  corridorBg.addAttrib('normals', 'normal', corridorBg.vertices.map(function() { return new Vec3(1, 0, 0)}));
  corridorBg.addAttrib('texCoords', 'texCoords', corridorBg.vertices.map(function() { return new Vec2(1, 0)}));
  var center = floorBBox.getCenter();
  corridorBg.vertices.forEach(function(v) {
    v.add(center)
  })
  var corridorBgMesh = new Mesh(corridorBg, new MapMaterial(), { faces: true })
  corridorBgMesh.position.z = -0.001;
  state.entities.unshift({ name: 'corridorBgMesh', map: true, cell: true, mesh: corridorBgMesh });

  log('rebuildMap', 'edgeMesh:', edgeMesh.geometry.vertices.length, 'cellMesh:', cellMesh.geometry.vertices.length, 'cellEdgeMesh:', cellEdgeMesh.geometry.vertices.length)
}

//-----------------------------------------------------------------------------

function update(state) {
  if (!state.map.nodes.length) {
    return;
  }

  updateCamera(state);

  if (!MapSys.ready || state.map.dirty) {
    MapSys.ready = true;
    rebuildMap(state);
  }
}

module.exports = update;
