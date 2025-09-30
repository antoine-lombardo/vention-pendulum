import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import {
  SimulationOptions,
  PendulumState,
  PendulumStatus,
} from '@src/models/SimulationTypes';
import { broadcast } from '@src/server';
import { Worker } from 'worker_threads';
import logger from 'jet-logger';
import { calculatePosition } from './SimulationUtils';
import {
  MainWorkerData,
  StartMessage,
  StateMessage,
  WorkerMessage,
} from './workers/WorkerTypes';
import { getState, getStatus } from './workers/WorkerUtils';

/******************************************************************************
                                Constants
******************************************************************************/

const ALREADY_RUNNING_ERR = 'Simulation is already running';
const NOT_RUNNING_ERR = 'Simulation is not running';
const NOT_PAUSED_ERR = 'Simulation is not paused';
const ANCHOR_LINE_Y = 0.05;
const DEFAULT_OPTIONS: SimulationOptions = {
  pendulums: [
    {
      anchor: { x: 0.15, y: ANCHOR_LINE_Y },
      angle: -0.5,
      length: 0.3,
      mass: 0.2,
      radius: 0.02,
    },
    {
      anchor: { x: 0.3, y: ANCHOR_LINE_Y },
      angle: -0.3,
      length: 0.3,
      mass: 0.2,
      radius: 0.02,
    },
    {
      anchor: { x: 0.45, y: ANCHOR_LINE_Y },
      angle: -0.1,
      length: 0.2,
      mass: 0.2,
      radius: 0.02,
    },
    {
      anchor: { x: 0.6, y: ANCHOR_LINE_Y },
      angle: 0.15,
      length: 0.25,
      mass: 0.2,
      radius: 0.02,
    },
    {
      anchor: { x: 0.75, y: ANCHOR_LINE_Y },
      angle: 0.45,
      length: 0.1,
      mass: 0.2,
      radius: 0.02,
    },
  ],
  wind: {
    enabled: false,
    direction: 0,
    velocity: 0,
  },
};

/******************************************************************************
                              Shared Arrays
******************************************************************************/

const f64Buf = new SharedArrayBuffer(
  Float64Array.BYTES_PER_ELEMENT * DEFAULT_OPTIONS.pendulums.length * 3, // x, y, angle
);
const un8Buf = new SharedArrayBuffer(
  Uint8Array.BYTES_PER_ELEMENT * DEFAULT_OPTIONS.pendulums.length * 1, // status
);
const f64 = new Float64Array(f64Buf);
const un8 = new Uint8Array(un8Buf);

/******************************************************************************
                             Local variables
******************************************************************************/

const options = { ...DEFAULT_OPTIONS };

/******************************************************************************
                                  Workers
******************************************************************************/

let worker: Worker;

const sendMessage = (message: WorkerMessage) => {
  worker.postMessage(message);
};

const messageHandler = (message: WorkerMessage) => {
  if (!message.to.some((x) => x === 'server')) return;

  switch (message.event) {
    case 'state': {
      broadcast(JSON.stringify(message));
    }
  }
};

function initWorker() {
  worker = new Worker('./src/services/simulation/workers/MainWorker.js', {
    workerData: {
      options,
      f64: f64Buf,
      un8: un8Buf,
    } as MainWorkerData,
  });

  worker.on('message', messageHandler);

  worker.on('exit', () => {
    logger.err('Main worker exited, restarting it...');
    initWorker();
  });
}

initWorker();

/******************************************************************************
                            Public Functions
******************************************************************************/

/**
 * Start the simulation
 */
const start = (options: SimulationOptions) => {
  // Fail if the simulation is not stopped
  if (!areAllStopped()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, ALREADY_RUNNING_ERR);
  }

  // Send a start event to the main worker
  sendMessage({
    event: 'start',
    from: 'server',
    to: ['pendulums'],
    time: Date.now(),
    data: {
      options,
    },
  } as StartMessage);

  logger.info('Simulation started');

  // // Handle state updates from the thread
  // currentSimulation.worker.on('message', (state: SimulationState) => {
  //   if (!currentSimulation) return;
  //   currentSimulation.state = state;
  //   _emitUpdate();
  // });
  //
  // // Handle errors from the thread
  // currentSimulation.worker.on('error', (err) => {
  //   if (!currentSimulation || currentSimulation.state.status !== 'running')
  //     return;
  //   currentSimulation.state.status = 'error';
  //   _emitError(err.message);
  //   _emitUpdate();
  //   logger.err(`Simulation error: ${err.message}`);
  // });
  //
  // // Handle process termination from the thread
  // currentSimulation.worker.on('exit', (code) => {
  //   if (!currentSimulation || currentSimulation.state.status !== 'running')
  //     return;
  //   if (code !== 0) {
  //     currentSimulation.state.status = 'error';
  //     _emitError(`Exited with error code ${code}.`);
  //     _emitUpdate();
  //     logger.err(`Simulation exited with error code ${code}`);
  //   } else {
  //     currentSimulation.state.status = 'ended';
  //     _emitUpdate();
  //     logger.info('Simulation ended');
  //   }
  // });
  // _emitStart();
};

/**
 * Stop the simulation
 */
function stop() {
  // Fail if the simulation is not running
  if (!areAllSimulating()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_RUNNING_ERR);
  }

  // Send a stop event to the main worker
  sendMessage({
    event: 'stop',
    from: 'server',
    to: ['pendulums'],
    time: Date.now(),
  });
  logger.info('Simulation stopped');
}

/**
 * Pause the simulation
 */
function pause() {
  // Fail if the simulation is not running
  if (!areAllRunning()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_RUNNING_ERR);
  }

  // Send a stop event to the main worker
  sendMessage({
    event: 'pause',
    from: 'server',
    to: ['pendulums'],
    time: Date.now(),
  });
  logger.info('Simulation paused');
}

/**
 * Resume the simulation
 */
function resume() {
  // Fail if the simulation is not paused
  if (!areAllPaused()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_PAUSED_ERR);
  }

  // Send a stop event to the main worker
  sendMessage({
    event: 'resume',
    from: 'server',
    to: ['pendulums'],
    time: Date.now(),
  });

  logger.info('Simulation resumed');
}

/**
 * Returns the current simulation status
 */
function get() {
  return {
    options,
    states: options.pendulums.map((pendulum, index) =>
      getState(f64, un8, index),
    ),
  };
}

/******************************************************************************
                            Private Functions
******************************************************************************/

/**
 * Returns true if all pendulums are running (RUNNING)
 */
function areAllRunning(): boolean {
  return options.pendulums
    .map((_, index) => getStatus(un8, index))
    .every((x) => [PendulumStatus.RUNNING].includes(x));
}

/**
 * Returns true if all pendulums are simulating (RUNNING, PAUSED, STOPPED or RESTARTING)
 */
function areAllSimulating(): boolean {
  return options.pendulums
    .map((_, index) => getStatus(un8, index))
    .every((x) =>
      [
        PendulumStatus.RUNNING,
        PendulumStatus.PAUSED,
        PendulumStatus.WAITING_FOR_RESTART,
      ].includes(x),
    );
}

/**
 * Returns true if all pendulums are stopped (IDLE or ERROR)
 */
function areAllPaused(): boolean {
  return options.pendulums
    .map((_, index) => getStatus(un8, index))
    .every((x) => [PendulumStatus.PAUSED].includes(x));
}

/**
 * Returns true if all pendulums are stopped (IDLE or ERROR)
 */
function areAllStopped(): boolean {
  return options.pendulums
    .map((_, index) => getStatus(un8, index))
    .every((x) => [PendulumStatus.IDLE, PendulumStatus.ERROR].includes(x));
}

/**
 * Notify simulation starts to users
 */
// function _emitStart() {
//   if (!currentSimulation) return;
//   broadcast(
//     JSON.stringify({
//       event: 'simulation_start',
//       data: {
//         options: currentSimulation.options,
//         state: currentSimulation.state,
//       },
//     }),
//   );
// }

/**
 * Notify simulation updates to users
 */
// function _emitUpdate() {
//   if (!currentSimulation) return;
//   broadcast(
//     JSON.stringify({
//       event: 'simulation_update',
//       data: {
//         state: currentSimulation.state,
//       },
//     }),
//   );
// }

/**
 * Notify simulation errors to users
 */
// function _emitError(errorMessage: string) {
//   if (!currentSimulation) return;
//   broadcast(
//     JSON.stringify({
//       event: 'simulation_error',
//       data: {
//         errorMessage,
//       },
//     }),
//   );
// }

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  start,
  stop,
  pause,
  resume,
  get,
} as const;
