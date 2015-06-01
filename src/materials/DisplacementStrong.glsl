#define N_DISTORT_POINTS 10

uniform vec3 strongDisplacePoints[N_DISTORT_POINTS];
uniform vec2 strongDisplaceProps[N_DISTORT_POINTS];
uniform int numStrongDisplacePoints;

vec3 calcStrongDisplacement(vec3 pos) {
  vec3 displacement = vec3(0.0);

  for (int i = 0; i < N_DISTORT_POINTS; i++) {
    if (i >= numStrongDisplacePoints) break;

    vec3 c = strongDisplacePoints[i];

    float dist = distance(pos, c);
    float distortionStrength = strongDisplaceProps[i].y;
    float maxDist = strongDisplaceProps[i].x;

    if (dist < maxDist) {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);

      displacement += dir * rat * maxDist * distortionStrength;
    }
  }

  return displacement;
}
