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
  'SPL - Sygeplejerskeuddannelsen'        : { primary: Color.fromHSL(0.0, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'PMU - Psykomotorikuddannelsen'         : { primary: Color.fromHSL(0.1, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'FYS - Fysioterapeutuddannelsen'        : { primary: Color.fromHSL(0.4, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'PÆD - Pædagoguddannelsen'              : { primary: Color.fromHSL(0.6, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'SOC - Socialrådgiveruddannelsen'       : { primary: Color.fromHSL(0.2, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'DIV - Diverse aktiviteter'             : { primary: Color.fromHSL(0.9, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'Diplom S - Diplomuddannelse - Sundhed' : { primary: Color.fromHSL(0.75, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) },
  'Diplom L - Diplomuddannelse - Ledelse' : { primary: Color.fromHSL(0.75, 1, 0.5), secondary: Color.fromHSL(0, 1, 1) }
};

var EnergyTypes = {
  'social': { color: Color.Red },
  'knowledge': { color: Color.Green },
  'economic': { color: Color.Blue },
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
}

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

  roomTypes: RoomTypes
};

Object.keys(Config.roomTypes).forEach(function(type) {
  var roomType = Config.roomTypes[type];
  roomType.color = Color.fromHex(roomType.color);
  roomType.centerColor = Color.fromHex(roomType.centerColor);
  roomType.edgeColor = Color.fromHex(roomType.edgeColor);
});

module.exports = Config;