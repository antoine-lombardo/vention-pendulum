import { SimulationOptions } from '@src/models/SimulationTypes';
import { Worker, parentPort, workerData } from 'worker_threads';
import { WorkerMessage } from './WorkerTypes';
import logger from 'jet-logger';

/******************************************************************************
                             Local variables
******************************************************************************/

const options = workerData as SimulationOptions;
const workers: Worker[] = [];

/******************************************************************************
                                Functions
******************************************************************************/

const messageHandler = (message: WorkerMessage) => {
  // Message to a specific pendulum
  if (typeof message.to === 'number') {
    workers[message.to].postMessage(message);
  }
  // Message to all pendulums
  if (message.to === 'pendulums') {
    for (const worker of workers) {
      worker.postMessage(message);
    }
  }
  // Message to server
  if (message.to === 'server') {
    parentPort?.postMessage(message);
  }
};

const addPendulum = async () => {
  return new Promise((resolve) => {
    const index = workers.length;
    workers.push(
      new Worker('./src/services/simulation/workers/PendulumWorker.js', {
        workerData: {
          index: workers.length,
          options,
        },
      }),
    );
    workers[index].on('error', resolve);
    workers[index].on('exit', resolve);
    workers[index].on('message', messageHandler); // worker sends result back
  });
};

/******************************************************************************
                                    Setup
******************************************************************************/

// Handle messages from the server
parentPort?.on('message', messageHandler);

/******************************************************************************
                               Worker Function
******************************************************************************/

const workerFunc = async () => {
  logger.info('Main worker started');
  const promises = options.pendulums.map(() => addPendulum());
  await Promise.all(promises);
  logger.info('All pendulum workers done');
};

workerFunc();
