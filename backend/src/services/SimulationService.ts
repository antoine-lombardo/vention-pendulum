import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import {
  SimulationOptions,
  CurrentSimulation,
  SimulationState,
} from '@src/models/SimulationTypes';
import { broadcast } from '@src/server';
import { Worker } from 'worker_threads';
import { calculatePosition } from './SimulationUtils';
import logger from 'jet-logger';

/******************************************************************************
                                Constants
******************************************************************************/

const ALREADY_RUNNING_ERR = 'Another simulation is already running';
const NOT_RUNNING_ERR = 'Simulation is not running';

/******************************************************************************
                             Local variables
******************************************************************************/

let currentSimulation: CurrentSimulation | undefined;

/******************************************************************************
                            Public Functions
******************************************************************************/

/**
 * Start the simulation
 */
const start = (options: SimulationOptions) => {
  // Fail if another simulation is running
  if (!!currentSimulation && currentSimulation.state?.status == 'running') {
    throw new RouteError(HttpStatusCodes.CONFLICT, ALREADY_RUNNING_ERR);
  }

  // Generate the current simulation data object
  currentSimulation = {
    options,
    worker: new Worker('./src/services/SimulationWorker.js', {
      workerData: options,
    }),
    state: {
      status: 'running',
      elapsedTime: 0,
      pendulums: options.pendulums.map((opt) => {
        return {
          angle: opt.angle,
          position: calculatePosition(opt.angle, opt),
        };
      }),
    },
  };
  logger.info('Simulation started');

  // Handle state updates from the thread
  currentSimulation.worker.on('message', (state: SimulationState) => {
    if (!currentSimulation) return;
    currentSimulation.state = state;
    _emitUpdate();
  });

  // Handle errors from the thread
  currentSimulation.worker.on('error', (err) => {
    if (!currentSimulation || currentSimulation.state.status !== 'running')
      return;
    currentSimulation.state.status = 'error';
    _emitError(err.message);
    _emitUpdate();
    logger.err(`Simulation error: ${err.message}`);
  });

  // Handle process termination from the thread
  currentSimulation.worker.on('exit', (code) => {
    if (!currentSimulation || currentSimulation.state.status !== 'running')
      return;
    if (code !== 0) {
      currentSimulation.state.status = 'error';
      _emitError(`Exited with error code ${code}.`);
      _emitUpdate();
      logger.err(`Simulation exited with error code ${code}`);
    } else {
      currentSimulation.state.status = 'ended';
      _emitUpdate();
      logger.info('Simulation ended');
    }
  });

  _emitStart();
};

/**
 * Stop the simulation
 */
function stop() {
  // Fail if another simulation is running
  if (!currentSimulation || currentSimulation.state.status !== 'running') {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, NOT_RUNNING_ERR);
  }
  currentSimulation.worker.terminate();
  currentSimulation.state.status = 'stopped';
  logger.info('Simulation stopped');
  _emitUpdate();
}

/**
 * Returns the current simulation status
 */
function getStatus() {
  // Return undefined if not simulation is defined
  if (!currentSimulation) return undefined;
  return {
    options: currentSimulation.options,
    state: currentSimulation.state,
  };
}

/******************************************************************************
                            Private Functions
******************************************************************************/

/**
 * Notify simulation starts to users
 */
function _emitStart() {
  if (!currentSimulation) return;
  broadcast(
    JSON.stringify({
      event: 'simulation_start',
      data: {
        options: currentSimulation.options,
        state: currentSimulation.state,
      },
    }),
  );
}

/**
 * Notify simulation updates to users
 */
function _emitUpdate() {
  if (!currentSimulation) return;
  broadcast(
    JSON.stringify({
      event: 'simulation_update',
      data: {
        state: currentSimulation.state,
      },
    }),
  );
}

/**
 * Notify simulation errors to users
 */
function _emitError(errorMessage: string) {
  if (!currentSimulation) return;
  broadcast(
    JSON.stringify({
      event: 'simulation_error',
      data: {
        errorMessage,
      },
    }),
  );
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  start,
  stop,
  getStatus,
} as const;
