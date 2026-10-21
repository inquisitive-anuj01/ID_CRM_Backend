import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌  MongoDB connection error:', error.message);
    throw error;
  }
};
