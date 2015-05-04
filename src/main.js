var Promise           = require('bluebird');
var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');
var gui               = require('pex-gui');
var R                 = require('ramda');
var plask             = require('plask');
var debug             = require('debug').enable('ucc/*')
var log               = require('debug')('ucc/main');

//CES
var meshRendererSys               = require('./ucc/sys/meshRendererSys');
var mapSys                        = require('./ucc/sys/mapSys');
var energySys                     = require('./ucc/sys/energySys');
var energyUpdaterSys              = require('./ucc/sys/energyUpdaterSys');
var energyPointSpriteUpdaterSys   = require('./ucc/sys/energyPointSpriteUpdaterSys');
var agentTargetNodeUpdaterSys     = require('./ucc/sys/agentTargetNodeUpdaterSys');
var agentTargetNodeFollowerSys    = require('./ucc/sys/agentTargetNodeFollowerSys');
var agentFlockingSys              = require('./ucc/sys/agentFlockingSys');
var agentPositionUpdaterSys       = require('./ucc/sys/agentPositionUpdaterSys');
var agentSpawnSys                 = require('./ucc/sys/agentSpawnSys');
var agentKillSys                  = require('./ucc/sys/agentKillSys');
var agentPointSpriteUpdaterSys    = require('./ucc/sys/agentPointSpriteUpdaterSys');
var agentDebugInfoUpdaterSys      = require('./ucc/sys/agentDebugInfoUpdaterSys');
var displacePointUpdaterSys       = require('./ucc/sys/displacePointUpdaterSys');
var roomInfoUpdaterSys            = require('./ucc/sys/roomInfoUpdaterSys');
var flufSys                       = require('./ucc/sys/flufSys');
var GUIControlExt                 = require('./gui/GUIControlExt');

//Stores
var MapStore          = require('./ucc/stores/MapStore');
var AgentStore        = require('./ucc/stores/AgentStore')

//Config
var Config            = require('./config');
var AgentModes        = require('./ucc/agents/agentModes');

//Data
var Client            = require('./ucc/data/Client');
var FakeClient        = require('./ucc/data/FakeClient');

var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;
var GUI               = gui.GUI;
var DebugText         = require('./typo/DebugText');

var Vec3              = require('pex-geom').Vec3;

var VK_LEFT  = Platform.isPlask ? 123 : 37;
var VK_RIGHT = Platform.isPlask ? 124 : 39;

var state = {
  client_id: 'Unknown',
  new_client_id: 'Unknown',
  api_server: '',
  api_server_ip: '',
  DPI: 1,//Platform.isBrowser ? 1 : plask.Window.screensInfo()[0].highdpi,

  //data
  liveData: false,

  //scene
  initFloor: Config.floorId.C_2,
  guiCurrentFloor: Config.floorId.C_2,
  camera: null,
  cameraDistance: 0.4,
  cameraDistanceOverride: 0,
  cameraRotation: 0,
  cameraRotationOverride: 0,
  cameraTilt: 0,
  cameraTiltOverride: 0,
  cameraTiltOverride: 0,
  arcball: null,
  zoom: 1,

  //entities
  entities: [],

  //stores
  map: null,

  //map config
  minNodeDistance: 0.001,
  maxAgentCount: Platform.isPlask ? 500 : 200,

  //state
  currentTime: 0,
  timeSpeed: Platform.isPlask ? 1 : 0.75,
  agentSpeed: Platform.isPlask ? 0.02 : 0.02,
  showCells: true,
  showAgents: true,
  showEnergy: true,
  debug: false,
  showNodes: false,
  showCorridors: false,
  showLabels: false,
  showAgentTargets: false,
  sway: 0,

  //debug
  debugText: null
};

try {
  var sys_conf = uccextension.read_system_configSync();
  var json = JSON.parse(sys_conf);
  log("client_id: " + json.client_id);
  log("api_server: " + json.api_server);
  log("api_server_port: " + json.api_server_port);
  state.new_client_id = json.client_id;
  state.api_server = json.api_server;
  state.api_server_port = json.api_server_port;
}
catch(e) {
  log('uccextension not available');
  state.new_client_id = 0;
}

var GUI_OFFSET = 0;

sys.Window.create({
  settings: {
    width: 1400 * state.DPI,
    height: 900 * state.DPI,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: state.DPI,
    borderless: true,
  },
  init: function() {
    this.initGUI();
    log('MAX_VERTEX_UNIFORM_VECTORS ' + this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
    log('MAX_VERTEX_ATTRIBS ' + this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS));
  },
  initAll: function() {
    Object.keys(Config.agentTypes).forEach(function(agentType) {
      console.log(agentType.substr(0,3), Config.agentTypes[agentType].colors[0].getHex(), Config.agentTypes[agentType].colors[1].getHex());
    })
    this.initDataClient();
    this.initLibs();
    this.initScene();
    this.initStores();
    this.initKeys();
  },
  initGUI: function() {
    //Time.verbose = true;

    this.gui = new GUI(this);
    this.gui.setEnabled(false);
    this.gui.addHeader('Client ID');
    this.clientIdLabel = this.gui.addLabel(state.client_id);
    this.gui.addHeader('Options');
    this.gui.addHeader('Map');

    this.gui.addRadioList('Example Screens', state, 'new_client_id', Config.screens.map(function(screen) {
      var name = screen.showFloor || screen.showRoom;
      return { name: screen.client_id + ' "' + name + '"', value: screen.client_id };
    }));

    this.gui.addHeader('Data');
    this.gui.addRadioList('Source', state, 'liveData', [
      { name: 'Generated', value: 0 },
      { name: 'Live', value: 1 }
    ], function(liveData) {
      this.killAllAgents();
    }.bind(this));

    this.gui.addHeader('Debug');
    this.gui.addParam('debug', state, 'debug');
    this.gui.addParam('showCells', state, 'showCells');
    this.gui.addParam('showCorridors', state, 'showCorridors');
    this.gui.addParam('showNodes', state, 'showNodes');
    this.gui.addParam('showAgents', state, 'showAgents');
    this.gui.addParam('showEnergy', state, 'showEnergy');
    this.gui.addParam('showLabels', state, 'showLabels');
    this.gui.addParam('showAgentTargets', state, 'showAgentTargets');
    this.gui.addHeader('Debug modes');
    this.gui.addButton('Night colors', this, 'setNightMode');

    this.gui.addHeader('Camera').setPosition(180 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Camera Distance', state, 'cameraDistanceOverride', { min: 0, max: 2 });
    this.gui.addParam('Camera Rotation', state, 'cameraRotationOverride', { min: 0, max: 360 });
    this.gui.addParam('Camera Tilt', state, 'cameraTiltOverride', { min: -Config.cameraMaxTilt, max: Config.cameraMaxTilt });
    this.gui.addHeader('Agents')
    this.gui.addParam('Repulsion Distance', Config, 'repulsionDistance', { min: 0, max: 0.1 });
    this.gui.addParam('Interaction Distance', Config, 'interactionDistance', { min: 0, max: 0.1 });

    this.gui.addHeader('Global Colors');
    this.gui.addParam('Cell Edge Width',  Config, 'cellEdgeWidth', { min: 0.5, max: 5 });
    this.gui.addParam('BgColor',          Config, 'bgColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Membrane color',   Config, 'membraneColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Agent line',       Config, 'agentLineColor');
    this.gui.addParam('Agent fill',       Config, 'agentFillColor');
    this.gui.addParam('Corridor',         Config, 'corridorColor');
    this.gui.addParam('Cell',             Config.roomTypes.cell, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Cell Center',      Config.roomTypes.cell, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Cell Edge',        Config.roomTypes.cell, 'edgeColor', {}, this.onColorChange.bind(this));

    this.gui.addHeader('Room colors').setPosition(350 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Classroom',        Config.roomTypes.classroom, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Classroom Center', Config.roomTypes.classroom, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Classroom Edge',   Config.roomTypes.classroom, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Food',             Config.roomTypes.food, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Food Center',      Config.roomTypes.food, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Food Edge',        Config.roomTypes.food, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Research',         Config.roomTypes.research, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Research Center',  Config.roomTypes.research, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Research Edge',    Config.roomTypes.research, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Knowledge',        Config.roomTypes.knowledge, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Knowledge Center', Config.roomTypes.knowledge, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Knowledge Edge',   Config.roomTypes.knowledge, 'edgeColor', {}, this.onColorChange.bind(this));

    this.gui.addHeader('Other room colors').setPosition(520 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Admin',            Config.roomTypes.admin, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Admin Center',     Config.roomTypes.admin, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Admin Edge',       Config.roomTypes.admin, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Toilet',           Config.roomTypes.toilet, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Toilet Center',    Config.roomTypes.toilet, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Toilet Edge',      Config.roomTypes.toilet, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Closet',           Config.roomTypes.closet, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Closet Center',    Config.roomTypes.closet, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Closet Edge',      Config.roomTypes.closet, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Exit',             Config.roomTypes.exit, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Exit Center',      Config.roomTypes.exit, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Exit Edge',        Config.roomTypes.exit, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addHeader('Agents Color 1').setPosition(690 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    Object.keys(Config.agentTypes).forEach(function(agentType) {
      this.gui.addParam(agentType + ' 0', Config.agentTypes[agentType].colors, '0');
    }.bind(this));
    this.gui.addHeader('Agents Color 2').setPosition(860 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    Object.keys(Config.agentTypes).forEach(function(agentType) {
      this.gui.addParam(agentType + ' 1', Config.agentTypes[agentType].colors, '1');
    }.bind(this));
    this.gui.addHeader('Energies').setPosition(1030 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Social',    Config.energyTypes.social, 'color');
    this.gui.addParam('Knowledge', Config.energyTypes.knowledge, 'color');
    this.gui.addParam('Power',      Config.energyTypes.power, 'color');
    this.gui.addParam('Dirt',      Config.energyTypes.dirt, 'color');
    this.gui.addParam('Social Intensity',    Config.energyTypes.social, 'intensity');
    this.gui.addParam('Knowledge Intensity',    Config.energyTypes.knowledge, 'intensity');
    this.gui.addParam('Power Intensity',    Config.energyTypes.power, 'intensity');
    this.gui.addParam('Dirt Intensity',    Config.energyTypes.dirt, 'intensity');

    /*
    Object.keys(Config.programmeColors).forEach(function(programme, programmeIndex) {
      if (programme != 'default') {
        var label = this.gui.addParam(programme.substr(0, 20) + '', Config.programmeColors[programme], 'primary', { readonly: true });
      }
    }.bind(this));
*/

    //this.gui.addLabel('Rooms').setPosition(180, 10);

    this.initAll();

    state.debugText = new DebugText(this.width, this.height, state.DPI);
  },
  initDataClient: function() {
    this.client = state.client = new Client(Config.serverUrl);
    this.fakeClient = state.fakeClient = new FakeClient(state.timeSpeed, state);
  },
  initLibs: function() {
    Promise.longStackTraces();
    random.seed(0);
  },
  initScene: function() {
    state.camera = new PerspectiveCamera(60, this.width / this.height, 0.01, 10);
    state.arcball = new Arcball(this, state.camera);
    state.arcball.disableZoom();
  },
  initStores: function() {
    Promise.all([
      MapStore.init(),
      AgentStore.init()
    ])
    .spread(function(map, agents) {
      map.setFloor(state.initFloor);

      state.map = map;
      state.agents = agents;

      state.width = this.width;
      state.height = this.height;

    }.bind(this))
    .catch(function(e) {
      log(e.stack)
    })
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      switch(e.str) {
        //case ' ': this.killAllAgents(); break;
        case 'd': state.debug = !state.debug; break;
        case 'g': this.gui.toggleEnabled(); break;
        case 'c': state.showCells = !state.showCells; break;
        case 'p': state.showCorridors = !state.showCorridors; state.showNodes = !state.showNodes; break;
        case 'a': state.showAgents = !state.showAgents; break;
        case 'e': state.showEnergy = !state.showEnergy; break;
        case 'l': state.showLabels = !state.showLabels; break;
        case 't': state.showAgentTargets = !state.showAgentTargets; break;
      }
    }.bind(this));
  },
  killAllAgents: function() {
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);

    agents.forEach(function(agent) {
      agent.state.entity = null;
      state.entities.splice(state.entities.indexOf(agent), 1);
    })
  },
  update: function() {
    if (state.new_client_id != state.client_id && state.map) {
      state.client_id = state.new_client_id;
      Config.screens.forEach(function(screenInfo) {
        if (screenInfo.client_id == state.client_id) {
          if (screenInfo.showFloor) {
            state.map.setFocusRoom(null);
            state.map.setFloor(screenInfo.showFloor);
          }
          if (screenInfo.showRoom) {
            state.map.setFocusRoom(screenInfo.showRoom);
          }
          state.cameraDistance = screenInfo.cameraDistance;
          state.cameraDistanceOverride = screenInfo.cameraDistance;
          this.clientIdLabel.setTitle(state.client_id)
          this.killAllAgents();
        }
      }.bind(this))
    }
    if (this.client) {
      this.client.enabled = state.liveData;
      this.fakeClient.enabled = !state.liveData;
    }

    if (state.camera) {
      state.zoom = 1/state.camera.getTarget().distance(state.camera.getPosition())
    }
  },
  setNightMode: function() {
    Config.nightColors();
    this.onColorChange();
  },
  onColorChange: function() {
    var entitiesWithMesh = R.filter(R.where({ mesh: R.identity }), state.entities);
    entitiesWithMesh.forEach(function(entity) {
      if (entity.mesh.geometry.colors) {
        entity.mesh.geometry.colors.dirty = true;
      }
    });
  },
  updateSystems: function() {
    mapSys(state);
    energySys(state);
    energyUpdaterSys(state);
    agentSpawnSys(state);
    agentTargetNodeUpdaterSys(state);
    agentKillSys(state);
    roomInfoUpdaterSys(state);
    agentDebugInfoUpdaterSys(state);
    agentTargetNodeFollowerSys(state);
    agentPositionUpdaterSys(state);
    agentFlockingSys(state);
    agentPointSpriteUpdaterSys(state);
    energyPointSpriteUpdaterSys(state);

    flufSys(state);

    displacePointUpdaterSys(state);

    meshRendererSys(state);

    this.fakeClient.update(state);

    state.map.dirty = false;
  },
  draw: function() {
    this.update();

    var agents = R.filter(R.where({ agent: true }), state.entities);

    glu.clearColorAndDepth(Config.bgColor);
    glu.enableDepthReadAndWrite(true);

    if (state.map && state.map.selectedNodes) {
      try {
        this.updateSystems();
      }
      catch(e) {
        log(e);
      }
    }

    if (state.showLabels) {
      state.debugText.draw(state.camera);
    }
    else {
      state.debugText.texts = []; //clear!
    }
    this.gui.draw();

    var err = this.gl.getError()
    if (err) {
      //log('GL ERROR ' + err);
      //this.draw = function() {}
    }
  }
});