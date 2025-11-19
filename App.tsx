
import React, { useState, Suspense } from 'react';
import Experience from './components/Experience';
import { Overlay, SettingsPanel } from './components/Overlay';
import { AppConfig } from './types';

const App: React.FC = () => {
  const [text, setText] = useState<string>(""); // Start blank
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default stable configuration
  const [config, setConfig] = useState<AppConfig>({
    feed: 0.030,
    kill: 0.062,
    displacementScale: 0.6,
    color1: '#00c3ff',
    color2: '#ff0055',
    backgroundColor: '#050505',
    fontFamily: 'Inter',
    fontSize: 45, // Smaller starting scale
    bloomIntensity: 1.2,
    useCaps: true // Start with All Caps
  });

  return (
    <main className="flex w-full h-full bg-black overflow-hidden">
      
      {/* Main Area: Canvas + HUD */}
      <div className="relative flex-1 h-full min-w-0">
        {/* 3D Layer */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center text-white font-mono text-xs">LOADING SHADERS...</div>}>
            <Experience textInput={text} config={config} />
          </Suspense>
        </div>

        {/* UI Layer */}
        <Overlay 
            text={text} 
            setText={setText} 
            isSettingsOpen={isSettingsOpen} 
            setIsSettingsOpen={setIsSettingsOpen} 
        />
      </div>
      
      {/* Sidebar Settings Panel */}
      <aside className={`${isSettingsOpen ? 'w-80 border-l border-white/10' : 'w-0 border-l-0'} bg-zinc-950 transition-[width] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden flex-shrink-0`}>
        <SettingsPanel config={config} setConfig={setConfig} setText={setText} />
      </aside>
      
    </main>
  );
};

export default App;
