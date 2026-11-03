const crypto = require("crypto");
const mongoose = require("mongoose");
const UserSession = require("../models/UserSession");

/**
 * Extract real client IP address considering reverse proxies, load balancers, etc.
 */
const getClientIp = (req) => {
  if (!req) return "Unknown";

  const forwarded = req.headers ? req.headers["x-forwarded-for"] : null;
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    if (ips[0]) return cleanIp(ips[0]);
  }

  const realIp = req.headers ? (req.headers["x-real-ip"] || req.headers["cf-connecting-ip"]) : null;
  if (realIp) return cleanIp(realIp);

  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
  if (socketIp) return cleanIp(socketIp);

  return "Unknown";
};

const cleanIp = (ip) => {
  if (!ip) return "Unknown";
  let cleaned = ip.trim();
  if (cleaned === "::1" || cleaned === "::ffff:127.0.0.1") {
    return "127.0.0.1 (Local)";
  }
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.replace("::ffff:", "");
  }
  return cleaned;
};

/**
 * Parse User-Agent into clean human-readable device and browser summary
 */
const parseDevice = (userAgent) => {
  if (!userAgent || typeof userAgent !== "string") return "Desktop / Browser";

  const ua = userAgent.toLowerCase();

  // OS
  let os = "Desktop";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  // Browser
  let browser = "Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  return `${browser} on ${os}`;
};

/**
 * Record or update user session.
 * Upserts into the UserSession collection so the same user never adds extra rows.
 */
const recordUserSession = async ({
  userId,
  role = "user",
  name = "",
  email = "",
  schoolId = null,
  campusId = "",
  schoolName = "",
  req = null,
  customSessionId = null,
}) => {
  try {
    if (!userId) return null;

    const uId = userId.toString();
    const userKey = `${role}:${uId}`;
    const sessionId = customSessionId || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"));

    const ipAddress = getClientIp(req);
    const userAgent = req?.headers ? req.headers["user-agent"] || "" : "";
    const device = parseDevice(userAgent);

    let validSchoolId = null;
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
      validSchoolId = new mongoose.Types.ObjectId(schoolId);
    }

    const now = new Date();

    const sessionDoc = await UserSession.findOneAndUpdate(
      { userKey },
      {
        $set: {
          userId: uId,
          userKey,
          role,
          name: name || "",
          email: email ? email.toLowerCase().trim() : "",
          schoolId: validSchoolId,
          campusId: campusId || "",
          schoolName: schoolName || "",
          sessionId,
          ipAddress,
          userAgent,
          device,
          isActive: true,
          forceLoggedOut: false,
          forceLoggedOutAt: null,
          forceLoggedOutBy: null,
          loginAt: now,
          lastActivityAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { sessionId, session: sessionDoc };
  } catch (error) {
    console.error("Error recording user session:", error.message);
    return null;
  }
};

/**
 * Validate that a session is active and has not been force-logged-out.
 * Features auto-heal to avoid false-positive logouts while strictly enforcing force-logout.
 */
const validateAndTouchSession = async (sessionId, decodedUser = null, req = null) => {
  if (!sessionId) return { valid: true };

  try {
    let session = await UserSession.findOne({ sessionId });

    // Fallback: If sessionId isn't found, check if a session exists for this userKey
    if (!session && decodedUser) {
      const role = decodedUser.role || "user";
      const uId = (decodedUser.id || decodedUser.schoolId || decodedUser.adminId || decodedUser.userId || "").toString();

      if (uId) {
        const userKey = `${role}:${uId}`;
        const existing = await UserSession.findOne({ userKey });

        if (existing) {
          // If the user was explicitly force-logged out, REJECT immediately!
          if (existing.forceLoggedOut || !existing.isActive) {
            return {
              valid: false,
              isForceLoggedOut: true,
              reason: "Your session has been terminated by Super Admin. Please log in again.",
              session: existing,
            };
          }

          // Otherwise update sessionId to sync with the active token
          existing.sessionId = sessionId;
          existing.isActive = true;
          existing.lastActivityAt = new Date();
          await existing.save();
          session = existing;
        } else {
          // Auto-record active session document so valid token isn't falsely rejected
          const created = await recordUserSession({
            userId: uId,
            role,
            name: decodedUser.name || decodedUser.schoolName || "",
            email: decodedUser.email || "",
            schoolId: decodedUser.schoolId || null,
            campusId: decodedUser.campusId || "",
            schoolName: decodedUser.schoolName || "",
            req,
            customSessionId: sessionId,
          });
          session = created?.session;
        }
      }
    }

    if (!session) {
      // If no record exists, allow the cryptographically verified JWT through
      return { valid: true };
    }

    // STRICT FORCE LOGOUT CHECK:
    if (session.forceLoggedOut || !session.isActive) {
      return {
        valid: false,
        isForceLoggedOut: true,
        reason: "Your session has been terminated by Super Admin. Please log in again.",
        session,
      };
    }

    // Throttle lastActivityAt updates to avoid DB thrashing
    const now = Date.now();
    const lastActive = session.lastActivityAt ? new Date(session.lastActivityAt).getTime() : 0;
    if (now - lastActive > 15000) {
      UserSession.updateOne({ _id: session._id }, { $set: { lastActivityAt: new Date() } }).exec();
    }

    return { valid: true, session };
  } catch (error) {
    console.error("Session validation error:", error.message);
    // Fail-open on unexpected DB error so active users aren't disrupted
    return { valid: true };
  }
};

/**
 * Terminate a session (Force Logout)
 */
const forceLogoutSession = async (sessionIdOrMongoId, terminatedBy = "superAdmin") => {
  try {
    const isObjectId = sessionIdOrMongoId && /^[0-9a-fA-F]{24}$/.test(sessionIdOrMongoId);
    const query = isObjectId
      ? { $or: [{ _id: sessionIdOrMongoId }, { sessionId: sessionIdOrMongoId }] }
      : { sessionId: sessionIdOrMongoId };

    const session = await UserSession.findOneAndUpdate(
      query,
      {
        $set: {
          isActive: false,
          forceLoggedOut: true,
          forceLoggedOutAt: new Date(),
          forceLoggedOutBy: terminatedBy,
        },
      },
      { new: true }
    );

    return session;
  } catch (error) {
    console.error("Error forcing logout:", error.message);
    throw error;
  }
};

/**
 * User voluntary logout: mark session as inactive
 */
const voluntaryLogoutSession = async (sessionIdOrUserId) => {
  try {
    if (!sessionIdOrUserId) return;
    await UserSession.updateOne(
      {
        $or: [
          { sessionId: sessionIdOrUserId },
          { userId: sessionIdOrUserId.toString() },
        ],
      },
      {
        $set: {
          isActive: false,
        },
      }
    );
  } catch (err) {
    console.error("Error in voluntary logout session:", err.message);
  }
};

module.exports = {
  getClientIp,
  parseDevice,
  recordUserSession,
  validateAndTouchSession,
  forceLogoutSession,
  voluntaryLogoutSession,
};
