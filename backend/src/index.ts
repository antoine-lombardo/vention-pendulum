import logger from 'jet-logger';

import ENV from '@src/common/constants/ENV';
import server from './server';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MSG =
  'Express server started on port: ' + ENV.Port.toString();

/******************************************************************************
                                  Run
******************************************************************************/

// Catch server errors
server.on('error', (err) => {
  logger.err(err.message);
});

// Start the server
server.listen(ENV.Port, () => {
  logger.info(SERVER_START_MSG);
});
