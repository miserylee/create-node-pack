import { verify } from 'jsonwebtoken';
import { Middleware } from 'koa';

const TOKEN_HEADER = 'Bearer ';

const checkToken: Middleware = async (ctx, next) => {
  const tokenString = ctx.get('Authorization') || ctx.query.token;
  if (tokenString && tokenString.indexOf(TOKEN_HEADER) === 0) {
    try {
      ctx.state.token = verify(tokenString.slice(TOKEN_HEADER.length), process.env.ACCESS_TOKEN_SECRET!);
    } catch (e) {
      // noop.
    }
  }
  await next();
};

export default checkToken;
