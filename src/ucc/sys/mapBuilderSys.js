var R                 = require('ramda');
var geom              = require('pex-geom');
var glu               = require('pex-glu');
var materials         = require('pex-materials');
var color             = require('pex-color');

var BoundingBoxHelper = require('../../helpers/BoundingBoxHelper');

var Geometry          = geom.Geometry;
var BoundingBox       = geom.BoundingBox;
var Vec3              = geom.Vec3;
var Mesh              = glu.Mesh;
var SolidColor        = materials.SolidColor;
var Color             = color.Color;

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

  //this.rebuildCells();
  //this.rebuildCorridors();
}

module.exports = mapBuilderSys;