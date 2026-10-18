const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const db_connection = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/classora";
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully to:", uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("👉 Tip: Ensure MongoDB service is running locally or specify a valid MONGO_URI in server/.env");
  }
};

module.exports = db_connection;