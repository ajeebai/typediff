class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isInitialized = false;

  // Notes for a pentatonic scale for pleasant generative sounds
  private notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 

  constructor() {
    // Lazy initialization handled in init()
  }

  public async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

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

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Pick a note based on character code or random from scale
    const note = this.notes[charIndex % this.notes.length] * (Math.random() > 0.8 ? 2 : 1);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    // Slight detune for thickness
    osc.detune.value = (Math.random() - 0.5) * 15;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.5);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverbNode); // Send to reverb
    gain.connect(this.masterGain); // Send dry signal too

    osc.start();
    osc.stop(this.ctx.currentTime + 2.0);
  }
}

export const audioSynth = new AudioSynth();