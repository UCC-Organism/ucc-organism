var Promise   = require('bluebird');
var IOUtils   = require('../../sys/IOUtils');
var Config    = require('../../config');
var R         = require('ramda');
var geom      = require('pex-geom');
var sys       = require('pex-sys');
var Vec3      = geom.Vec3;
var Platform  = sys.Platform;
var log       = require('debug')('ucc/mapStore');

var MapStore = {
  nodes: [],
  rooms: [],
  roomsById: {},
  selectedNodes: [],
  focusRoomId: null,//'C.216',
  strongDisplacePoints: [],
  floors: [],
  currentFloor: 7,
  dirty: true,
  init: function() {
    log('init');
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
      }.bind(this));

      log('init nodes:' + this.nodes.length + ' rooms:' + this.rooms.length);

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
  getFloorId: function(floor) {
    var floorId = null;
    Config.floors.forEach(function(floorInfo) {
      if (floorInfo.name == floor) {
        floorId = floorInfo.id;
      }
    })
    return floorId;
  },
  setFloor: function(floor) {
    var floorId;
    if (!isNaN(floor)) {
      floorId = floor;
    }
    else {
      floorId = this.getFloorId(floor);
    }
    this.currentFloor = floorId;
    if (this.currentFloor != -1) {
      this.selectedNodes = this.nodes.filter(function(node) {
        return node.floor == this.currentFloor;
      }.bind(this));
    }
    else {
      this.selectedNodes = this.nodes;
    }
    log('setFloor', this.currentFloor)
    this.dirty = true;
    this.caches = [];
  },
  setFocusRoom: function(roomId) {
    this.focusRoomId = roomId;
    var room = this.roomsById[roomId];
    this.setFloor(room ? room.floor : this.currentFloor);
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
  getRoomById: function(id) {
    if (!id) return null;
    var room = this.roomsById[id];
    if (!room) {
      room = this.roomsById[Config.roomIdMap[id]];
    }
    return room;
  },
  getSelectedNodeByRoomId: function(id) {
    var targetNode = R.find(R.where({ roomId: id }), this.selectedNodes);
    if (!targetNode) {
      var roomId = Config.roomIdMap[id];
      if (roomId) {
        targetNode = R.find(R.where({ roomId: roomId }), this.selectedNodes);
      }
    }
    return targetNode;
  },
  getSelectedNodesByRoomType: function(type) {
    if (!this.caches[type]) {
      this.caches[type] = this.selectedNodes.filter(R.where({roomType:type}));
    }
    return this.caches[type];
  }
}

module.exports = MapStore;
