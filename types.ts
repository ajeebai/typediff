
export interface SynthConfig {
  volume: number;
  detune: number;
}

export interface SimulationConfig {
  feed: number;
  kill: number;
  da: number;
  db: number;
}

export type AudioContextState = 'suspended' | 'running' | 'closed';

export interface AppConfig {
  feed: number;
  kill: number;
  displacementScale: number;
  speed: number;
  aberration: number;
  noise: number;
  color1: string;
  color2: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  bloomIntensity: number;
  freeRoam: boolean;
}
