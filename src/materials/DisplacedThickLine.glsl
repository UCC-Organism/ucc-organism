#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
uniform float thickness;

#define N_DISTORT_POINTS 10

uniform vec3 strongDisplacePoints[N_DISTORT_POINTS];
uniform vec2 strongDisplaceProps[N_DISTORT_POINTS];
uniform int numStrongDisplacePoints;

attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

varying vec4 vColor;
varying vec2 vTexCoord;



void main() {
  vec3 pos = position;
  vec3 c;
  vec3 displacement = vec3(0.0, 0.0, 0.0);

  // ----------------------------
  // Calculate strong displacement
  // ----------------------------

  for (int i = 0; i < N_DISTORT_POINTS; i++)
  {
    if (i >= numStrongDisplacePoints) break;

    c = strongDisplacePoints[i];

    float dist = distance(pos, c);
    float distortionStrength = strongDisplaceProps[i].y;
    float maxDist = strongDisplaceProps[i].x;

    if (dist < maxDist && maxDist > 0.0)
    {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);

      displacement += dir * rat * maxDist * distortionStrength;
    }
  }

  pos += displacement;

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
