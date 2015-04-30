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
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'SPL - Sygeplejerskeuddannelsen',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'PMU - Psykomotorikuddannelsen',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'FYS - Fysioterapeutuddannelsen',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'SOC - Socialrådgiveruddannelsen',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'PÆD - Pædagoguddannelsen',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'DIV - Diverse aktiviteter',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'Diplom S - Diplomuddannelse - Sundhed',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'Diplom L - Diplomuddannelse - Ledelse',
  [Color.fromHex("#0000FF"), Color.fromHex("#00FFFF")],//'Teacher',
  [Color.fromHex("#DD33FF"), Color.fromHex("#FF22FF")],//'Researcher',
  [Color.fromHex("#7B5647"), Color.fromHex("#7B5647")],//'Janitor',
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],//'Cook',
  [Color.fromHex("#0000FF"), Color.fromHex("#00FFFF")],//'Admin'
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
  'social': { color: Color.Red.clone() },
  'knowledge': { color: Color.Green.clone() },
  'economic': { color: Color.Blue.clone() },
  'power': { color: Color.Orange.clone() },
  'dirt': { color: Color.fromHSL(0.1, 0.8, 0.4) }
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

var CellStyle = {
  bg: [ 222, 200, 39, 255 ],
  cellBorderEdge : [ 255*0.5561439022429832, 255*0.10527327716561674, 255*0.853888654652565, 255*1.0 ],
  cellBorder: [ 222-30, 200-30, 39-0, 255 ],
  cellInside: [ 255, 255, 210, 200 ],
  cellCore: [ 100, 70, 90, 200 ],
  teacher: [39, 178, 128, 255],
  simple: [239, 105, 108, 255],
  teacher: [ 255, 255, 255, 150 ],
  simple: [ 255, 255, 255, 150 ],
  //simple: [ 255, 50, 10, 255 ],
  //teacher: [ 255, 50, 10, 255 ],
  //paed: [ 255, 50, 10, 255 ]
  paed: [ 255, 255, 255, 150 ]
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
  //each lab (*agents) -> random classroom
  { from: "research", to: "classroom", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "agents", view: "all"},
  //each lab (*agents) -> random exit
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each classroom
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, random: true, energy: "knowledge", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, random: true, energy: "knowledge", multiplier: "agents", view: "all"},
  //each exit (*random*intensity) -> The Library
  { from: "exit", to: "Library", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random lab
  { from: "exit", to: "research", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random teacher room
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "all"},

  //Knowledge (additionally in Macro view)
  //each lab (*agents) -> random knowledge blob cell
  { from: "research", to: "knowledgeBlob", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "agents", view: "macro"},
  //The Library (*agents) -> each knowledge blob cell
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 10, random: true, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> The Library
  { from: "knowledgeBlob", to: "library", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> random lab
  { from: "knowledgeBlob", to: "research", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "macro"},
  //Each knowledge blob cell (*random*intensity) -> random teacher room
  { from: "knowledgeBlob", to: "teacher", fromNum: 'all', toNum: 1, random: true, energy: "knowledge", multiplier: "intensity", view: "macro"},

  //Social (in all views)
  //each classroom (*agents) -> random classroom
  { from: "classroom", to: "classroom", fromNum: 'all', toNum: 1, random: true, energy: "social", multiplier: "agents", view: "all"},
  //each classroom (*agents) -> random exit
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "social", multiplier: "agents", view: "all"},
  //The Canteen (*agents) -> each exit
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 10, random: true, energy: "social", multiplier: "agents", view: "all"},
  //The Cafe (*agents) -> each exit
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 10, random: true, energy: "social", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> The Canteen
  { from: "exit", to: "canteen", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> The Cafe
  { from: "exit", to: "cafe", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "intensity", view: "all"},

  //Social (additionally in Macro view)
  //each classroom (*agents) -> random social blob cell
  { from: "classroom", to: "socialBlob", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "agents", view: "macro"},
  //The Canteen (*agents) -> each social blob cell
  { from: "canteen", to: "socialBlob", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "agents", view: "macro"},
  //The Cafe (*agents) -> each social blob cell
  { from: "cafe", to: "socialBlob", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "agents", view: "macro"},
  //Each social blob cell (*random*intensity) -> The Canteen
  { from: "socialBlob", to: "classrom", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "intensity", view: "macro"},
  //Each social blob cell (*random*intensity) -> The Cafe
  { from: "socialBlob", to: "canteen", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "intensity", view: "macro"},
  //Each social blob cell (*random*intensity) -> random classroom
  { from: "socialBlob", to: "cafe", fromNum: 10, toNum: 1, random: true, energy: "social", multiplier: "intensity", view: "macro"},

  //Power (in all views)
  //each admin room (*agents) -> random admin room
  { from: "admin", to: "admin", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random classroom
  { from: "admin", to: "classroom", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random teacher room
  { from: "admin", to: "teacher", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random exit
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each classroom
  { from: "library", to: "classroom", fromNum: 'all', toNum: 10, random: true, energy: "power", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 10, random: true, energy: "power", multiplier: "agents", view: "all"},
  //each exit (*random*intensity) -> The Library
  { from: "exit", to: "library", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random admin room
  { from: "exit", to: "admin", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random classroom
  { from: "exit", to: "classroom", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "all"},
  //each exit (*random*intensity) -> random teacher room
  { from: "exit", to: "teacher", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "all"},

  //Power (additionally in Macro view)
  //each admin room (*agents) -> random power blob cell
  { from: "admin", to: "powerBlob", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "macro"},
  //The Library (*agents) -> each knowledge blob cell
  { from: "library", to: "knowledgeBlob", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "agents", view: "macro"},
  //Each power blob cell (*random*intensity) -> The Library
  { from: "powerBlob", to: "library", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random admin room
  { from: "powerBlob", to: "admin", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random classroom
  { from: "powerBlob", to: "classroom", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "macro"},
  //Each power blob cell (*random*intensity) -> random teacher room
  { from: "powerBlob", to: "teacher", fromNum: 'all', toNum: 1, random: true, energy: "power", multiplier: "intensity", view: "macro"},

  //Brown (in all views)
  //each lab (*agents) -> random exit
  { from: "research", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //each classroom (*agents) -> random exit
  { from: "classroom", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //each teacher room (*agents) -> random exit
  { from: "teacher", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //each admin room (*agents) -> random exit
  { from: "admin", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //each toilet (*agents) -> random exit
  { from: "toilet", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //each closet (*agents) -> random exit
  { from: "closed", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //The Canteen (*agents) -> each exit
  { from: "canteen", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //The Cafe (*agents) -> each exit
  { from: "cafe", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
  //The Library (*agents) -> each exit
  { from: "library", to: "exit", fromNum: 'all', toNum: 1, random: true, energy: "dirt", multiplier: "agents", view: "all"},
];

var Config = {
  serverUrl: Platform.isPlask ? 'http://localhost:8080' : 'http://localhost:8080',
  settingsFile: Platform.isPlask ? __dirname + '/settings.json' : 'settings.json',
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  energyTypes: EnergyTypes,

  agentTypeColors: AgentTypeColors,
  agentTypeGroups: AgentTypeGroups,

  scheduleStartDate: "2014-11-24",
  scheduleEndDate: "2014-11-30",

  cellCloseness: 0.00155,
  cellEdgeWidth: 1,
  cellColor: Color.fromHex('#696E98'),
  cellCenterColor: Color.fromHex('#696E98'),
  cellEdgeColor: Color.fromHex('#FF00FF'),
  bgColor: Color.fromHex('#312D2D'),
  corridorColor: Color.fromHex('#FFFF00'),

  glowColor: Color.fromHex('#FF0000'),
  agentLineColor: new Color(0.0, 0.0, 0.0, 1.0),
  agentFillColor: new Color(1.0, 1.0, 1.0, 1.0),
  agentFillColorBasedOnAccentColor: true,
  agentInvertFillAndLineColorBasedOnGender: true,
  agentStudentColor: new Color(1.0, 1.0, 0.3, 1.0),
  agentTeacherColor: new Color(1.0, 0.3, 0.3, 1.0),
  agentResearcherColor: new Color(1.0, 0.3, 0.3, 1.0),
  agentCookColor: new Color(0.3, .9, 0.3, 1.0),
  agentJanitorColor: new Color(0.0, 1.0, 0.0, 1.0),
  membraneColor: new Color(0.9, 0.9, 0.9, 1.0),

  roomTypes: RoomTypes,
  floors: Floors,
  energyPaths: EnergyPaths,

  cellStyle: CellStyle,

  minStudentAge: 18,
  maxStudentAge: 40,

  maxDistortPoints: 100,

  energySpriteSize: 0.5,
  agentSpriteSize: 10,

  cameraRotationDuration: 120*5, //10min,


  floorId: FloorId
};

Object.keys(Config.roomTypes).forEach(function(type) {
  var roomType = Config.roomTypes[type];
  roomType.color = Color.fromHex(roomType.color);
  roomType.centerColor = Color.fromHex(roomType.centerColor);
  roomType.edgeColor = Color.fromHex(roomType.edgeColor);
});

module.exports = Config;