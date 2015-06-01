#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;
varying vec4 vColor;

uniform vec2 scale;
uniform vec2 offset;
varying vec2 vTexCoord;

#pragma glslify: import('./DisplacementStrong.glsl')

void main() {

	vec3 pos = position;
	pos += calcStrongDisplacement(pos);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = pointSize;
  vTexCoord = texCoord * scale + offset;
  vColor = color;
}

#endif

#ifdef FRAG

uniform sampler2D texture;
varying vec2 vTexCoord;
varying vec4 vColor;

void main() {
  gl_FragColor = texture2D(texture, vTexCoord) * vColor;
  if (length(gl_FragColor.a) == 0.0) discard;
}

#endif
