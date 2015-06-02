#ifdef VERT

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

#pragma glslify: import('./DisplacementWeak.glsl')
#pragma glslify: import('./DisplacementStrong.glsl')

uniform float time;
uniform float sway;

varying vec4 vColor;

void main()
{
  vColor = color;

  vec3 pos = position;

  float isRoom = normal.x;

  pos += calcWeakDisplacement(pos, isRoom, vColor);
  pos += calcStrongDisplacement(pos);

  //pos.xy += sway * 0.05 * snoise3(vec3(pos.x + time/5.0, pos.y, pos.x)*5.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = pointSize;
}

#endif

#ifdef FRAG

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}

#endif
