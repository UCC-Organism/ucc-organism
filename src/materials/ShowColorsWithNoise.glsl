#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;
varying vec4 vColor;

uniform float spread;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: import('./DisplacementStrong.glsl')

void main() {

  vec3 pos = position;
  pos.x += spread * 0.002 * snoise3(vec3(texCoord, 0.0) * 10.0 + position * 10.0);
  pos.y += spread * 0.002 * snoise3(vec3(0.0, texCoord/2.0) * 10.0 + position * 10.0);

  pos += calcStrongDisplacement(pos);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = pointSize;
  vColor = color;
}

#endif

#ifdef FRAG

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}

#endif
