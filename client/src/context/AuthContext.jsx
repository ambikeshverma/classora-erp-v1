import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

/**
 * Classora ERP - Auth & Role Context
 * Provides global access to the current authenticated user's profile, role, token,
 * and role-verification utility methods across any component in the application.
 */

export const AuthContext = createContext(null);

// Safely parse JSON from localStorage
const getStoredJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
};

// Safely decode payload from JWT without external dependency
const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Standardize role string for flexible matching ("schoolAdmin", "School Admin", "school_admin" all match)
export const normalizeRole = (role) => {
  if (!role || typeof role !== "string") return "";
  return role.toLowerCase().replace(/[\s_-]/g, "");
};

// Helper to extract initial auth state from localStorage
const getInitialAuthState = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("superAdminToken") || null;
  const decoded = parseJwtPayload(token);

  // Role resolution priority:
  // 1. Direct "role" / "userRole" in localStorage
  // 2. Role inside stored "user" / "userInfo" / "superAdminUser" object
  // 3. Role from decoded JWT token payload
  // 4. Inferred role based on existing legacy localStorage keys
  let role =
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    null;

  const storedUser =
    getStoredJson("user") ||
    getStoredJson("userInfo") ||
    getStoredJson("superAdminUser");

  if (!role && storedUser?.role) {
    role = storedUser.role;
  }

  if (!role && decoded?.role) {
    role = decoded.role;
  }

  if (!role) {
    if (localStorage.getItem("superAdminToken")) {
      role = "superAdmin";
    } else if (localStorage.getItem("schoolId")) {
      role = "schoolAdmin";
    }
  }

  // Build unified user info
  let user = null;
  if (storedUser) {
    user = {
      ...storedUser,
      role: role || storedUser.role || "user",
      name: storedUser.name || storedUser.schoolName || localStorage.getItem("userName") || "User",
      schoolId: storedUser.schoolId || localStorage.getItem("schoolId"),
      campusId: storedUser.campusId || localStorage.getItem("campusId"),
    };
  } else if (token || localStorage.getItem("schoolId") || localStorage.getItem("userName")) {
    user = {
      id: localStorage.getItem("schoolId") || decoded?.id || decoded?.schoolId || decoded?.adminId,
      schoolId: localStorage.getItem("schoolId") || decoded?.schoolId,
      campusId: localStorage.getItem("campusId") || decoded?.campusId,
      name: localStorage.getItem("userName") || decoded?.name || decoded?.schoolName || "User",
      schoolName: localStorage.getItem("userName") || decoded?.schoolName,
      email: decoded?.email || "",
      role: role || "schoolAdmin",
      enabledModules: getStoredJson("enabledModules", []),
      enabledSubModules: getStoredJson("enabledSubModules", {}),
    };
  }

  return { token, role, user };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const [loading] = useState(false);

  // Sync state from storage changes (e.g. across tabs, custom events)
  const syncFromStorage = useCallback(() => {
    setAuthState(getInitialAuthState());
  }, []);

  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (
        !e.key ||
        e.key === "token" ||
        e.key === "role" ||
        e.key === "user" ||
        e.key === "superAdminToken" ||
        e.key === "superAdminUser"
      ) {
        syncFromStorage();
      }
    };

    const handleCustomAuthChange = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("auth:change", handleCustomAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("auth:change", handleCustomAuthChange);
    };
  }, [syncFromStorage]);

  /**
   * login(authData, options)
   * Stores token and user info into localStorage and updates React Context state immediately.
   * Fully preserves all legacy keys for complete backward compatibility.
   */
  const login = useCallback((authData, options = {}) => {
    if (!authData) return;

    const token =
      authData.accessToken ||
      authData.token ||
      (options.isSuperAdmin ? localStorage.getItem("superAdminToken") : localStorage.getItem("token"));

    const decoded = parseJwtPayload(token);

    // Resolve role
    const resolvedRole =
      authData.role ||
      authData.user?.role ||
      authData.admin?.role ||
      decoded?.role ||
      (options.isSuperAdmin ? "superAdmin" : authData.schoolId ? "schoolAdmin" : "user");

    // Resolve name
    const resolvedName =
      authData.name ||
      authData.user?.name ||
      authData.schoolName ||
      authData.admin?.name ||
      decoded?.name ||
      decoded?.schoolName ||
      "User";

    // Resolve user info object
    const userInfo = {
      id:
        authData.user?.id ||
        authData.schoolId ||
        authData.admin?.id ||
        authData.id ||
        decoded?.id ||
        decoded?.schoolId ||
        decoded?.adminId,
      schoolId: authData.schoolId || authData.user?.schoolId || decoded?.schoolId,
      campusId: authData.campusId || authData.user?.campusId || decoded?.campusId,
      name: resolvedName,
      schoolName: authData.schoolName || authData.user?.schoolName || resolvedName,
      email: authData.email || authData.user?.email || authData.admin?.email || decoded?.email || "",
      role: resolvedRole,
      contactNo: authData.contactNo || authData.user?.contactNo || "",
      address: authData.address || authData.user?.address || "",
      schoolLogo: authData.schoolLogo || authData.user?.schoolLogo || "",
      enabledModules: authData.enabledModules || authData.user?.enabledModules || [],
      enabledSubModules: authData.enabledSubModules || authData.user?.enabledSubModules || {},
      isActive: authData.isActive !== undefined ? authData.isActive : true,
      ...(authData.user || {}),
    };

    // Store in localStorage - maintaining existing keys
    if (token) {
      localStorage.setItem("token", token);
      if (resolvedRole === "superAdmin" || options.isSuperAdmin) {
        localStorage.setItem("superAdminToken", token);
      }
    }

    if (userInfo.name) {
      localStorage.setItem("userName", userInfo.name);
    }
    if (userInfo.schoolId) {
      localStorage.setItem("schoolId", userInfo.schoolId);
    }
    if (userInfo.campusId) {
      localStorage.setItem("campusId", userInfo.campusId);
    }

    if (userInfo.enabledModules && Array.isArray(userInfo.enabledModules)) {
      localStorage.setItem("enabledModules", JSON.stringify(userInfo.enabledModules));
    }
    if (userInfo.enabledSubModules) {
      localStorage.setItem("enabledSubModules", JSON.stringify(userInfo.enabledSubModules));
    }

    // Role and structured user keys
    localStorage.setItem("role", resolvedRole);
    localStorage.setItem("userRole", resolvedRole);
    localStorage.setItem("user", JSON.stringify(userInfo));
    localStorage.setItem("userInfo", JSON.stringify(userInfo));

    if (resolvedRole === "superAdmin" || options.isSuperAdmin) {
      localStorage.setItem("superAdminUser", JSON.stringify(userInfo));
    }

    // Update Context State
    setAuthState({
      token,
      role: resolvedRole,
      user: userInfo,
    });

    // Notify any other listeners
    window.dispatchEvent(new CustomEvent("auth:change", { detail: { user: userInfo, role: resolvedRole } }));
  }, []);

  /**
   * logout(options)
   * Clears session, resets context state, and dispatches auth:change event.
   */
  const logout = useCallback((options = { redirect: true }) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("userName");
    localStorage.removeItem("schoolId");
    localStorage.removeItem("campusId");
    localStorage.removeItem("enabledModules");
    localStorage.removeItem("enabledSubModules");
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminUser");

    setAuthState({
      token: null,
      role: null,
      user: null,
    });

    window.dispatchEvent(new CustomEvent("auth:change", { detail: null }));

    if (options.redirect) {
      const redirectPath = options.redirectPath || "/";
      if (window.location.pathname !== redirectPath) {
        window.location.href = redirectPath;
      }
    }
  }, []);

  /**
   * updateUser(partialData)
   * Merges partial updates into current user and updates localStorage.
   */
  const updateUser = useCallback((partialData) => {
    if (!partialData || typeof partialData !== "object") return;

    setAuthState((prev) => {
      const updatedUser = {
        ...(prev.user || {}),
        ...partialData,
      };

      const updatedRole = partialData.role || prev.role || updatedUser.role;

      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      if (partialData.role) {
        localStorage.setItem("role", partialData.role);
        localStorage.setItem("userRole", partialData.role);
      }
      if (partialData.name || partialData.schoolName) {
        localStorage.setItem("userName", partialData.name || partialData.schoolName);
      }

      window.dispatchEvent(new CustomEvent("auth:change", { detail: { user: updatedUser, role: updatedRole } }));

      return {
        ...prev,
        role: updatedRole,
        user: updatedUser,
      };
    });
  }, []);

  /**
   * hasRole(roles)
   * Checks if current user's role matches any of the given roles.
   * Supports:
   *   hasRole("schoolAdmin")
   *   hasRole(["schoolAdmin", "superAdmin"])
   *   hasRole("School Admin") -> matches "schoolAdmin" seamlessly
   */
  const hasRole = useCallback(
    (roles) => {
      if (!roles) return false;
      const currentNorm = normalizeRole(authState.role);
      if (!currentNorm) return false;

      if (Array.isArray(roles)) {
        return roles.some((r) => normalizeRole(r) === currentNorm);
      }

      return normalizeRole(roles) === currentNorm;
    },
    [authState.role]
  );

  /**
   * hasAnyRole(...roles)
   */
  const hasAnyRole = useCallback(
    (...roles) => {
      const flat = roles.flat();
      return hasRole(flat);
    },
    [hasRole]
  );

  const isSuperAdmin = useMemo(() => normalizeRole(authState.role) === "superadmin", [authState.role]);
  const isSchoolAdmin = useMemo(() => normalizeRole(authState.role) === "schooladmin", [authState.role]);
  const isAuthenticated = useMemo(() => Boolean(authState.token), [authState.token]);

  const value = useMemo(
    () => ({
      user: authState.user,
      role: authState.role,
      token: authState.token,
      isAuthenticated,
      isSuperAdmin,
      isSchoolAdmin,
      loading,
      login,
      logout,
      updateUser,
      hasRole,
      hasAnyRole,
      checkPermission: hasRole,
    }),
    [
      authState.user,
      authState.role,
      authState.token,
      isAuthenticated,
      isSuperAdmin,
      isSchoolAdmin,
      loading,
      login,
      logout,
      updateUser,
      hasRole,
      hasAnyRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth() Hook
 * Use in ANY React component or page to access user info, role, and permission checkers.
 * Example:
 *   const { user, role, hasRole, isSchoolAdmin, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Graceful fallback if called outside provider: read directly from localStorage
  if (!context) {
    const initial = getInitialAuthState();
    return {
      user: initial.user,
      role: initial.role,
      token: initial.token,
      isAuthenticated: Boolean(initial.token),
      isSuperAdmin: normalizeRole(initial.role) === "superadmin",
      isSchoolAdmin: normalizeRole(initial.role) === "schooladmin",
      loading: false,
      login: () => {},
      logout: () => {
        localStorage.clear();
        window.location.href = "/";
      },
      updateUser: () => {},
      hasRole: (roles) => {
        if (!roles) return false;
        const currentNorm = normalizeRole(initial.role);
        if (!currentNorm) return false;
        if (Array.isArray(roles)) {
          return roles.some((r) => normalizeRole(r) === currentNorm);
        }
        return normalizeRole(roles) === currentNorm;
      },
      hasAnyRole: (...roles) => {
        const flat = roles.flat();
        const currentNorm = normalizeRole(initial.role);
        return flat.some((r) => normalizeRole(r) === currentNorm);
      },
      checkPermission: () => true,
    };
  }
  return context;
};

/**
 * Convenience hooks and aliases
 */
export const useUser = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  return { user, updateUser, isAuthenticated };
};

export const useRole = () => {
  const { role, hasRole, hasAnyRole, isSuperAdmin, isSchoolAdmin } = useAuth();
  return { role, hasRole, hasAnyRole, isSuperAdmin, isSchoolAdmin };
};

// Aliases for context
export const UserContext = AuthContext;
export const RoleContext = AuthContext;

/**
 * RoleGuard Component
 * Conditionally renders children if user role matches allowed roles.
 * Example:
 *   <RoleGuard allowedRoles={["schoolAdmin", "superAdmin"]} fallback={<p>Not authorized</p>}>
 *     <SensitiveSettings />
 *   </RoleGuard>
 */
export const RoleGuard = ({ allowedRoles, fallback = null, children }) => {
  const { hasRole } = useAuth();
  if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
    return <>{children}</>;
  }
  return hasRole(allowedRoles) ? <>{children}</> : <>{fallback}</>;
};

export default AuthContext;
