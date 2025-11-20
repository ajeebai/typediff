
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundProfile {
  oscType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq: number;
  filterQ: number;
  detuneAmount: number;
  reverbMix: number;
  hasSub: boolean;
  subDetune?: number;
}

const PROFILES: Record<string, SoundProfile> = {
  // Coral: Lush, underwater pads
  'Coral': { oscType: 'sine', attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.5, filterFreq: 600, filterQ: 1, detuneAmount: 5, reverbMix: 0.8, hasSub: true },
  
  // Mitosis: Sharp, biological, splitting sound. Sawtooth with high resonance.
  'Mitosis': { oscType: 'sawtooth', attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4, filterFreq: 2500, filterQ: 8, detuneAmount: 15, reverbMix: 0.4, hasSub: true, subDetune: 5 },
  
  // Mazes: Digital, structural, robotic. Square wave with precise envelope.
  'Mazes': { oscType: 'square', attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.2, filterFreq: 1500, filterQ: 4, detuneAmount: 8, reverbMix: 0.3, hasSub: false },
  
  // Chaos: Harsh, noisy, overwhelming. 
  'Chaos': { oscType: 'sawtooth', attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.8, filterFreq: 2000, filterQ: 10, detuneAmount: 50, reverbMix: 0.5, hasSub: true },
  
  // Worms: Deep, squelchy, subterranean. Triangle/Sine mix with low filter.
  'Worms': { oscType: 'triangle', attack: 0.08, decay: 0.3, sustain: 0.4, release: 0.8, filterFreq: 300, filterQ: 2, detuneAmount: 12, reverbMix: 0.7, hasSub: true, subDetune: -5 },
  
  // Spots: Plucky, light, droplet-like. High pitch sine/triangle.
  'Spots': { oscType: 'sine', attack: 0.001, decay: 0.08, sustain: 0, release: 0.1, filterFreq: 4000, filterQ: 1, detuneAmount: 0, reverbMix: 0.2, hasSub: false },
  
  'Default': { oscType: 'triangle', attack: 0.02, decay: 0.1, sustain: 0.1, release: 1.0, filterFreq: 1000, filterQ: 1, detuneAmount: 10, reverbMix: 0.4, hasSub: false }
};

class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private destNode: MediaStreamAudioDestinationNode | null = null;
  private isInitialized = false;
  private currentProfile: SoundProfile = PROFILES['Default'];

  // Pentatonic scale
  private notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 

  constructor() {
    // Lazy init
  }

  public async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    
    // Create destination for recording
    this.destNode = this.ctx.createMediaStreamDestination();
    
    // Connect Master -> Speakers
    this.masterGain.connect(this.ctx.destination);
    // Connect Master -> Recording Stream
    this.masterGain.connect(this.destNode);

    // Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.impulseResponse(2.5, 2.0, false);
    this.reverbNode.connect(this.masterGain);

    this.isInitialized = true;
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setProfile(presetName: string) {
    if (PROFILES[presetName]) {
      this.currentProfile = PROFILES[presetName];
    } else {
      this.currentProfile = PROFILES['Default'];
    }
  }

  public getAudioStream(): MediaStream | null {
    return this.destNode ? this.destNode.stream : null;
  }

  private impulseResponse(duration: number, decay: number, reverse: boolean): AudioBuffer {
    if (!this.ctx) throw new Error("No Audio Context");
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = reverse ? length - i : i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
  }

  public triggerNote(charIndex: number) {
    if (!this.ctx || !this.masterGain || !this.reverbNode) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    const p = this.currentProfile;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Pitch Logic
    let note = this.notes[charIndex % this.notes.length];
    // Octave shift random chance
    if (Math.random() > 0.7) note *= 2;
    if (Math.random() > 0.9) note /= 2;
    
    osc.type = p.oscType;
    osc.frequency.setValueAtTime(note, now);
    osc.detune.value = (Math.random() - 0.5) * p.detuneAmount;

    // Filter Logic
    filter.type = 'lowpass';
    filter.Q.value = p.filterQ;
    filter.frequency.setValueAtTime(p.filterFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(p.filterFreq / 4, 50), now + p.attack + p.decay);

    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + p.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.attack + p.decay + p.release);

    osc.connect(filter);
    filter.connect(gain);
    
    // Wet/Dry Mix
    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 1.0 - (p.reverbMix * 0.5);
    gain.connect(dryGain);
    dryGain.connect(this.masterGain);

    const wetGain = this.ctx.createGain();
    wetGain.gain.value = p.reverbMix;
    gain.connect(wetGain);
    wetGain.connect(this.reverbNode);

    osc.start(now);
    osc.stop(now + p.attack + p.decay + p.release + 0.1);

    // Sub Oscillator for thickness
    if (p.hasSub) {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = p.oscType === 'sine' ? 'square' : 'sine'; // Contrast sub
        
        // Optional sub detune logic
        const subNote = note / 2;
        subOsc.frequency.setValueAtTime(subNote, now);
        if (p.subDetune) subOsc.detune.value = p.subDetune;

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.25, now + p.attack);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + p.attack + p.decay);
        
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + p.attack + p.decay + 0.1);
    }
  }
}

export const audioSynth = new AudioSynth();
