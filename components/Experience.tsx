
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, DepthOfField, ChromaticAberration, Bloom, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { ReactionDiffusion } from './ReactionDiffusion';
import { AppConfig } from '../types';

interface ExperienceProps {
  textInput: string;
  config: AppConfig;
}

const Experience: React.FC<ExperienceProps> = ({ textInput, config }) => {
  // Use config.aberration to determine offset vector
  const aberrationOffset = useMemo(() => {
    return new THREE.Vector2(config.aberration, config.aberration);
  }, [config.aberration]);

  return (
    <div className="w-full h-full relative bg-black">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 45 }}
        dpr={1.5} // Balanced DPR: Crisp enough for retina, but light enough for smooth video encoding
        // preserveDrawingBuffer is required for canvas.toDataURL() to work (Export Image)
        gl={{ 
          antialias: false, 
          stencil: false, 
          depth: false, 
          powerPreference: "high-performance",
          preserveDrawingBuffer: true 
        }}
      >
        <color attach="background" args={[config.backgroundColor]} />
        
        <ambientLight intensity={0.2} />
        
        <ReactionDiffusion textInput={textInput} config={config} />

        {/* Post Processing Pipeline */}
        <EffectComposer multisampling={0}>
          <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={config.bloomIntensity} 
            radius={0.5}
          />
          
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={aberrationOffset}
            radialModulation={false}
            modulationOffset={0}
          />

          <DepthOfField
            focusDistance={0.02}
            focalLength={0.5} 
            bokehScale={3} 
            height={480}
          />
          
          <Noise opacity={config.noise} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Experience;
