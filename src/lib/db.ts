import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null };
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<mongoose.Connection> {
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  if (!global.mongoose.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");

    global.mongoose.promise = mongoose
      .connect(uri)
      .then((m) => m.connection);
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}
