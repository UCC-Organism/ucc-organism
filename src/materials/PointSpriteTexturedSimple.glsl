#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
}

#endif

#ifdef FRAG

uniform sampler2D texture;
uniform float alpha;


void main() {
  vec2 texCoord = gl_PointCoord;
  gl_FragColor = texture2D(texture, texCoord);
  gl_FragColor *= alpha;

  if (gl_FragColor.a == 0.0) discard;
}

#endif
