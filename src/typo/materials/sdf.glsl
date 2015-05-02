#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
attribute vec3 position;
attribute vec2 texCoord;
varying vec2 vTexCoord;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vTexCoord = texCoord;
}

#endif

#ifdef FRAG

uniform sampler2D texture;
uniform vec2 scale;
varying vec2 vTexCoord;

uniform vec4 color;
uniform vec4 bgColor;
uniform vec4 border;
uniform float smoothing;

void main() {
  //FIXME: textures are not premultiplied???
  float dist = texture2D(texture, vTexCoord).a;
  float alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, dist);
  gl_FragColor = mix(bgColor, color, alpha);
  if (dist < 0.5 && dist > 0.0 && length(border) > 0.0) {
    gl_FragColor = border;
  }
  if (gl_FragColor.a < 0.1) {
   discard;
  }
}

#endif