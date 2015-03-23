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

var ProgrammeColors = {
  'default'                               : { primary: Color.fromHSL(0.0, 0, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'SPL - Sygeplejerskeuddannelsen'        : { primary: Color.fromHSL(0.0, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'PMU - Psykomotorikuddannelsen'         : { primary: Color.fromHSL(0.1, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'FYS - Fysioterapeutuddannelsen'        : { primary: Color.fromHSL(0.4, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'PÆD - Pædagoguddannelsen'              : { primary: Color.fromHSL(0.6, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'SOC - Socialrådgiveruddannelsen'       : { primary: Color.fromHSL(0.2, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'DIV - Diverse aktiviteter'             : { primary: Color.fromHSL(0.9, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'Diplom S - Diplomuddannelse - Sundhed' : { primary: Color.fromHSL(0.75, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'Diplom L - Diplomuddannelse - Ledelse' : { primary: Color.fromHSL(0.75, 0.7, 0.5), secondary: Color.fromHSL(0, 1, 1) }
};

var EnergyTypes = {
  'social': { color: Color.Red.clone() },
  'knowledge': { color: Color.Green.clone() },
  'economic': { color: Color.Blue.clone() },
  'dirt': { color: Color.fromHSL(0.1, 0.8, 0.4) }
};

var RoomTypes = {
  ''         : { label: 'Other'    , color: '#999999', centerColor: '#999999', edgeColor: '#999999' },
  'classroom': { label: 'Classroom', color: '#00FF00', centerColor: '#00FF00', edgeColor: '#00FF00' },
  'toilet'   : { label: 'Toilet'   , color: '#0055DD', centerColor: '#0055DD', edgeColor: '#0055DD' },
  'research' : { label: 'Research' , color: '#FF00FF', centerColor: '#FF00FF', edgeColor: '#FF00FF' },
  'admin'    : { label: 'Admin'    , color: '#6666FF', centerColor: '#6666FF', edgeColor: '#6666FF' },
  'closet'   : { label: 'Closet'   , color: '#996600', centerColor: '#996600', edgeColor: '#996600' },
  'food'     : { label: 'Food'     , color: '#FFAA00', centerColor: '#FFAA00', edgeColor: '#FFAA00' },
  'knowledge': { label: 'Knowledge', color: '#00DDAA', centerColor: '#00DDAA', edgeColor: '#00DDAA' },
  'exit'     : { label: 'Exit'     , color: '#FF0000', centerColor: '#FF0000', edgeColor: '#FF0000' },
  'empty'    : { label: 'Empty'    , color: '#000000', centerColor: '#000000', edgeColor: '#000000' },
  'cell'     : { label: 'Cell'     , color: '#696E98', centerColor: '#696E98', edgeColor: '#FF00FF' }
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
  'All', //0
  'A 0', //1
  'A 1', //2
  'B 0', //3
  'B 1', //4
  'C 0', //5
  'C 1', //6
  'C 2' //7
];

var Config = {
  settingsFile: Platform.isPlask ? __dirname + '/settings.json' : 'settings.json',
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  programmeColors: ProgrammeColors,
  energyTypes: EnergyTypes,

  scheduleStartDate: "2014-11-24",
  scheduleEndDate: "2014-11-30",

  cellCloseness: 0.0035,
  cellEdgeWidth: 1,
  cellColor: Color.fromHex('#696E98'),
  cellCenterColor: Color.fromHex('#696E98'),
  cellEdgeColor: Color.fromHex('#FF00FF'),
  bgColor: Color.fromHex('#312D2D'),
  corridorColor: Color.fromHex('#FFFF00'),

  roomTypes: RoomTypes,

  cellStyle: CellStyle,

  minStudentAge: 18,
  maxStudentAge: 40,

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