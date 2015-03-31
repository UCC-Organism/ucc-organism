#ifdef VERT

#define N_DISTORT_POINTS 100

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

uniform vec3 distortPoints[N_DISTORT_POINTS];

varying vec4 vColor;

void main() 
{
	vColor = color;

	vec3 pos = position;
  vec3 c = vec3(-.56, -.45, 0.0);

  for (int i = 0; i < N_DISTORT_POINTS; i++)
  {
     c = distortPoints[i];
    float dist = distance(pos, c);
    float maxDist = 0.1;
  
    if (dist < maxDist)
    {
      vec3 dir = normalize(pos - c);
      float rat = pow(1.0 - dist / maxDist, 4.0);
      vColor.rgb += vec3(1.0, 0.0, 0.0) *  rat * .05;
      pos += dir * rat * maxDist * .02;
    }
  }
  
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	gl_PointSize = pointSize;
}

#endif