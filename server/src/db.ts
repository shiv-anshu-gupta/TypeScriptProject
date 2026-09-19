/**
 * The process's single MongoDB connection.
 *
 * @packageDocumentation
 */
import mongoose from "mongoose";

/**
 * Opens the shared Mongoose connection and waits for it.
 *
 * @remarks
 * Awaited once at boot, before Express starts listening, so no route can ever
 * run without a database behind it. The connection string comes from
 * `MONGO_URI`; if it is missing or unreachable this rejects and takes the
 * process down, which is preferred to serving requests that cannot work.
 *
 * Mongoose keeps one pooled connection for the whole process, so nothing else
 * needs to call this - models simply use the default connection.
 */
export async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("db connected");
}
