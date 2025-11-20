
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { audioSynth } from '../services/AudioSynth';
import { AppConfig } from '../types';

interface SettingsPanelProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  onReset: () => void;
  setIsOpen: (v: boolean) => void;
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

const hsvToHex = (h: number, s: number, v: number) => {
    s /= 100;
    v /= 100;
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
};

// Convert Hex to HSV (approximate via HSL)
const hexToHsv = (hex: string) => {
    const { h, s, l } = hexToHsl(hex);
    const s_norm = s / 100;
    const l_norm = l / 100;
    
    const v = l_norm + s_norm * Math.min(l_norm, 1 - l_norm);
    const s_hsv = v === 0 ? 0 : 2 * (1 - l_norm / v);
    
    return { h, s: s_hsv * 100, v: v * 100 };
};

// -- UI Components --

const GlassSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  displayValue?: string;
  withTicks?: boolean;
  className?: string;
}> = ({ label, value, min, max, step, onChange, displayValue, withTicks, className }) => {
  const percent = ((value - min) / (max - min)) * 100;
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }).map((_, i) => i * (100 / (tickCount - 1)));

  return (
    <div className={`group py-2 px-4 hover:bg-white/5 transition-colors ${className}`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[9px] font-bold tracking-widest text-white/60 group-hover:text-white/90 transition-colors uppercase">{label}</span>
        <span className="text-[8px] font-mono text-white/40 bg-black/20 px-1.5 py-0.5 rounded min-w-[30px] text-center">{displayValue || value}</span>
      </div>
      <div className="relative h-4 flex items-center w-full">
         <input 
            type="range" min={min} max={max} step={step} value={value} onChange={onChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
         />
         
         {/* Track */}
         <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm z-0">
            <div 
              className="h-full bg-gradient-to-r from-blue-400/80 to-blue-200 transition-all duration-100 ease-out" 
              style={{ width: `${percent}%` }}
            />
         </div>

         {/* Ticks */}
         {withTicks && (
            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-between items-center px-0.5 z-0 opacity-20">
                {ticks.map((t, i) => (
                    <div key={i} className={`w-0.5 h-0.5 rounded-full ${Math.abs(t - percent) < 5 ? 'bg-white' : 'bg-white/50'}`} style={{ left: `${t}%` }}></div>
                ))}
            </div>
         )}

         {/* Thumb */}
         <div 
            className="absolute w-3 h-3 bg-white border border-blue-50 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-100 ease-out z-10 group-hover:scale-110"
            style={{ left: `calc(${percent}% - 6px)` }}
         />
      </div>
    </div>
  );
};

interface GlassDropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string; fontFamily: string }[];
  onChange: (val: string) => void;
}

const GlassDropdown: React.FC<GlassDropdownProps> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 cursor-pointer transition-colors"
      >
         <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase">{label}</span>
         <div className="flex items-center gap-2 min-w-0">
           <span className="text-[10px] text-white truncate" style={{ fontFamily: selectedOption.fontFamily }}>
               {selectedOption.label}
           </span>
           <svg className={`w-2 h-2 text-white/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </div>
      </div>

      {/* Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto scrollbar-hide overflow-hidden">
           {options.map(opt => (
               <div 
                   key={opt.value}
                   onClick={() => {
                       onChange(opt.value);
                       setIsOpen(false);
                   }}
                   className={`px-3 py-2 text-[11px] text-white cursor-pointer hover:bg-white/10 flex items-center justify-between
                       ${opt.value === value ? 'bg-white/5' : ''}`}
               >
                   <span style={{ fontFamily: opt.fontFamily }}>{opt.label}</span>
                   {opt.value === value && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"/>}
               </div>
           ))}
        </div>
      )}
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (c: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, isOpen, onToggle }) => {
  const [hsv, setHsv] = useState(hexToHsv(color));
  const satRef = useRef<HTMLDivElement>(null);
  const isDraggingSat = useRef(false);

  useEffect(() => {
    if (!isDraggingSat.current) {
        setHsv(hexToHsv(color));
    }
  }, [color]);

  const updateColor = (newHsv: { h: number, s: number, v: number }) => {
    setHsv(newHsv);
    onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
  };

  const handleSatInteract = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!satRef.current) return;
    const rect = satRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    // x = Saturation, y = 1 - Value
    updateColor({ ...hsv, s: x * 100, v: (1 - y) * 100 });
  }, [hsv, onChange]);

  useEffect(() => {
    const handleUp = () => isDraggingSat.current = false;
    const handleMove = (e: MouseEvent) => {
        if (isDraggingSat.current) {
            handleSatInteract(e);
        }
    };
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('mousemove', handleMove);
    return () => {
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('mousemove', handleMove);
    };
  }, [handleSatInteract]);

  return (
    <div className="px-4 py-2 hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-center cursor-pointer" onClick={onToggle}>
        <label className="text-[9px] tracking-widest font-bold text-white/60 uppercase">{label}</label>
        <div className="flex items-center gap-2">
            <div className="text-[8px] font-mono text-white/40">{color.toUpperCase()}</div>
            <div 
              className="w-4 h-3 rounded-sm border border-white/10 shadow-sm ring-1 ring-white/5"
              style={{ backgroundColor: color }}
            />
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-2 space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 pb-2">
           {/* 2D Color Field: Saturation/Brightness */}
           <div 
             ref={satRef}
             onMouseDown={(e) => { isDraggingSat.current = true; handleSatInteract(e); }}
             className="w-full h-24 rounded-lg cursor-crosshair relative shadow-inner border border-white/10 overflow-hidden"
             style={{ 
                 backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                 backgroundImage: `
                    linear-gradient(to top, #000, transparent), 
                    linear-gradient(to right, #fff, transparent)
                 `
             }}
           >
             <div 
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ 
                    left: `${hsv.s}%`, 
                    top: `${100 - hsv.v}%`,
                    backgroundColor: color 
                }}
             />
           </div>

           {/* Hue Slider */}
           <div className="h-3 w-full rounded-full relative overflow-hidden cursor-pointer border border-white/10">
             <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
             <input 
                type="range" 
                min="0" 
                max="360" 
                value={hsv.h} 
                onChange={(e) => updateColor({ ...hsv, h: parseInt(e.target.value) })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <div 
                className="absolute top-0 h-full w-1 bg-white shadow-sm pointer-events-none"
                style={{ left: `${(hsv.h / 360) * 100}%` }}
             />
           </div>
        </div>
      )}
    </div>
  );
};

const RD_PRESETS = [
  { name: 'Coral', feed: 0.0545, kill: 0.0620 },
  { name: 'Mitosis', feed: 0.0367, kill: 0.0644 },
  { name: 'Mazes', feed: 0.0290, kill: 0.0570 },
  { name: 'Chaos', feed: 0.0820, kill: 0.0600 },
  { name: 'Worms', feed: 0.0460, kill: 0.0630 },
  { name: 'Spots', feed: 0.0250, kill: 0.0600 },
];

const FONT_OPTIONS = [
    { label: 'Geist', value: 'Geist', fontFamily: 'Geist, sans-serif' },
    { label: 'Asul', value: 'Asul', fontFamily: 'Asul, serif' },
    { label: 'MuseoModerno', value: 'MuseoModerno', fontFamily: 'MuseoModerno, sans-serif' },
    { label: 'Unifraktur', value: 'UnifrakturMaguntia', fontFamily: 'UnifrakturMaguntia, cursive' },
    { label: 'Voltaire', value: 'Voltaire', fontFamily: 'Voltaire, sans-serif' },
    { label: 'Parisienne', value: 'Parisienne', fontFamily: 'Parisienne, cursive' },
    { label: 'Gaegu', value: 'Gaegu', fontFamily: 'Gaegu, cursive' },
    { label: 'Silkscreen', value: 'Silkscreen', fontFamily: 'Silkscreen, cursive' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig, onReset, setIsOpen }) => {
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const applyPreset = (preset: typeof RD_PRESETS[0]) => {
    setConfig({
      ...config,
      feed: preset.feed,
      kill: preset.kill
    });
    audioSynth.setProfile(preset.name);
  };

  const togglePicker = (id: string) => {
    setActivePicker(activePicker === id ? null : id);
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `typediff-art-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const toggleRecording = () => {
    if (isRecording) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    } else {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        // Keep 30FPS for performance/compatibility
        const videoStream = canvas.captureStream(30);
        const audioStream = audioSynth.getAudioStream();

        // Combine video and audio tracks if available
        const tracks = [
            ...videoStream.getVideoTracks(),
            ...(audioStream ? audioStream.getAudioTracks() : [])
        ];
        const combinedStream = new MediaStream(tracks);
        streamRef.current = combinedStream;
        
        const mimeTypes = [
          'video/mp4;codecs=avc1.42E01E',
          'video/mp4',
          'video/webm;codecs=h264', // Better hardware acceleration support
          'video/webm;codecs=vp9',
          'video/webm'
        ];
        
        const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
        const options = selectedMimeType ? { 
            mimeType: selectedMimeType, 
            videoBitsPerSecond: 20000000 // 20 Mbps - Good balance for 1080p/2K without choking browser
        } : undefined;

        try {
          const recorder = new MediaRecorder(combinedStream, options);
          
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

              // Stop all tracks
              if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                  streamRef.current = null;
              }
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
    <div className="w-full md:w-80 h-full flex flex-col p-4 text-white overflow-y-auto scrollbar-hide bg-zinc-950 font-sans">
       
       {/* Header with Hide Button */}
       <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
         <h2 className="text-[11px] font-bold tracking-widest text-white/70 uppercase">Configuration</h2>
         <button 
           onClick={() => setIsOpen(false)}
           className="text-[10px] text-white/40 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10 md:block hidden"
         >
           Hide
         </button>
       </div>

       <div className="space-y-4 flex-1 pb-20">
          
          {/* Typography Section */}
          <div className="space-y-2">
            <label className="text-[9px] tracking-wider text-white/40 font-bold uppercase block px-1">Typography</label>
            
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-visible">
                <div className="p-1 border-b border-white/5">
                    <GlassDropdown 
                        label="Font"
                        value={config.fontFamily}
                        options={FONT_OPTIONS}
                        onChange={(val) => updateConfig('fontFamily', val)}
                    />
                </div>

                <GlassSlider 
                    label="Size"
                    min={20} max={300} step={10}
                    value={config.fontSize}
                    onChange={(e) => updateConfig('fontSize', parseFloat(e.target.value))}
                    className="rounded-b-xl"
                />
            </div>
          </div>

          {/* Simulation Section */}
          <div className="space-y-2">
            <label className="text-[9px] tracking-wider text-white/40 font-bold uppercase block px-1">Simulation</label>
            
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {/* Presets */}
                <div className="p-1.5 border-b border-white/5 flex flex-wrap gap-1">
                  {RD_PRESETS.map((preset) => {
                    const isActive = Math.abs(config.feed - preset.feed) < 0.001 && Math.abs(config.kill - preset.kill) < 0.001;
                    return (
                        <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`flex-1 min-w-[30%] text-[9px] font-medium py-1 rounded-md transition-all duration-200 
                            ${isActive ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                        {preset.name}
                        </button>
                    );
                  })}
                </div>

                <div className="divide-y divide-white/5">
                    <GlassSlider 
                        label="Feed Rate"
                        min={0.0100} max={0.1000} step={0.0005}
                        value={config.feed}
                        displayValue={config.feed.toFixed(4)}
                        onChange={(e) => updateConfig('feed', parseFloat(e.target.value))}
                        withTicks
                    />
                    <GlassSlider 
                        label="Kill Rate"
                        min={0.0450} max={0.0700} step={0.0005}
                        value={config.kill}
                        displayValue={config.kill.toFixed(4)}
                        onChange={(e) => updateConfig('kill', parseFloat(e.target.value))}
                        withTicks
                    />
                    <GlassSlider 
                        label="Flow Speed"
                        min={0.1} max={1.0} step={0.1}
                        value={config.speed}
                        displayValue={config.speed.toFixed(1)}
                        onChange={(e) => updateConfig('speed', parseFloat(e.target.value))}
                        withTicks
                    />
                </div>
            </div>
          </div>

          {/* Aesthetics Section */}
          <div className="space-y-2">
            <label className="text-[9px] tracking-wider text-white/40 font-bold uppercase block px-1">Aesthetics</label>
            
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                <GlassSlider 
                    label="Depth"
                    min={0} max={3} step={0.1}
                    value={config.displacementScale}
                    onChange={(e) => updateConfig('displacementScale', parseFloat(e.target.value))}
                />
                 <GlassSlider 
                    label="Bloom"
                    min={0} max={4} step={0.5}
                    value={config.bloomIntensity}
                    onChange={(e) => updateConfig('bloomIntensity', parseFloat(e.target.value))}
                    withTicks
                />
                 <GlassSlider 
                    label="Chromatic"
                    min={0} max={0.02} step={0.001}
                    value={config.aberration}
                    displayValue={(config.aberration * 100).toFixed(1)}
                    onChange={(e) => updateConfig('aberration', parseFloat(e.target.value))}
                />
                 <GlassSlider 
                    label="Grain"
                    min={0} max={0.3} step={0.05}
                    value={config.noise}
                    onChange={(e) => updateConfig('noise', parseFloat(e.target.value))}
                    withTicks
                />
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5 mt-2">
              <ColorPicker 
                label="Primary" 
                color={config.color1} 
                onChange={(c) => updateConfig('color1', c)} 
                isOpen={activePicker === 'color1'}
                onToggle={() => togglePicker('color1')}
              />
              <ColorPicker 
                label="Secondary" 
                color={config.color2} 
                onChange={(c) => updateConfig('color2', c)} 
                isOpen={activePicker === 'color2'}
                onToggle={() => togglePicker('color2')}
              />
              <ColorPicker 
                label="Background" 
                color={config.backgroundColor} 
                onChange={(c) => updateConfig('backgroundColor', c)} 
                isOpen={activePicker === 'bg'}
                onToggle={() => togglePicker('bg')}
              />
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-2 pt-2">
             <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleSnapshot}
                  className="text-[9px] font-bold py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-white/80 transition-all uppercase tracking-wider"
                >
                  Snapshot
                </button>
                 <button 
                  onClick={toggleRecording}
                  className={`text-[9px] font-bold py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 uppercase tracking-wider
                    ${isRecording 
                        ? 'border-red-500/50 bg-red-500/20 text-red-200 animate-pulse' 
                        : 'border-white/10 bg-white/5 hover:bg-white/20 text-white/80'}`}
                >
                  {isRecording ? (
                      <><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"/> REC</>
                  ) : 'Record'}
                </button>
             </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full mt-1 text-[9px] font-bold tracking-widest uppercase bg-red-500/5 border border-red-500/20 rounded-lg py-3 hover:bg-red-500/20 text-red-400/80 transition-colors"
           >
             Reset Canvas
           </button>
       </div>

       {/* Footer Credit */}
       <div className="pt-3 pb-1 text-center border-t border-white/10">
          <p className="text-[9px] text-white/30 font-sans">
            Designed by <a href="https://bykins.com" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">kins</a>
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
  hasStarted: boolean;
  onStart: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ text, setText, isSettingsOpen, setIsSettingsOpen, hasStarted, onStart }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    if (text.length > 0 && !hasTyped) {
      setHasTyped(true);
    }
  }, [text, hasTyped]);

  // Handle typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > 100) return; 
    
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
    if (!hasStarted) {
        await audioSynth.init();
        onStart();
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (hasStarted) {
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
  }, [hasStarted, setText]);

  const handleGlobalClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input')) return;
    if ((e.target as HTMLElement).closest('div[class*="bg-white/5"]')) return;
    if ((e.target as HTMLElement).closest('aside')) return;
    if ((e.target as HTMLElement).closest('.prevent-click')) return;
    
    if (!hasStarted) {
      handleStart();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="absolute inset-0 z-10 flex flex-col cursor-text"
      onClick={handleGlobalClick}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        className="opacity-0 fixed top-0 left-0 pointer-events-none w-0 h-0 resize-none overflow-hidden"
        autoFocus={hasStarted}
      />

      {/* UI Controls Container - Pointer events only for buttons */}
      <div className="flex-1 flex flex-col justify-between p-4 md:p-6 pointer-events-none relative z-20">
          
          {/* Top Left: Desktop Config Trigger */}
          <div className="flex justify-start">
             <div className="pointer-events-auto hidden md:block">
                {!isSettingsOpen && hasStarted && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSettingsOpen(true);
                        }}
                        className="text-[10px] font-bold tracking-wider text-white/60 hover:text-white border border-white/10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors uppercase"
                    >
                        Config
                    </button>
                )}
             </div>
          </div>

      </div>

      {/* Mobile Floating Toggle Button (Fixed Position to sit on top of Bottom Sheet) */}
      <div className="pointer-events-auto md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
          {hasStarted && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsOpen(!isSettingsOpen);
                }}
                className="p-3 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
                aria-label="Toggle Settings"
            >
                  <div className="w-5 h-5 relative flex items-center justify-center">
                    {/* Hamburger / Cross Transition */}
                    <span className={`absolute h-0.5 w-5 bg-white/90 rounded-full transition-all duration-300 ease-in-out ${isSettingsOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`} />
                    <span className={`absolute h-0.5 w-5 bg-white/90 rounded-full transition-all duration-300 ease-in-out ${isSettingsOpen ? 'opacity-0' : 'opacity-100'}`} />
                    <span className={`absolute h-0.5 w-5 bg-white/90 rounded-full transition-all duration-300 ease-in-out ${isSettingsOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}`} />
                  </div>
            </button>
          )}
      </div>

      {/* Typing Hint */}
      {hasStarted && text.length === 0 && !hasTyped && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-1000">
            <span className="text-white/30 font-sans text-xs tracking-[0.3em] uppercase animate-pulse">
                Start Typing
            </span>
         </div>
      )}

      {/* Center Start Button (Overlay) */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md transition-opacity duration-700 z-50">
          <button 
            className="prevent-click group pointer-events-auto relative px-8 py-3 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/10 transition-all duration-500 ease-out hover:scale-105 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_12px_40px_rgba(0,0,0,0.6)]"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
          >
             <span className="font-sans text-sm font-medium text-white/90 tracking-widest group-hover:text-white transition-colors drop-shadow-md uppercase">
               Click to Begin
             </span>
          </button>
        </div>
      )}
    </div>
  );
};