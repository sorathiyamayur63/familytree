import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Cache connection in dev to avoid multiple connections
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Add it to .env.local:\nMONGODB_URI=mongodb+srv://...'
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
