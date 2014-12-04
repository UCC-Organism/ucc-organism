#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
  vNormal = normal;
  vColor = color;
  vTexCoord = texCoord;
}

#endif

#ifdef FRAG

#define PI 3.14159265359

uniform sampler2D texture;
uniform float alpha;
uniform vec2 texSize;
uniform vec2 texOffset;

varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexCoord;

//http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche31.html
mat2 rotate2(float angle) {
  return mat2(
    cos( angle ), -sin( angle ),
    sin( angle ),  cos( angle )
  );
}

void main() {
  float rot = vNormal.x;
  rot += PI / 2.0;

  vec2 texCoord = gl_PointCoord;
  //texCoord.y = 1.0 - texCoord.y;
  texCoord -= vec2(0.5, 0.5);
  texCoord = rotate2(rot) * texCoord;
  texCoord += vec2(0.5, 0.5);
  texCoord *= texSize;
  texCoord += texOffset * vTexCoord;

  gl_FragColor = texture2D(texture, texCoord);
  gl_FragColor.rgb *= vColor.rgb;

  //gl_FragColor.rgb *= mix(1.0 - vColor.rgb, vColor.rgb, step(0.75, gl_FragColor.r));
  //gl_FragColor.a *= vColor.a;
  //gl_FragColor = vec4(step(0.75, gl_FragColor.r));
  gl_FragColor *= alpha;

  if (gl_FragColor.a == 0.0) discard;

  //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

  //rot += 0.5;
  //gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
  //gl_FragColor.rgb = vNormal*0.5 + 0.5;
}

#endif
