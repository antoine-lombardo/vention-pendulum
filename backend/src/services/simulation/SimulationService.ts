import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import { SimulationOptions, PendulumState } from '@src/models/SimulationTypes';
import { broadcast } from '@src/server';
import { Worker } from 'worker_threads';
import logger from 'jet-logger';
import { calculatePosition } from './SimulationUtils';
import {
  PauseMessage,
  ResumeMessage,
  StartMessage,
  StateMessage,
  StopMessage,
  WorkerMessage,
} from './workers/WorkerTypes';

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
    },
    {
      anchor: { x: 0.3, y: ANCHOR_LINE_Y },
      angle: -0.3,
      length: 0.3,
      mass: 0.2,
    },
    {
      anchor: { x: 0.45, y: ANCHOR_LINE_Y },
      angle: -0.1,
      length: 0.2,
      mass: 0.2,
    },
    {
      anchor: { x: 0.6, y: ANCHOR_LINE_Y },
      angle: 0.15,
      length: 0.25,
      mass: 0.2,
    },
    {
      anchor: { x: 0.75, y: ANCHOR_LINE_Y },
      angle: 0.45,
      length: 0.1,
      mass: 0.2,
    },
  ],
  wind: {
    enabled: false,
    direction: 0,
    velocity: 0,
  },
};

/******************************************************************************
                             Local variables
******************************************************************************/

const options = { ...DEFAULT_OPTIONS };
const states: PendulumState[] = options.pendulums.map((opt) => {
  return {
    status: 'idle',
    angle: opt.angle,
    position: calculatePosition(opt.angle, opt),
  };
});

/******************************************************************************
                                  Workers
******************************************************************************/

let worker: Worker;

const messageHandler = (message: WorkerMessage) => {
  if (message.to !== 'server') return;

  switch (message.event) {
    case 'state': {
      const stateMessage = message as StateMessage;
      states[stateMessage.from] = stateMessage.data.state;
      broadcast(JSON.stringify(stateMessage));
    }
  }
};

function initWorker() {
  worker = new Worker('./src/services/simulation/workers/MainWorker.js', {
    workerData: options,
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
  if (!isStopped()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, ALREADY_RUNNING_ERR);
  }

  // Send a start event to the main worker
  const message: StartMessage = {
    event: 'start',
    from: 'server',
    to: 'pendulums',
    time: Date.now(),
    data: {
      options,
    },
  };
  worker.postMessage(message);
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
  if (!isRunning()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_RUNNING_ERR);
  }

  // Send a stop event to the main worker
  const message: StopMessage = {
    event: 'stop',
    from: 'server',
    to: 'pendulums',
    time: Date.now(),
  };
  worker.postMessage(message);
  logger.info('Simulation stopped');
}

/**
 * Pause the simulation
 */
function pause() {
  // Fail if the simulation is not running
  if (!isRunningBase()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_PAUSED_ERR);
  }

  // Send a stop event to the main worker
  const message: PauseMessage = {
    event: 'pause',
    from: 'server',
    to: 'pendulums',
    time: Date.now(),
  };
  worker.postMessage(message);
  logger.info('Simulation paused');
}

/**
 * Resume the simulation
 */
function resume() {
  // Fail if the simulation is not paused
  if (!isPaused()) {
    throw new RouteError(HttpStatusCodes.CONFLICT, NOT_RUNNING_ERR);
  }

  // Send a stop event to the main worker
  const message: ResumeMessage = {
    event: 'resume',
    from: 'server',
    to: 'pendulums',
    time: Date.now(),
  };
  worker.postMessage(message);
  logger.info('Simulation resumed');
}

/**
 * Returns the current simulation status
 */
function getStatus() {
  return {
    options,
    states,
  };
}

/******************************************************************************
                            Private Functions
******************************************************************************/

function isRunningBase(): boolean {
  return states.every((x) => ['running'].includes(x.status));
}

function isRunning(): boolean {
  return states.every((x) =>
    ['running', 'stopped', 'restarting'].includes(x.status),
  );
}

function isStopped(): boolean {
  return states.every((x) => ['idle', 'error'].includes(x.status));
}

function isPaused(): boolean {
  return states.every((x) => ['paused'].includes(x.status));
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
  getStatus,
} as const;
