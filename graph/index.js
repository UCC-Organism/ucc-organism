function Graph(nodes, edges) {
  this.nodes = nodes;
  this.edges = edges;
}

function makeGraph(nodes, edges) {
  return new Graph(nodes, edges);
}


module.exports = makeGraph;