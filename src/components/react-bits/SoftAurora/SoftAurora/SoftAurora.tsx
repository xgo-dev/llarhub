import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

import './SoftAurora.css';

interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  surfaceColor1?: string;
  surfaceColor2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  upperBandHeight?: number;
  lowerBandHeight?: number;
  bandTilt?: number;
  bandCurve?: number;
  radialMode?: boolean;
  radialCenterX?: number;
  radialCenterY?: number;
  innerCenterYOffset?: number;
  outerRadius?: number;
  innerRadius?: number;
  depthShift?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
  lightMode?: boolean;
  interactiveLayers?: boolean;
  initialFrontLayer?: 'upper' | 'lower';
  ariaLabel?: string;
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uSurfaceColor1;
uniform vec3 uSurfaceColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uUpperBandHeight;
uniform float uLowerBandHeight;
uniform float uBandTilt;
uniform float uBandCurve;
uniform float uRadialMode;
uniform float uRadialCenterX;
uniform float uRadialCenterY;
uniform float uInnerCenterYOffset;
uniform float uOuterRadius;
uniform float uInnerRadius;
uniform float uDepthShift;
uniform float uFrontMix;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;
uniform float uLightMode;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraField(float t, vec2 shift, float bandHeight) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - bandHeight * 10.0;
  return noiseVal + yBand;
}

float auroraGlow(float field) {
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(field))), 0.0);
}

float radialField(float t, vec2 shift, float radius, float centerYOffset) {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv += shift;
  float aspect = uResolution.x / uResolution.y;
  vec2 metric = vec2((uv.x - uRadialCenterX) * aspect, uv.y - (uRadialCenterY + centerYOffset));
  float noiseVal = perlin3D(uNoiseAmp * 0.14, uNoiseFreq, metric.x * uScale, metric.y * uScale, t);
  return (length(metric) - radius + noiseVal) * 10.0;
}

float secondCircleField(vec2 point, vec2 center, vec2 radius) {
  vec2 delta = (point - center) / max(radius, vec2(0.0001));
  return exp(-dot(delta, delta) * 1.25);
}

vec3 secondCircleSurface(vec2 sourceUv, float time) {
  float colorTime = time * uSpeed * 0.18;
  vec2 blueCenter = vec2(0.20, 0.57) + vec2(sin(colorTime * 0.71), cos(colorTime * 0.63)) * vec2(0.007, 0.006);
  vec2 violetCenter = vec2(0.78, 0.22) + vec2(cos(colorTime * 0.57), sin(colorTime * 0.68)) * vec2(0.006, 0.004);
  vec2 pearlCenter = vec2(0.50, 0.46) + vec2(cos(colorTime * 0.48), sin(colorTime * 0.54)) * vec2(0.009, 0.007);
  float blueField = secondCircleField(sourceUv, blueCenter, vec2(0.62, 0.34));
  float violetField = secondCircleField(sourceUv, violetCenter, vec2(0.65, 0.23));
  float pearlField = secondCircleField(sourceUv, pearlCenter, vec2(0.56, 0.32));
  float compactViewport = 1.0 - smoothstep(1.55, 1.90, uResolution.x / uResolution.y);

  vec3 desktopBase = vec3(239.0, 239.0, 251.0) / 255.0;
  vec3 desktopSurface = desktopBase
    - blueField * vec3(109.0, 77.0, 7.0) / 255.0
    - violetField * vec3(30.0, 40.0, 4.0) / 255.0;

  vec3 compactSurface = vec3(155.0, 175.0, 232.0) / 255.0;
  compactSurface = mix(compactSurface, vec3(112.0, 155.0, 239.0) / 255.0, blueField * 0.38);
  compactSurface = mix(compactSurface, vec3(191.0, 151.0, 241.0) / 255.0, violetField * 0.34);

  vec3 surface = mix(desktopSurface, compactSurface, compactViewport);
  float pearlStrength = mix(0.09, 0.22, compactViewport);
  surface = mix(surface, vec3(204.0, 222.0, 249.0) / 255.0, pearlField * pearlStrength);
  // WebGL UVs start at bottom-left, so (1, 0) is the screen's bottom-right corner.
  float bottomRightDistance = length((sourceUv - vec2(1.0, 0.0)) * vec2(0.85, 1.10));
  float bottomRightWhite = 1.0 - smoothstep(0.08, 0.82, bottomRightDistance);
  float bottomRightLift = pow(bottomRightWhite, 1.25) * 0.74;
  vec3 pearlWhite = vec3(245.0, 249.0, 255.0) / 255.0;
  return clamp(mix(surface, pearlWhite, bottomRightLift), 0.0, 1.0);
}

vec4 alphaOver(vec4 back, vec4 front) {
  float outAlpha = front.a + back.a * (1.0 - front.a);
  vec3 outColor = (front.rgb * front.a + back.rgb * back.a * (1.0 - front.a)) / max(outAlpha, 0.0001);
  return vec4(outColor, outAlpha);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  float upperFront = uFrontMix;
  float lowerFront = 1.0 - uFrontMix;
  float horizontal = uv.x - 0.5;
  float profile = horizontal * uBandTilt + (horizontal * horizontal - 0.25) * uBandCurve;
  float upperHeight = uUpperBandHeight + profile - upperFront * uDepthShift + lowerFront * uDepthShift * 0.22;
  float lowerHeight = uLowerBandHeight + profile - lowerFront * uDepthShift + upperFront * uDepthShift * 0.22;
  float outerRadius = uOuterRadius + upperFront * uDepthShift - lowerFront * uDepthShift * 0.22;
  float innerRadius = uInnerRadius + lowerFront * uDepthShift - upperFront * uDepthShift * 0.22;
  float field1 = uRadialMode > 0.5 ? radialField(t, shift, outerRadius, 0.0) : auroraField(t, shift, upperHeight);
  float field2 = uRadialMode > 0.5 ? radialField(t + uLayerOffset, shift, innerRadius, uInnerCenterYOffset) : auroraField(t + uLayerOffset, shift, lowerHeight);
  float glow1 = auroraGlow(field1) * mix(0.68, 1.24, upperFront);
  float glow2 = auroraGlow(field2) * mix(0.68, 1.24, lowerFront);
  vec3 gradient1 = cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20));
  vec3 gradient2 = cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));

  vec3 col = 0.99 * glow1 * gradient1 * uColor1;
  col += 0.99 * glow2 * gradient2 * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  if (uLightMode > 0.5) {
    float upperFill = (1.0 - smoothstep(-0.14, 0.0, field1)) * smoothstep(-4.4, -0.38, field1);
    float lowerFill = (1.0 - smoothstep(-0.14, 0.0, field2)) * smoothstep(-16.0, -0.42, field2);
    float upperAlpha = upperFill * mix(0.08, 0.13, upperFront);
    float lowerAlpha = lowerFill * mix(0.20, 0.52, lowerFront);
    vec4 upperLayer = vec4(uSurfaceColor1, upperAlpha);
    vec3 lowerSurface = uSurfaceColor2;
    if (lowerFill > 0.001) {
      lowerSurface = secondCircleSurface(uv, uTime);
    }
    vec4 lowerLayer = vec4(lowerSurface, lowerAlpha);
    vec4 lightLayer = mix(alphaOver(upperLayer, lowerLayer), alphaOver(lowerLayer, upperLayer), upperFront);

    float emissionPeak = max(col.r, max(col.g, col.b));
    vec3 emissionColor = clamp(col / max(emissionPeak, 0.0001), 0.0, 1.0);
    vec3 lowerEmission = 0.99 * glow2 * gradient2 * uColor2 * uBrightness;
    float lowerEmissionPeak = max(lowerEmission.r, max(lowerEmission.g, lowerEmission.b));
    vec3 lowerEmissionColor = clamp(lowerEmission / max(lowerEmissionPeak, 0.0001), 0.0, 1.0);
    float upperOutside = smoothstep(0.0, 0.18, field1);
    float lowerOutside = smoothstep(0.0, 0.18, field2);
    float upperEmissionSide = smoothstep(-0.12, 0.14, field1);
    float lowerEmissionSide = smoothstep(-0.12, 0.14, field2);
    float phosphorSide = max(upperEmissionSide, lowerEmissionSide);
    float emissionAlpha = clamp(emissionPeak * 1.55, 0.0, 0.54) * phosphorSide;

    float upperHalo = exp(-abs(field1) * 2.8) * 0.72;
    float lowerHalo = exp(-abs(field2) * 2.8) * 0.72;
    float upperCore = exp(-abs(field1) * 22.0) * 0.72;
    float lowerCore = exp(-abs(field2) * 22.0) * 0.72;
    vec3 upperEdge = mix(uColor1, vec3(1.0), 0.58);
    vec3 lowerEdge = mix(uColor2, vec3(1.0), 0.56);

    float upperEdgeAlpha = clamp(upperHalo * 0.14 + upperCore * 0.56, 0.0, 0.68) * upperOutside;
    float lowerEdgeAlpha = clamp(lowerHalo * 0.14 + lowerCore * 0.56, 0.0, 0.68) * lowerOutside;
    lightLayer = alphaOver(lightLayer, vec4(upperEdge, upperEdgeAlpha));
    lightLayer = alphaOver(lightLayer, vec4(lowerEdge, lowerEdgeAlpha));
    float whiteCore = clamp((exp(-abs(field1) * 38.0) + exp(-abs(field2) * 38.0)) * 0.72, 0.0, 1.0);
    lightLayer = alphaOver(lightLayer, vec4(1.0, 1.0, 1.0, whiteCore * 0.68));
    lightLayer = alphaOver(lightLayer, vec4(mix(emissionColor, vec3(1.0), 0.24), emissionAlpha));
    float lowerCoreTint = exp(-abs(field2) * 38.0) * 0.72 * lowerEmissionSide;
    lightLayer = alphaOver(lightLayer, vec4(mix(lowerEmissionColor, vec3(1.0), 0.24), lowerCoreTint * 0.58));
    gl_FragColor = vec4(clamp(lightLayer.rgb, 0.0, 1.0), clamp(lightLayer.a, 0.0, 1.0));
  } else {
    gl_FragColor = vec4(col, alpha);
  }
}
`;

export default function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1.0,
  color1 = '#f7f7f7',
  color2 = '#e100ff',
  surfaceColor1 = '#8f8bed',
  surfaceColor2 = '#6484f1',
  noiseFrequency = 2.5,
  noiseAmplitude = 1.0,
  bandHeight = 0.5,
  upperBandHeight = 0.66,
  lowerBandHeight = 0.39,
  bandTilt = 0,
  bandCurve = 0,
  radialMode = false,
  radialCenterX = 1.04,
  radialCenterY = -0.48,
  innerCenterYOffset = 0,
  outerRadius = 1.49,
  innerRadius = 1.19,
  depthShift = 0.035,
  bandSpread = 1.0,
  octaveDecay = 0.1,
  layerOffset = 0,
  colorSpeed = 1.0,
  enableMouseInteraction = true,
  mouseInfluence = 0.25,
  lightMode = false,
  interactiveLayers = false,
  initialFrontLayer = 'lower',
  ariaLabel = 'Switch foreground wave'
}: SoftAuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    // Program is assigned after the initial size measurement used by resize().
    // eslint-disable-next-line prefer-const
    let program: Program;
    const currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];
    let currentFront = initialFrontLayer === 'upper' ? 1 : 0;
    let targetFront = currentFront;

    function handleMouseMove(e: MouseEvent) {
      const rect = gl.canvas.getBoundingClientRect();
      targetMouse = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height
      ];
    }

    function handleMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    function setFrontLayer(layer: 'upper' | 'lower') {
      targetFront = layer === 'upper' ? 1 : 0;
      const displayLayer = radialMode ? (layer === 'upper' ? 'outer' : 'inner') : layer;
      gl.canvas.dataset.frontLayer = displayLayer;
      gl.canvas.setAttribute('aria-label', `${ariaLabel}. ${displayLayer[0].toUpperCase()}${displayLayer.slice(1)} wave in foreground`);
    }

    function handlePointerDown(e: PointerEvent) {
      const rect = gl.canvas.getBoundingClientRect();
      const normalizedY = (e.clientY - rect.top) / rect.height;
      if (radialMode) {
        const normalizedX = (e.clientX - rect.left) / rect.width;
        const aspect = rect.width / rect.height;
        const dx = (normalizedX - radialCenterX) * aspect;
        const glY = 1 - normalizedY;
        const outerDistance = Math.hypot(dx, glY - radialCenterY);
        const innerDistance = Math.hypot(dx, glY - (radialCenterY + innerCenterYOffset));
        setFrontLayer(Math.abs(outerDistance - outerRadius) < Math.abs(innerDistance - innerRadius) ? 'upper' : 'lower');
        return;
      }
      const normalizedX = (e.clientX - rect.left) / rect.width;
      const horizontal = normalizedX - 0.5;
      const profile = horizontal * bandTilt + (horizontal * horizontal - 0.25) * bandCurve;
      const upperScreenY = 1 - (upperBandHeight + profile);
      const lowerScreenY = 1 - (lowerBandHeight + profile);
      const splitY = (upperScreenY + lowerScreenY) * 0.5;
      setFrontLayer(normalizedY < splitY ? 'upper' : 'lower');
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFrontLayer('upper');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFrontLayer('lower');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFrontLayer(targetFront > 0.5 ? 'lower' : 'upper');
      }
    }

    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      if (program) {
        program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
      }
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uSurfaceColor1: { value: hexToVec3(surfaceColor1) },
        uSurfaceColor2: { value: hexToVec3(surfaceColor2) },
        uNoiseFreq: { value: noiseFrequency },
        uNoiseAmp: { value: noiseAmplitude },
        uBandHeight: { value: bandHeight },
        uUpperBandHeight: { value: upperBandHeight },
        uLowerBandHeight: { value: lowerBandHeight },
        uBandTilt: { value: bandTilt },
        uBandCurve: { value: bandCurve },
        uRadialMode: { value: radialMode ? 1 : 0 },
        uRadialCenterX: { value: radialCenterX },
        uRadialCenterY: { value: radialCenterY },
        uInnerCenterYOffset: { value: innerCenterYOffset },
        uOuterRadius: { value: outerRadius },
        uInnerRadius: { value: innerRadius },
        uDepthShift: { value: depthShift },
        uFrontMix: { value: currentFront },
        uBandSpread: { value: bandSpread },
        uOctaveDecay: { value: octaveDecay },
        uLayerOffset: { value: layerOffset },
        uColorSpeed: { value: colorSpeed },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: mouseInfluence },
        uEnableMouse: { value: enableMouseInteraction },
        uLightMode: { value: lightMode ? 1 : 0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    if (interactiveLayers) {
      gl.canvas.tabIndex = 0;
      gl.canvas.setAttribute('role', 'button');
      gl.canvas.style.cursor = 'pointer';
      setFrontLayer(initialFrontLayer);
      gl.canvas.addEventListener('pointerdown', handlePointerDown);
      gl.canvas.addEventListener('keydown', handleKeyDown);
    }

    if (enableMouseInteraction) {
      gl.canvas.addEventListener('mousemove', handleMouseMove);
      gl.canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    let animationFrameId: number;

    function update(time: number) {
      animationFrameId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      currentFront += 0.055 * (targetFront - currentFront);
      program.uniforms.uFrontMix.value = currentFront;

      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        program.uniforms.uMouse.value[0] = currentMouse[0];
        program.uniforms.uMouse.value[1] = currentMouse[1];
      } else {
        program.uniforms.uMouse.value[0] = 0.5;
        program.uniforms.uMouse.value[1] = 0.5;
      }

      renderer.render({ scene: mesh });
    }
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (enableMouseInteraction) {
        gl.canvas.removeEventListener('mousemove', handleMouseMove);
        gl.canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (interactiveLayers) {
        gl.canvas.removeEventListener('pointerdown', handlePointerDown);
        gl.canvas.removeEventListener('keydown', handleKeyDown);
      }
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [speed, scale, brightness, color1, color2, surfaceColor1, surfaceColor2, noiseFrequency, noiseAmplitude, bandHeight, upperBandHeight, lowerBandHeight, bandTilt, bandCurve, radialMode, radialCenterX, radialCenterY, innerCenterYOffset, outerRadius, innerRadius, depthShift, bandSpread, octaveDecay, layerOffset, colorSpeed, enableMouseInteraction, mouseInfluence, lightMode, interactiveLayers, initialFrontLayer, ariaLabel]);

  return <div ref={containerRef} className="soft-aurora-container" />;
}
