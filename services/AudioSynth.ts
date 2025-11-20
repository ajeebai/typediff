
class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private isInitialized = false;
  private currentProfile: string = 'Coral';

  // Notes for a pentatonic scale for pleasant generative sounds
  private notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 

  constructor() {
    // Lazy initialization handled in init()
  }

  public setProfile(profileName: string) {
    this.currentProfile = profileName;
  }

  public getAudioStream(): MediaStream | null {
    return this.mediaStreamDest ? this.mediaStreamDest.stream : null;
  }

  public async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    // Create Media Stream Destination for recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.mediaStreamDest);

    // Create a simple impulse response for reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.impulseResponse(2, 2, false);
    this.reverbNode.connect(this.masterGain);

    this.isInitialized = true;
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private impulseResponse(duration: number, decay: number, reverse: boolean): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx!.createBuffer(2, length, sampleRate);
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

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Base frequency
    const baseFreq = this.notes[charIndex % this.notes.length] * (Math.random() > 0.8 ? 2 : 1);

    // Configure sound based on profile
    switch (this.currentProfile) {
      case 'Mitosis': // Bubbly Sine
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); // Short decay
        
        osc.connect(gain);
        gain.connect(this.masterGain); // Dry mostly
        break;

      case 'Mazes': // 8-bit Square
        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq * 0.5, t); // Lower octave
        
        // Lowpass filter for that "retro" muffled sound
        const filterM = this.ctx.createBiquadFilter();
        filterM.type = 'lowpass';
        filterM.frequency.value = 800;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

        osc.connect(filterM);
        filterM.connect(gain);
        gain.connect(this.masterGain);
        break;

      case 'Chaos': // Aggressive Sawtooth
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.detune.value = (Math.random() - 0.5) * 50; // Heavy detune

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);

        osc.connect(gain);
        gain.connect(this.reverbNode); // Heavy reverb
        gain.connect(this.masterGain);
        break;

      case 'Worms': // FM / Wobble
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        
        carrier.type = 'sine';
        carrier.frequency.value = baseFreq;
        
        modulator.type = 'triangle';
        modulator.frequency.value = 10; // Fast wobble
        modGain.gain.value = 50; // FM depth

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

        modulator.start();
        carrier.connect(gain);
        gain.connect(this.masterGain);
        carrier.start();
        carrier.stop(t + 1.5);
        modulator.stop(t + 1.5);
        return; // Special exit for FM

      case 'Spots': // High Bell/Chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 4, t); // Very high
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0); // Long ringing tail

        osc.connect(gain);
        gain.connect(this.reverbNode);
        break;

      case 'Coral':
      default: // The Original Lush Triangle
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.detune.value = (Math.random() - 0.5) * 15;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.1);
        filter.frequency.exponentialRampToValueAtTime(100, t + 1.5);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.reverbNode);
        gain.connect(this.masterGain);
        break;
    }

    if (this.currentProfile !== 'Worms') {
        osc.start();
        osc.stop(t + 2.5);
    }
  }
}

export const audioSynth = new AudioSynth();
