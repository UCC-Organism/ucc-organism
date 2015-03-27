var Promise = require('bluebird');
var R = require('ramda');

var AgentStore = {
  all: [],
  init: function() {
    return new Promise(function(resolve, reject) {
      resolve(this);
    }.bind(this))
  },
  getAgentById: function(id) {
    return R.find(R.where({ id: id }), this.all);
  }
};



module.exports = AgentStore;