const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let dbUrl = process.env.MONGO_URI;

    // If no URI provided or connection string is dummy, use memory server
    if (!dbUrl || dbUrl.includes('localhost:27017')) {
      console.log('Using MongoDB Memory Server as fallback...');
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
    }

    const conn = await mongoose.connect(dbUrl);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Falling back to MongoDB Memory Server due to connection error...');

    try {
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('MongoDB Memory Server Connected successfully as standby.');
      }
    } catch (memError) {
      console.error('Critical: MongoDB Memory Server failed too.', memError.message);
    }
  }
};

module.exports = connectDB;
