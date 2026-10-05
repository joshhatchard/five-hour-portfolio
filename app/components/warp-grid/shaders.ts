export const vertexShader = /* glsl */ `
  uniform float uVelocity;
  uniform vec2 uViewport;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // A shared screen-space cylinder, not a separate bulge around each card.
    float screenY = clamp(world.y / (uViewport.y * 0.5), -1.0, 1.0);
    float arc = 1.0 - sqrt(max(0.0, 1.0 - pow(screenY * 0.92, 2.0)));
    // Orthographic projection cannot show a Z-only bend; deform X/Y too.
    world.x *= 1.0 + arc * abs(uVelocity) * 0.32;
    world.y += sin(screenY * 3.14159265) * uVelocity * 12.0;
    world.z += sin(uv.y * 3.14159265) * uVelocity * 20.0;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uVelocity;
  uniform float uRgbShift;
  uniform float uOpacity;
  uniform vec2 uUvScale;
  varying vec2 vUv;
  void main() {
    vec2 uv = (vUv - 0.5) * uUvScale + 0.5;
    float offset = abs(uVelocity) * uRgbShift;
    vec4 colour = texture2D(uTexture, uv);
    colour.r = texture2D(uTexture, uv + vec2(offset, 0.0)).r;
    colour.b = texture2D(uTexture, uv - vec2(offset, 0.0)).b;
    gl_FragColor = vec4(colour.rgb, colour.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
