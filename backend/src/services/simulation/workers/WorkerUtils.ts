import { PendulumState, PendulumStatus } from '@src/models/SimulationTypes';

export const getPosition = (
  f64: Float64Array,
  i: number,
): { x: number; y: number } => {
  return {
    x: f64[i * 3],
    y: f64[i * 3 + 1],
  };
};

export const getAngle = (f64: Float64Array, i: number): number => {
  return f64[i * 3 + 2];
};

export const getStatus = (un8: Uint8Array, i: number): PendulumStatus => {
  return un8[i];
};

export const getState = (
  f64: Float64Array,
  un8: Uint8Array,
  i: number,
): PendulumState => {
  return {
    status: getStatus(un8, i),
    angle: getAngle(f64, i),
    position: getPosition(f64, i),
  };
};
