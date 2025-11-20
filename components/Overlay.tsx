import React, { useRef, useState, useEffect } from 'react';
import { audioSynth } from '../services/AudioSynth';
import { AppConfig } from '../types';

interface SettingsPanelProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  setText: (t: string) => void;
}

// Refined Reaction Diffusion Regimes for distinct, alive visuals
const RD_PRESETS = [
  { name: 'Coral', feed: 0.0545, kill: 0.0620 },
  { name: 'Mitosis', feed: 0.0367, kill: 0.0644 },
  { name: 'Mazes', feed: 0.0290, kill: 0.0570 },
  { name: 'Chaos', feed: 0.0820, kill: 0.0600 },
  { name: 'Worms', feed: 0.0460, kill: 0.0630 },
  { name: 'Spots', feed: 0.0250, kill: 0.0600 },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig, setText }) => {
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
    <div className="w-80 h-full flex flex-col p-6 text-white overflow-y-auto">
       <div className="space-y-8 flex-1">
          {/* Typography Section */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-widest text-pink-500 font-bold block mb-2 border-b border-white/10 pb-1">TYPEFACE</label>
            <select 
              value={config.fontFamily} 
              onChange={(e) => updateConfig('fontFamily', e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-xs p-2 outline-none focus:border-pink-500 text-white/90 font-mono mb-2"
            >
              <option value="Geist">Geist (Modern)</option>
              <option value="Asul">Asul (Baroque)</option>
              <option value="MuseoModerno">MuseoModerno (Geo)</option>
              <option value="UnifrakturMaguntia">Unifraktur (Gothic)</option>
              <option value="Voltaire">Voltaire (Art Deco)</option>
              <option value="Parisienne">Parisienne (Script)</option>
              <option value="Gaegu">Gaegu (Handwritten)</option>
              <option value="Silkscreen">Silkscreen (Pixel)</option>
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
                    ${Math.abs(config.feed - preset.feed) < 0.001 && Math.abs(config.kill - preset.kill) < 0.001
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200' 
                      : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Fine Tuning - Ranges expanded to allow for Chaos and Spots */}
            <div className="pt-4 space-y-4 border-t border-white/5 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] text-cyan-200/70 font-mono">
                  <span>GROWTH (FEED)</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded">{config.feed.toFixed(4)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0100" 
                  max="0.1000" 
                  step="0.0001"
                  value={config.feed}
                  onChange={(e) => updateConfig('feed', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-white/10 appearance-none rounded-full cursor-pointer"
                />
                <p className="text-[8px] text-white/20 leading-tight">Controls expanding waves. Low = Spots, High = Chaos.</p>
              </div>
              
               <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] text-cyan-200/70 font-mono">
                  <span>DECAY (KILL)</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded">{config.kill.toFixed(4)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0450" 
                  max="0.0700" 
                  step="0.0001"
                  value={config.kill}
                  onChange={(e) => updateConfig('kill', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-white/10 appearance-none rounded-full cursor-pointer"
                />
                <p className="text-[8px] text-white/20 leading-tight">Controls pattern stability. Low = Solids, High = Sparse.</p>
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

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div>
                <label className="text-[9px] text-white/30 font-mono block mb-1">PRIMARY</label>
                <input 
                  type="color" 
                  value={config.color1}
                  onChange={(e) => updateConfig('color1', e.target.value)}
                  className="w-full h-6 bg-transparent border-0 p-0 cursor-pointer rounded opacity-80 hover:opacity-100"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/30 font-mono block mb-1">SECONDARY</label>
                <input 
                  type="color" 
                  value={config.color2}
                  onChange={(e) => updateConfig('color2', e.target.value)}
                  className="w-full h-6 bg-transparent border-0 p-0 cursor-pointer rounded opacity-80 hover:opacity-100"
                />
              </div>
              <div>
                <label className="text-[9px] text-white/30 font-mono block mb-1">BG</label>
                <input 
                  type="color" 
                  value={config.backgroundColor}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  className="w-full h-6 bg-transparent border-0 p-0 cursor-pointer rounded opacity-80 hover:opacity-100"
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

       {/* Footer Credit */}
       <div className="pt-6 pb-2 text-center border-t border-white/5 mt-4">
          <p className="text-[9px] text-white/30 font-mono">
            Made by <a href="https://bykins.com" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white underline decoration-white/30 transition-colors">kins</a>
          </p>
       </div>
    </div>
  );
};

interface OverlayProps {
  text: string;
  setText: (t: string | ((prev: string) => string)) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ text, setText, isSettingsOpen, setIsSettingsOpen }) => {
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > 60) return; 
    
    const isDelete = newVal.length < text.length;
    const isAdd = newVal.length > text.length;

    // Allow newlines, respect user casing
    setText(newVal);
    
    // Trigger audio based on action
    if (isAdd) {
       const charCode = newVal.charCodeAt(newVal.length - 1);
       audioSynth.triggerNote(charCode);
    } else if (isDelete) {
       // Backspace sound (passing a constant or specific note index)
       audioSynth.triggerNote(8); 
    }
  };

  // Handle initial start for audio context
  const handleStart = async () => {
    if (!started) {
        await audioSynth.init();
        setStarted(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }
  };

  // Global keyboard listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If already started, let the textarea handle input naturally
      if (started) {
        // Just ensure input is focused if we lost it
        if (document.activeElement !== inputRef.current && inputRef.current) {
           inputRef.current.focus();
        }
        return;
      }

      // Check for modifier keys to avoid triggering on shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      // Start the app on first valid keystroke (including backspace if they really want to start that way)
      handleStart();
      
      // If it's a single printable character, treat it as input
      if (e.key.length === 1) {
          setText((prev) => prev + e.key);
          audioSynth.triggerNote(e.key.charCodeAt(0));
      } else if (e.key === 'Backspace') {
          // Allow starting with backspace, though text is likely empty
          // No-op on text, but triggers start
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [started, setText]);

  // Keep focus on input unless interacting with controls or buttons
  const handleGlobalClick = (e: React.MouseEvent) => {
    // Prevent focus stealing if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input')) return;
    if ((e.target as HTMLElement).closest('select')) return;
    
    if (started && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-8 cursor-text"
      onClick={handleGlobalClick}
    >
      {/* Hidden Input */}
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        className="opacity-0 fixed top-0 left-0 pointer-events-none w-0 h-0 resize-none overflow-hidden"
        autoFocus={started}
      />

      {/* Top Bar (Only Controls Toggle) */}
      <div className="flex justify-end w-full pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(!isSettingsOpen);
            }}
            className="text-xs font-mono text-white/60 hover:text-white border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-colors uppercase"
          >
            {isSettingsOpen ? 'HIDE SETTINGS' : 'SETTINGS'}
          </button>
        </div>
      </div>

      {/* Center Start Button (Text-based trigger for Mobile/Click preference) */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/90 transition-opacity duration-700 z-50">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                handleStart();
            }}
            className="group relative p-12 focus:outline-none cursor-pointer"
          >
             <span className="font-['Asul'] text-xl md:text-2xl text-white/80 tracking-widest lowercase group-hover:text-white transition-colors duration-500 ease-out block">
               click to begin
             </span>
             <span className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[1px] bg-white/40 w-0 group-hover:w-12 transition-all duration-500 ease-out"></span>
          </button>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="w-full flex justify-center pointer-events-none pb-8">
      </div>
    </div>
  );
};