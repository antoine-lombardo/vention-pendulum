import type {
  PendulumState,
  SimulationOptions,
} from '~/contexts/simulation/types';

export interface APIMessage {
  message: string;
}

export interface SimulationStatusResponse {
  options: SimulationOptions;
  states: PendulumState[];
}
