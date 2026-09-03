const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("MONGO_URL or MONGO_URI is required in your environment variables");
  }

  await mongoose.connect(mongoUrl);
  console.log("MongoDB connected");
};

module.exports = connectDB;
