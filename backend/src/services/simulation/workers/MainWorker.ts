import { Worker, parentPort, workerData } from 'worker_threads';
import { MainWorkerData, WorkerMessage } from './WorkerTypes';
import logger from 'jet-logger';

/******************************************************************************
                             Local variables
******************************************************************************/

const options = (workerData as MainWorkerData).options;
const workers: Worker[] = [];

/******************************************************************************
                                Functions
******************************************************************************/

const messageProxy = (message: WorkerMessage) => {
  for (const recipient of message.to) {
    // Message to a specific pendulum
    if (typeof recipient === 'number') {
      workers[recipient].postMessage(message);
    }
    // Message to all pendulums
    if (recipient === 'pendulums') {
      for (let i = 0; i < workers.length; i++) {
        if (message.from === i) continue;
        workers[i].postMessage(message);
      }
    }
    // Message to server
    if (recipient === 'server') {
      parentPort?.postMessage(message);
    }
    // Message to me
    if (recipient === 'main') {
      messageHandler(message);
    }
  }
};

const messageHandler = (_: WorkerMessage) => {
  // Nothing to handle yet
  return;
};

const addPendulum = async () => {
  return new Promise((resolve) => {
    const index = workers.length;
    workers.push(
      new Worker('./src/services/simulation/workers/PendulumWorker.js', {
        workerData: {
          index: workers.length,
          options,
          f64: (workerData as MainWorkerData).f64,
          un8: (workerData as MainWorkerData).un8,
        },
      }),
    );
    workers[index].on('error', resolve);
    workers[index].on('exit', resolve);
    workers[index].on('message', messageProxy); // worker sends result back
  });
};

/******************************************************************************
                                    Setup
******************************************************************************/

// Handle messages from the server
parentPort?.on('message', messageProxy);

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
