const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User'); // Adjust path as needed
const Identity = require('./server/models/Identity');
require('dotenv').config({ path: './server/.env' });

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/calmly_db');
    console.log('Connected to DB');

    const email = 'admin@calmly.app';
    const password = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists, updating role...');
      user.isAdmin = true;
      user.role = 'admin';
      user.password = hashedPassword;
      await user.save();
    } else {
      console.log('Creating new admin user...');
      user = await User.create({
        email,
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        isVerified: true
      });

      // Create Identity
      await Identity.create({
        user: user._id,
        handle: 'admin_master',
        displayName: 'Admin User',
        type: 'real'
      });
    }

    console.log('Admin seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
