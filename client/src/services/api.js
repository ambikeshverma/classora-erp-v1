import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 🔒 Request Interceptor: Attach proper Bearer token
api.interceptors.request.use(
  (config) => {
    // If request is directed to Super Admin API endpoints, use superAdminToken
    const isSuperAdminRequest = config.url && config.url.includes("/api/superAdmin");
    const token = isSuperAdminRequest
      ? localStorage.getItem("superAdminToken")
      : localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Response Interceptor: Handle Token Expiration, Silent Refresh, and Deactivation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if school is deactivated by Super Admin
    if (error.response?.status === 403 && error.response?.data?.isDeactivated) {
      localStorage.removeItem("token");
      localStorage.removeItem("schoolId");
      localStorage.removeItem("campusId");
      localStorage.removeItem("userName");
      localStorage.removeItem("enabledModules");
      window.dispatchEvent(
        new CustomEvent("school:deactivated", {
          detail: { message: error.response.data.message },
        })
      );
      return Promise.reject(error);
    }

    // Handle 401 Token Expiration (Silent Refresh)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      (error.response?.data?.isExpired ||
        error.response?.data?.message?.toLowerCase().includes("expired"))
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const isSuperAdmin = originalRequest.url && originalRequest.url.includes("/api/superAdmin");
      const refreshUrl = isSuperAdmin
        ? `${API_BASE_URL}/api/superAdmin/refresh`
        : `${API_BASE_URL}/api/school/refresh`;

      try {
        const refreshResponse = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data.accessToken || refreshResponse.data.token;

        if (isSuperAdmin) {
          localStorage.setItem("superAdminToken", newAccessToken);
        } else {
          localStorage.setItem("token", newAccessToken);
          if (refreshResponse.data.enabledModules) {
            localStorage.setItem(
              "enabledModules",
              JSON.stringify(refreshResponse.data.enabledModules)
            );
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (isSuperAdmin) {
          localStorage.removeItem("superAdminToken");
          localStorage.removeItem("superAdminUser");
          if (!window.location.pathname.includes("/super-admin/login")) {
            window.location.href = "/super-admin/login";
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("schoolId");
          localStorage.removeItem("campusId");
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ==========================================================
   API HELPER FUNCTIONS
========================================================== */

// 👑 Super Admin Endpoints
export const superAdminService = {
  login: (credentials) => api.post("/api/superAdmin/login", credentials),
  init: () => api.post("/api/superAdmin/init"),
  refresh: () => api.post("/api/superAdmin/refresh"),
  logout: () => api.post("/api/superAdmin/logout"),
  getProfile: () => api.get("/api/superAdmin/me"),
  getSchools: () => api.get("/api/superAdmin/schools"),
  createSchool: (data) => api.post("/api/superAdmin/schools", data),
  updateSchool: (id, data) => api.put(`/api/superAdmin/schools/${id}`, data),
  toggleSchoolStatus: (id, isActive) =>
    api.patch(`/api/superAdmin/schools/${id}/toggle-status`, { isActive }),
  updateSchoolModules: (id, enabledModules) =>
    api.patch(`/api/superAdmin/schools/${id}/modules`, { enabledModules }),
  resetSchoolPassword: (id, newPassword) =>
    api.patch(`/api/superAdmin/schools/${id}/reset-password`, { newPassword }),
  deleteSchool: (id) => api.delete(`/api/superAdmin/schools/${id}`),
  // Notice Management
  getSchoolNotices: (id) => api.get(`/api/superAdmin/schools/${id}/notices`),
  addSchoolNotice: (id, data) => api.post(`/api/superAdmin/schools/${id}/notices`, data),
  toggleSchoolNotice: (id, noticeId) => api.patch(`/api/superAdmin/schools/${id}/notices/${noticeId}/toggle`),
  deleteSchoolNotice: (id, noticeId) => api.delete(`/api/superAdmin/schools/${id}/notices/${noticeId}`),
};

// 🏫 School Endpoints
export const schoolService = {
  login: (credentials) => api.post("/api/school/login", credentials),
  refresh: () => api.post("/api/school/refresh"),
  logout: () => api.post("/api/school/logout"),
  getProfile: () => api.get("/api/school/profile"),
  getNotices: () => api.get("/api/school/notices"),
};

export default api;
