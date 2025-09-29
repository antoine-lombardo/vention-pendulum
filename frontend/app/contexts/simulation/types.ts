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

export interface CurrentSimulation {
  state: SimulationState;
}

export interface SimulationState {
  status: 'running' | 'stopped' | 'ended' | 'error';
  elapsedTime: number;
  pendulums: PendulumState[];
}
