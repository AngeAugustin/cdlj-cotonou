import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
