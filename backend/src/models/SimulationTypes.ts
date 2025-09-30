export interface PendulumOptions {
  angle: number; // In radians
  mass: number; // In kilograms
  length: number; // In meters
  anchor: {
    x: number; // In meters
    y: number; // In meters
  };
}

export interface PendulumState {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'restarting' | 'error';
  angle: number; // In radians
  position: {
    x: number;
    y: number;
  };
}

export interface SimulationOptions {
  pendulums: PendulumOptions[];
  wind: {
    enabled: boolean;
    direction: number;
    velocity: number;
  };
}
