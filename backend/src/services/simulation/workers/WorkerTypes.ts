import { PendulumState, SimulationOptions } from '@src/models/SimulationTypes';

export interface PendulumWorkerData {
  index: number;
  options: SimulationOptions;
}

export interface WorkerMessage {
  event: string;
  from: 'server' | 'main' | number;
  to: 'server' | 'main' | number | 'pendulums';
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
    collisionWith: string;
  };
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
