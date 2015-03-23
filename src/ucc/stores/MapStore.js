var Promise   = require('bluebird');
var IOUtils   = require('../../sys/IOUtils');
var Config    = require('../../config');
var R         = require('ramda');
var geom      = require('pex-geom');
var sys       = require('pex-sys');
var Vec3      = geom.Vec3;
var Platform  = sys.Platform;

var MapStore = {
  nodes: [],
  rooms: [],
  roomsById: {},
  selectedNodes: [],
  focusRoomId: 'C.216',
  floors: [],
  currentFloor: -1,
  dirty: true,
  init: function() {
    console.log('MapStore.init');
    return Promise.all([
      IOUtils.loadJSON(Config.dataPath + '/map/layers.json'),
      IOUtils.loadJSON(Config.dataPath + '/map/nodes.client.json')
    ])
    .spread(function(layersData, nodesData) {
      this.nodes = nodesData.nodes;
      this.rooms = nodesData.rooms;
      this.rooms.forEach(function(room) {
        this.roomsById[room.id] = room;
      }.bind(this))
      this.nodes.forEach(function(node) {
        if (node.room) {
          this.roomsById[node.room].floor = node.floor;
        }
      }.bind(this))

      console.log('MapStore.init nodes:' + this.nodes.length + ' rooms:' + this.rooms.length);

      //Transform json data to real objects
      this.nodes.forEach(function(node) {
        //{x, y, z} to Vec3
        node.position = new Vec3(node.position.x, -node.position.y, node.position.z);
        //Neighbor index to node reference
        node.neighbors = R.map(R.rPartial(R.prop, this.nodes), node.neighbors);
      }.bind(this));

      //this.nodes = this.nodes.filter(function(node) {
      //  return node.floor == 1 || node.floor == 2 || node.floor == 3 || node.floor == 4 || node.floor == 5;
      //})

      //flatten whole map
      this.nodes.forEach(function(node) {
        node.position.z = 0;
        if (node.floor == 1) {
          node.position.y -= 0.5;
        }
        if (node.floor == 3) {
          node.position.x += 0.25;
        }
        if (node.floor == 6) {
          node.position.x += 0.45;
          node.position.y += 0.15;
        }
        if (node.floor == 7) {
          node.position.x -= 0.45;
          node.position.y -= 0.15;
        }
      })

      //Find unique floor ids
      this.floors = this.nodes.map(R.prop('floor'));
      this.floors.sort();
      this.floors = this.floors.filter(function(floor, i) {
        return floor != this.floors[i - 1];
      }.bind(this));
      //Add null floor for global map view
      this.floors.unshift('-1');

      //skip first global floor '-1'
      //this.currentFloor = this.floors[7];
      this.setFloor(this.currentFloor);

      return this;
    }.bind(this));
  },
  setFloor: function(floorId) {
    this.currentFloor = floorId;
    if (this.currentFloor != -1) {
      this.selectedNodes = this.nodes.filter(function(node) {
        return node.floor == this.currentFloor;
      }.bind(this));
    }
    else {
      this.selectedNodes = this.nodes;
    }
    console.log('MapStore.setFloor', this.currentFloor)
    this.dirty = true;
  },
  setFocusRoom: function(roomId) {
    this.focusRoomId = roomId;
    var room = this.roomsById[roomId];
    this.setFloor(room.floor);
  },
  setPrevFloor: function() {
    var floorIndex = this.floors.indexOf(this.currentFloor);
    var prevFloorIndex = (floorIndex - 1 + this.floors.length) % this.floors.length;
    this.setFloor(this.floors[prevFloorIndex]);
  },
  setNextFloor: function() {
    var floorIndex = this.floors.indexOf(this.currentFloor);
    var nextFloorIndex = (floorIndex + 1) % this.floors.length;
    this.setFloor(this.floors[nextFloorIndex]);
  },
}

module.exports = MapStore;