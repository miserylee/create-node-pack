import * as mongoose from 'mongoose';
import { createConnection, Schema } from 'mongoose';

mongoose.plugin((schema: Schema) => {
  schema.set('timestamps', true);
});
mongoose.plugin(require('mongoose-finder-enhancer'));
mongoose.plugin(require('mongoose-explain-checker'));

const connection = createConnection(process.env.MONGODB_URI!, { useNewUrlParser: true });

export default connection;
