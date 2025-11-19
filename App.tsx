import React, { useState, Suspense } from 'react';
import Experience from './components/Experience';
import { Overlay } from './components/Overlay';
import { AppConfig } from './types';

const App: React.FC = () => {
  const [text, setText] = useState<string>(""); // Start blank
  
  // Default stable configuration
  const [config, setConfig] = useState<AppConfig>({
    feed: 0.030,
    kill: 0.062,
    displacementScale: 0.6,
    color1: '#00c3ff',
    color2: '#ff0055',
    fontFamily: 'Inter',
    fontSize: 80, // Smaller starting scale
    bloomIntensity: 1.2,
    useCaps: true // Start with All Caps
  });

  return (
    <main className="relative w-full h-full bg-black overflow-hidden">
      
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center text-white font-mono text-xs">LOADING SHADERS...</div>}>
          <Experience textInput={text} config={config} />
        </Suspense>
      </div>

      {/* UI Layer */}
      <Overlay text={text} setText={setText} config={config} setConfig={setConfig} />
      
    </main>
  );
};

export default App;