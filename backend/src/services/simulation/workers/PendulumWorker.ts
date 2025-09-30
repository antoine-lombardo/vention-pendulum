import { PendulumStatus } from '@src/models/SimulationTypes';
import { parentPort, workerData } from 'worker_threads';
import { calculatePosition, calculateAngle } from '../SimulationUtils';
import {
  CollisionMessage,
  PendulumWorkerData,
  RestartMessage,
  StartMessage,
  StateMessage,
  WorkerMessage,
} from './WorkerTypes';
import logger from 'jet-logger';
import { getAngle, getPosition, getState, getStatus } from './WorkerUtils';

/******************************************************************************
                                Constants
******************************************************************************/

const MAX_REFRESH_RATE = 60;
const COLLISION_THRESHOLD = 0;
const COLLISION_TIMEOUT = 5;

/******************************************************************************
                             Local variables
******************************************************************************/

let options = (workerData as PendulumWorkerData).options;
const index = (workerData as PendulumWorkerData).index;
// const states: PendulumState[] = options.pendulums.map((pendulum, i) => {
//   return {
//     status: PendulumStatus.IDLE,
//     angle: options.pendulums[i].angle,
//     position: calculatePosition(
//       options.pendulums[i].angle,
//       options.pendulums[i],
//     ),
//   };
// });
let startTime = 0;
let pauseTime = 0;
const exitEvent = false;

/******************************************************************************
                              Shared Arrays
******************************************************************************/

const f64 = new Float64Array((workerData as PendulumWorkerData).f64);
const un8 = new Uint8Array((workerData as PendulumWorkerData).un8);

export const setPosition = (position: { x: number; y: number }) => {
  f64[index * 3] = position.x;
  f64[index * 3 + 1] = position.y;
};

export const setAngle = (angle: number) => {
  f64[index * 3 + 2] = angle;
};

export const setStatus = (status: PendulumStatus) => {
  un8[index] = status;
};

/******************************************************************************
                                Collisions
******************************************************************************/

let collisionTime = 0;

const detectCollision = (time: number): boolean => {
  // Skip collision detection if simulation not running
  if (getStatus(un8, index) !== PendulumStatus.RUNNING) return false;

  // Try collision with every other running pendulum
  for (let i = 0; i < options.pendulums.length; i++) {
    if (i === index) continue;
    if (getStatus(un8, i) !== PendulumStatus.RUNNING) continue;

    // Retrieve pendulums positions
    const posA = getPosition(f64, index);
    const posB = getPosition(f64, i);

    // Calculate if there is a collision or not
    const ctrDist = Math.sqrt(
      Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2),
    );
    const threshold =
      options.pendulums[index].radius +
      options.pendulums[i].radius +
      COLLISION_THRESHOLD;
    const isCollision = ctrDist <= threshold;

    // Return the pendulum index with which there is a collision
    if (isCollision) {
      // Log collision infos
      logger.info(`Collision between ${index} and ${i} detected`);

      // Initialize collision state
      onCollision(time);

      // Send collision event to other pendulums
      const collisionMessage: CollisionMessage = {
        event: 'collision',
        from: index,
        to: ['pendulums'],
        time: time,
        data: {
          collisionWith: i,
        },
      };
      sendMessage(collisionMessage);

      // Return the pendulum index with which there is a collision
      return true;
    }
  }

  return false;
};

const onCollision = (time: number) => {
  if (time < collisionTime) return;
  collisionTime = time;
  restartSent = false;
  clearReceivedRestarts();
  setStatus(PendulumStatus.WAITING_FOR_RESTART);
};

/******************************************************************************
                                Restarts
******************************************************************************/

let receivedRestarts = options.pendulums.map(() => false);
let restartSent = false;

const sendRestart = () => {
  const collisionMessage: RestartMessage = {
    event: 'restart',
    from: index,
    to: ['pendulums'],
    time: collisionTime,
  };
  sendMessage(collisionMessage);
  restartSent = true;
};

const clearReceivedRestarts = () => {
  receivedRestarts = options.pendulums.map(() => false);
};

const addReceivedRestart = (i: number) => {
  if (i < 0 || i >= receivedRestarts.length) return;
  receivedRestarts[i] = true;
};

const allRestartsReceived = () => {
  return receivedRestarts.every((x, i) => i === index || x);
};

const readyToRestart = (time: number) => {
  return allRestartsReceived() && time > restartTime();
};

const restartTime = () => {
  return collisionTime + COLLISION_TIMEOUT * 1000;
};

/******************************************************************************
                                Functions
******************************************************************************/

const sendMessage = (message: WorkerMessage) => {
  parentPort?.postMessage(message);
};

const messageHandler = (message: WorkerMessage) => {
  switch (message.event) {
    case 'start': {
      const startMessage = message as StartMessage;
      options = startMessage.data.options;
      startTime = startMessage.time;
      setAngle(options.pendulums[index].angle);
      setPosition(
        calculatePosition(
          options.pendulums[index].angle,
          options.pendulums[index],
        ),
      );
      setStatus(PendulumStatus.RUNNING);
      break;
    }
    case 'stop': {
      if (message.time < startTime) return;

      setStatus(PendulumStatus.IDLE);
      setAngle(options.pendulums[index].angle);
      setPosition(
        calculatePosition(
          options.pendulums[index].angle,
          options.pendulums[index],
        ),
      );

      sendMessage({
        event: 'state',
        from: index,
        to: ['server'],
        time: message.time,
        data: {
          state: getState(f64, un8, index),
        },
      } as StateMessage);

      break;
    }
    case 'pause': {
      if (getStatus(un8, index) !== PendulumStatus.RUNNING) return;
      if (message.time < startTime) return;
      pauseTime = message.time;
      setStatus(PendulumStatus.PAUSED);
      pendulumTick(message.time);
      break;
    }
    case 'resume': {
      if (getStatus(un8, index) !== PendulumStatus.PAUSED) return;
      if (message.time < startTime) return;
      startTime = startTime + (message.time - pauseTime);
      pauseTime = 0;
      setStatus(PendulumStatus.RUNNING);
      pendulumTick(message.time);
      break;
    }
    case 'state': {
      const stateMessage = message as StateMessage;
      if (stateMessage.from === index) return;
      break;
    }
    case 'collision': {
      onCollision(message.time);
      pendulumTick(message.time);
      break;
    }
    case 'restart': {
      const restartMessage = message as RestartMessage;
      addReceivedRestart(restartMessage.from);
      break;
    }
  }
};

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pendulumTick = (time: number) => {
  const timeSinceStart = (time - startTime) / 1000;
  setAngle(calculateAngle(timeSinceStart, options.pendulums[index]));
  setPosition(
    calculatePosition(getAngle(f64, index), options.pendulums[index]),
  );
  detectCollision(time);
  sendMessage({
    event: 'state',
    from: index,
    to: ['server', 'pendulums'],
    time,
    data: {
      state: getState(f64, un8, index),
    },
  } as StateMessage);
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
  setStatus(PendulumStatus.IDLE);
  setAngle(options.pendulums[index].angle);
  setPosition(
    calculatePosition(options.pendulums[index].angle, options.pendulums[index]),
  );
  let nextRefresh = Date.now();
  while (!exitEvent) {
    // Wait to respect the max refresh rate
    const delay = nextRefresh - Date.now();
    if (delay > 0) {
      await sleep(delay);
    }

    switch (getStatus(un8, index)) {
      case PendulumStatus.RUNNING: {
        pendulumTick(nextRefresh);
        break;
      }
      case PendulumStatus.WAITING_FOR_RESTART: {
        if (!restartSent) sendRestart();
        if (!readyToRestart(nextRefresh)) break;
        setAngle(options.pendulums[index].angle);
        setPosition(
          calculatePosition(
            options.pendulums[index].angle,
            options.pendulums[index],
          ),
        );
        startTime = restartTime();
        clearReceivedRestarts();
        collisionTime = 0;
        setStatus(PendulumStatus.RUNNING);
        break;
      }
    }
    nextRefresh = nextRefresh + 1000 / MAX_REFRESH_RATE;
  }
  logger.info(`Pendulum #${index} worker stopped: Exit event received.`);
};

workerFunc();
