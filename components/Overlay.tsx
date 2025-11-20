
import React, { useRef, useState, useEffect } from 'react';
import { audioSynth } from '../services/AudioSynth';
import { AppConfig } from '../types';

interface SettingsPanelProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  setText: (t: string) => void;
}

// -- Color Utility Functions --

const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c/2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
};

// -- Custom Color Picker Component --

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (c: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, isOpen, onToggle }) => {
  const [hsl, setHsl] = useState(hexToHsl(color));
  const [localHex, setLocalHex] = useState(color);

  useEffect(() => {
    setHsl(hexToHsl(color));
    setLocalHex(color);
  }, [color]);

  const updateHSL = (key: 'h' | 's' | 'l', val: number) => {
    const newHsl = { ...hsl, [key]: val };
    setHsl(newHsl);
    const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setLocalHex(newHex);
    onChange(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalHex(e.target.value);
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative mb-2 pointer-events-auto">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[9px] text-white/30 font-mono">{label}</label>
        <div className="flex items-center gap-2">
            <div className="text-[9px] font-mono text-white/50">{color.toUpperCase()}</div>
            <button 
            onClick={onToggle}
            className="w-6 h-4 rounded border border-white/10 hover:scale-110 transition-transform shadow-sm"
            style={{ backgroundColor: color }}
            />
        </div>
      </div>
      
      {isOpen && (
        <div className="p-3 bg-zinc-900 rounded border border-white/10 mt-1 space-y-3 animate-in fade-in slide-in-from-top-1 shadow-xl z-20 relative">
           {/* Standard Hex Input */}
           <div className="flex items-center gap-2 border-b border-white/5 pb-2">
             <span className="text-[9px] font-mono text-white/40">#</span>
             <input 
                type="text" 
                value={localHex.replace('#', '')} 
                onChange={(e) => handleHexChange({ ...e, target: { ...e.target, value: '#' + e.target.value }})}
                className="bg-transparent text-[10px] font-mono text-white/80 outline-none w-full uppercase"
                maxLength={6}
             />
           </div>

           {/* HSL Sliders */}
           <div className="space-y-2">
               <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono w-3 text-white/40">H</span>
                <input 
                type="range" min="0" max="360" 
                value={hsl.h} 
                onChange={(e) => updateHSL('h', parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full appearance-none cursor-pointer" 
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono w-3 text-white/40">S</span>
                <input 
                type="range" min="0" max="100" 
                value={hsl.s} 
                onChange={(e) => updateHSL('s', parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none accent-white cursor-pointer" 
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono w-3 text-white/40">L</span>
                <input 
                type="range" min="0" max="100" 
                value={hsl.l} 
                onChange={(e) => updateHSL('l', parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none accent-white cursor-pointer" 
                />
            </div>
           </div>
        </div>
      )}
    </div>
  );
};


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
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const applyPreset = (preset: typeof RD_PRESETS[0]) => {
    setConfig({
      ...config,
      feed: preset.feed,
      kill: preset.kill,
      presetName: preset.name
    });
    // Update audio profile immediately
    audioSynth.setProfile(preset.name);
  };

  const togglePicker = (id: string) => {
    setActivePicker(activePicker === id ? null : id);
  };

  // Export Functions
  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    // Create a temporary link
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `typediff-art-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const toggleRecording = async () => {
    if (isRecording) {
        // Stop Recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    } else {
        // Start Recording
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        
        // Ensure audio is initialized
        await audioSynth.init();

        // Capture stream at 60fps
        const canvasStream = canvas.captureStream(60); 
        
        // Get Audio Stream from Synth
        const audioStream = audioSynth.getAudioStream();
        
        // Combine Tracks
        const combinedTracks = [
            ...canvasStream.getVideoTracks(),
            ...(audioStream ? audioStream.getAudioTracks() : [])
        ];
        
        const combinedStream = new MediaStream(combinedTracks);
        
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4'
        ];
        
        const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
        
        // High Bitrate for FullHD Quality (25 Mbps)
        const options: MediaRecorderOptions = { 
            mimeType: selectedMimeType,
            videoBitsPerSecond: 25000000 
        };

        try {
          const recorder = new MediaRecorder(combinedStream, selectedMimeType ? options : undefined);
          
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          
          recorder.onstop = () => {
              const blobType = selectedMimeType || 'video/webm';
              const blob = new Blob(chunksRef.current, { type: blobType });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
              link.download = `typediff-video-${timestamp}.${ext}`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
          };

          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        } catch (error) {
          console.error("Failed to start recording:", error);
          setIsRecording(false);
        }
    }
  };

  return (
    <div className="w-80 h-full flex flex-col p-6 text-white overflow-y-auto pointer-events-auto">
       <div className="space-y-8 flex-1 pb-20">
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
                    ${config.presetName === preset.name
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-200' 
                      : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:text-white'}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Fine Tuning */}
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
              </div>
              
              {/* Sim Speed - Restricted to 1.0 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] text-cyan-200/70 font-mono">
                  <span>SIM SPEED</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded">{config.speed.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.1"
                  value={config.speed}
                  onChange={(e) => updateConfig('speed', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-white/10 appearance-none rounded-full cursor-pointer"
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

            {/* Creative Options: Aberration & Noise */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>RGB SHIFT</span>
                <span>{(config.aberration * 100).toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="0.02" step="0.0005"
                value={config.aberration}
                onChange={(e) => updateConfig('aberration', parseFloat(e.target.value))}
                className="w-full accent-yellow-400 h-1 bg-white/10 appearance-none rounded-full"
              />
            </div>
            
             <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>NOISE GRAIN</span>
                <span>{config.noise.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="0.3" step="0.01"
                value={config.noise}
                onChange={(e) => updateConfig('noise', parseFloat(e.target.value))}
                className="w-full accent-yellow-400 h-1 bg-white/10 appearance-none rounded-full"
              />
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 gap-1 pt-2">
              <ColorPicker 
                label="PRIMARY" 
                color={config.color1} 
                onChange={(c) => updateConfig('color1', c)} 
                isOpen={activePicker === 'color1'}
                onToggle={() => togglePicker('color1')}
              />
              <ColorPicker 
                label="SECONDARY" 
                color={config.color2} 
                onChange={(c) => updateConfig('color2', c)} 
                isOpen={activePicker === 'color2'}
                onToggle={() => togglePicker('color2')}
              />
              <ColorPicker 
                label="BACKGROUND" 
                color={config.backgroundColor} 
                onChange={(c) => updateConfig('backgroundColor', c)} 
                isOpen={activePicker === 'bg'}
                onToggle={() => togglePicker('bg')}
              />
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-3">
             <label className="text-[10px] tracking-widest text-emerald-400 font-bold block mb-2 border-b border-white/10 pb-1">EXPORT</label>
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSnapshot}
                  className="text-[10px] font-mono py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition-colors"
                >
                  SAVE IMAGE
                </button>
                 <button 
                  onClick={toggleRecording}
                  className={`text-[10px] font-mono py-3 border transition-colors flex items-center justify-center gap-2
                    ${isRecording 
                        ? 'border-red-500 bg-red-500 text-white animate-pulse' 
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-white'}`}
                >
                  {isRecording ? (
                      <>
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      STOP VIDEO
                      </>
                  ) : 'RECORD VIDEO'}
                </button>
             </div>
             <p className="text-[9px] text-white/30 font-mono leading-tight">
                Images saved as PNG. Video includes audio (WebM/MP4).
             </p>
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
  config: AppConfig;
}

export const Overlay: React.FC<OverlayProps> = ({ text, setText, isSettingsOpen, setIsSettingsOpen, config }) => {
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > 60) return; 
    
    const isDelete = newVal.length < text.length;
    const isAdd = newVal.length > text.length;

    setText(newVal);
    
    if (isAdd) {
       const charCode = newVal.charCodeAt(newVal.length - 1);
       audioSynth.triggerNote(charCode);
    } else if (isDelete) {
       audioSynth.triggerNote(8); 
    }
  };

  // Handle initial start for audio context
  const handleStart = async () => {
    if (!started) {
        await audioSynth.init();
        // Apply current preset sound on start
        if (config.presetName) audioSynth.setProfile(config.presetName);
        setStarted(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (started) {
        if (document.activeElement !== inputRef.current && inputRef.current) {
           inputRef.current.focus();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      handleStart();
      
      if (e.key.length === 1) {
          setText((prev) => prev + e.key);
          audioSynth.triggerNote(e.key.charCodeAt(0));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [started, setText, config.presetName]);

  const handleGlobalClick = (e: React.MouseEvent) => {
    // Avoid triggering on UI controls
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input')) return;
    if ((e.target as HTMLElement).closest('select')) return;
    
    if (!started) {
      handleStart();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-8 transition-colors cursor-text pointer-events-auto"
      onClick={handleGlobalClick}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        className="opacity-0 fixed top-0 left-0 pointer-events-none w-0 h-0 resize-none overflow-hidden"
        autoFocus={started}
      />

      {/* Top Bar */}
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

      {/* Center Start Button (Visual Only) */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/90 transition-opacity duration-700 z-50" onClick={handleGlobalClick}>
          <div className="group relative p-12 cursor-pointer">
             <span className="font-mono text-sm md:text-base text-white/70 tracking-widest lowercase group-hover:text-white transition-colors duration-500 ease-out block">
               click to begin
             </span>
             <span className="absolute bottom-10 left-1/2 -translate-x-1/2 h-[1px] bg-white/40 w-12 transition-all duration-500 ease-out"></span>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center pointer-events-none pb-8">
      </div>
    </div>
  );
};
