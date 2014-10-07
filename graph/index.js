function Graph(nodes, edges) {
  this.nodes = nodes;
  this.edges = edges;
}

Graph.prototype.getNodeVertices = function(nodeFilter) {

}

Graph.prototype.getEdgeVertices = function(nodeFilter) {

}

Graph.prototype.clip = function(bbox) {

}

function makeGraph(nodes, edges) {
  return new Graph(nodes, edges);
}


module.exports = makeGraph;