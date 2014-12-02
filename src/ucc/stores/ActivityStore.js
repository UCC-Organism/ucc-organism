var IOUtils = require('../../sys/IOUtils');
var Promise = require('bluebird');
var Config  = require('../../config');
var R       = require('ramda');
var moment  = require('moment');

var weekStart = moment().day(1-7).hours(0).minutes(0).seconds(0).toDate().getTime(); //prev monday
var weekEnd   = moment().day(8-7).hours(0).minutes(0).seconds(0).toDate().getTime(); //next monday

var ActivityStore = {
  all: [],
  locations: [],
  current: [],
  currentGroups: [],
  currentLocations: [],
  currentStudents: [],
  init: function() {
    console.log('ActivityStore.init');
    return IOUtils.loadJSON(Config.dataPath + '/static/activities_bundle.json')
      .then(function(activities) {

        this.all = activities.filter(function(activity) {
          return activity.startTime >= weekStart && activity.endTime <= weekEnd;
        })

        this.all.sort(function(a, b) {
          return a.startTime - b.startTime;
        })


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

        console.log('ActivityStore.init', this.all[0].start, R.last(this.all).end);
        console.log('ActivityStore.init activities:' + this.all.length + ' locations:' + this.locations.length + ' teachers:' + this.teachers.length + ' groups:' + this.groups.length);
        return this;
      }.bind(this));
  },
};

module.exports = ActivityStore;