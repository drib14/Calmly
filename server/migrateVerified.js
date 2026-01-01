const mongoose = require('mongoose');
const User = require('./models/User'); // Fixed path
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') }); // Load from root .env if needed, or default

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is not defined");
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const result = await User.updateMany(
      { isVerified: false },
      { $set: { isVerified: true, verificationToken: undefined } }
    );

    console.log(`Updated ${result.modifiedCount} users to verified status.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
