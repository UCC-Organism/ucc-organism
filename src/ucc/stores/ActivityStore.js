var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');
var R       = require('ramda');

var ActivityStore = {
  all: [],
  locations: [],
  init: function() {
    console.log('ActivityStore.init');
    return IOUtils.loadJSON(Config.dataPath + '/static/activities_bundle.json')
      .then(function(activities) {

        this.all = activities;

        this.locations = R.filter(R.identity,
          R.uniq(
            R.flatten(R.map(R.prop('locations'), activities))
          )
        );

        this.teachers = R.filter(R.identity,
          R.uniq(
            R.flatten(R.map(R.prop('teachers'), activities))
          )
        );

        this.groups = R.filter(R.identity,
          R.uniq(
            R.flatten(R.map(R.prop('groups'), activities))
          )
        );

        console.log('ActivityStore.init activities:' + this.all.length + ' locations:' + this.locations.length + ' teachers:' + this.teachers.length + ' groups:' + this.groups.length);
        return this;
      }.bind(this));
  },
};

module.exports = ActivityStore;