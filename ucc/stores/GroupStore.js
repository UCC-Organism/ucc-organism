var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');

var GroupStore = {
  activities: [],
  init: function() {
    return IOUtils.loadJSON('data/static/activities_bundle.json')
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