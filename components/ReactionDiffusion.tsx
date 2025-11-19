import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import { AppConfig } from '../types';

// -- SHADERS --

const simulationVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simulationFragmentShader = `
uniform sampler2D uTexture;
uniform sampler2D uInput;
uniform vec2 uResolution;
uniform float uFeed;
uniform float uKill;
uniform float uDt;
varying vec2 vUv;

void main() {
    vec2 texel = 1.0 / uResolution;
    
    vec4 uv = texture2D(uTexture, vUv);
    float a = uv.r;
    float b = uv.g;

    // Weighted Laplacian (Moore Neighborhood)
    vec2 t = vec2(0.0, -texel.y);
    vec2 r = vec2(texel.x, 0.0);
    
    vec4 u = texture2D(uTexture, vUv - t);
    vec4 d = texture2D(uTexture, vUv + t);
    vec4 l = texture2D(uTexture, vUv - r);
    vec4 ri = texture2D(uTexture, vUv + r);
    
    vec4 ul = texture2D(uTexture, vUv - r - t);
    vec4 ur = texture2D(uTexture, vUv + r - t);
    vec4 dl = texture2D(uTexture, vUv - r + t);
    vec4 dr = texture2D(uTexture, vUv + r + t);
    
    float lapA = (u.r + d.r + l.r + ri.r) * 0.2 + 
                 (ul.r + ur.r + dl.r + dr.r) * 0.05 - 
                 1.0 * a;
                 
    float lapB = (u.g + d.g + l.g + ri.g) * 0.2 + 
                 (ul.g + ur.g + dl.g + dr.g) * 0.05 - 
                 1.0 * b;
    
    // Gray-Scott Reaction Diffusion
    float nextA = a + (1.0 * lapA - a * b * b + uFeed * (1.0 - a)) * uDt;
    float nextB = b + (0.5 * lapB + a * b * b - (uKill + uFeed) * b) * uDt;

    // Text Input Injection
    float seed = texture2D(uInput, vUv).r;
    if(seed > 0.1) {
        nextB = mix(nextB, 0.9, 0.5); // Soft inject
    }

    gl_FragColor = vec4(clamp(nextA, 0.0, 1.0), clamp(nextB, 0.0, 1.0), 0.0, 1.0);
}
`;

const displayVertexShader = `
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;
uniform sampler2D uTexture;
uniform float uDisplacementScale;

void main() {
    vUv = uv;
    vec4 data = texture2D(uTexture, uv);
    
    // Displace based on Chemical B
    float displacement = data.g * uDisplacementScale; 
    vDisplacement = displacement;
    
    vec3 pos = position;
    pos.z += displacement;
    
    vNormal = normal;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const displayFragmentShader = `
varying vec2 vUv;
varying float vDisplacement;
uniform sampler2D uTexture;
uniform vec3 uColor1;
uniform vec3 uColor2;

void main() {
    vec4 data = texture2D(uTexture, vUv);
    float b = data.g;
    
    // Sharper threshold for cleaner look
    vec3 col = mix(vec3(0.0), uColor1, smoothstep(0.05, 0.2, b));
    col = mix(col, uColor2, smoothstep(0.2, 0.5, b));
    
    // Artificial shading based on displacement/concentration
    col *= smoothstep(0.05, 0.2, b);
    
    // Add a subtle highlight at the top
    float highlight = smoothstep(0.4, 0.6, b);
    col += vec3(highlight) * 0.3;

    gl_FragColor = vec4(col, 1.0);
}
`;

interface ReactionDiffusionProps {
  textInput: string;
  config: AppConfig;
}

export const ReactionDiffusion: React.FC<ReactionDiffusionProps> = ({ textInput, config }) => {
  
  const params = useMemo(() => ({
    dt: 1.0,
    resX: 300, // Slight increase for better multiline text resolution
    resY: 300
  }), []);

  // Framebuffers
  const options = { 
    magFilter: THREE.LinearFilter, 
    minFilter: THREE.LinearFilter, 
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping
  };
  
  const bufferA = useFBO(params.resX, params.resY, options);
  const bufferB = useFBO(params.resX, params.resY, options);
  
  // Text Input Texture
  const textCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = params.resX;
    canvas.height = params.resY;
    return canvas;
  }, [params.resX, params.resY]);
  
  const textTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(textCanvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [textCanvas]);

  // Update Text Texture with Fonts and Multiline support
  useEffect(() => {
    const ctx = textCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, params.resX, params.resY);
      
      const fontSize = config.fontSize;
      
      // Select weight based on font family for better aesthetic
      let fontWeight = '400';
      if (config.fontFamily === 'Inter') fontWeight = '200'; // ExtraLight
      if (config.fontFamily === 'Orbitron') fontWeight = '900';
      
      ctx.font = `${fontWeight} ${fontSize}px "${config.fontFamily}", sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.save();

      // Handle Case Sensitivity
      const textToRender = config.useCaps ? textInput.toUpperCase() : textInput;

      // Multiline Processing
      const lines = textToRender.split('\n');
      // Use a slightly reduced line height for tighter packing in the diffusion map
      const lineHeight = fontSize * 0.85; 
      const totalBlockHeight = lines.length * lineHeight;
      
      // Calculate widest line for scaling
      let maxLineWidth = 0;
      lines.forEach(line => {
          const metrics = ctx.measureText(line);
          if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
      });
      
      const maxW = params.resX * 0.9;
      const maxH = params.resY * 0.9;
      
      let scale = 1;
      // Constraint by width
      if (maxLineWidth > maxW) {
         scale = maxW / maxLineWidth;
      }
      // Constraint by height
      if (totalBlockHeight * scale > maxH) {
         scale = maxH / totalBlockHeight;
      }
      
      ctx.translate(params.resX / 2, params.resY / 2);
      ctx.scale(scale, scale);
      
      // Draw lines centered
      // Calculate Y start to center the whole block
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
          ctx.fillText(line, 0, startY + (i * lineHeight));
      });
      
      ctx.restore();
      
      textTexture.needsUpdate = true;
    }
  }, [textInput, textCanvas, textTexture, params.resX, params.resY, config.fontFamily, config.fontSize, config.useCaps]);

  // Shader Materials
  const simMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uInput: { value: textTexture },
        uResolution: { value: new THREE.Vector2(params.resX, params.resY) },
        uFeed: { value: config.feed },
        uKill: { value: config.kill },
        uDt: { value: params.dt }
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader
    });
  }, [params, textTexture]); 

  const renderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uDisplacementScale: { value: config.displacementScale },
        uColor1: { value: new THREE.Color(config.color1) },
        uColor2: { value: new THREE.Color(config.color2) },
      },
      vertexShader: displayVertexShader,
      fragmentShader: displayFragmentShader,
    });
  }, []);

  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simMesh = useRef<THREE.Mesh>(null);

  // Reactive Updates for Uniforms
  useEffect(() => {
    if (simMaterial) {
        simMaterial.uniforms.uFeed.value = config.feed;
        simMaterial.uniforms.uKill.value = config.kill;
    }
    if (renderMaterial) {
        renderMaterial.uniforms.uDisplacementScale.value = config.displacementScale;
        renderMaterial.uniforms.uColor1.value.set(config.color1);
        renderMaterial.uniforms.uColor2.value.set(config.color2);
    }
  }, [config, simMaterial, renderMaterial]);

  useFrame((state) => {
    if (!simMesh.current) return;

    const ITERATIONS = 4;
    
    for(let i=0; i<ITERATIONS; i++) {
          // Step 1: A -> B
          simMesh.current.material = simMaterial;
          simMaterial.uniforms.uTexture.value = bufferA.texture;
          state.gl.setRenderTarget(bufferB);
          state.gl.render(scene, camera);
          
          // Step 2: B -> A
          simMaterial.uniforms.uTexture.value = bufferB.texture;
          state.gl.setRenderTarget(bufferA);
          state.gl.render(scene, camera);
    }
    
    state.gl.setRenderTarget(null);
    renderMaterial.uniforms.uTexture.value = bufferA.texture;
  });

  return (
    <>
      {createPortal(
        <mesh ref={simMesh}>
          <planeGeometry args={[2, 2]} />
        </mesh>,
        scene
      )}

      <mesh rotation={[-Math.PI / 3.5, 0, 0]} position={[0, 0, 0]}>
        {/* Optimized geometry for detail vs performance */}
        <planeGeometry args={[10, 10, 240, 240]} />
        <primitive object={renderMaterial} attach="material" />
      </mesh>
    </>
  );
};