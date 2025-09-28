import {
  PendulumOptions,
  SimulationOptions,
  SimulationState,
} from '@src/models/SimulationTypes';
import { parentPort, workerData } from 'worker_threads';
import { calculatePosition } from './SimulationUtils';

const SIMULATION_OPTIONS = workerData as SimulationOptions;
const START_TIME = Date.now();
const MAX_REFRESH_RATE = 60;

const state: SimulationState = {
  status: 'running',
  elapsedTime: 0,
  pendulums: SIMULATION_OPTIONS.pendulums.map((opt) => {
    return { angle: opt.angle, position: calculatePosition(opt.angle, opt) };
  }),
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const emit = () => {
  parentPort?.postMessage(state);
};

const workerFunc = async () => {
  let next = START_TIME; // Next refresh time, in seconds
  for (let i = 0; i < 60 * 10; i++) {
    state.elapsedTime = (next - START_TIME) / 1000.0;
    for (let i = 0; i < SIMULATION_OPTIONS.pendulums.length; i++) {
      state.pendulums[i].angle = calculateAngle(
        state.elapsedTime,
        SIMULATION_OPTIONS.pendulums[i],
      );
      state.pendulums[i].position = calculatePosition(
        state.pendulums[i].angle,
        SIMULATION_OPTIONS.pendulums[i],
      );
    }
    const delay = next - Date.now();
    if (delay > 0) {
      await sleep(delay);
    }
    emit();
    next = next + 1000 / MAX_REFRESH_RATE;
  }
};

const calculateAngle = (time: number, options: PendulumOptions) => {
  if (time < 0) time = 0;
  // Ref: https://www.acs.psu.edu/drussell/Demos/Pendulum/Pendulum.html
  return options.angle * Math.cos(Math.sqrt(9.81 / options.length) * time);
};

workerFunc();
