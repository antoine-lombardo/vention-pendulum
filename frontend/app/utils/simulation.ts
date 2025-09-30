import type {
  PendulumState,
  PendulumStatus,
} from '~/contexts/simulation/types';

export const areAllStatus = (
  states: PendulumState[],
  state: PendulumStatus,
): boolean => {
  return states.every((pendulum) => pendulum.status === state);
};
