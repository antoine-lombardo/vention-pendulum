import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';

import SimulationService from '@src/services/SimulationService';

import { IReq, IRes } from './common/types';
import { parseReq } from './common/util';
import { testObject, testObjectArray } from 'jet-validators/utils';
import { isNumber } from 'jet-validators';
import { SimulationOptions } from '@src/models/SimulationTypes';

/******************************************************************************
                                Constants
******************************************************************************/

const Validators = {
  start: parseReq({
    pendulums: testObjectArray({
      angle: isNumber,
      mass: isNumber,
      length: isNumber,
      anchor: testObject({
        x: isNumber,
        y: isNumber,
      }),
    }),
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Start the simulation
 */
function start(req: IReq, res: IRes) {
  const options = Validators.start(req.body) as SimulationOptions;
  SimulationService.start(options);
  res.status(HttpStatusCodes.OK).json({
    ...SimulationService.getStatus(),
    message: 'Simulation started',
  });
}

/**
 * Stop the simulation
 */
function stop(_: IReq, res: IRes) {
  SimulationService.stop();
  res.status(HttpStatusCodes.OK).json({ message: 'Simulation stopped' });
}

/**
 * Get the current simulation status
 */
function get(_: IReq, res: IRes) {
  res.status(HttpStatusCodes.OK).json(SimulationService.getStatus());
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  start,
  stop,
  get,
} as const;
