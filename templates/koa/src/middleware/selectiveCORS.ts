import cors = require('kcors');
import * as url from 'url';

const selectiveCORS = (allowedOrigins: string[] | '*' = '*') => {
  return cors({
    exposeHeaders: '*',
    origin: ctx => {
      if (allowedOrigins === '*') {
        return '*';
      }
      const origin = ctx.get('origin');
      const { hostname } = url.parse(origin);
      const domain = hostname!.slice(hostname!.lastIndexOf('.', hostname!.lastIndexOf('.') - 1) + 1);
      if (allowedOrigins.includes(domain)) {
        return '*';
      }
      return '';
    },
    credentials: true,
    keepHeadersOnError: true,
  });
};

export default selectiveCORS;
