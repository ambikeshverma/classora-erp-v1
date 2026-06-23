const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const db_connection = async ()=>{
    try{
      await mongoose.connect(process.env.MONGO_URI)
      console.log("MongoDB Connected Successfully")
    }
    catch(err){
    console.log("MongoDB Connection Error:", err.message);
  }
}

module.exports = db_connection;