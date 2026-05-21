const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const resetBlocks = async () => {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected. Resetting blocks...');

        const result = await User.updateMany(
            {},
            {
                $set: {
                    'settings.blockedUsers': [],
                    'settings.mutedUsers': []
                }
            }
        );

        console.log(`Reset complete. Modified ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error("Reset Failed:", err);
        process.exit(1);
    }
};

resetBlocks();
