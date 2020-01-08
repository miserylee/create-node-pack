import Signals = NodeJS.Signals;

const IS_DEV = process.env.NODE_ENV !== 'production';

if (IS_DEV) {
  require('dotenv').config();
}

import * as Application from 'koa';
import * as compress from 'koa-compress';
import createLogger from 'koa-erz-logger';
import koact from 'koact';
import * as path from 'path';
import checkToken from './middleware/checkToken';
import selectiveCORS from './middleware/selectiveCORS';

require('./helpers/mongodb_connection');

const app = new Application();

// Add middleware
app.use(createLogger());
app.use(compress());
app.use(selectiveCORS(IS_DEV ? '*' : [
  // Put your allowed origins here.
]));
app.use(checkToken);
app.use(koact(path.resolve(__dirname, 'routes'), [], {
  resolves: IS_DEV ? ['.ts', '.js'] : ['.js'],
}));

const port = process.env.APP_SERVER_PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server started! Listening on port ${port}`);
});

const preExit = (error: Error | Signals | {} | null | undefined) => {
  if (error instanceof Error) {
    console.error(error);
  }
  // Do sth. before exit.
  server.close(() => {
    process.exit(0);
  });
};

process.on('uncaughtException', preExit);

process.on('unhandledRejection', preExit);

process.on('SIGINT', preExit);
