#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

attribute vec4 lineColor;
attribute vec4 fillColor;
attribute vec4 accentColor;

varying vec3 vNormal;
varying vec4 vColor;
varying vec2 vTexCoord;
varying vec4 vLineColor;
varying vec4 vFillColor;
varying vec4 vAccentColor;

#define N_DISTORT_POINTS 100

uniform vec3 strongDisplacePoints[N_DISTORT_POINTS];
uniform vec2 strongDisplaceProps[N_DISTORT_POINTS];
uniform int numStrongDisplacePoints;

void main() {

  vec3 pos = position;
  vec3 c;
  vec3 displacement = vec3(0.0, 0.0, 0.0);

  // ----------------------------
  // Calculate strong displacement
  // ----------------------------

  for (int i = 0; i < N_DISTORT_POINTS; i++)
  {
    if (i > numStrongDisplacePoints) break;
    
    c = strongDisplacePoints[i];

    float dist = distance(pos, c);
    float distortionStrength = strongDisplaceProps[i].y;
    float maxDist = strongDisplaceProps[i].x;
  
    if (dist < maxDist)
    {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);

      displacement += dir * rat * maxDist * distortionStrength;
    }
  }

  pos += displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = pointSize;
  vNormal = normal;
  vColor = color;
  vTexCoord = texCoord;
  vLineColor = lineColor;
  vFillColor = fillColor;
  vAccentColor = accentColor;
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

varying vec4 vLineColor;
varying vec4 vFillColor;
varying vec4 vAccentColor;

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

  vec4 c = texture2D(texture, texCoord);
  float a = c.a;

  vec4 c1 = vLineColor;
  vec4 c2 = vFillColor;
  vec4 c3 = vAccentColor;

  float total = c.r + c.g + c.b;
  c = (c1 * (c.r / total)) + (c2 * (c.g/ total)) + (c3 * (c.b / total));
  c.a *= a;

  gl_FragColor = c;
  gl_FragColor.rgb *= vColor.rgb;
  gl_FragColor *= alpha;

  if (gl_FragColor.a == 0.0) discard;
}

#endif
