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
}

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
}

var EnergyTypes = {
  'social': { color: Color.Red },
  'knowledge': { color: Color.Green },
  'economic': { color: Color.Blue },
  'dirt': { color: Color.fromHSL(0.1, 0.8, 0.4) }
};

var Config = {
  settingsFile: __dirname + '/settings.json',
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  programmeColors: ProgrammeColors,
  energyTypes: EnergyTypes,

  scheduleStartDate: "2014-11-24",
  scheduleEndDate: "2014-11-30",

  //look
  cellCloseness: 0.0035,
  cellEdgeWidth: 1,
  bgColor: Color.fromHex('#312D2D'),
  cellColor: Color.fromHex('#696E98'),
  cellCenterColor: Color.fromHex('#696E98'),
  cellEdgeColor: Color.fromHex('#FF00FF'),
  corridorColor: Color.fromHex('#FFFF00'),
  classroomColor: Color.fromHex('#FFFFFF'),
  classroomCenterColor: Color.fromHex('#FFFFFF'),
  classroomEdgeColor: Color.fromHex('#FFFFFF'),
  otherRoomColor: Color.fromHex('#FFFFFF'),
  otherRoomCenterColor: Color.fromHex('#FFFFFF'),
  otherRoomEdgeColor: Color.fromHex('#FFFFFF'),
  toiletColor: Color.fromHex('#FFFFFF'),
  toiletCenterColor: Color.fromHex('#FFFFFF'),
  toiletEdgeColor: Color.fromHex('#FFFFFF')
}

module.exports = Config;