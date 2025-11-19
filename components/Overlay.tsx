import React, { useRef, useState } from 'react';
import { audioSynth } from '../services/AudioSynth';
import { AppConfig } from '../types';

interface OverlayProps {
  text: string;
  setText: (t: string) => void;
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
}

// Pre-defined Reaction Diffusion Regimes
const RD_PRESETS = [
  { name: 'Cellular', feed: 0.030, kill: 0.062 },
  { name: 'Coral', feed: 0.0545, kill: 0.062 },
  { name: 'Mitosis', feed: 0.0367, kill: 0.0644 },
  { name: 'Mazes', feed: 0.029, kill: 0.057 },
  { name: 'Chaos', feed: 0.025, kill: 0.060 },
];

export const Overlay: React.FC<OverlayProps> = ({ text, setText, config, setConfig }) => {
  const [started, setStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > 60) return; 
    
    // Allow newlines, respect user casing
    setText(newVal);
    
    // Trigger audio on valid char entry
    if (newVal.length > text.length) {
       const charCode = newVal.charCodeAt(newVal.length - 1);
       audioSynth.triggerNote(charCode);
    }
  };

  // Handle initial start for audio context
  const handleStart = async () => {
    await audioSynth.init();
    setStarted(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keep focus on input unless interacting with controls
  const handleGlobalClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.controls-panel')) return;
    if ((e.target as HTMLElement).closest('button')) return;

    if (started && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const applyPreset = (preset: typeof RD_PRESETS[0]) => {
    setConfig({
      ...config,
      feed: preset.feed,
      kill: preset.kill
    });
  };

  return (
    <div 
      className="absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-8"
      onClick={handleGlobalClick}
    >
      {/* Hidden Input */}
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        className="opacity-0 fixed top-0 left-0 pointer-events-auto w-0 h-0 resize-none overflow-hidden"
        autoFocus={started}
      />

      {/* Top Bar (Only Controls Toggle) */}
      <div className="flex justify-end w-full pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => setShowControls(!showControls)}
            className="text-xs font-mono text-white/60 hover:text-white border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors"
          >
            {showControls ? 'HIDE SETTINGS' : 'SETTINGS'}
          </button>
        </div>
      </div>

      {/* Center Start Button */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/80 backdrop-blur-sm transition-opacity duration-500 z-20">
          <button 
            onClick={handleStart}
            className="group relative px-12 py-6 bg-transparent border border-white/20 hover:border-pink-500 transition-colors duration-300"
          >
             <span className="text-white font-mono text-lg tracking-[0.2em] group-hover:text-pink-400 transition-colors">
               BEGIN
             </span>
             <div className="absolute inset-0 bg-pink-500/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          </button>
        </div>
      )}

      {/* Controls Panel */}
      <div className={`controls-panel absolute top-20 right-4 md:right-8 w-72 bg-black/80 backdrop-blur-xl border border-white/10 p-6 text-white transition-transform duration-300 ease-in-out ${showControls ? 'translate-x-0' : 'translate-x-[150%]'} pointer-events-auto max-h-[80vh] overflow-y-auto rounded-sm shadow-2xl`}>
        
        <div className="space-y-8">
          
          {/* Typography Section */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-widest text-pink-500 font-bold block mb-2 border-b border-white/10 pb-1">TYPEFACE</label>
            <select 
              value={config.fontFamily} 
              onChange={(e) => updateConfig('fontFamily', e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-xs p-2 outline-none focus:border-pink-500 text-white/90 font-mono mb-2"
            >
              <option value="Inter">Inter (Light)</option>
              <option value="Orbitron">Orbitron (Sci-Fi)</option>
              <option value="Monoton">Monoton (Retro)</option>
              <option value="Rubik Glitch">Rubik (Glitch)</option>
              <option value="UnifrakturMaguntia">Unifraktur (Gothic)</option>
              <option value="Permanent Marker">Marker (Graffiti)</option>
            </select>

            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <span className="text-[10px] font-mono text-white/40">ALL CAPS</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.useCaps} 
                  onChange={(e) => updateConfig('useCaps', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-white/40">SCALE</span>
              <input 
                type="range" min="20" max="300" step="5"
                value={config.fontSize}
                onChange={(e) => updateConfig('fontSize', parseFloat(e.target.value))}
                className="w-32 accent-pink-500 h-1 bg-white/10 appearance-none rounded-full"
              />
            </div>
          </div>

          {/* Reaction Diffusion Patterns */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-widest text-cyan-400 font-bold block mb-2 border-b border-white/10 pb-1">REACTION PATTERN</label>
            
            <div className="grid grid-cols-2 gap-2">
              {RD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`text-[10px] font-mono py-2 border transition-all duration-200 
                    ${Math.abs(config.feed - preset.feed) < 0.001 
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200' 
                      : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Fine Tuning (Collapsible/Small) */}
            <div className="pt-2 space-y-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>FEED RATE</span>
                  <span>{config.feed.toFixed(4)}</span>
                </div>
                <input 
                  type="range" min="0.01" max="0.1" step="0.0001"
                  value={config.feed}
                  onChange={(e) => updateConfig('feed', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-white/10 appearance-none rounded-full"
                />
              </div>
               <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>KILL RATE</span>
                  <span>{config.kill.toFixed(4)}</span>
                </div>
                <input 
                  type="range" min="0.01" max="0.1" step="0.0001"
                  value={config.kill}
                  onChange={(e) => updateConfig('kill', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-white/10 appearance-none rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Aesthetics */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-widest text-yellow-400 font-bold block mb-2 border-b border-white/10 pb-1">AESTHETICS</label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>DEPTH</span>
                <span>{config.displacementScale.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="3" step="0.1"
                value={config.displacementScale}
                onChange={(e) => updateConfig('displacementScale', parseFloat(e.target.value))}
                className="w-full accent-yellow-400 h-1 bg-white/10 appearance-none rounded-full"
              />
            </div>

             <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>GLOW</span>
                <span>{config.bloomIntensity.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="4" step="0.1"
                value={config.bloomIntensity}
                onChange={(e) => updateConfig('bloomIntensity', parseFloat(e.target.value))}
                className="w-full accent-yellow-400 h-1 bg-white/10 appearance-none rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[9px] text-white/30 font-mono block mb-1">PRIMARY</label>
                <input 
                  type="color" 
                  value={config.color1}
                  onChange={(e) => updateConfig('color1', e.target.value)}
                  className="w-full h-6 bg-transparent border-0 p-0 cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/30 font-mono block mb-1">SECONDARY</label>
                <input 
                  type="color" 
                  value={config.color2}
                  onChange={(e) => updateConfig('color2', e.target.value)}
                  className="w-full h-6 bg-transparent border-0 p-0 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex gap-2">
               <button 
                onClick={() => setText("")}
                className="flex-1 text-[10px] font-bold tracking-wider font-mono bg-red-500/10 border border-red-500/30 py-2 hover:bg-red-500/20 text-red-300 transition-colors"
               >
                 CLEAR CANVAS
               </button>
          </div>
        </div>

      </div>

      {/* Minimal Footer */}
      <div className="w-full flex justify-center pointer-events-none pb-8">
        <p className={`text-white/20 font-mono text-[10px] tracking-[0.2em] transition-opacity duration-500 ${started && text.length === 0 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
          TYPE TO GENERATE
        </p>
      </div>
    </div>
  );
};