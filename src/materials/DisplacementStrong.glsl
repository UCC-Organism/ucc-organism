#define N_STRONG_DISTORT_POINTS 10

uniform vec4 strongDisplacePoints[N_STRONG_DISTORT_POINTS];
//uniform vec2 strongDisplaceProps[N_STRONG_DISTORT_POINTS];
uniform int numStrongDisplacePoints;

vec3 calcStrongDisplacement(vec3 pos) {
  vec3 displacement = vec3(0.0);

  for (int i = 0; i < N_STRONG_DISTORT_POINTS; i++) {
    if (i >= numStrongDisplacePoints) break;

    vec3 c = vec3(strongDisplacePoints[i].xy, 0.0);

    float dist = distance(pos, c);
    float maxDist = strongDisplacePoints[i].z;
    float distortionStrength = strongDisplacePoints[i].w;

    if (dist < maxDist) {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);

      displacement += dir * rat * maxDist * distortionStrength;
    }
  }

  return displacement;
}
