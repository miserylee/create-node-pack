import { ClientSession, createConnection, Schema } from 'mongoose';

const connection = createConnection(process.env.MONGODB_URI!, {
  useNewUrlParser: true,
  useCreateIndex: true,
  autoIndex: !!process.env.AUTO_INDEX,
  useFindAndModify: false,
});

export const enhanceSchema = (schema: Schema) => {
  schema.set('timestamps', true);
  schema.plugin(require('mongoose-finder-enhancer'));
  schema.plugin(require('mongoose-explain-checker'), { connection });
  return schema;
};

export default connection;

export async function pack<T>(operations: (session: ClientSession) => Promise<T>) {
  const session = await connection.startSession();

  async function commitWithRetry() {
    try {
      await session.commitTransaction();
    } catch (error) {
      if (error.hasOwnProperty('errorLabels') && error.errorLabels.includes('UnknownTransactionCommitResult')) {
        console.log('UnknownTransactionCommitResult, retrying commit operation ...');
        await commitWithRetry();
      } else {
        throw error;
      }
    }
  }

  async function tryTransaction(): Promise<T> {
    try {
      session.startTransaction();
      const result = await operations(session);
      await commitWithRetry();
      return result;
    } catch (error) {
      await session.abortTransaction();
      // If transient error, retry the whole transaction
      if (error.hasOwnProperty('errorLabels') && error.errorLabels.includes('TransientTransactionError')) {
        console.log('TransientTransactionError, retrying transaction ...');
        return await tryTransaction();
      } else {
        throw error;
      }
    }
  }

  return await tryTransaction();
}
