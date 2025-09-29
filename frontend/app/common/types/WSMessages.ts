import type {
  SimulationOptions,
  SimulationState,
} from '~/contexts/simulation/types';

export interface SimulationUpdateMessage {
  event: 'simulation_update';
  data: {
    state: SimulationState;
  };
}

export interface SimulationStartMessage {
  event: 'simulation_start';
  data: {
    options: SimulationOptions;
    state: SimulationState;
  };
}

export interface SimulationErrorMessage {
  event: 'simulation_error';
  data: {
    errorMessage: string;
  };
}

export type WSMessage =
  | SimulationStartMessage
  | SimulationUpdateMessage
  | SimulationErrorMessage;
