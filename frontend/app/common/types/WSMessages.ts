import type { PendulumState } from '~/contexts/simulation/types';

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

export type WSMessage = WorkerMessage | StateMessage;
