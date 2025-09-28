import { Router } from 'express';

import Paths from '@src/common/constants/Paths';
import SimulationRoutes from './SimulationRoutes';
import UserRoutes from './UserRoutes';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ** Add UserRouter ** //

// Init router
const userRouter = Router();

// Get all users
userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);

// Add UserRouter
apiRouter.use(Paths.Users.Base, userRouter);

// ** Add SimulationRouter ** //

// Init router
const simulationRouter = Router();

// Register all routes
simulationRouter.post(Paths.Simulation.Start, SimulationRoutes.start);
simulationRouter.get(Paths.Simulation.Stop, SimulationRoutes.stop);
simulationRouter.get(Paths.Simulation.Get, SimulationRoutes.get);

// Add SimulationRouter
apiRouter.use(Paths.Simulation.Base, simulationRouter);

/******************************************************************************
                                Export default
******************************************************************************/

export default apiRouter;
