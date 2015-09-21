var Promise           = require('bluebird');
var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');
var gui               = require('pex-gui');
var R                 = require('ramda');
var plask             = require('plask');
//var debug             = require('debug').enable('ucc/* ucc-data/*')
var debug             = require('debug').enable('ucc/main ucc/flufSys ucc/agentFlockingSys ucc-data/client')
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
var agentBrownianMotionSys        = require('./ucc/sys/agentBrownianMotionSys');
var agentPositionUpdaterSys       = require('./ucc/sys/agentPositionUpdaterSys');
var agentSpawnSys                 = require('./ucc/sys/agentSpawnSys');
var agentKillSys                  = require('./ucc/sys/agentKillSys');
var agentPointSpriteUpdaterSys    = require('./ucc/sys/agentPointSpriteUpdaterSys');
var agentDebugInfoUpdaterSys      = require('./ucc/sys/agentDebugInfoUpdaterSys');
var displacePointUpdaterSys       = require('./ucc/sys/displacePointUpdaterSys');
var roomInfoUpdaterSys            = require('./ucc/sys/roomInfoUpdaterSys');
var flufSys                       = require('./ucc/sys/flufSys');
var trainSys                      = require('./ucc/sys/trainSys');
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
var extend            = require('extend');

var fx                = require('pex-fx');

var VK_LEFT  = Platform.isPlask ? 123 : 37;
var VK_RIGHT = Platform.isPlask ? 124 : 39;

var debug = false;

function timeStart(label) {
  if (debug) console.time(label);
}

function timeEnd(label) {
  if (debug) console.timeEnd(label);
}

var state = {
  client_id: 'Unknown',
  new_client_id: 'Unknown',
  //DPI: Platform.isBrowser ? 1 : plask.Window.screensInfo()[0].highdpi,
  DPI: 1,

  //data
  liveData: false,
  generatedDataMode: null,

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
  log("api_server_url: " + json.api_server_url);
  state.new_client_id = json.client_id;

  Config.serverUrl = json.api_server_url || '';

  if (Config.serverUrl) {
    state.liveData = 1;
  }
}
catch(e) {
  log('uccextension not available');
  state.new_client_id = Platform.isPlask ? '0' : '0';
  state.liveData = 0;

  if (Platform.isPlask) {
    var fs = require('fs');
    var path = require('path');
    var iterationCount = 0;
    var dir = __dirname;
    while(dir != '/' && ++iterationCount < 50) {
      var configFile = path.join(dir,'/','system.conf.json');
      if (fs.existsSync(configFile)) {
        log('reading config from ' + configFile)
        var json = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        state.new_client_id = json.client_id;
        Config.serverUrl = json.api_server_url || '';
        if (Config.serverUrl) {
          state.liveData = 1;
        }
        break;
      }
      else {
        dir = path.resolve(path.join(dir, '/', '..'));
      }
    }
  }
}

var GUI_OFFSET = 0;

sys.Window.create({
  settings: {
    //position: { x: 0, y: 0 },
    width: Platform.isBrowser ? 1400 : plask.Window.screensInfo()[0].width * state.DPI,
    height: Platform.isBrowser ? 900 : plask.Window.screensInfo()[0].height * state.DPI,
    type: '3d',
    fullscreen: debug ? false : (Platform.isBrowser ? true : true),
    highdpi: state.DPI,
    borderless: debug ? false : (Platform.isBrowser ? false : true),
  },
  init: function() {
    this.initGUI();
    log('MAX_VERTEX_UNIFORM_VECTORS ' + this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS));
    log('MAX_VERTEX_ATTRIBS ' + this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS));
  },
  initAll: function() {
    state.DPI = 2;
    this.settings.highdpi = 1;

    this.initDataClient();
    this.initLibs();
    this.initScene();
    this.initStores();
    this.initKeys();
    this.initMouse();
  },
  initGUI: function() {
    //Time.verbose = true;

    this.gui = new GUI(this);
    this.gui.setEnabled(false);
    this.gui.addHeader('Client ID');
    this.clientIdLabel = this.gui.addLabel(state.client_id);
    this.gui.addHeader('API Server');
    this.apiServerLabel = this.gui.addLabel(Config.serverUrl);
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
    this.gui.addParam('printFPS', Time, 'verbose');
    this.gui.addParam('showAgentTargets', state, 'showAgentTargets');
    this.gui.addHeader('Debug modes');
    this.gui.addButton('Night colors', this, 'setNightMode');
    this.gui.addButton('Train', this, 'fireTrain');

    this.gui.addHeader('Camera').setPosition(180 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Camera Distance', state, 'cameraDistanceOverride', { min: 0, max: 2 });
    this.gui.addParam('Camera Rotation', state, 'cameraRotationOverride', { min: 0, max: 360 });
    this.gui.addParam('Camera Tilt', state, 'cameraTiltOverride', { min: -Config.cameraMaxTilt, max: Config.cameraMaxTilt });
    this.gui.addHeader('Agents');
    this.gui.addParam('Agent Speed', Config, 'agentSpeed', { min: 0, max: 0.1 });
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

    this.gui.addHeader('Social blob colors').setPosition(690 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Social blob',            Config.roomTypes.socialBlob, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Social blob Center',     Config.roomTypes.socialBlob, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Social blob Edge',       Config.roomTypes.socialBlob, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Knowledge blob',           Config.roomTypes.knowledgeBlob, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Knowledge blob Center',    Config.roomTypes.knowledgeBlob, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Knowledge blob Edge',      Config.roomTypes.knowledgeBlob, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Power blob',           Config.roomTypes.powerBlob, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Power blob Center',    Config.roomTypes.powerBlob, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Power blob Edge',      Config.roomTypes.powerBlob, 'edgeColor', {}, this.onColorChange.bind(this));

    this.gui.addHeader('Agents Color 1').setPosition(860 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    Object.keys(Config.agentTypes).forEach(function(agentType) {
      this.gui.addParam(agentType + ' 0', Config.agentTypes[agentType].colors, '0');
    }.bind(this));
    this.gui.addHeader('Agents Color 2').setPosition(1030 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    Object.keys(Config.agentTypes).forEach(function(agentType) {
      this.gui.addParam(agentType + ' 1', Config.agentTypes[agentType].colors, '1');
    }.bind(this));
    this.gui.addHeader('Energies').setPosition(1200 * state.DPI, 10 * state.DPI + GUI_OFFSET);
    this.gui.addParam('Social',    Config.energyTypes.social, 'color');
    this.gui.addParam('Social Intensity',    Config.energyTypes.social, 'intensity');
    this.gui.addParam('Social Emmitance',    Config.energyTypes.social, 'emittance');
    this.gui.addParam('Knowledge', Config.energyTypes.knowledge, 'color');
    this.gui.addParam('Knowledge Intensity',    Config.energyTypes.knowledge, 'intensity');
    this.gui.addParam('Knowledge Emmitance',    Config.energyTypes.knowledge, 'emittance');
    this.gui.addParam('Power',      Config.energyTypes.power, 'color');
    this.gui.addParam('Power Intensity',    Config.energyTypes.power, 'intensity');
    this.gui.addParam('Power Emmitance',    Config.energyTypes.power, 'emittance');
    this.gui.addParam('Dirt',      Config.energyTypes.dirt, 'color');
    this.gui.addParam('Dirt Intensity',    Config.energyTypes.dirt, 'intensity');
    this.gui.addParam('Dirt Emmitance',    Config.energyTypes.dirt, 'emittance');

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
        case 'd': state.debug = !state.debug; break;
        case 'g': this.gui.toggleEnabled(); break;
        case 'c': state.showCells = !state.showCells; break;
        case 'p': state.showCorridors = !state.showCorridors; state.showNodes = !state.showNodes; break;
        case 'a': state.showAgents = !state.showAgents; break;
        case 'e': state.showEnergy = !state.showEnergy; break;
        case 'l': state.showLabels = !state.showLabels; break;
        case 'n': state.showNodes = !state.showNodes; break;
        case 'f': Time.verbose = !Time.verbose; break;
        case 't': state.showAgentTargets = !state.showAgentTargets; break;
        case 'w':
          this.killAllAgents();
          state.generatedDataMode = 'showcase';
          break;
      }
    }.bind(this));
  },
  initMouse: function() {
    var lastClick = 0;
    this.on('leftMouseDown', function(e) {
      var now = Date.now();
      if (now - lastClick < 300) this.gui.toggleEnabled();
      lastClick = now;
    }.bind(this))
  },
  killAllAgents: function() {
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);

    agents.forEach(function(agent) {
      agent.state.mode = AgentModes.Dead;
    })
  },
  update: function() {
    if (state.new_client_id != state.client_id && state.map) {
      state.client_id = state.new_client_id;
      this.applyScreenSettings();
    }
    if (this.client) {
      this.client.enabled = state.liveData;
      this.fakeClient.enabled = !state.liveData;
    }
    else {
      if (state.liveData && !this.client && Config.serverUrl) {
        this.client = state.client = new Client(Config.serverUrl);
        log('new client created');
        this.client.checkServerConnection();
        this.checkForNewConfig();
      }
    }

    if (state.newConfig) {
      var newConfig = state.newConfig;
      this.applyConfig(newConfig);
      this.onColorChange();
      state.newConfig = null;
    }

    if (state.camera) {
      state.zoom = 1/state.camera.getTarget().distance(state.camera.getPosition())
    }
  },
  applyScreenSettings: function() {
    Config.screens.forEach(function(screenInfo) {
      if (screenInfo.client_id == state.client_id) {
        var changed = false;
        if (screenInfo.showFloor) {
          var floorId = state.map.getFloorId(screenInfo.showFloor);
          if (state.map.currentFloor != floorId) {
            changed = true;
            state.map.setFocusRoom(null);
            state.map.setFloor(floorId);
          }
        }
        if (screenInfo.showRoom) {
          if (state.map.focusRoomId != screenInfo.showRoom) {
            changed = true;
            state.map.setFocusRoom(screenInfo.showRoom);
          }
        }
        if (changed) {
          this.clientIdLabel.setTitle(state.client_id);
          this.apiServerLabel.setTitle(Config.serverUrl);
          this.killAllAgents();
        }
        state.cameraDistance = screenInfo.cameraDistance;
        state.cameraDistanceOverride = screenInfo.cameraDistance;
      }
    }.bind(this))
  },
  checkForNewConfig: function() {
    log('checkForNewConfig');
    this.client.updateConfig().then(function(newConfig) {
      state.newConfig = newConfig;
      setTimeout(this.checkForNewConfig.bind(this), Config.configCheckTimeout);
    }.bind(this)).catch(function() {
      setTimeout(this.checkForNewConfig.bind(this), Config.configCheckTimeout);
    }.bind(this));
  },
  applyConfig: function(newConfig) {
    log('applyConfig');
    Object.keys(Config).forEach(function(key) {
      var value = newConfig[key];
      if (value && value.length && value[0] == '#') {
        Config[key].copy(Color.fromHex(newConfig[key]));
        delete newConfig[key];
      }
    })

    Object.keys(Config.energyTypes).forEach(function(type) {
      if (newConfig.energyTypes[type].color[0] == '#') {
        Config.energyTypes[type].color.copy(Color.fromHex(newConfig.energyTypes[type].color));
        delete newConfig.energyTypes[type].color;
      }
    })

    Object.keys(Config.agentTypes).forEach(function(agentType) {
      if (newConfig.agentTypes[agentType].colors[0][0] == '#') {
        Config.agentTypes[agentType].colors[0].copy(Color.fromHex(newConfig.agentTypes[agentType].colors[0]));
        Config.agentTypes[agentType].colors[1].copy(Color.fromHex(newConfig.agentTypes[agentType].colors[1]));
        delete newConfig.agentTypes[agentType].colors[0];
        delete newConfig.agentTypes[agentType].colors[1];
      }
    })

    Object.keys(Config.roomTypes).forEach(function(type) {
      var newRoomType = newConfig.roomTypes[type];
      var oldRoomType = Config.roomTypes[type];
      if (!newRoomType) return;
      if (newRoomType.color[0] =='#') oldRoomType.color.copy(Color.fromHex(newRoomType.color));
      if (newRoomType.centerColor[0] =='#') oldRoomType.centerColor.copy(Color.fromHex(newRoomType.centerColor));
      if (newRoomType.edgeColor[0] =='#') oldRoomType.edgeColor.copy(Color.fromHex(newRoomType.edgeColor));
      delete newRoomType.color;
      delete newRoomType.centerColor;
      delete newRoomType.edgeColor;
    });

    //remove show properties to avoid both being present
    Config.screens.forEach(function(screenInfo) {
      delete screenInfo.showRoom;
      delete screenInfo.showFloor;
    })

    extend(true, Config, newConfig);

    this.applyScreenSettings();
  },
  setNightMode: function() {
    Config.nightColors();
    this.onColorChange();
  },
  fireTrain: function() {
    state.trainArrived = true;
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
    if (debug) console.log('---');
    timeStart('updateSystems');
    timeStart('mapSys');                       mapSys(state);                      timeEnd('mapSys');
    timeStart('trainSys');                     trainSys(state);                    timeEnd('trainSys');
    timeStart('agentSpawnSys');                agentSpawnSys(state);               timeEnd('agentSpawnSys');
    timeStart('agentTargetNodeUpdaterSys');    agentTargetNodeUpdaterSys(state);   timeEnd('agentTargetNodeUpdaterSys');
    timeStart('agentKillSys');                 agentKillSys(state);                timeEnd('agentKillSys');
    timeStart('roomInfoUpdaterSys');           roomInfoUpdaterSys(state);          timeEnd('roomInfoUpdaterSys');
    timeStart('agentDebugInfoUpdaterSys');     agentDebugInfoUpdaterSys(state);    timeEnd('agentDebugInfoUpdaterSys');
    timeStart('agentTargetNodeFollowerSys');   agentTargetNodeFollowerSys(state);  timeEnd('agentTargetNodeFollowerSys');
    timeStart('agentBrownianMotionSys');       agentBrownianMotionSys(state);      timeEnd('agentBrownianMotionSys');
    timeStart('agentPositionUpdaterSys');      agentPositionUpdaterSys(state);     timeEnd('agentPositionUpdaterSys');
    timeStart('agentFlockingSys');             agentFlockingSys(state);            timeEnd('agentFlockingSys');
    timeStart('agentPointSpriteUpdaterSys');   agentPointSpriteUpdaterSys(state);  timeEnd('agentPointSpriteUpdaterSys');
    timeStart('energySys');                    energySys(state);                   timeEnd('energySys');
    timeStart('energyUpdaterSys');             energyUpdaterSys(state);            timeEnd('energyUpdaterSys');
    timeStart('energyPointSpriteUpdaterSys');  energyPointSpriteUpdaterSys(state); timeEnd('energyPointSpriteUpdaterSys');
    timeStart('flufSys');                      flufSys(state);                     timeEnd('flufSys');
    timeStart('displacePointUpdaterSys');      displacePointUpdaterSys(state);     timeEnd('displacePointUpdaterSys');

    timeEnd('updateSystems');

    this.fakeClient.update(state);

    state.map.dirty = false;
  },
  render: function() {
    glu.clearColorAndDepth(Config.bgColor);

    timeStart('meshRendersys');
    if (debug) this.gl.finish();
    meshRendererSys(state, debug);
    if (debug) this.gl.finish();
    timeEnd('meshRendersys');
  },
  draw: function() {
    timeStart('frame');
    this.update();

    var agents = R.filter(R.where({ agent: true }), state.entities);

    glu.enableDepthReadAndWrite(true);

    if (state.map && state.map.selectedNodes) {
      try {
        this.updateSystems();
        var color = fx().render({
          drawFunc: this.render.bind(this),
          depth: true,
          width: this.width * state.DPI,
          height: this.height * state.DPI
        });
        color.blit({ width: this.width, height: this.height });
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
    if (debug) this.gl.finish();
    timeEnd('frame');
  }
});

process.on('uncaughtException', function(e) {
  log('ERR' + e);
})
