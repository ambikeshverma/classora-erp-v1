const express = require("express");
const db_connection = require("./config/db_connection.js");
const schoolAuth = require("./middleware/schoolAuth.js")
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

db_connection();
dotenv.config();
const PORT = process.env.PORT
app.use(cors());
app.use(express.json());

const adminRoutes = require("./routes/adminRoutes")
const schoolRoutes = require("./routes/schoolRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const masterRoutes = require("./routes/masterRoutes");

app.use("/api/master",schoolAuth, masterRoutes);
app.use("/api/superAdmin", adminRoutes)
app.use("/api/school", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("api/admissions", admissionRoutes);


app.listen(PORT || 5000, ()=>{
  console.log(`server is running port ${PORT}`)
})