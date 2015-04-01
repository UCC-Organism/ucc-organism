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

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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

  vec4 c = texture2D(texture, texCoord);
  float a = c.a;
  vec3 hsv = rgb2hsv(c.rgb);

  vec4 c1 = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 c2 = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 c3 = vec4(1.0, 0.4, 0.4, 1.0);

  float total = c.r + c.g + c.b;
  c = (c1 * (c.r / total)) + (c2 * (c.g/ total)) + (c3 * (c.b / total));
  c.a *= a;

  gl_FragColor = c;
  gl_FragColor.rgb *= vColor.rgb;
  gl_FragColor *= alpha;

  if (gl_FragColor.a == 0.0) discard;
}

#endif
