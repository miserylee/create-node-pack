import { createConnection, Schema } from 'mongoose';

const connection = createConnection(process.env.MONGODB_URI!, { useNewUrlParser: true });

export const enhanceSchema = (schema: Schema) => {
  schema.set('timestamps', true);
  schema.plugin(require('mongoose-finder-enhancer'));
  schema.plugin(require('mongoose-explain-checker'), { connection });
  return schema;
};

export default connection;
