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
    // One viewport-centred inverse barrel shared by every gallery item.
    // Deformation is driven entirely by scroll velocity. At rest this resolves
    // to a 1:1 pixel mapping; faster scrolling produces more curvature.
    world.x *= 1.0 + arc * abs(uVelocity) * 0.32;
    // Explicit CSS-pixel projection avoids camera zoom or DPR changing sizes.
    gl_Position = vec4(world.xy / (uViewport * 0.5), 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uVelocity;
  uniform float uRgbShift;
  uniform float uOpacity;
  uniform vec2 uUvScale;
  uniform float uHover;
  uniform float uHoverEnabled;
  uniform float uHoverDirection;
  uniform sampler2D uPrimaryTexture;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) * uUvScale + 0.5;
    float offset = abs(uVelocity) * uRgbShift;
    vec4 colour = texture2D(uTexture, uv);
    if (offset > 0.0) {
      colour.r = texture2D(uTexture, uv + vec2(offset, 0.0)).r;
      colour.b = texture2D(uTexture, uv - vec2(offset, 0.0)).b;
    }
    if (uHoverEnabled > 0.5) {
      float progress = uHover;
      float limePanel = uHoverDirection < 0.5 ? step(vUv.x, progress)
        : uHoverDirection < 1.5 ? step(1.0 - vUv.x, progress)
        : uHoverDirection < 2.5 ? step(1.0 - vUv.y, progress)
        : step(vUv.y, progress);
      vec3 lime = texture2D(uPrimaryTexture, vec2(0.5)).rgb;
      colour.rgb = mix(colour.rgb, lime, limePanel);
    }
    gl_FragColor = vec4(colour.rgb, colour.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
