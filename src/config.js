var sys       = require('pex-sys');
var color     = require('pex-color');

var Platform  = sys.Platform;
var Color     = color.Color;

var RoomIdMap = {
  //'Afleveres i Wiseflow',
  'Bevægelse B.001' : 'B.001',
  'Teatersal C.024' : 'C.024',
  'VNT A.004' : 'A.004',
  //'Bevægelse 2',
  'Auditorium C.028' : 'C.028',
  'Behandlingsrum C.033' : 'C.033',
  //'Bevægelse 1',
  'Mikrobiologi C.224' : 'C.224',
  'Learning Lab C.216' : 'C.216',
  'NaturVid. Café C.123' : 'C.123',
  'Brikserum C.125' : 'C.125',
  //'Ude af huset',
  'Brikserum C.129' : 'C.129'
};

var AgentTypes = {
  'spl'         : { colors: ["#FF0000", "#FFAA00"], student: true,  programme: 'SPL - Sygeplejerskeuddannelsen' },
  'pmu'         : { colors: ["#FFAA00", "#FFFF00"], student: true,  programme: 'PMU - Psykomotorikuddannelsen' },
  'fys'         : { colors: ["#FF00FF", "#FFAAFF"], student: true,  programme: 'FYS - Fysioterapeutuddannelsen' },
  'soc'         : { colors: ["#00DDFF", "#DAFFFF"], student: true,  programme: 'SOC - Socialrådgiveruddannelsen' },
  'paed'        : { colors: ["#F0F9F5", "#F0F9F5"], student: true,  programme: 'PÆD - Pædagoguddannelsen' },
  'div'         : { colors: ["#FF0000", "#FFAA00"], student: true,  programme: 'DIV - Diverse aktiviteter' },
  'diplomS'     : { colors: ["#FF0000", "#FFAA00"], student: true,  programme: 'Diplom S - Diplomuddannelse - Sundhed' },
  'diplomL'     : { colors: ["#FF0000", "#FFAA00"], student: true,  programme: 'Diplom L - Diplomuddannelse - Ledelse' },
  'teacher'     : { colors: ["#46DA00", "#00FF53"], student: false, programme: 'Teacher' },
  'researcher'  : { colors: ["#32FFFB", "#00C37B"], student: false, programme: 'Researcher' },
  'janitor'     : { colors: ["#7B5647", "#7B5647"], student: false, programme: 'Janitor' },
  'cook'        : { colors: ["#FF0000", "#FFFF00"], student: false, programme: 'Cook' },
  'admin'       : { colors: ["#0000FF", "#00FFFF"], student: false, programme: 'Admin' },
  'unknown'     : { colors: ["#FFFFFF", "#FFFFFF"], student: false, programme: '' },
}

var EnergyTypes = {
  'social':    { id: 0, color: '#FF0069', intensity: 0.5 },
  'knowledge': { id: 1, color: '#20A020', intensity: 0.5 },
  'power':     { id: 3, color: '#FF9900', intensity: 0.5 },
  'dirt':      { id: 4, color: '#904930', intensity: 0.5 }
};

var RoomTypes = {
  ''              : { label: 'Other'     , color: '#999999', centerColor: '#999999', edgeColor: '#999999' },
  'classroom'     : { label: 'Classroom' , color: '#949494', centerColor: '#9C9C9C', edgeColor: '#999999' },
  'toilet'        : { label: 'Toilet'    , color: '#252F35', centerColor: '#110F17', edgeColor: '#85A6AF' },
  'research'      : { label: 'Research'  , color: '#0C6150', centerColor: '#02120D', edgeColor: '#191919' },
  'knowledge'     : { label: 'Knowledge' , color: '#021916', centerColor: '#021916', edgeColor: '#86C74A' },
  'teacher'       : { label: 'Teacher'   , color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
  'admin'         : { label: 'Admin'     , color: '#1A2646', centerColor: '#0A0B12', edgeColor: '#FF9900' },
  'closet'        : { label: 'Closet'    , color: '#313131', centerColor: '#2E1100', edgeColor: '#923B00' },
  'food'          : { label: 'Food'      , color: '#2B2A1B', centerColor: '#050301', edgeColor: '#FF0000' },
  'exit'          : { label: 'Exit'      , color: '#252525', centerColor: '#000000', edgeColor: '#191919' },
  'empty'         : { label: 'Empty'     , color: '#000000', centerColor: '#000000', edgeColor: '#000000' },
  'cell'          : { label: 'Cell'      , color: '#D9D9D9', centerColor: '#D8D8D8', edgeColor: '#FFFFFF' },
  'socialBlob'    : { label: 'SocialBlob', color: '#D9D9D9', centerColor: '#D8D8D8', edgeColor: '#FF0000' },
  'knowledgeBlob' : { label: 'SocialBlob', color: '#D9D9D9', centerColor: '#D8D8D8', edgeColor: '#86C74A' },
  'powerBlob'     : { label: 'SocialBlob', color: '#D9D9D9', centerColor: '#D8D8D8', edgeColor: '#FF9900' }
};

var SocietyBlobs = [
  { center: { x: 1.20, y:-0.70, z:0.2 }, radius: 0.40, numCells: 25, roomType: 'knowledgeBlob' },
  { center: { x: 0.70, y: 0.70, z:0.2 }, radius: 0.24, numCells:  5, roomType: 'knowledgeBlob' },
  { center: { x: 1.20, y: 0.17, z:0.2 }, radius: 0.30, numCells:  9, roomType: 'knowledgeBlob' },
  { center: { x:-1.20, y: 0.25, z:0.0 }, radius: 0.30, numCells: 15, roomType: 'powerBlob'     },
  { center: { x:-1.30, y:-0.50, z:0.0 }, radius: 0.23, numCells: 10, roomType: 'powerBlob'     },
  { center: { x:-0.50, y:-1.40, z:0.0 }, radius: 0.35, numCells: 10, roomType: 'socialBlob'    },
  { center: { x: 0.25, y:-1.30, z:0.0 }, radius: 0.25, numCells:  5, roomType: 'socialBlob'    }
];

var Floors = [
  { name: 'All', id: -1 },
  { name: 'A 0', id:  1 },
  { name: 'A 1', id:  2 },
  { name: 'B 0', id:  3 },
  { name: 'B 1', id:  4 },
  { name: 'C 0', id:  5 },
  { name: 'C 1', id:  6 },
  { name: 'C 2', id:  7 }
];

var FloorId = {
  All: -1,
  A_0:  1,
  A_1:  2,
  B_0:  3,
  B_1:  4,
  C_0:  5,
  C_1:  6,
  C_2:  7
};

var EnergyPaths = [
  //Knowledge (in all views)
  { from: "research", to: "classroom", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents" },
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents" },
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "agents" },
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "agents" },
  { from: "exit", to: "library", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },
  { from: "exit", to: "research", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },

  //Knowledge (additionally in Macro view)
  { from: "research", to: "knowledgeBlob", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents" },
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "intensity" },
  { from: "knowledgeBlob", to: "library", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },
  { from: "knowledgeBlob", to: "research", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },
  { from: "knowledgeBlob", to: "teacher", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity" },

  //Social (in all views)
  { from: "classroom", to: "classroom", fromNum: 'all', toNum: 1, energy: "social", multiplier: "agents" },
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, energy: "social", multiplier: "agents" },
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 10, energy: "social", multiplier: "agents" },
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 10, energy: "social", multiplier: "intensity" },
  { from: "exit", to: "canteen", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity" },
  { from: "exit", to: "cafe", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity" },

  //Social (additionally in Macro view)
  { from: "classroom", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents" },
  { from: "canteen", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents" },
  { from: "cafe", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents" },
  { from: "socialBlob", to: "classrom", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity" },
  { from: "socialBlob", to: "canteen", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity" },
  { from: "socialBlob", to: "cafe", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity" },

  //Power (in all views)
  { from: "admin", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "admin", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "admin", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, energy: "power", multiplier: "agents" },
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, energy: "power", multiplier: "agents" },
  { from: "exit", to: "library", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "exit", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "exit", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },

  //Power (additionally in Macro view)
  { from: "admin", to: "powerBlob", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents" },
  { from: "powerBlob", to: "library", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "powerBlob", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "powerBlob", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },
  { from: "powerBlob", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity" },

  //Brown (in all views)
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "teacher", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "toilet", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "closet", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
  { from: "library", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents" },
];

var AgentInteractions = [
  //Knowledge Energy
  { from: 'teacher', to: 'student', energy: 'knowledge' },
  { from: 'teacher', to: 'teacher', energy: 'knowledge' },
  { from: 'researcher', to: 'teacher', energy: 'knowledge' },
  { from: 'researcher', to: 'researcher', energy: 'knowledge' },

  //Social Energy
  { from: 'student', to: 'student', energy: 'social' },
  { from: 'student', to: 'cook', energy: 'social' },
  { from: 'student', to: 'janitor', energy: 'social' },
  { from: 'cook', to: 'cook', energy: 'social' },
  { from: 'janitor', to: 'janitor', energy: 'social' },

  //Power Energy
  { from: 'admin', to: 'student', energy: 'social' },
  { from: 'admin', to: 'teacher', energy: 'social' },
  { from: 'admin', to: 'researcher', energy: 'social' },
  { from: 'admin', to: 'cook', energy: 'social' },
  { from: 'admin', to: 'janitor', energy: 'social' },
  { from: 'admin', to: 'admin', energy: 'social' }
];

var Screens = [
  { client_id: '0', showFloor: 'C 2', cameraDistance: 0.5 },
  { client_id: '1', showFloor: 'All', cameraDistance: 2.0 },
  { client_id: '2', showFloor: 'A 0', cameraDistance: 0.5 },
  { client_id: '3', showFloor: 'A 1', cameraDistance: 0.5 },
  { client_id: '4', showFloor: 'B 0', cameraDistance: 0.5 },
  { client_id: '5', showFloor: 'B 1', cameraDistance: 0.5 },
  { client_id: '6', showFloor: 'C 0', cameraDistance: 0.5 },
  { client_id: '7', showFloor: 'C 1', cameraDistance: 0.5 },
  { client_id: '8', showFloor: 'C 2', cameraDistance: 0.5 },
  { client_id: '9', showRoom: 'C.230', cameraDistance: 0.15 },
  { client_id: '10', showRoom: 'canteen', cameraDistance: 0.15 },
  { client_id: '11', showRoom: 'library', cameraDistance: 0.15 }
];

var Config = {
  serverUrl: Platform.isPlask ? 'http://localhost:8080' : 'http://localhost:8080',
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  energyTypes: EnergyTypes,
  agentTypes: AgentTypes,
  agentInteractions: AgentInteractions,
  screens: Screens,

  //map
  cellCloseness: 0.00155,
  cellEdgeWidth: 1.75,
  bgColor: '#FFFFFF',
  membraneColor: '#DDDDDD',

  agentLineColor: '#000000',
  agentFillColor: '#FFFFFF',
  agentFillColorBasedOnAccentColor: true,
  agentInvertFillAndLineColorBasedOnGender: true,

  repulsionDistance: 0.01,
  interactionDistance: 0.03,

  roomTypes: RoomTypes,
  societyBlobs: SocietyBlobs,
  floors: Floors,
  energyPaths: EnergyPaths,

  minStudentAge: 18,
  maxStudentAge: 40,

  maxDistortPoints: 10,

  energySpriteSize: 2,
  agentSpriteSize: 10,

  energyPointsMaxPerPath: 50,
  //energyPointsPerPathLength: 30,
  energyAgentCountStrength: 0.1,
  energyIntensityStrength: 5,

  cameraRotationDuration: 60*10, //60s*10 = 10min,
  cameraTiltDuration: 60*10,//60s*10 = 10min
  cameraMaxTilt: 2,

  floorId: FloorId,

  parseColors: parseColors,
  nightColors: nightColors
};

function parseColors() {
  Object.keys(Config).forEach(function(key) {
    var value = Config[key];
    if (value && value.length && value[0] == '#') {
      Config[key] = Color.fromHex(Config[key]);
    }
  })


  Object.keys(Config.energyTypes).forEach(function(type) {
    if (Config.energyTypes[type].color[0] == '#') {
      Config.energyTypes[type].color = Color.fromHex(Config.energyTypes[type].color);
    }
  })

  Object.keys(Config.agentTypes).forEach(function(agentType) {
    if (Config.agentTypes[agentType].colors[0][0] == '#') {
      Config.agentTypes[agentType].colors[0] = Color.fromHex(Config.agentTypes[agentType].colors[0]);
      Config.agentTypes[agentType].colors[1] = Color.fromHex(Config.agentTypes[agentType].colors[1]);
    }
  })

  Object.keys(Config.roomTypes).forEach(function(type) {
    var roomType = Config.roomTypes[type];
    if (roomType.color[0] =='#') roomType.color = Color.fromHex(roomType.color);
    if (roomType.centerColor[0] =='#') roomType.centerColor = Color.fromHex(roomType.centerColor);
    if (roomType.edgeColor[0] =='#') roomType.edgeColor = Color.fromHex(roomType.edgeColor);
  });
}

function darkenColor(color) {
  var hsl = color.getHSL();
  hsl.l *= 0.25;
  color.setHSL(hsl.h, hsl.s, hsl.l);
}

function desaturateColor(color) {
  var hsl = color.getHSL();
  hsl.s *= 0.8;
  color.setHSL(hsl.h, hsl.s, hsl.l);
}

function nightColors() {
  console.log('nightColors');
  var tmp = new Color();

  Object.keys(Config).forEach(function(key) {
    var value = Config[key];
    if (value && value.r) {
      darkenColor(Config[key])
    }
  })

  Object.keys(Config.energyTypes).forEach(function(type) {
    desaturateColor(Config.energyTypes[type].color);
  })

  Object.keys(Config.agentTypes).forEach(function(agentType) {
    desaturateColor(Config.agentTypes[agentType].colors[0]);
    desaturateColor(Config.agentTypes[agentType].colors[1]);
  })

  Object.keys(Config.roomTypes).forEach(function(type) {
    var roomType = Config.roomTypes[type];
    darkenColor(roomType.color);
    darkenColor(roomType.centerColor);
    darkenColor(roomType.edgeColor);
  });
}

Config.parseColors();

module.exports = Config;