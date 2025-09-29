import type { SimulationState } from '~/contexts/simulation/types';

export interface APIMessage {
  message: string;
}

export interface SimulationStartResponse extends APIMessage {
  state: SimulationState;
}
