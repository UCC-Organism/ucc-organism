var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');

var GroupStore = {
  activities: [],
  init: function() {
    return IOUtils.loadJSON(Config.dataPath + '/static/activities_bundle.json')
      .then(function(activities) {
        this.activities = activities;
        return this;
      }.bind(this));
  },
  getActivities: function() {
    return this.activities;
  }
};

module.exports = GroupStore;