#define N_WEAK_DISTORT_POINTS 10

uniform vec4 weakDisplacePoints[N_WEAK_DISTORT_POINTS];
uniform int numWeakDisplacePoints;
uniform float maxWeakDisplacement;
uniform vec4 glowColors[N_WEAK_DISTORT_POINTS];

vec3 calcWeakDisplacement(vec3 pos, float isRoom, inout vec4 color) {
  vec3 displacement = vec3(0.0);

  for (int i = 0; i < N_WEAK_DISTORT_POINTS; i++)
  {
    if (i >= numWeakDisplacePoints) break;

    vec3 c = vec3(weakDisplacePoints[i].xy, 0.0);
    float dist = distance(pos, c);
    float maxDist = weakDisplacePoints[i].z;
    float distortionStrength = weakDisplacePoints[i].w;

    if (dist < maxDist && maxDist > 0.0) {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);
      color.rgb = mix(color.rgb, glowColors[i].rgb, rat * distortionStrength * 30.0 * isRoom);

      displacement += dir * rat * maxDist * distortionStrength;
    }
  }

  if ((maxWeakDisplacement > 0.0) && (length(displacement) > maxWeakDisplacement)) {
    displacement = normalize(displacement) * maxWeakDisplacement;
  }

  return displacement;
}
