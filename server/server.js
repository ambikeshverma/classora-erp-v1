const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
const PORT = process.env.PORT
app.use(cors());
app.use(express.json());

const schoolRoutes = require("./routes/schoolRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
app.use("/api/school", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("api/admissions", admissionRoutes);

app.listen(PORT || 5000, ()=>{
  console.log(`server is running port ${PORT}`)
})