#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
uniform float thickness;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

varying vec4 vColor;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * thickness, 1.0);
  gl_PointSize = pointSize;
  vColor = color;
}

#endif

#ifdef FRAG

uniform bool premultiplied;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
  if (premultiplied) {
    gl_FragColor.rgb *= vColor.a;
  }
}

#endif
