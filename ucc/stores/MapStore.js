var Promise   = require('bluebird');
var IOUtils   = require('../../sys/IOUtils');
var R         = require('ramda');
var geom      = require('pex-geom');
var sys       = require('pex-sys');
var Vec3      = geom.Vec3;
var Platform  = sys.Platform;

var DATA_PATH = Platform.isPlask ? __dirname + '/../../data' : 'data';

var MapStore = {
  nodes: [],
  rooms: [],
  selectedNodes: [],
  floors: [],
  currentFloor: [],
  dirty: true,
  init: function() {
    return Promise.all([
      IOUtils.loadJSON(DATA_PATH + '/map/layers.json'),
      IOUtils.loadJSON(DATA_PATH + '/map/nodes.client.json')
    ])
    .spread(function(layersData, nodesData) {
      this.nodes = nodesData.nodes;
      this.rooms = nodesData.rooms;

      //Transform json data to real objects
      this.nodes.forEach(function(node) {
        //{x, y, z} to Vec3
        node.position = new Vec3(node.position.x, node.position.y, node.position.z);
        //Neighbor index to node reference
        node.neighbors = R.map(R.rPartial(R.prop, this.nodes), node.neighbors);
      }.bind(this));

      //Find unique floor ids
      this.floors = this.nodes.map(R.prop('floor'));
      this.floors.sort();
      this.floors = this.floors.filter(function(floor, i) {
        return floor != this.floors[i - 1];
      }.bind(this));
      //Add null floor for global map view
      this.floors.unshift('-1');

      //skip first global floor '-1'
      this.currentFloor = this.floors[1];
      this.setCurrentFloor(this.currentFloor);

      return this;
    }.bind(this));
  },
  setCurrentFloor: function(floor) {
    if (this.floorId != -1) {
      this.selectedNodes = this.nodes.filter(function(node) {
        return node.floor == this.currentFloor;
      }.bind(this));
    }
    else {
      this.selectedNodes = this.nodes;
    }
  }
}

module.exports = MapStore;