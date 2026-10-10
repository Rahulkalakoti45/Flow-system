const mongoose = require('mongoose');

/**
 * Connects Mongoose to MongoDB. Throws on failure so the caller can decide
 * whether to exit (server start-up) or surface the error (tests).
 */
async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDB };
