const jwt = require("jsonwebtoken");

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "classora_access_default_secret_key_2026";

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || "classora_refresh_default_secret_key_2026";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const generateSchoolTokens = (school) => {
  const role = school.role || "schoolAdmin";
  const payload = {
    id: school._id.toString(),
    schoolId: school._id.toString(),
    campusId: school.campusId,
    email: school.email,
    schoolName: school.schoolName,
    name: school.schoolName,
    role: role,
  };

  const accessToken = jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      id: school._id.toString(),
      schoolId: school._id.toString(),
      role: role,
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const generateSuperAdminTokens = (admin) => {
  const role = admin.role || "superAdmin";
  const payload = {
    id: admin._id.toString(),
    adminId: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: role,
  };

  const accessToken = jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      id: admin._id.toString(),
      adminId: admin._id.toString(),
      role: role,
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Generic token generator for any user role (e.g. teacher, student, accountant, receptionist)
const generateUserTokens = (user, customRole, extraPayload = {}) => {
  const role = customRole || user.role || "user";
  const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : "");

  const payload = {
    id: userId,
    userId: userId,
    email: user.email || "",
    name: user.name || user.schoolName || user.username || user.employeeName || "",
    role: role,
    ...(user.schoolId ? { schoolId: user.schoolId.toString() } : {}),
    ...(user.campusId ? { campusId: user.campusId } : {}),
    ...extraPayload,
  };

  const accessToken = jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      id: userId,
      role: role,
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

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
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
  generateUserTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  setRefreshCookie,
  clearRefreshCookie,
};
