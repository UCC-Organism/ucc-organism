#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

uniform sampler2D agentProxyTex;
uniform vec2 windowSize;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
  vColor = color;

  vec2 ndc = gl_Position.xy/gl_Position.w;
  vec2 texCoord = (ndc + 1.0)/2.0;

  float d = texture2D(agentProxyTex, texCoord).r;
  float dx = texture2D(agentProxyTex, texCoord + vec2(10.0/windowSize.x, 0.0)).r - d;
  float dy = texture2D(agentProxyTex, texCoord + vec2(0.0, 10.0/windowSize.y)).r - d;

  vec3 distortion = normalize(vec3(dx, dy, 0.0));
  float strength = -10.0 * d/1000.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + strength * distortion, 1.0);
  //float distortionStrength = texture2D(agentProxyTex, texCoord).r;

  //vColor = vec4(dx * 0.5 + 0.5, dy * 0.5 + 0.5, 0.0, 1.0);
}

#endif

#ifdef FRAG

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}

#endif
