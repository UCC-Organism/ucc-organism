var Promise           = require('bluebird');
var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');
var gui               = require('pex-gui');
var R                 = require('ramda');

//CES
var meshRendererSys               = require('./ucc/sys/meshRendererSys');
var mapBuilderSys                 = require('./ucc/sys/mapBuilderSys');
var agentTargetNodeUpdaterSys     = require('./ucc/sys/agentTargetNodeUpdaterSys');
var agentTargetNodeFollowerSys    = require('./ucc/sys/agentTargetNodeFollowerSys');
var agentSpawnSys                 = require('./ucc/sys/agentSpawnSys');
var pointSpriteUpdaterSys         = require('./ucc/sys/pointSpriteUpdaterSys');
var agentDebugInfoUpdaterSys      = require('./ucc/sys/agentDebugInfoUpdaterSys');

//Stores
var MapStore          = require('./ucc/stores/MapStore');
var ActivityStore     = require('./ucc/stores/ActivityStore');
var GroupStore        = require('./ucc/stores/GroupStore');

//UI
var ActivityTimeline  = require('./ucc/ui/ActivityTimeline');

//Config
var config            = require('./config');

var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;
var GUI               = gui.GUI;

var VK_LEFT  = Platform.isPlask ? 123 : 37;
var VK_RIGHT = Platform.isPlask ? 124 : 39;

//var Cube = gen.Cube;
//var Mesh = glu.Mesh;
//var ShowNormals = materials.ShowNormals;
//var SolidColor = materials.SolidColor;
//var ShowColors = materials.ShowColors;
//var Color = color.Color;
//var Platform = sys.Platform;
//var IO = sys.IO;
//var Geometry = geom.Geometry;
//var Vec3 = geom.Vec3;
//var LineBuilder = gen.LineBuilder;
//var BoundingBox = geom.BoundingBox;
//
//
//var ScreenImage = glu.ScreenImage;
//var Texture2D = glu.Texture2D;
//var PointSpriteTextured = require('./materials/PointSpriteTextured')

//
//var notNull = R.identity;

//var Style = {
//  groupColors: {
//    'default': new Color(1,1,1,1),
//    'spl'    : new Color(1,1,1,1),
//    'pmu'    : new Color(1,1,1,1),
//    'fys'    : new Color(1,1,1,1),
//    'nor'    : new Color(1,1,1,1),
//    'PE1'    : new Color(1,1,1,1),
//    'PNE'    : new Color(1,1,1,1)
//  }
//}

var state = {
  DPI: Platform.isPlask ? 1 : 1,
  //scene
  bgColor: new Color(0.1, 0.1, 0.12, 1.0),
  //bgColor: Color.fromHex('#00331B'),
  //bgColor: Color.fromHSV(0.4, 0.85, 0.6),
  //bgColor: Color.Black,
  camera: null,
  cameraPosZ: 0.80,
  arcball: null,

  //entities
  entities: [],

  //stores
  map: null,

  //map config
  minNodeDistance: 0.001,
  maxAgentCount: Platform.isPlask ? 100 : 500,

  //state
  currentTime: 0,
  timeSpeed: Platform.isPlask ? 0 : 60 * 60,//60 * 60 * 5,
  agentSpeed: Platform.isPlask ? 0 : 0.02,
  debug: true,
  clearBg: true,

  //graph: null,
  //nodes: [],
  //selectedNodes: [],
  //floors: [],
  //currentFloor: 6,
  //
  //pointSpriteMeshEntity: null,
  //agentDebugInfoMeshEntity: null,
  //agentSpeed: 0.02,
  //maxNumAgents: 100,
  //debug: false,
  //
};

sys.Window.create({
  settings: {
    width: 1280 * state.DPI,
    height: 720 * state.DPI,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: state.DPI,
  },
  bla: 0,
  init: function() {
    this.initGUI();
    this.initWatchdog();
    this.initLibs();
    this.initScene();
    this.initStores();
    this.initKeys();
  },
  initGUI: function() {
    Time.verbose = true;

    this.gui = new GUI(this);
    this.gui.addLabel('UI');
    this.gui.addParam('Agent speed', state, 'agentSpeed', { min: 0.01, max: 1 });
    this.gui.addParam('Agent count', state, 'maxAgentCount', { min: 1, max: 2500, step: 1 });
    this.gui.addParam('Time speed', state, 'timeSpeed', { min: 0, max: 60 * 60 * 5 });
    this.gui.addParam('Color', state, 'bgColor');

    Object.keys(config.programmeColors).forEach(function(programme) {
      if (programme != 'default') {
        this.gui.addParam(programme.substr(0, 12) + '...', config.programmeColors[programme], 'primary', { readonly: true });
      }
    }.bind(this))

    this.activityTimeline = new ActivityTimeline(this, 180 * state.DPI, 10 * state.DPI, this.width - 190 * state.DPI, 150 * state.DPI);
  },
  initWatchdog: function() {
    if (typeof(uccextension) != 'undefined') {
      window.setInterval(function() {
        uccextension.aliveSync();
      }, 5000);
    }
    console.log('WARN', 'uccextension not found');
  },
  initLibs: function() {
    Promise.longStackTraces();
    random.seed(0);
  },
  initScene: function() {
    state.camera = new PerspectiveCamera(60, this.width / this.height);
    state.arcball = new Arcball(this, state.camera);
  },
  initStores: function() {
    Promise.all([
      MapStore.init(),
      ActivityStore.init(),
      GroupStore.init()
    ])
    .spread(function(map, activities, groups) {
      state.map = map;
      state.activities = activities;
      state.groups = groups;
      this.checkMissingRooms(state);
    }.bind(this))
    .catch(function(e) {
      console.log(e.stack)
    })
  },
  checkMissingRooms: function() {
    var roomsOnTheMap = R.uniq(R.pluck('id', state.map.rooms));
    var activityLocations = state.activities.locations;

    var missingRooms = R.difference(activityLocations, roomsOnTheMap);
    if (missingRooms.length > 0) {
      //console.log('roomsOnTheMap', roomsOnTheMap);
      //console.log('activityLocations', activityLocations);
      var str = missingRooms.map(function(roomId) {
        var roomActivities = state.activities.all.filter(function(activity) {
          return activity.locations.indexOf(roomId) != -1;
        });
        roomActivities = R.uniq(R.pluck('subject', roomActivities));
        return ' - ' +  roomId + ' ' + JSON.stringify(roomActivities);
      }).join('\n');

      str = 'Main.missingRooms ' + missingRooms.length + '\n' + str;
      console.log(str);
    }
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      switch(e.str) {
        //case ' ': this.killAllAgents(); break;
        case 'd': state.debug = !state.debug; break;
        case 'c': state.clearBg = !state.clearBg; break;
        case ' ': this.killAllAgents(); break;
      }
      switch(e.keyCode) {
        case VK_LEFT: state.map.setPrevFloor(); break;
        case VK_RIGHT: state.map.setNextFloor(); break;
      }
    }.bind(this));
  },
  killAllAgents: function() {
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);

    agents.forEach(function(agent) {
      state.entities.splice(state.entities.indexOf(agent), 1);
    })
  },
  //updateUI: function() {
  //  if (Time.frameNumber % 2 == 0) {
  //    var x = remap(state.currentTime, state.activtiesStartTime, state.activtiesEndTime, 0, state.crayon.canvas.width);
  //    state.crayon.fill([255, 255, 255, 255]).rect(x, 0, 2, 5 * DPI);
  //    state.uiTexture.update(state.canvas);
  //  }
  //},
  update: function() {
    var verbose = false;

    //this.updateUI();

    if (state.activities && state.activities.all) {
      state.activities.current = state.activities.all.filter(function(activity) {
        return (activity.startTime <= state.currentTime && activity.endTime >= state.currentTime);
      })

      state.activities.currentLocations =  R.uniq(R.flatten(state.activities.current.map(R.prop('locations'))));
      state.activities.currentGroups =  R.uniq(R.flatten(state.activities.current.map(R.prop('groups'))));
      state.activities.currentStudents =  R.uniq(R.flatten(state.activities.currentGroups.map(function(groupId) {
        var group = state.groups.byId[groupId];
        if (group) {
          return group.students;
        }
        else {
          if (verbose) console.log('Main.update group', groupId, 'is missing');
          return [];
        }
      })));
      if (verbose) console.log('Main.update current',
        'activities:', state.activities.current.length,
        'locations:', state.activities.currentLocations.length,
        'groups:', state.activities.currentGroups.length,
        'students:', state.activities.currentStudents.length
      );
    }
  },
  updateSystems: function() {

  },
  draw: function() {
    this.update();

    if (state.clearBg) glu.clearColorAndDepth(state.bgColor);
    glu.enableDepthReadAndWrite(true);

    if (state.map && state.activities && state.groups && state.map.selectedNodes) {
      agentSpawnSys(state);
      agentTargetNodeUpdaterSys(state);
      agentTargetNodeFollowerSys(state);
      //agentDebugInfoUpdaterSys(state);
      pointSpriteUpdaterSys(state);

      //glu.enableDepthReadAndWrite(false);
      //glu.enableAlphaBlending(true);

      glu.enableAlphaBlending();
      mapBuilderSys(state);
      meshRendererSys(state);
    }

    //glu.enableAlphaBlending();
    //state.ui.draw();

    this.gui.draw();
    this.activityTimeline.draw(state);
  }
});
