var R                 = require('ramda');
var geom              = require('pex-geom');
var glu               = require('pex-glu');
var materials         = require('pex-materials');
var color             = require('pex-color');
var gen               = require('pex-gen');

var delaunay          = require('../../geom/delaunay');
var voronoi           = require('../../geom/voronoi');
var graph             = require('../../graph');
var fn                = require('../../utils/fn');
var GeomUtils         = require('../../geom/GeomUtils');

var BoundingBoxHelper = require('../../helpers/BoundingBoxHelper');

var Geometry          = geom.Geometry;
var BoundingBox       = geom.BoundingBox;
var Vec2              = geom.Vec2;
var Vec3              = geom.Vec3;
var Mesh              = glu.Mesh;
var SolidColor        = materials.SolidColor;
var ShowColors        = materials.ShowColors;
var Color             = color.Color;
var LineBuilder       = gen.LineBuilder

function mapBuilderSys(state) {
  if (!state.map || !state.map.nodes.length || !state.map.selectedNodes.length || !state.map.dirty) {
    return;
  }

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
  state.entities.filter(R.where({ map: true})).forEach(function(entity) {
    entity.mesh.material.program.dispose();
    entity.mesh.dispose();
    state.entities.splice(state.entities.indexOf(entity), 1);
  });

  //add new entities
  state.entities.push({ map: true, debug: true, mesh: mapPointsMesh });
  state.entities.push({ map: true, debug: true, mesh: entrancePointsMesh });
  state.entities.push({ map: true, debug: true, mesh: starisPointsMesh });
  state.entities.push({ map: true, debug: true, mesh: roomEdgesMesh });
  state.entities.push({ map: true, debug: true, mesh: corridorEdgesMesh });
  state.entities.push({ map: true, debug: true, mesh: floorBBoxHelper });

  //center camera on the new floor
  var target = floorBBox.getCenter();
  var position = new Vec3(state.camera.target.x, state.camera.target.y + state.cameraPosY, state.camera.target.z + 0.01);
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

function pointsToMesh(points) {
  var lineBuilder = new LineBuilder();
  points.forEach(function(p) {
    lineBuilder.addCross(p, 0.005);
  })
  var mesh = new Mesh(lineBuilder, new SolidColor(), { lines: true })
  return mesh;
}

function vec3to2(v) {
  return new Vec2(v.x, v.z);
}

function vec2to3(v) {
  return new Vec3(v.x, 0, v.y);
}

function rebuildCells(state) {
  var selectedNodes = state.map.selectedNodes;

  var points = selectedNodes.map(R.prop('position'));

  //room centers
  var cellGroups = fn.groupBy(selectedNodes, 'room');
  var cellMeshes = Object.keys(cellGroups).filter(R.identity).map(function(roomId) {
    var nodes = cellGroups[roomId];
    var cellPoints = nodes.map(R.prop('position'));
    var center = cellPoints.reduce(function(center, p) {
      return center.add(p);
    }, new Vec3(0, 0, 0)).scale(1/cellPoints.length);
    points.push(center);
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

  selectedNodes.forEach(function(node) {
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
      for(var i=0.5; i<0.6; i += 0.5) {
        points.push(dir.dup().scale(i).add(a));
        //if (Math.random() > 0.9) console.log(a)
      }
    }
  })

  //console.log(connections.length)


  //cells

  var points2D = points.map(vec3to2);

  var cells = voronoi(points2D);
  var cellPoints2 = R.flatten(cells);

  //state.entities.push({ map: true, mesh: pointsToMesh(points) });
  var cellPoints3 = cellPoints2.map(vec2to3).map(function(p) { p.y = points[0].y; return p; })

  var lineBuilder = new LineBuilder();
  cells.forEach(function(cell) {
    cell.forEach(function(edge) {
      var a = vec2to3(edge[0]);
      a.y = points[0].y;
      var b = vec2to3(edge[1]);
      b.y = points[0].y;
      lineBuilder.addLine(a, b);
    })
  })

  var edgeMesh = new Mesh(lineBuilder, new SolidColor({ color: Color.Yellow }), { lines: true });

  state.entities.push({ map: true, mesh: edgeMesh });
  state.entities.push({ map: true, mesh: pointsToMesh(cellPoints3) });
}

function rebuildCellsTri(state) {
  var selectedNodes = state.map.selectedNodes;
  var cellGroups = fn.groupBy(selectedNodes, 'room');
  var cellMeshes = Object.keys(cellGroups).filter(R.identity).map(function(roomId) {
    var nodes = cellGroups[roomId];
    var roomColor1 = Color.Grey;
    var roomColor2 = Color.DarkGrey;

    if (state.activities.locations.indexOf(roomId) != -1) {
      roomColor1 = Color.fromHSV(0.5, 1.0, 0.5);
      roomColor2 = Color.fromHSV(0.7, 1.0, 0.6);
    }

    var cellMaterial = new ShowColors();

    //if (index > 0) return;
    nodes = graph.orderNodes(nodes);
    var points = nodes.map(R.prop('position'));
    var lineBuilder = new LineBuilder();
    //add little turbulence to room corners

    var subDividedEdges = [];
    points.forEach(function(p, i) {
      var np = points[(i + 1) % points.length];
      subDividedEdges.push(p);
      subDividedEdges.push(np.clone().sub(p).scale(0.5).add(p));
    })

    var points2D = subDividedEdges.map(function(p) {
      return new Vec2(p.x, p.z);
      //return new Vec2(Math.random(), Math.random());
    });

    points2D.forEach(function(p) {
      p.x += (Math.random() - 0.5) * 0.01;
      p.y += (Math.random() - 0.5) * 0.01;
    });

    var center = points2D.reduce(function(center, p) {
      return center.add(p);
    }, new Vec2(0, 0)).scale(1/points2D.length);

    points2D.unshift(center);

    var triangles = delaunay(points2D);
    triangles = triangles.map(function(t, i) {
      var a = new Vec3(t[0].x, points[0].y, t[0].y);
      var b = new Vec3(t[1].x, points[0].y, t[1].y);
      var c = new Vec3(t[2].x, points[0].y, t[2].y);
      return [a, b, c];
    });

    var g = new Geometry({ vertices: true, colors: true, faces: true });

    triangles.forEach(function(t) {
      var n = g.vertices.length;
      g.vertices.push(t[0], t[1], t[2]);
      g.colors.push(roomColor1, roomColor1, roomColor2);
      g.faces.push([n, n+1, n+2]);
      //lineBuilder.addLine(t[0], t[1]);
      //lineBuilder.addLine(t[1], t[2]);
      //lineBuilder.addLine(t[2], t[0]);
    });

    //points = points2D.map(function(p) {
    //  return new Vec3(p.x, 0, p.y);
    //});
    //points = GeomUtils.computeBSpline(points);
    //for(var i=0; i<points.length; i++) {
    //  var p = points[i];
    //  var np = points[(i+1)%points.length];
    //  lineBuilder.addLine(p, np);
    //}
    var mesh = new Mesh(g, cellMaterial, { lines: true })
    state.entities.push({ map: true, mesh: mesh });
  })
}

module.exports = mapBuilderSys;