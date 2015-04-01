var glu           = require('pex-glu');
var sys           = require('pex-sys');
var Crayon        = require('../../crayons/crayons');
var remap         = require('re-map');
var moment        = require('moment');
var R             = require('ramda');
var Color         = require('pex-color').Color;
var Texture2D     = glu.Texture2D;
var ScreenImage   = glu.ScreenImage;
var Context       = glu.Context;
var Platform      = sys.Platform;
var Time          = sys.Time;
var config        = require('../../config');

function updateTexture(texture, canvas) {
  var gl = Context.currentContext;
  texture.bind();
  if (Platform.isPlask) {
    gl.texImage2DSkCanvas(texture.target, 0, canvas);
  }
  else if (Platform.isBrowser) {
    gl.texImage2D(texture.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }
}

function ActivityTimeline(window, x, y, width, height) {
  this.needsFullRedraw = true;
  this.window = window;
  this.canvas = Crayon.createCanvas(width, height);
  this.crayon = new Crayon(this.canvas);

  this.texture = Texture2D.create(width, height);
  updateTexture(this.texture, this.canvas);
  this.screenImage = new ScreenImage(this.texture, x, y, width, height, window.width, window.height);
}

ActivityTimeline.prototype.drawActivities = function(state) {
  if (!state.groups) return;

  var activities = state.activities.all;
  var activtiesStart = activities[0].start;
  var activtiesEnd = activities[activities.length-1].end;
  var activtiesStartTime = activtiesStart.getTime();
  var activtiesEndTime = activtiesEnd.getTime();
  var dpi = this.window.settings.highdpi;

  var activeColor = [255, 0, 0, 255];
  var incactiveColor = [ 150, 0, 0, 255];
  var missingGroups = [];
  var missingProgrammes = [];

  for(var i=0; i<activities.length; i++) {
    var activity = activities[i];

    var groupId = activity.groups[0];
    var groupColor = Color.White.clone();

    if (state.groups.byId[groupId]) {
      var group = state.groups.byId[groupId];
      if (config.programmeColors[group.programme]) {
        groupColor = config.programmeColors[group.programme].primary.clone();
      }
      else {
        missingProgrammes.push(group.programme);
        groupColor = Color.White.clone();
      }
    }
    else {
      missingGroups.push(groupId);
    }

    if (activity.startTime <= state.currentTime && activity.endTime >= state.currentTime) {
      groupColor.a = 1;
    }
    else {
      groupColor.a = 0.70;
    }

    this.crayon.fill([Math.floor(255 * groupColor.r), Math.floor(255 * groupColor.g), Math.floor(255 * groupColor.b), Math.floor(255 * groupColor.a)]);

    var location = activity.locations[0];

    var locationIndex = state.activities.locations.indexOf(location);

    var s = remap(activity.startTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var e = remap(activity.endTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var y = 10 * dpi + locationIndex * 3 * dpi;
    this.crayon.rect(s, y, e - s, 2 * dpi);
  }

  var startDate = moment(activtiesStart).format("MMM Do");
  var endDate = moment(activtiesEnd).format("MMM Do");

  this.crayon.fill([255, 255, 255, 255]).font("Arial", 16 * dpi).text(startDate, 10 * dpi, this.canvas.height - 12 * dpi)
  this.crayon.fill([255, 255, 255, 255]).font("Arial", 16 * dpi).text(endDate, this.canvas.width - 100 * dpi, this.canvas.height - 12 * dpi)

  missingGroups = R.uniq(missingGroups);
  missingProgrammes = R.uniq(missingProgrammes);
  if (state.verbose) console.log('missingGroups', missingGroups.length, "[" + missingGroups + "]");
  if (state.verbose) console.log('missingProgrammes', missingProgrammes.length, "[" + missingProgrammes + "]");
}

ActivityTimeline.prototype.updateTime = function(state) {
  if (state.currentTime == 0) {
    state.currentTime = state.activities.all[0].start.getTime();
  }
  else {
    var start = state.activities.all[0].start.getTime();
    var end = R.last(state.activities.all).end.getTime();
    state.currentTime += Time.delta * 1000;

    if (state.currentTime > end) {
      state.currentTime = start;
      this.needsFullRedraw = true;
    }
  }
}

ActivityTimeline.prototype.drawTime = function(state) {
  var dpi = this.window.settings.highdpi;
  var start = state.activities.all[0].start.getTime();
  var end = R.last(state.activities.all).end.getTime();
  var time = state.currentTime;
  var t = (time - start) / (end - start);

  this.crayon.fill([255,255,255,255]).rect(0, this.canvas.height - 5 * dpi, this.canvas.width * t, 5 * dpi);
}

ActivityTimeline.prototype.draw = function(state) {
  if (!state.activities || !state.activities.all.length) {
    return;

  }

  this.updateTime(state);

  if (this.needsFullRedraw) {
    //this.needsFullRedraw = false;
    this.crayon.clear(true);
    this.crayon.fill([0,0,0,50]).rect(0, 0, this.canvas.width, this.canvas.height);
    this.drawActivities(state);
  }

  this.drawTime(state);

  updateTexture(this.texture, this.canvas);

  glu.enableAlphaBlending();
  glu.enableDepthReadAndWrite(false, false);
  this.screenImage.draw();
}

module.exports = ActivityTimeline;