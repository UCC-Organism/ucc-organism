var Promise           = require('bluebird');
var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');
var gui               = require('pex-gui');
var R                 = require('ramda');

//CES
var meshRendererSys               = require('./ucc/sys/meshRendererSys');
var mapSys                        = require('./ucc/sys/mapSys');
var energySys                     = require('./ucc/sys/energySys');
var energyPointSpriteUpdaterSys   = require('./ucc/sys/energyPointSpriteUpdaterSys');
var agentTargetNodeUpdaterSys     = require('./ucc/sys/agentTargetNodeUpdaterSys');
var agentTargetNodeFollowerSys    = require('./ucc/sys/agentTargetNodeFollowerSys');
var agentFlockingSys              = require('./ucc/sys/agentFlockingSys');
var agentPositionUpdaterSys       = require('./ucc/sys/agentPositionUpdaterSys');
var agentSpawnSys                 = require('./ucc/sys/agentSpawnSys');
var agentPointSpriteUpdaterSys    = require('./ucc/sys/agentPointSpriteUpdaterSys');
var agentScheduleUpdaterSys       = require('./ucc/sys/agentScheduleUpdaterSys');
var agentDebugInfoUpdaterSys      = require('./ucc/sys/agentDebugInfoUpdaterSys');
var agentProxyRendererSys         = require('./ucc/sys/agentProxyRendererSys');

//Stores
var MapStore          = require('./ucc/stores/MapStore');
var AgentStore        = require('./ucc/stores/AgentStore')

//Config
var config            = require('./config');
var AgentModes        = require('./ucc/agents/AgentModes');


//Data
var Client            = require('./ucc/data/Client');
var FakeClient        = require('./ucc/data/FakeClient');

var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Texture2D         = glu.Texture2D;
var Color             = color.Color;
var GUI               = gui.GUI;

var VK_LEFT  = Platform.isPlask ? 123 : 37;
var VK_RIGHT = Platform.isPlask ? 124 : 39;

var DPI = Platform.isPlask ? 2 : 2;

var state = {
  DPI: DPI,
  windowWidth: 1600 * DPI,
  windowHeight: 900 * DPI,
  //scene
  initFloor: 7,
  camera: null,
  cameraPosZ: 0.30,
  arcball: null,
  zoom: 1,

  //entities
  entities: [],

  //stores
  map: null,

  //map config
  minNodeDistance: 0.001,
  maxAgentCount: Platform.isPlask ? 500 : 500,

  //state
  currentTime: 0,
  timeSpeed: Platform.isPlask ? 0 : 60 * 60,//60 * 60 * 5,
  agentSpeed: Platform.isPlask ? 0.02 : 0.02,
  debug: false,
  showCells: true,
  showCorridors: true,
  showNodes: true,
  showAgents: true,
  showEnergy: true,
  clearBg: true,
  animateCells: false,

  roomPotential: 0,

  numRandomStudents: 0,

  //ui
  showGUI: true,
  showSchedule: false,

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

  selectedRooms: {}
};

sys.Window.create({
  settings: {
    width: state.windowWidth,
    height: state.windowHeight,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: state.DPI,
    borderless: true,
  },
  bla: 0,
  init: function() {
    this.initGUI();
    this.initDataClient();
    this.initWatchdog();
    this.initLibs();
    this.initScene();
    this.initStores();
    this.initKeys();
    this.initMouse();
  },
  initGUI: function() {
    Time.verbose = true;

    this.gui = new GUI(this);
    this.gui.addHeader('UI');
    this.gui.addParam('Show Schedule', state, 'showSchedule', false);
    this.gui.addParam('Animate cells', state, 'animateCells', false);
    this.gui.addParam('Agent speed', state, 'agentSpeed', { min: 0.01, max: 0.1 });
    this.gui.addParam('Agent count', state, 'maxAgentCount', { min: 1, max: 2500, step: 1 });
    this.gui.addParam('Time speed', state, 'timeSpeed', { min: 0, max: 60 * 60 * 5 });
    this.gui.addHeader('Global Colors');
    this.gui.addParam('Cell Edge Width', config, 'cellEdgeWidth', { min: 0.5, max: 5 });
    this.gui.addParam('BgColor', config, 'bgColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Corridor', config, 'corridorColor');
    this.gui.addParam('Cell', config, 'cellColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Cell Center', config, 'cellCenterColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Cell Edge', config, 'cellEdgeColor', {}, this.onColorChange.bind(this));
    this.gui.addHeader('Room colors').setPosition(180 * state.DPI, 10 * state.DPI);
    this.gui.addParam('Classroom',        config.roomTypes.classroom, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Classroom Center', config.roomTypes.classroom, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Classroom Edge',   config.roomTypes.classroom, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Other room',       config.roomTypes[''], 'color', {}, this.onColorChange.bind(this));
    this.gui.addParam('Other room Center',config.roomTypes[''], 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Other room Edge',  config.roomTypes[''], 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Toilet',           config.roomTypes.toilet, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Toilet Center',    config.roomTypes.toilet, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Toilet Edge',      config.roomTypes.toilet, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Exit',           config.roomTypes.exit, 'color', {}, this.onColorChange.bind(this))
    this.gui.addParam('Exit Center',    config.roomTypes.exit, 'centerColor', {}, this.onColorChange.bind(this));
    this.gui.addParam('Exit Edge',      config.roomTypes.exit, 'edgeColor', {}, this.onColorChange.bind(this));
    this.gui.addHeader('Energy colors').setPosition(350 * state.DPI, 10 * state.DPI);
    this.gui.addParam('Social Energy',    config.energyTypes.social, 'color');
    this.gui.addParam('Knowledge Energy', config.energyTypes.knowledge, 'color');
    this.gui.addParam('Economic Energy',  config.energyTypes.economic, 'color');
    this.gui.addParam('Dirt Energy',      config.energyTypes.dirt, 'color');
    this.gui.addHeader('Programme colors')
    Object.keys(config.programmeColors).forEach(function(programme, programmeIndex) {
      if (programme != 'default') {
        var label = this.gui.addParam(programme.substr(0, 20) + '', config.programmeColors[programme], 'primary', { readonly: true });
      }
    }.bind(this));
    this.gui.addHeader('Agent Proxies');
    state.agentProxyTex = Texture2D.create(1,1);//temp
    state.agentProxyTexPreview = this.gui.addTexture2D('Preview', state.agentProxyTex);

    //this.gui.addLabel('Rooms').setPosition(180, 10);

    this.gui.load(config.settingsFile);
  },
  initDataClient: function() {
    //this.client = state.client = new Client(config.serverUrl);
    this.client = state.client = new FakeClient(config.serverUrl);
  },
  initRoomsGUI: function() {
    this.gui.addHeader('Rooms').setPosition(this.width - 170 * state.DPI, 10 * state.DPI);
    this.gui.addParam('Potential', state, 'roomPotential', { min: -1, max: 1})
    var classrooms = R.filter(R.where({type:'classroom'}), state.map.rooms);
    var roomList = classrooms.map(function(classroom) {
      return { name: classroom.id + ' / ' + classroom.floor, value: classroom.id };
    })
    this.gui.addRadioList('Room', state, 'focusedRoom', roomList, function(roomId) {
      state.map.setFocusRoom(roomId);
    })
  },
  initWatchdog: function() {
    if (typeof(uccextension) != 'undefined') {
      window.setInterval(function() {
        uccextension.aliveSync();
      }, 5000);
      console.log('WARN', 'uccextension not found');
    }
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
      AgentStore.init()
    ])
    .spread(function(map, agents) {
      map.setFloor(state.initFloor);

      state.map = map;
      state.agents = agents;

      state.width = this.width;
      state.height = this.height;

      this.initRoomsGUI();
    }.bind(this))
    .catch(function(e) {
      console.log(e.stack)
    })
  },
  initKeys: function() {
    this.on('keyDown', function(e) {
      switch(e.str) {
        //case ' ': this.killAllAgents(); break;
        case 'd': state.debug = !state.debug; break;
        case 'g': state.showGUI = !state.showGUI; break;
        case 'c': state.showCells = !state.showCells; break;
        case 'p': state.showCorridors = !state.showCorridors; state.showNodes = !state.showNodes; break;
        case 'a': state.showAgents = !state.showAgents; break;
        case 'e': state.showEnergy = !state.showEnergy; break;
        case 'b': state.clearBg = !state.clearBg; break;
        //case ' ': this.killAllAgents(); break;
        case ' ': this.toggleClass(); break;
        case 'S': this.gui.save(config.settingsFile); break;
        case 'L': this.gui.load(config.settingsFile); break;
      }
      switch(e.keyCode) {
        case VK_LEFT: state.map.setPrevFloor(); this.killAllAgents(); break;
        case VK_RIGHT: state.map.setNextFloor(); this.killAllAgents(); break;
      }
    }.bind(this));
  },
  initMouse: function() {
    var gen = require('pex-gen');
    var materials = require('pex-materials');
    var geom = require('pex-geom');

    var mouseMesh = new glu.Mesh(new gen.Cube(0.01), new materials.SolidColor({ color: Color.Red }));
    var mouseMesh2 = new glu.Mesh(new gen.Cube(0.01), new materials.SolidColor({ color: Color.Red }));
    var mouseMesh3 = new glu.Mesh(new gen.Cube(0.01), new materials.SolidColor({ color: Color.Red }));

    var xyPlane = {
      point: new geom.Vec3(0, 0, 0),
      normal: new geom.Vec3(0, 0, 1)
    }

    this.on('mouseMoved', function(e) {
      state.mousePos = {
        x: e.x,
        y: e.y
      }

      var ray = state.camera.getWorldRay(e.x, e.y, this.width, this.height);
      var hit = ray.hitTestPlane(xyPlane.point, xyPlane.normal)[0];
      if (!hit) return;
      mouseMesh.position.copy(hit);

      state.mouseHit = {
        x: hit.x,
        y: hit.y,
        z: hit.z
      };

      var ray2 = state.camera.getWorldRay(this.width - e.x, this.height - e.y, this.width, this.height);
      var hit2 = ray2.hitTestPlane(xyPlane.point, xyPlane.normal)[0];
      mouseMesh2.position.copy(hit2);
      state.mouseHit2 = {
        x: hit2.x,
        y: hit2.y,
        z: hit2.z
      };

      var ray3 = state.camera.getWorldRay(e.y, e.x, this.width, this.height);
      var hit3 = ray3.hitTestPlane(xyPlane.point, xyPlane.normal)[0];
      mouseMesh3.position.copy(hit3);
      state.mouseHit3 = {
        x: hit3.x,
        y: hit3.y,
        z: hit3.z
      };
    }.bind(this));

    state.entities.push({
      type: 'mouse',
      mesh: mouseMesh
    })

    state.entities.push({
      type: 'mouse',
      mesh: mouseMesh2
    })

    state.entities.push({
      type: 'mouse',
      mesh: mouseMesh3
    })
  },
  killAllAgents: function() {
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);

    agents.forEach(function(agent) {
      agent.state.entity = null;
      state.entities.splice(state.entities.indexOf(agent), 1);
    })
  },
  toggleClass: function() {
    console.log('toggleClass');
    var agents = R.filter(R.where({ agent: R.identity }), state.entities);
    agents.forEach(function(agent) {
      agent.targetNodeList.length = 0;
      agent.targetNode = null;
      if (agent.mode == AgentModes.Wander) {
        agent.mode = AgentModes.Classroom;
      }
      else {
        agent.mode = AgentModes.Wander;
      }
    })
  },
  updateFake: function() {
    if (state.animateCells) {
      Object.keys(state.selectedRooms).forEach(function(roomId, roomIndex) {
        random.seed(roomIndex);
        state.selectedRooms[roomId] = 0.75 + 0.5 * Math.cos(Time.seconds + random.float(0, Math.PI * 2));
      })
    }
  },
  update: function() {
    var verbose = false;

    this.updateFake();

    state.zoom = 1/state.camera.getTarget().distance(state.camera.getPosition())
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
  },
  draw: function() {
    this.update();

    var agents = R.filter(R.where({ agent: true }), state.entities);
    //if (agents[0] && agents[0].position) {
    //  state.mouseHit = agents[0].position.dup();
    //  state.mouseHit2 = agents[1].position.dup();
    //  state.mouseHit3 = agents[2].position.dup();
    //}

    if (state.clearBg) glu.clearColorAndDepth(config.bgColor);
    glu.enableDepthReadAndWrite(true);

    if (state.map && state.map.selectedNodes) {
      agentDebugInfoUpdaterSys(state);
      mapSys(state);
      energySys(state);
      agentSpawnSys(state);
      agentTargetNodeUpdaterSys(state);
      agentTargetNodeFollowerSys(state);
      agentPositionUpdaterSys(state);

      //speed up x3
      agentTargetNodeFollowerSys(state);
      agentPositionUpdaterSys(state);
      agentTargetNodeFollowerSys(state);
      agentPositionUpdaterSys(state);
      //end of speedup

      agentFlockingSys(state);
      agentPointSpriteUpdaterSys(state);
      energyPointSpriteUpdaterSys(state);

      glu.enableDepthReadAndWrite(false);
      glu.enableAlphaBlending(true);
      meshRendererSys(state);
      agentProxyRendererSys(state);

      state.agentProxyTexPreview.texture = state.agentProxyTex;

      state.map.dirty = false;
    }

    //glu.enableAlphaBlending();
    //state.ui.draw();

    if (state.showGUI) {
      this.gui.draw();
    }
  }
});
