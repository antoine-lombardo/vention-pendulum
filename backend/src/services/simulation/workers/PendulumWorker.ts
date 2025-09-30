import { PendulumState } from '@src/models/SimulationTypes';
import { parentPort, workerData } from 'worker_threads';
import { calculatePosition, calculateAngle } from '../SimulationUtils';
import {
  PendulumWorkerData,
  StartMessage,
  StateMessage,
  WorkerMessage,
} from './WorkerTypes';
import logger from 'jet-logger';

/******************************************************************************
                                Constants
******************************************************************************/

const MAX_REFRESH_RATE = 60;

/******************************************************************************
                             Local variables
******************************************************************************/

let options = (workerData as PendulumWorkerData).options;
const index = (workerData as PendulumWorkerData).index;
const state: PendulumState = {
  status: 'idle',
  angle: options.pendulums[index].angle,
  position: calculatePosition(
    options.pendulums[index].angle,
    options.pendulums[index],
  ),
};
let startTime = 0;
let pauseTime = 0;
const exitEvent = false;

/******************************************************************************
                                Functions
******************************************************************************/

const messageHandler = (message: WorkerMessage) => {
  // Ignore messages that are not for me
  if (message.to !== index && message.to !== 'pendulums') return;

  switch (message.event) {
    case 'start': {
      const startMessage = message as StartMessage;
      options = startMessage.data.options;
      startTime = startMessage.time;
      state.angle = options.pendulums[index].angle;
      state.position = calculatePosition(
        options.pendulums[index].angle,
        options.pendulums[index],
      );
      state.status = 'running';
      break;
    }
    case 'stop': {
      if (message.time < startTime) return;
      state.status = 'idle';
      state.angle = options.pendulums[index].angle;
      state.position = calculatePosition(
        options.pendulums[index].angle,
        options.pendulums[index],
      );
      const stateMessage: StateMessage = {
        event: 'state',
        from: index,
        to: 'server',
        time: message.time,
        data: {
          state,
        },
      };
      parentPort?.postMessage(stateMessage);
      break;
    }
    case 'pause': {
      if (state.status !== 'running') return;
      if (message.time < startTime) return;
      pauseTime = message.time;
      state.status = 'paused';
      pendulumTick(message.time);
      break;
    }
    case 'resume': {
      if (state.status !== 'paused') return;
      if (message.time < startTime) return;
      startTime = startTime + (message.time - pauseTime);
      pauseTime = 0;
      state.status = 'running';
      pendulumTick(message.time);
      break;
    }
  }
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pendulumTick = (time: number) => {
  const timeSinceStart = (time - startTime) / 1000;
  state.angle = calculateAngle(timeSinceStart, options.pendulums[index]);
  state.position = calculatePosition(state.angle, options.pendulums[index]);
  const message: StateMessage = {
    event: 'state',
    from: index,
    to: 'server',
    time,
    data: {
      state,
    },
  };
  parentPort?.postMessage(message);
};

/******************************************************************************
                                    Setup
******************************************************************************/

parentPort?.on('message', messageHandler);

/******************************************************************************
                               Worker Function
******************************************************************************/

const workerFunc = async () => {
  logger.info(`Pendulum #${index} worker started`);
  let nextRefresh = Date.now();
  while (!exitEvent) {
    // Wait to respect the max refresh rate
    const delay = nextRefresh - Date.now();
    if (delay > 0) {
      await sleep(delay);
    }

    switch (state.status) {
      case 'running': {
        pendulumTick(nextRefresh);
        break;
      }
    }
    nextRefresh = nextRefresh + 1000 / MAX_REFRESH_RATE;
  }
};

workerFunc();
