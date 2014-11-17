var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');

var GroupStore = {
  all: [],
  byId: {},
  init: function() {
    return IOUtils.loadJSON(Config.dataPath + '/static/groups_bundle.json')
      .then(function(groups) {
        this.all = groups;

        var totalStudents = groups.reduce(function(sum, group) {
          return sum + group.students.length;
        }, 0);
        console.log('GroupStore.init groups:', groups.length, totalStudents)

        groups.forEach(function(group) {
          this.byId[group.id] = group;
        }.bind(this));
        return this;
      }.bind(this));
  },
};

module.exports = GroupStore;