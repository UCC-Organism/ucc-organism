var R = require('ramda');
var random = require('pex-random');
var graph  = require('../../graph');
var Color = require('pex-color').Color;
var Spline3D = require('pex-geom').Spline3D;
var Vec3 = require('pex-geom').Vec3;
var LineBuilder = require('pex-gen').LineBuilder;
var Mesh = require('pex-glu').Mesh;
var SolidColor = require('pex-materials').SolidColor;
var ShowNormals = require('pex-materials').ShowNormals;
var config            = require('../../config');
var util = require('util');

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

  var specs = [
   /* { from: "C.202c", to: "exit", type: "each", energy: "knowledge", multiplier: 100},*/
    { from: "C.230", to: "classroom", type: "each", energy: "knowledge", multiplier: "agents"},
    //{ from: "C.202c", to: "classroom", type: "random", num: 10, energy: "knowledge", multiplier: 20}
    /*
    { from: "toilet", to: "exit", type: "random", energy: "knowledge", multiplier: 100},
    { from: "C.202c", to: "c.226", type: "random", energy: "knowledge", multiplier: 100},
    { from: "cantine", to: "exit", type: "random", energy: "knowledge", multiplier: 100},
    { from: "classroom", to: "classroom", type: "random", energy: "economic", multiplier: 100},
    { from: "classroom", to: "classroom", type: "random", energy: "economic", multiplier: 100},
    { from: "classroom", to: "classroom", type: "random", energy: "knowledge", multiplier: 100}
    */
  ];

  var selectedNodes = state.map.selectedNodes;
  var roomNodesPrType = {};

  for (var type in config.roomTypes) {
    var nodes = state.map.selectedNodes.filter(R.where({ roomType: type }))
    roomNodesPrType[type] = nodes;
  }

  for (var i = 0; i < specs.length; i++) {
    var spec = specs[i];
    var startCandidates = getRoomNodesForIdOrType(spec.from)
    var endCandidates = getRoomNodesForIdOrType(spec.to);

    if (!startCandidates || !endCandidates || !startCandidates.length || !endCandidates.length) continue;

    if (spec.type != "each") { // randomize element
      startCandidates = shuffleArray(startCandidates);
      endCandidates = shuffleArray(endCandidates);
    }

    var num = spec.num || 1;
    var numAdded = 0;
    for (var j = 0; j < startCandidates.length; j++) {
      for (var k = 0; k < endCandidates.length; k++) {
        var start = startCandidates[j];
        var end = endCandidates[k];
        var energyType = config.energyTypes[spec.energy];
        addPath(start, end, energyType, spec.multiplier);
        numAdded++;
        if (numAdded >= num) break;
      }
      if (numAdded >= num) break;
    }
  }

  function getRoomNodesForIdOrType (idOrType) {
    var room = state.map.roomsById[idOrType];
    var nodes;

    if (room)
    {
      nodes = state.map.selectedNodes.filter(R.where({ roomId: idOrType }))
      if (nodes) return nodes;
    }

    return roomNodesPrType[idOrType];
  }

  function addPath (start, end, energyType, multiplier) {
      if (!start || !end) return;

      multiplier = multiplier || 1;
      //var room = state.map.getRoomById(agent.state.location);

      var path = graph.findShortestPath(start, end);
      if (!path || path.length == 0) return;
      var pathPoints = R.pluck('position')(path);
      var spline = new Spline3D(pathPoints);
      var g = new LineBuilder();
      g.addPath(spline, Color.Red, 0);
      //var mesh = new Mesh(g, new SolidColor({ color: Color.Red }), { lines: true });
      //state.entities.push({ name: 'energyPathMesh', energy: true, debug: false, mesh: mesh, lineWidth: 5 });

      state.entities.push({ energyPath: spline, startRoomId: start.roomId, energy: true, color: energyType.color, multiplier: multiplier});
  }

  function shuffleArray(arr)
  { 
    if (arr.length < 2) return arr;

    var a = arr.slice();
    var newArr = [];
    var num = a.length;

    for (var i = 0; i < num; i++)
    {
      var el = random.element(a);
      a.splice(a.indexOf(el), 1);
      newArr.push(el)
    }

    return newArr;
  }

/*
  var numPaths = 50;
  R.range(0, numPaths).map(function() {

    var start = random.element(selectedNodes);
    var end = random.element(selectedNodes);

    var energyType = config.energyTypes[random.element(Object.keys(config.energyTypes))];

    // add random energy flow from outside cells
    if (state.map.currentFloor == -1 && externalNodes.length > 0) {
      var beginning = null;
      start = beginning = random.element(externalNodes);
      for(var i=0; i<10; i++) {
        end = random.element(beginning.neighbors);
        if (end != start) break;
      }
      start = end;
      for(var i=0; i<10; i++) {
        end = random.element(start.neighbors);
        if (beginning.neighbors.indexOf(end) == -1 && !end.external && end != start) break;
      }
      var energy;
      if (beginning.externalType == 'classroom') energy = 'knowledge';
      if (beginning.externalType == 'food') energy = 'social';
      if (beginning.externalType == 'admin') energy = 'economic';
      energyType = config.energyTypes[energy];
    }

    if (start.external || end.external) return;

    addPath(start, end, energyType);
  })

  if (state.map.currentFloor == -1 && externalNodes.length > 0) {
    R.range(0, 5).map(function() {
      start = random.element(libraryNodes);
      end = random.element(classroomNodes);
      addPath(start, end, config.energyTypes['knowledge']);
    });
    R.range(0, 30).map(function() {
      start = random.element(researchNodes);
      end = random.element(classroomNodes);
      addPath(start, end, config.energyTypes['knowledge']);
    });
  }
  */
}

function update(state) {
  if (!state.map.nodes.length) {
    return;
  }

  if (state.map.dirty) {
    rebuildEnergyPaths(state);
  }
}

module.exports = update;