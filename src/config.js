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
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#0000FF"), Color.fromHex("#00FFFF")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")],
  [Color.fromHex("#FF0000"), Color.fromHex("#FFFF00")]
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
  'dirt': { color: Color.fromHSL(0.1, 0.8, 0.4) }
};

var RoomTypes = {
  ''         : { label: 'Other'    , color: '#999999', centerColor: '#999999', edgeColor: '#999999' },
  'classroom': { label: 'Classroom', color: '#00FF00', centerColor: '#00FF00', edgeColor: '#00FF00' },
  'toilet'   : { label: 'Toilet'   , color: '#FF0000', centerColor: '#0055DD', edgeColor: '#0055DD' },
  'research' : { label: 'Research' , color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
  'knowledge': { label: 'Knowledge' , color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
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
  agentStudentColor: new Color(1.0, 1.0, 0.3, 1.0),
  agentTeacherColor: new Color(1.0, 0.3, 0.3, 1.0),
  agentResearcherColor: new Color(1.0, 0.3, 0.3, 1.0),
  agentCookColor: new Color(0.3, .9, 0.3, 1.0),
  agentJanitorColor: new Color(0.0, 1.0, 0.0, 1.0),

  roomTypes: RoomTypes,
  floors: Floors,

  cellStyle: CellStyle,

  minStudentAge: 18,
  maxStudentAge: 40,

  maxDistortPoints: 100,

  energySpriteSize: 0.5,
  agentSpriteSize: 10,
};

Object.keys(Config.roomTypes).forEach(function(type) {
  var roomType = Config.roomTypes[type];
  roomType.color = Color.fromHex(roomType.color);
  roomType.centerColor = Color.fromHex(roomType.centerColor);
  roomType.edgeColor = Color.fromHex(roomType.edgeColor);
});

module.exports = Config;