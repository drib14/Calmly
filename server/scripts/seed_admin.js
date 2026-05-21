const mongoose = require('mongoose');
const User = require('../models/User');
const Identity = require('../models/Identity');
const connectDB = require('../config/db');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await connectDB();
        const email = "admin_verify@test.com";
        const password = "password123";

        // Cleanup
        const existing = await User.findOne({ email });
        if (existing) {
            await User.findByIdAndDelete(existing._id);
            await Identity.deleteMany({ user: existing._id });
        }

        const user = await User.create({
            email,
            password, // Will be hashed by pre-save
            role: 'admin',
            isVerified: true
        });

        await Identity.create({
            user: user._id,
            type: 'real',
            name: 'Admin User',
            handle: '@adminuser'
        });

        console.log(`Admin created: ${email} / ${password}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
