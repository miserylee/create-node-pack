import cors = require('kcors');

const selectiveCORS = (allowedOrigins: string[] | '*' = '*') => {
  return cors({
    exposeHeaders: '*',
    origin: ctx => {
      if (allowedOrigins === '*') {
        return '*';
      }
      const origin = ctx.get('origin');
      const domain = origin.slice(origin.lastIndexOf('.', origin.lastIndexOf('.') - 1) + 1);
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
