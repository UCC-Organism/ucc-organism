var glu           = require('pex-glu');
var sys           = require('pex-sys');
var Crayon        = require('../../crayons/crayons');
var remap         = require('re-map');
var moment        = require('moment');
var R             = require('ramda');
var Texture2D     = glu.Texture2D;
var ScreenImage   = glu.ScreenImage;
var Context       = glu.Context;
var Platform      = sys.Platform;
var Time          = sys.Time;

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
  var activities = state.activities.all;
  var activtiesStart = activities[0].start;
  var activtiesEnd = activities[activities.length-1].end;
  var activtiesStartTime = activtiesStart.getTime();
  var activtiesEndTime = activtiesEnd.getTime();
  var dpi = this.window.settings.highdpi;

  var activeColor = [255, 0, 0, 255];
  var incactiveColor = [ 150, 0, 0, 255];

  for(var i=0; i<activities.length; i++) {
    var activity = activities[i];

    if (activity.startTime <= state.currentTime && activity.endTime >= state.currentTime) {
      this.crayon.fill(activeColor);
    }
    else {
      this.crayon.fill(incactiveColor);
    }

    var location = activity.locations[0];

    var locationIndex = state.activities.locations.indexOf(location);

    var s = remap(activity.startTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var e = remap(activity.endTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var y = 10 * dpi + locationIndex * 3 * dpi;
    this.crayon.rect(s, y, e - s - 2, 2 * dpi);
  }

  var startDate = moment(activtiesStart).format("MMM Do");
  var endDate = moment(activtiesEnd).format("MMM Do");

  this.crayon.fill([255, 255, 255, 255]).font("Arial", 16 * dpi).text(startDate, 10 * dpi, this.canvas.height - 12 * dpi)
  this.crayon.fill([255, 255, 255, 255]).font("Arial", 16 * dpi).text(endDate, this.canvas.width - 100 * dpi, this.canvas.height - 12 * dpi)
}

ActivityTimeline.prototype.updateTime = function(state) {
  if (state.currentTime == 0) {
    state.currentTime = state.activities.all[0].start.getTime();
  }
  else {
    var start = state.activities.all[0].start.getTime();
    var end = R.last(state.activities.all).end.getTime();
    state.currentTime += Time.delta * 1000 * state.timeSpeed;

    if (state.currentTime > end) {
      state.currentTime = start;
      this.needsFullRedraw = true;
    }
  }

  state.activities.activeLocations = R.uniq(R.flatten(state.activities.all.filter(function(activity) {
    return (activity.startTime <= state.currentTime && activity.endTime >= state.currentTime);
  }).map(R.prop('locations'))));
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