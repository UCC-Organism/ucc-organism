#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

#define N_DISTORT_POINTS 10

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
    if (i >= numStrongDisplacePoints) break;
    
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
  vColor = color;
}

#endif

#ifdef FRAG

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}

#endif
