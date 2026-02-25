const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.DATABASE_URI || process.env.MONGO_URI || process.env.CONNECT_URI;

    if (!uri) {
        // fail fast with a helpful message; Render logs will show this
        const msg = 'DATABASE_URI environment variable is not defined. ' +
            'Make sure you set it in the Render dashboard (or your .env when running locally).';
        console.error(msg);
        throw new Error(msg);
    }

    try {
        console.log('Attempting to connect to MongoDB using URI:', uri ? '[redacted]' : uri);
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err; // rethrow so the process exits and Render shows failure
    }
}

module.exports = connectDB;
