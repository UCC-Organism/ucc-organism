var R           = require('ramda');
var random      = require('pex-random');
var graph       = require('../../graph');
var Color       = require('pex-color').Color;
var Spline3D    = require('../../geom/Spline3DOpt');
var Vec3        = require('pex-geom').Vec3;
var LineBuilder = require('pex-gen').LineBuilder;
var Mesh        = require('pex-glu').Mesh;
var SolidColor  = require('pex-materials').SolidColor;
var ShowNormals = require('pex-materials').ShowNormals;
var Config      = require('../../config');
var util        = require('util');
var Time        = require('pex-sys').Time;
var log         = require('debug')('ucc/energySys');
var shuffle     = require('shuffle-array');
var random      = require('pex-random');

function removeEnergyPathsEntities(state) {
  //remove existing map meshes
  state.entities.filter(R.where({ energy: R.identity })).forEach(function(entity) {
    if (entity.mesh) {
      entity.mesh.material.program.dispose();
      entity.mesh.dispose();
    }
    state.entities.splice(state.entities.indexOf(entity), 1);
  });
}

function rebuildEnergyPaths(state) {
  removeEnergyPathsEntities(state);
  random.seed(Date.now());

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

    startCandidates = shuffle(startCandidates);
    endCandidates = shuffle(endCandidates);

    var fromNum = 1;
    var toNum = 1;

    if (spec.fromNum == "all") {
      fromNum = startCandidates.length;
    }
    else {
      fromNum = spec.fromNum;
    }

    if (spec.toNum == "all") {
      toNum = endCandidates.length;
      if (spec.to == spec.from) toNum --;
    }
    else {
      toNum = spec.toNum;
    }

    for (var j = 0; j < fromNum; j++) {
      var start = startCandidates[j];
      var endCand = endCandidates.slice();

      if (spec.to == spec.from){
        endCand.splice(endCand.indexOf(start), 1);
      }

      for (var k = 0; k < toNum; k++) {
        var end = endCandidates[k];
        addPath(start, end, spec, spec.multiplier);
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

  function addPath(start, end, spec, multiplier) {
      if (!start || !end) return;

      var energy = spec.energy;
      var energyType = Config.energyTypes[spec.energy];

      multiplier = multiplier || 1;

      var path = graph.findShortestPath(start, end);
      if (!path || path.length == 0)
      {
        log("no valid path");
        return;
      }
      var pathPoints = R.pluck('position')(path).map(function(v) { return v.dup(); });
      pathPoints.forEach(function(v) {
        v.z += 0.001;
      })
      var spline = new Spline3D(pathPoints);
      state.entities.push({ energyPath: spline, startRoomId: start.roomId, energy: energy, spec: spec, color: energyType.color, multiplier: multiplier, num: 0, seed: Date.now(), random: random.float()});

      var debugPathPoints = R.pluck('position')(path).map(function(v) { return v.dup(); });
      debugPathPoints.forEach(function(v) {
        v.z += 0.005 * (1 + energyType.id);
      })
      var debugSpline = new Spline3D(debugPathPoints);
      var g = new LineBuilder();
      g.addPath(debugSpline, Color.Red, pathPoints.length * 5);
      var mesh = new Mesh(g, new SolidColor({ color: energyType.color }), { lines: true });

      state.entities.push({ name: 'energyPathMesh', energy: true, debug: true, mesh: mesh, lineWidth: 2 });
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
