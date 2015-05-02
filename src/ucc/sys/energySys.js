var R           = require('ramda');
var random      = require('pex-random');
var graph       = require('../../graph');
var Color       = require('pex-color').Color;
var Spline3D    = require('pex-geom').Spline3D;
var Vec3        = require('pex-geom').Vec3;
var LineBuilder = require('pex-gen').LineBuilder;
var Mesh        = require('pex-glu').Mesh;
var SolidColor  = require('pex-materials').SolidColor;
var ShowNormals = require('pex-materials').ShowNormals;
var Config      = require('../../config');
var util        = require('util');
var Time        = require('pex-sys').Time;
var log         = require('debug')('ucc/energySys');

function removeEnergyPathsEntities(state) {
  //remove existing map meshes
  state.entities.filter(R.where({ energy: true })).forEach(function(entity) {
    if (entity.mesh) {
      entity.mesh.material.program.dispose();
      entity.mesh.dispose();
    }
    state.entities.splice(state.entities.indexOf(entity), 1);
  });
}

function rebuildEnergyPaths(state) {
  removeEnergyPathsEntities(state);

  var specs = Config.energyPaths;

  var selectedNodes = state.map.selectedNodes;
  var roomNodesPrType = {};

  for (var type in Config.roomTypes) {
    var nodes = state.map.selectedNodes.filter(R.where({ roomType: type }))
    roomNodesPrType[type] = nodes;
  }

  for (var i = 0; i < specs.length; i++) {
    var spec = specs[i];
    var startCandidates = getRoomNodesForIdOrType(spec.from)
    var endCandidates = getRoomNodesForIdOrType(spec.to);

    if (!startCandidates || !endCandidates || !startCandidates.length || !endCandidates.length) continue;

    startCandidates = shuffleArray(startCandidates);
    endCandidates = shuffleArray(endCandidates);

    var fromNum = 1;
    var toNum = 1;

    if (parseFloat(spec.fromNum)) {
      fromNum = parseFloat(spec.fromNum);
    }
    else if (spec.fromNum == "all") {
      fromNum = startCandidates.length;
    }

    if (parseFloat(spec.toNum)) {
      toNum = parseFloat(spec.toNum);
    }
    else if (spec.toNum == "all") {
      toNum = endCandidates.length;
      if (spec.to == spec.from) toNum --;
    }

    for (var j = 0; j < fromNum; j++) {
      var start = startCandidates[j];
      var endCand = endCandidates.slice();

      if (spec.to == spec.from){
        endCand.splice(endCand.indexOf(start), 1);
      }

      for (var k = 0; k < toNum; k++) {
        var end = endCandidates[k];
        var energyType = Config.energyTypes[spec.energy];
        addPath(start, end, energyType, spec.multiplier);
      }
    }
  }

  function getRoomNodesForIdOrType(idOrType) {
    var room = state.map.roomsById[idOrType];
    var nodes;

    if (room) {
      nodes = state.map.selectedNodes.filter(R.where({ roomId: idOrType }))
      if (nodes) return nodes;
    }

    return roomNodesPrType[idOrType];
  }

  function addPath(start, end, energyType, multiplier) {
      if (!start || !end) return;

      multiplier = multiplier || 1;

      var path = graph.findShortestPath(start, end);
      if (!path || path.length == 0)
      {
        log("no valid path");
        return;
      }
      var pathPoints = R.pluck('position')(path).map(function(v) { return v.dup(); });
      pathPoints.forEach(function(v) {
        v.z += 0.005 * (1 + energyType.id);
      })
      var spline = new Spline3D(pathPoints);
      var g = new LineBuilder();

      g.addPath(spline, Color.Red, pathPoints.length * 5);
      var mesh = new Mesh(g, new SolidColor({ color: energyType.color }), { lines: true });
      state.entities.push({ name: 'energyPathMesh', energy: true, debug: true, mesh: mesh, lineWidth: 5 });

      state.entities.push({ energyPath: spline, startRoomId: start.roomId, energy: true, color: energyType.color, multiplier: multiplier, num: 0});
  }

  function shuffleArray(arr) {
    if (arr.length < 2) return arr;

    var a = arr.slice();
    var newArr = [];
    var num = a.length;

    for (var i = 0; i < num; i++) {
      random.seed(Time.seconds);
      var el = random.element(a);
      a.splice(a.indexOf(el), 1);
      newArr.push(el)
    }

    return newArr;
  }
}

function energySys(state) {
  if (!state.map.nodes.length) {
    return;
  }

  if (state.map.dirty) {
    rebuildEnergyPaths(state);
  }
}

module.exports = energySys;