//Breath First Search
//assumes startNode has neighbors property *{ Array of Node }*
function findShortestPath(startNode, endNode) {
  console.time('findShortestPath');
  var stack = [];
  var depthMap = [];

  depthMap[startNode.id] = 0;

  stack.push(startNode);

  while(stack.length > 0) {
    var currNode = stack.shift();
    var currNodeDepth = depthMap[currNode.id];
    if (currNode == endNode) {

      //Found solution
      //Recostruct the path by going backwards towards nodes with smaller depth until we reach depth == 0
      var path = [];
      var backwardsStack = [];
      backwardsStack.push(currNode);
      while(backwardsStack.length > 0) {
        var node = backwardsStack.shift();
        var nodeDepth = depthMap[node.id];
        path.unshift(node);
        for(var i=0; i<node.neighbors.length; i++) {
          var neighbor = node.neighbors[i];
          var neighborDepth = depthMap[neighbor.id];
          if (neighborDepth == nodeDepth - 1) {
            backwardsStack.push(neighbor);
            break;
          }
        }
      }
      return path;
    }

    currNode.neighbors.forEach(function(neighborNode) {
      if (depthMap[neighborNode.id] === undefined) {
        depthMap[neighborNode.id] = currNodeDepth + 1;
        stack.push(neighborNode);
      }
    });
  }
}

function findNearestNode(nodes, p) {
  var best = nodes.reduce(function(best, node, nodeIndex) {
    var dist = node.position.squareDistance(p);
    if (dist < best.distance) {
      best.node = node;
      best.index = nodeIndex;
      best.distance = dist;
    }
    return best;
  }, { index: -1, distance: Infinity, node: null });

  return best.node;
}

function orderNodes(nodes) {
  var sortedNodes = [];

  var currNode = nodes.shift();
  while(currNode) {
    sortedNodes.push(currNode);

    if (nodes.length == 0) break;

    for(var i=0; i<nodes.length; i++) {
      if (currNode.neighbors.indexOf(nodes[i]) != -1) {
        currNode = nodes[i];
        nodes.splice(i, 1);
        break;
      }
    }
  }
  return sortedNodes;
}

module.exports.findShortestPath = findShortestPath;
module.exports.findNearestNode = findNearestNode;
module.exports.orderNodes = orderNodes;