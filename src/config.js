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
  'Brikserum C.129' : 'C.129',
  'canteen': 'KantineS', //TODO: Fix 'KantineS'
  'Kantine': 'KantineS'  //TODO: Fix 'KantineS'
};

var AgentTypeColors = [
  ["#FF0000", "#FFFF00"],//'SPL - Sygeplejerskeuddannelsen',
  ["#FF0000", "#FFFF00"],//'PMU - Psykomotorikuddannelsen',
  ["#FF0000", "#FFFF00"],//'FYS - Fysioterapeutuddannelsen',
  ["#FF0000", "#FFFF00"],//'SOC - Socialrådgiveruddannelsen',
  ["#FF0000", "#FFFF00"],//'PÆD - Pædagoguddannelsen',
  ["#FF0000", "#FFFF00"],//'DIV - Diverse aktiviteter',
  ["#FF0000", "#FFFF00"],//'Diplom S - Diplomuddannelse - Sundhed',
  ["#FF0000", "#FFFF00"],//'Diplom L - Diplomuddannelse - Ledelse',
  ["#0000FF", "#00FFFF"],//'Teacher',
  ["#DD33FF", "#FF22FF"],//'Researcher',
  ["#7B5647", "#7B5647"],//'Janitor',
  ["#FF0000", "#FFFF00"],//'Cook',
  ["#0000FF", "#00FFFF"],//'Admin'
];

var AgentTypeGroups = [
  'SPL - Sygeplejerskeuddannelsen',           //0
  'PMU - Psykomotorikuddannelsen',            //1
  'FYS - Fysioterapeutuddannelsen',           //2
  'SOC - Socialrådgiveruddannelsen',          //3
  'PÆD - Pædagoguddannelsen',                 //4
  'DIV - Diverse aktiviteter',                //5
  'Diplom S - Diplomuddannelse - Sundhed',    //6
  'Diplom L - Diplomuddannelse - Ledelse',    //7
  'Teacher',                                  //8
  'Researcher',                               //9
  'Janitor',                                  //10
  'Cook',                                     //11
  'Admin'                                     //12
];

var EnergyTypes = {
  'social':    { id: 0, color: '#FF0000' },
  'knowledge': { id: 1, color: '#00FF00' },
  'economic':  { id: 2, color: '#0000FF' },
  'power':     { id: 3, color: '#FF9900' },
  'dirt':      { id: 4, color: '#904930' }
};

var RoomTypes = {
  ''         : { label: 'Other'    , color: '#999999', centerColor: '#999999', edgeColor: '#999999' },
  'classroom': { label: 'Classroom', color: '#00FF00', centerColor: '#00FF00', edgeColor: '#00FF00' },
  'toilet'   : { label: 'Toilet'   , color: '#FF0000', centerColor: '#0055DD', edgeColor: '#0055DD' },
  'research' : { label: 'Research' , color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
  'knowledge': { label: 'Knowledge', color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
  'admin'    : { label: 'Admin'    , color: '#112f28', centerColor: '#122120', edgeColor: '#3333FF' },
  'closet'   : { label: 'Closet'   , color: '#996600', centerColor: '#996600', edgeColor: '#996600' },
  'food'     : { label: 'Food'     , color: '#FFAA00', centerColor: '#FFAA00', edgeColor: '#FFAA00' },
  'exit'     : { label: 'Exit'     , color: '#FF0000', centerColor: '#FF0000', edgeColor: '#FF0000' },
  'empty'    : { label: 'Empty'    , color: '#000000', centerColor: '#000000', edgeColor: '#000000' }
};

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
  //each classroom (*agents) -> random exit
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents", view: "all"},
  //each lab (*agents) -> random classroom
  { from: "research", to: "classroom", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents", view: "all"},
  //each lab (*agents) -> random exit
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each classroom
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "agents", view: "all"},
  //each exit (*random*intensity) -> The Library
  { from: "exit", to: "Library", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random lab
  { from: "exit", to: "research", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random teacher room
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "all"},

  //Knowledge (additionally in Macro view)
  //each lab (*agents) -> random knowledge blob cell
  { from: "research", to: "knowledgeBlob", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "agents", view: "macro"},
  //The Library (*agents) -> each knowledge blob cell
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 10, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> The Library
  { from: "knowledgeBlob", to: "library", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> random lab
  { from: "knowledgeBlob", to: "research", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> random teacher room
  { from: "knowledgeBlob", to: "teacher", fromNum: 'all', toNum: 1, energy: "knowledge", multiplier: "intensity", view: "macro"},

  //Social (in all views)
  //each classroom (*agents) -> random classroom
  { from: "classroom", to: "classroom", fromNum: 'all', toNum: 1, energy: "social", multiplier: "agents", view: "all"},
  //each classroom (*agents) -> random exit
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, energy: "social", multiplier: "agents", view: "all"},
  //The Canteen (*agents) -> each exit
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 10, energy: "social", multiplier: "agents", view: "all"},
  //The Cafe (*agents) -> each exit
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 10, energy: "social", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> The Canteen
  { from: "exit", to: "canteen", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> The Cafe
  { from: "exit", to: "cafe", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity", view: "all"},

  //Social (additionally in Macro view)
  //each classroom (*agents) -> random social blob cell
  { from: "classroom", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents", view: "macro"},
  //The Canteen (*agents) -> each social blob cell
  { from: "canteen", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents", view: "macro"},
  //The Cafe (*agents) -> each social blob cell
  { from: "cafe", to: "socialBlob", fromNum: 10, toNum: 1, energy: "social", multiplier: "agents", view: "macro"},
  //Each social blob cell (*random*intensity) -> The Canteen
  { from: "socialBlob", to: "classrom", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity", view: "macro"},
  //Each social blob cell (*random*intensity) -> The Cafe
  { from: "socialBlob", to: "canteen", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity", view: "macro"},
  //Each social blob cell (*random*intensity) -> random classroom
  { from: "socialBlob", to: "cafe", fromNum: 10, toNum: 1, energy: "social", multiplier: "intensity", view: "macro"},

  //Power (in all views)
  //each admin room (*agents) -> random admin room
  { from: "admin", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random classroom
  { from: "admin", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random teacher room
  { from: "admin", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random exit
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each classroom
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, energy: "power", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, energy: "power", multiplier: "agents", view: "all"},
  //each exit (*random*intensity) -> The Library
  { from: "exit", to: "library", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random admin room
  { from: "exit", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random classroom
  { from: "exit", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random teacher room
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "all"},

  //Power (additionally in Macro view)
  //each admin room (*agents) -> random power blob cell
  { from: "admin", to: "powerBlob", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "macro"},
  //The Library (*agents) -> each knowledge blob cell
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 1, energy: "power", multiplier: "agents", view: "macro"},
  //Each power blob cell (*random*intensity) -> The Library
  { from: "powerBlob", to: "library", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random admin room
  { from: "powerBlob", to: "admin", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random classroom
  { from: "powerBlob", to: "classroom", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random teacher room
  { from: "powerBlob", to: "teacher", fromNum: 'all', toNum: 1, energy: "power", multiplier: "intensity", view: "macro"},

  //Brown (in all views)
  //each lab (*agents) -> random exit
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //each classroom (*agents) -> random exit
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //each teacher room (*agents) -> random exit
  { from: "teacher", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random exit
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //each toilet (*agents) -> random exit
  { from: "toilet", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //each closet (*agents) -> random exit
  { from: "closed", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //The Canteen (*agents) -> each exit
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //The Cafe (*agents) -> each exit
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 1, energy: "dirt", multiplier: "agents", view: "all"},
];

var Config = {
  serverUrl: Platform.isPlask ? 'http://localhost:8080' : 'http://localhost:8080',
  settingsFile: Platform.isPlask ? __dirname + '/settings.json' : 'settings.json',
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  energyTypes: EnergyTypes,

  agentTypeColors: AgentTypeColors,
  agentTypeGroups: AgentTypeGroups,

  //map
  cellCloseness: 0.00155,
  cellEdgeWidth: 1,
  cellColor: '#696E98',
  cellCenterColor: '#696E98',
  cellEdgeColor: '#FF00FF',
  bgColor: '#312D2D',
  corridorColor: '#FFFF00',
  membraneColor: '#EEEEEE',

  agentLineColor: '#000000',
  agentFillColor: '#FFFFFF',
  agentFillColorBasedOnAccentColor: true,
  agentInvertFillAndLineColorBasedOnGender: true,

  roomTypes: RoomTypes,
  floors: Floors,
  energyPaths: EnergyPaths,

  minStudentAge: 18,
  maxStudentAge: 40,

  maxDistortPoints: 100,

  energySpriteSize: 0.5,
  agentSpriteSize: 10,

  cameraRotationDuration: 120*5, //10min,

  floorId: FloorId,

  parseColors: parseColors
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

  Object.keys(Config.agentTypeColors).forEach(function(i) {
    if (Config.agentTypeColors[i][0][0] == '#') {
      Config.agentTypeColors[i][0] = Color.fromHex(Config.agentTypeColors[i][0]);
      Config.agentTypeColors[i][1] = Color.fromHex(Config.agentTypeColors[i][1]);
    }
  })

  Object.keys(Config.roomTypes).forEach(function(type) {
    var roomType = Config.roomTypes[type];
    if (roomType.color[0] =='#') roomType.color = Color.fromHex(roomType.color);
    if (roomType.centerColor[0] =='#') roomType.centerColor = Color.fromHex(roomType.centerColor);
    if (roomType.edgeColor[0] =='#') roomType.edgeColor = Color.fromHex(roomType.edgeColor);
  });
}

Config.parseColors();

module.exports = Config;