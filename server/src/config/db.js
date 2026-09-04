import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

let warned = false;

export async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] connected -> ${redact(env.mongoUri)}`);
    return true;
  } catch (err) {
    if (!warned) {
      warned = true;
      console.error(`[db] cannot reach MongoDB at ${redact(env.mongoUri)}`);
      console.error(`[db] ${err.message}`);
      console.error(
        "[db] the API stays up and serves 503 on data routes; start mongod or set MONGO_URI in server/.env, then it reconnects on its own."
      );
    }
    setTimeout(connectDb, 5000);
    return false;
  }
}

export function dbReady() {
  return mongoose.connection.readyState === 1;
}

function redact(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}
