#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

uniform sampler2D agentProxyTex;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
  vColor = color;

  vec2 ndc = gl_Position.xy/gl_Position.w;
  vec2 texCoord = (ndc + 1.0)/2.0;

  float distortionStrength = texture2D(agentProxyTex, texCoord).r;

  vColor = vec4(distortionStrength, 0.0, 0.0, 1.0);
}

#endif

#ifdef FRAG

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}

#endif
