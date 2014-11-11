var glu           = require('pex-glu');
var sys           = require('pex-sys');
var Crayon        = require('../../crayons/crayons');
var remap         = require('re-map');
var Texture2D     = glu.Texture2D;
var ScreenImage   = glu.ScreenImage;
var Context       = glu.Context;
var Platform      = sys.Platform;

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
  this.dirty = true;
  this.window = window;
  this.canvas = Crayon.createCanvas(width, height);
  this.crayon = new Crayon(this.canvas);

  this.texture = Texture2D.create(width, height);
  updateTexture(this.texture, this.canvas);
  this.screenImage = new ScreenImage(this.texture, x, y, width, height, window.width, window.height);
}

ActivityTimeline.prototype.drawActivities = function(state) {
  var activities = state.activities.all;
  var activtiesStart = new Date(activities[0].start);
  var activtiesEnd = new Date(activities[activities.length-1].end);
  var activtiesStartTime = activtiesStart.getTime();
  var activtiesEndTime = activtiesEnd.getTime();
  var dpi = this.window.settings.highdpi;

  this.crayon.fill([255, 0, 0, 255]);
  for(var i=0; i<activities.length; i++) {
    var activity = activities[i];
    activity.startTime = new Date(activities[i].start).getTime();
    activity.endTime = new Date(activities[i].end).getTime();
    var location = activity.locations[0];

    var locationIndex = state.activities.locations.indexOf(location);

    var s = remap(activity.startTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var e = remap(activity.endTime, activtiesStartTime, activtiesEndTime, 0, this.canvas.width);
    var y = 10 * dpi + locationIndex * 3 * dpi;
    this.crayon.rect(s, y, e - s - 2, 2 * dpi);
  }
}

ActivityTimeline.prototype.draw = function(state) {
  if (state.activities && state.activities.all.length > 0 && this.dirty) {
    this.dirty = false;

    this.crayon.fill([0,0,0,50]).rect(0, 0, this.canvas.width, this.canvas.height);
    this.drawActivities(state);

    updateTexture(this.texture, this.canvas);
  }

  glu.enableAlphaBlending();
  this.screenImage.draw();
}

module.exports = ActivityTimeline;