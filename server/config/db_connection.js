const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
mongoose
  .connect("process.env.DB_CONNECTION_URL")
  .then(() => {
    console.log("MongoDB Connected");

  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err.message);
  });