import React, { useState, Suspense } from 'react';
import Experience from './components/Experience';
import { Overlay, SettingsPanel } from './components/Overlay';
import { AppConfig } from './types';

const App: React.FC = () => {
  const [text, setText] = useState<string>(""); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Start closed
  const [hasStarted, setHasStarted] = useState(false);
  const [resetKey, setResetKey] = useState(0); // For forcing canvas reset
  
  // Default stable configuration
  const [config, setConfig] = useState<AppConfig>({
    feed: 0.0545, // Coral default
    kill: 0.0620, // Coral default
    displacementScale: 0.6,
    speed: 0.8,
    aberration: 0.004,
    noise: 0.04,
    color1: '#00c3ff',
    color2: '#ff0055',
    backgroundColor: '#050505',
    fontFamily: 'MuseoModerno',
    fontSize: 40, 
    bloomIntensity: 1.2,
    freeRoam: false,
  });

  const handleStart = () => {
    setHasStarted(true);
    // Only auto-open settings on desktop (width >= 768px)
    if (window.innerWidth >= 768) {
      setIsSettingsOpen(true);
    }
  };

  const handleReset = () => {
    setText("");
    setResetKey(prev => prev + 1);
  };

  return (
    <main className="flex w-full h-full bg-black overflow-hidden flex-col md:flex-row relative">
      
      {/* Responsive Sidebar / Bottom Sheet */}
      <aside className={`
        bg-zinc-950 z-50 overflow-hidden flex-shrink-0
        
        /* Mobile: Bottom Sheet Overlay */
        fixed inset-x-0 bottom-0 
        border-t border-white/10 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
        transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isSettingsOpen ? 'translate-y-0' : 'translate-y-full'}
        h-[70vh] md:h-auto

        /* Desktop: Sidebar overrides */
        md:relative md:inset-auto md:h-full md:rounded-none md:border-t-0 md:border-r md:shadow-none 
        md:translate-y-0 md:transition-[width] md:duration-500 md:ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${isSettingsOpen ? 'md:w-80' : 'md:w-0 md:border-r-0'}
      `}>
        <SettingsPanel 
          config={config} 
          setConfig={setConfig} 
          onReset={handleReset}
          setIsOpen={setIsSettingsOpen}
        />
      </aside>

      {/* Main Area: Canvas + HUD */}
      <div className="relative flex-1 h-full min-w-0 order-first md:order-last">
        {/* 3D Layer */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center text-white font-mono text-xs">LOADING SHADERS...</div>}>
            <Experience textInput={text} config={config} resetKey={resetKey} />
          </Suspense>
        </div>

        {/* UI Layer */}
        <Overlay 
            text={text} 
            setText={setText} 
            isSettingsOpen={isSettingsOpen} 
            setIsSettingsOpen={setIsSettingsOpen}
            hasStarted={hasStarted}
            onStart={handleStart}
            config={config}
            setConfig={setConfig}
        />
      </div>
      
    </main>
  );
};

export default App;