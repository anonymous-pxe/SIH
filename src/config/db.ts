import mongoose from 'mongoose';

export interface DatabaseState {
  isConnected: boolean;
  uri: string;
  dbName: string;
  error?: string;
  client?: any;
  db?: any;
}

const state: DatabaseState = {
  isConnected: false,
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexasupply',
  dbName: 'nexasupply',
};

export async function connectDB(customUri?: string): Promise<DatabaseState> {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/nexasupply';
  state.uri = uri;

  try {
    const urlObj = new URL(uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://') ? uri : `mongodb://${uri}`);
    state.dbName = urlObj.pathname.replace('/', '') || 'nexasupply';
  } catch {
    state.dbName = 'nexasupply';
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      state.client = mongoose.connection.getClient ? mongoose.connection.getClient() : (mongoose.connection as any).client;
      state.db = mongoose.connection.db;
      state.isConnected = true;
      state.error = undefined;

      console.log(`[MongoDB] Connected to database: ${state.dbName}`);

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Connection lost');
        state.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Connection re-established');
        state.isConnected = true;
        state.error = undefined;
      });
    }

    return state;
  } catch (err: any) {
    state.isConnected = false;
    state.error = err.message || 'Database connection offline';
    console.warn(`[MongoDB Notice] ${state.error}. Running in resilient mode.`);
    return state;
  }
}

export function getDatabaseState(): DatabaseState {
  return {
    isConnected: state.isConnected,
    uri: state.uri,
    dbName: state.dbName,
    error: state.error,
  };
}

export function getMongoDB(): any {
  return state.db;
}
