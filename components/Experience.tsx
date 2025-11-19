import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, DepthOfField, ChromaticAberration, Bloom, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { ReactionDiffusion } from './ReactionDiffusion';
import { AppConfig } from '../types';

interface ExperienceProps {
  textInput: string;
  config: AppConfig;
}

const Experience: React.FC<ExperienceProps> = ({ textInput, config }) => {
  return (
    <div className="w-full h-full relative bg-black">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 45 }}
        dpr={[1, 1.5]} 
        gl={{ antialias: false, stencil: false, depth: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.2} />
        
        <ReactionDiffusion textInput={textInput} config={config} />

        {/* Post Processing Pipeline */}
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={config.bloomIntensity} 
            radius={0.5}
          />
          
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.004, 0.004]} 
          />

          <DepthOfField
            focusDistance={0.02}
            focalLength={0.5} 
            bokehScale={3} 
            height={480}
          />
          
          <Noise opacity={0.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Experience;