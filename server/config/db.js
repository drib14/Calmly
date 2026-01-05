const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // process.exit(1); // Do not exit process in Vercel/Dev environment to allow debugging
  }
};

module.exports = connectDB;
