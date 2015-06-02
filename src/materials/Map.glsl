#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

#define N_WEAK_DISTORT_POINTS 30
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
