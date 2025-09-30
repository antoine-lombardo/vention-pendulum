import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import SimulationRoutes from './SimulationRoutes';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ** Add SimulationRouter ** //

// Init router
const simulationRouter = Router();

// Register all routes
simulationRouter.post(Paths.Simulation.Start, SimulationRoutes.start);
simulationRouter.get(Paths.Simulation.Stop, SimulationRoutes.stop);
simulationRouter.get(Paths.Simulation.Pause, SimulationRoutes.pause);
simulationRouter.get(Paths.Simulation.Resume, SimulationRoutes.resume);
simulationRouter.get(Paths.Simulation.Get, SimulationRoutes.get);

// Add SimulationRouter
apiRouter.use(Paths.Simulation.Base, simulationRouter);

/******************************************************************************
                                Export default
******************************************************************************/

export default apiRouter;
