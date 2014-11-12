var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');
var R       = require('ramda');

var ActivityStore = {
  all: [],
  locations: [],
  activeLocations: [],
  init: function() {
    console.log('ActivityStore.init');
    return IOUtils.loadJSON(Config.dataPath + '/static/activities_bundle.json')
      .then(function(activities) {

        this.all = activities;

        //remap room names to cleaner id's
        activities.forEach(function(activity) {
          activity.locations = activity.locations.map(function(location) {
            if (Config.roomIdMap[location]) return Config.roomIdMap[location];
            else return location;
          })
        })

        //convert time to dates
        this.all.forEach(function(activity) {
          activity.start = new Date(activity.start);
          activity.end = new Date(activity.end);
          activity.startTime = activity.start.getTime();
          activity.endTime = activity.end.getTime();
        })

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