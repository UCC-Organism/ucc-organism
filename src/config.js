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
  'default'                        : { primary: Color.fromHSL(0.0, 0, 0.5), secondary: Color.fromHSL(0, 1, 0.4) },
  'SPL - Sygeplejerskeuddannelsen' : { primary: Color.fromHSL(0.0, 1, 0.5), secondary: Color.fromHSL(0, 1, 0.4) },
  'PMU - Psykomotorikuddannelsen'  : { primary: Color.fromHSL(0.1, 1, 0.5), secondary: Color.fromHSL(0, 1, 0.4) },
  'FYS - Fysioterapeutuddannelsen' : { primary: Color.fromHSL(0.4, 1, 0.5), secondary: Color.fromHSL(0, 1, 0.4) },
  'PÆD - Pædagoguddannelsen'       : { primary: Color.fromHSL(0.6, 1, 0.5), secondary: Color.fromHSL(0, 1, 0.4) }
}

var Config = {
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data',
  roomIdMap: RoomIdMap,
  programmeColors: ProgrammeColors
}

module.exports = Config;