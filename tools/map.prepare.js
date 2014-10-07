var fs = require('fs');

var inNodesFile = '../data/map/nodes.json';
var outNodesFile = '../data/map/nodes.client.json';

var nodesData = JSON.parse(fs.readFileSync(inNodesFile, 'utf8'));
var nextRoomId = 1;

function logVec3(v) {
  return "{ " + Math.floor(v.x*1000)/1000 + ", " + Math.floor(v.y*1000)/1000 + ", " + Math.floor(v.z*1000)/1000 + " }";
}

var nodes = nodesData.nodes.map(function(node) {
  return {
    floor: node.layerId,
    room: '',
    position: node.position,
    neighbors: []
  }
});

nodesData.connections.forEach(function(edge) {
  if (!nodes[edge[0]]) {
    console.log('Invalid edge', edge);
    return;
  }
  if (!nodes[edge[1]]) {
    console.log('Invalid edge', edge);
    return;
  }
  nodes[edge[0]].neighbors.push(edge[1]);
  nodes[edge[1]].neighbors.push(edge[0]);
});

nodesData.rooms.forEach(function(room) {
  var roomId = room.id

  if (room.id === 'undefined') {
    roomId = 'room_' + nextRoomId++;
    console.log('Room without id, generating new one', roomId);
  }

  room.nodes.forEach(function(nodeIndex) {
    nodes[nodeIndex].room = roomId;
  })
});

//remove free floating nodes

var nodesToRemove = nodes.filter(function(node) {
  if (node.neighbors.length == 0) {
    console.log('Invalid node', 'floor:' + node.floor, 'position:' + logVec3(node.position));
    return true;
  }
  return false;
});

nodesToRemove.forEach(function(nodeToRemove) {
  var removedNodeIndex = nodes.indexOf(nodeToRemove);
  nodes.forEach(function(node) {
    node.neighbors = node.neighbors.map(function(i) {
      if (i > removedNodeIndex) return --i;
      else return i;
    })
  })
  nodes.splice(removedNodeIndex, 1);
})

nodes.forEach(function(node, nodeIndex) {
  node.id = nodeIndex;
})

fs.writeFileSync(outNodesFile, JSON.stringify(nodes), 'utf8');
