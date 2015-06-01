#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
uniform float thickness;

#pragma glslify: import('./DisplacementStrong.glsl')

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

varying vec4 vColor;
varying vec2 vTexCoord;



void main() {
  vec3 pos = position;

  pos += calcStrongDisplacement(pos);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + normal * thickness, 1.0);
  gl_PointSize = pointSize;
  vColor = color;
  vTexCoord = texCoord;
}

#endif

#ifdef FRAG

uniform bool premultiplied;
varying vec4 vColor;
varying vec2 vTexCoord;

uniform sampler2D texture;

void main() {
  gl_FragColor = vColor;

  float alpha = vColor.a * texture2D(texture, vec2(0.0, vTexCoord.y)).r;
  gl_FragColor.a = alpha;

  if (premultiplied) {
    gl_FragColor.rgb *= alpha;
  }
}

#endif
