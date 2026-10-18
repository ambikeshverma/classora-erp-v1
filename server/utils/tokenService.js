const jwt = require("jsonwebtoken");

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "classora_access_default_secret_key_2026";

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || "classora_refresh_default_secret_key_2026";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const generateSchoolTokens = (school) => {
  const payload = {
    schoolId: school._id.toString(),
    campusId: school.campusId,
    email: school.email,
    schoolName: school.schoolName,
    role: "schoolAdmin",
  };

  const accessToken = jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      schoolId: school._id.toString(),
      role: "schoolAdmin",
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const generateSuperAdminTokens = (admin) => {
  const payload = {
    adminId: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: "superAdmin",
  };

  const accessToken = jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      adminId: admin._id.toString(),
      role: "superAdmin",
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

const setRefreshCookie = (res, token, name = "refreshToken") => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

const clearRefreshCookie = (res, name = "refreshToken") => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

module.exports = {
  generateSchoolTokens,
  generateSuperAdminTokens,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
