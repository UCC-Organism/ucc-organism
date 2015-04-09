var SpriteTextBox = require('./typo/SpriteTextBox');

//var text = 'Hello World';
//var text = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.';
var text = 'You can pass a custom measure function which takes the text being wrapped, the start (inclusive) and end (exclusive) indices into the string, and the desired width. The return value should be an object with { start, end } indices, representing the actual glyphs that can be rendered within those bounds.';

var Font = JSON.parse(fs.readFileSync(__dirname + '/assets/fonts//LatoRegular-sdf.json','utf8'));

var sdfMaterial = this.sdfMaterial = new SDF({
  texture: fontTex,
  color: Color.White,
  smoothing: 1/16
});

this.text = new SpriteTextBox(text, {
  fontSize: this.fontSize * DPI / 500,
  lineHeight: 1.2,
  font: Font,
  textures: [ this.fontTex ],
  wrap: 320 * DPI / 500
});