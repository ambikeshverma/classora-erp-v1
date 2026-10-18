// auth.js - alias wrapper pointing to schoolAuth to guarantee schoolId extraction and active status check
const schoolAuth = require("./schoolAuth");

module.exports = schoolAuth;