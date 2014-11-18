var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');
var R       = require('ramda');

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
        console.log('GroupStore.init groups:', groups.length, 'students', totalStudents)

        console.log(R.uniq(R.map(R.prop('programme'), groups)));

        //var sids =  R.flatten(R.map(R.prop('id'), R.flatten(R.map(R.prop('students'), groups))));
        //var usids = R.uniq(sids);
        //console.log('Total students', sids.length, 'unique', usids.length);

        groups.forEach(function(group) {
          this.byId[group.id] = group;

          group.students.forEach(function(student) {
            student.groupId = group.id;
          })
        }.bind(this));
        return this;
      }.bind(this));
  },
};

module.exports = GroupStore;