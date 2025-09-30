import { PendulumState, SimulationOptions } from '@src/models/SimulationTypes';

export interface MainWorkerData {
  options: SimulationOptions;
  f64: SharedArrayBuffer;
  un8: SharedArrayBuffer;
}

export interface PendulumWorkerData {
  index: number;
  options: SimulationOptions;
  f64: SharedArrayBuffer;
  un8: SharedArrayBuffer;
}

export interface WorkerMessage {
  event: string;
  from: 'server' | 'main' | number;
  to: ('server' | 'main' | number | 'pendulums')[];
  time: number;
}

export interface StateMessage extends WorkerMessage {
  event: 'state';
  from: number;
  data: {
    state: PendulumState;
  };
}

export interface CollisionMessage extends WorkerMessage {
  event: 'collision';
  data: {
    collisionWith: number;
  };
}

export interface RestartMessage extends WorkerMessage {
  event: 'restart';
  from: number;
}

export interface StartMessage extends WorkerMessage {
  event: 'start';
  data: {
    options: SimulationOptions;
  };
}

export interface StopMessage extends WorkerMessage {
  event: 'stop';
}

export interface PauseMessage extends WorkerMessage {
  event: 'pause';
}

export interface ResumeMessage extends WorkerMessage {
  event: 'resume';
}
