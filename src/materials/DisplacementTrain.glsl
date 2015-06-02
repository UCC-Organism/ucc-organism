uniform float trainWavePosition;
uniform float trainWaveWidth;
uniform float trainWaveStrength;

vec3 calcTrainDisplacement(vec3 pos) {
  float dist = abs(pos.x - trainWavePosition) / trainWaveWidth;

  dist = clamp(dist, 0.0, 1.0);

  vec3 displacement = vec3(0.0);

  displacement.y += trainWaveStrength * smoothstep(0.0, 1.0, 1.0 - dist);

  return displacement;
}
