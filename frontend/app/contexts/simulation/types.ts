export interface PendulumOptions {
  angle: number; // In radians
  mass: number; // In kilograms
  radius: number; // In meters
  length: number; // In meters
  anchor: {
    x: number; // In meters
    y: number; // In meters
  };
}

export enum PendulumStatus {
  IDLE,
  RUNNING,
  PAUSED,
  WAITING_FOR_RESTART,
  NOT_SYNCED,
}

export interface PendulumState {
  status: PendulumStatus;
  angle: number; // In radians
  position: {
    x: number;
    y: number;
  };
}

export interface SimulationOptions {
  pendulums: PendulumOptions[];
  wind: {
    direction: number;
    velocity: number;
  };
}
