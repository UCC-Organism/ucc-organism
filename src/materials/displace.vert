#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;

uniform vec3 distortPoints[2];

varying vec4 vColor;

void main() 
{
	vColor = color;

	
	vec3 pos = position;
  vec3 c = vec3(-.56, -.45, 0.0);

  for (int i = 0; i < 2; i++)
  {
     c = distortPoints[i];
    float dist = distance(pos, c);
    float maxDist = 0.05;
  
    if (dist < maxDist)
    {
      vec3 dir = normalize(pos - c);
      //vColor = vec4(1.0, 1.0, 0.0, 1.0);
      float rat = 1.0 - (dist / maxDist);
      pos += dir * rat * maxDist * .04;
    }
  }
  
 

	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	gl_PointSize = pointSize;
}

#endif