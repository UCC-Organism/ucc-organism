var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');

var GroupStore = {
  all: [],
  init: function() {
    return IOUtils.loadJSON(Config.dataPath + '/static/groups_bundle.json')
      .then(function(groups) {
        this.all = groups;
        return this;
      }.bind(this));
  },
};

module.exports = GroupStore;