import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🚀 In-flight GET request deduplicator: Prevents duplicate parallel API calls
const inFlightGets = new Map();
const originalGet = api.get.bind(api);
api.get = (url, config) => {
  const cacheKey = `${url}?${config?.params ? JSON.stringify(config.params) : ""}`;

  if (inFlightGets.has(cacheKey)) {
    return inFlightGets.get(cacheKey);
  }

  const reqPromise = originalGet(url, config).finally(() => {
    inFlightGets.delete(cacheKey);
  });

  inFlightGets.set(cacheKey, reqPromise);
  return reqPromise;
};

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
      localStorage.removeItem("enabledSubModules");
      localStorage.removeItem("role");
      localStorage.removeItem("userRole");
      localStorage.removeItem("user");
      localStorage.removeItem("userInfo");
      window.dispatchEvent(new CustomEvent("auth:change", { detail: null }));
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
          if (refreshResponse.data.role) {
            localStorage.setItem("role", refreshResponse.data.role);
            localStorage.setItem("userRole", refreshResponse.data.role);
          }
          if (refreshResponse.data.admin || refreshResponse.data.user) {
            const adminData = refreshResponse.data.admin || refreshResponse.data.user;
            localStorage.setItem("superAdminUser", JSON.stringify(adminData));
            localStorage.setItem("user", JSON.stringify(adminData));
            localStorage.setItem("userInfo", JSON.stringify(adminData));
          }
        } else {
          localStorage.setItem("token", newAccessToken);
          if (refreshResponse.data.role) {
            localStorage.setItem("role", refreshResponse.data.role);
            localStorage.setItem("userRole", refreshResponse.data.role);
          }
          if (refreshResponse.data.user) {
            localStorage.setItem("user", JSON.stringify(refreshResponse.data.user));
            localStorage.setItem("userInfo", JSON.stringify(refreshResponse.data.user));
          }
          if (refreshResponse.data.name || refreshResponse.data.schoolName) {
            localStorage.setItem("userName", refreshResponse.data.name || refreshResponse.data.schoolName);
          }
          if (refreshResponse.data.enabledModules) {
            localStorage.setItem(
              "enabledModules",
              JSON.stringify(refreshResponse.data.enabledModules)
            );
          }
          if (refreshResponse.data.enabledSubModules) {
            localStorage.setItem(
              "enabledSubModules",
              JSON.stringify(refreshResponse.data.enabledSubModules)
            );
          }
        }

        window.dispatchEvent(new CustomEvent("auth:change", { detail: refreshResponse.data }));

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (isSuperAdmin) {
          localStorage.removeItem("superAdminToken");
          localStorage.removeItem("superAdminUser");
          localStorage.removeItem("role");
          localStorage.removeItem("userRole");
          localStorage.removeItem("user");
          localStorage.removeItem("userInfo");
          window.dispatchEvent(new CustomEvent("auth:change", { detail: null }));
          if (!window.location.pathname.includes("/super-admin/login")) {
            window.location.href = "/super-admin/login";
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("schoolId");
          localStorage.removeItem("campusId");
          localStorage.removeItem("userName");
          localStorage.removeItem("role");
          localStorage.removeItem("userRole");
          localStorage.removeItem("user");
          localStorage.removeItem("userInfo");
          window.dispatchEvent(new CustomEvent("auth:change", { detail: null }));
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
  updateSchoolModules: (id, enabledModules, enabledSubModules) =>
    api.patch(`/api/superAdmin/schools/${id}/modules`, { enabledModules, enabledSubModules }),
  updateSchoolSubModules: (id, enabledSubModules) =>
    api.patch(`/api/superAdmin/schools/${id}/submodules`, { enabledSubModules }),
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

// 🏢 HR & Staff Management Endpoints (Connected Prerequisites)
export const hrService = {
  // Departments
  getDepartments: () => api.get("/api/hr/departments"),
  createDepartment: (data) => api.post("/api/hr/departments", data),
  updateDepartment: (id, data) => api.put(`/api/hr/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/api/hr/departments/${id}`),

  // Positions
  getPositions: (departmentId) =>
    api.get("/api/hr/positions", { params: departmentId ? { departmentId } : {} }),
  createPosition: (data) => api.post("/api/hr/positions", data),
  updatePosition: (id, data) => api.put(`/api/hr/positions/${id}`, data),
  deletePosition: (id) => api.delete(`/api/hr/positions/${id}`),

  // Staff
  getStaff: (params) => api.get("/api/hr/staff", { params }),
  getStaffById: (id) => api.get(`/api/hr/staff/${id}`),
  createStaff: (data) => api.post("/api/hr/staff", data),
  updateStaff: (id, data) => api.put(`/api/hr/staff/${id}`, data),
  toggleStaffStatus: (id) => api.patch(`/api/hr/staff/${id}/toggle-status`),
  deleteStaff: (id) => api.delete(`/api/hr/staff/${id}`),

  // Leaves (Connected to Staff Attendance)
  getLeaves: (params) => api.get("/api/hr/leaves", { params }),
  createLeave: (data) => api.post("/api/hr/leaves", data),
  updateLeave: (id, data) => api.put(`/api/hr/leaves/${id}`, data),
  deleteLeave: (id) => api.delete(`/api/hr/leaves/${id}`),
  updateLeaveStatus: (id, status) => api.patch(`/api/hr/leaves/${id}/status`, { status }),
};

// 🔐 User Control Endpoints
export const userControlService = {
  // Meta: classes, subjects, and staff in one optimized query
  getMeta: () => api.get("/api/user-control/meta"),

  // User Management
  getUsers: (params) => api.get("/api/user-control/users", { params }),
  createUser: (data) => api.post("/api/user-control/users", data),
  updateUser: (id, data) => api.put(`/api/user-control/users/${id}`, data),
  toggleUserStatus: (id) => api.patch(`/api/user-control/users/${id}/toggle-status`),
  resetUserPassword: (id) => api.post(`/api/user-control/users/${id}/reset-password`),
  deleteUser: (id) => api.delete(`/api/user-control/users/${id}`),

  // Class Teacher Assignment
  getClassTeachers: () => api.get("/api/user-control/class-teachers"),
  assignClassTeacher: (data) => api.post("/api/user-control/class-teachers/assign", data),
  deleteClassTeacher: (id) => api.delete(`/api/user-control/class-teachers/${id}`),

  // Subject Teacher Assignment
  getSubjectTeachers: (params) => api.get("/api/user-control/subject-teachers", { params }),
  assignSubjectTeacher: (data) => api.post("/api/user-control/subject-teachers/assign", data),
  deleteSubjectTeacher: (id) => api.delete(`/api/user-control/subject-teachers/${id}`),
};

export const masterService = {
  getSubjects: () => api.get("/api/master/subject/fetch"),
  createSubject: (data) => api.post("/api/master/subject/create", data),
  updateSubject: (id, data) => api.put(`/api/master/subject/${id}`, data),
  deleteSubject: (id) => api.delete(`/api/master/subject/${id}`),
  getClasses: () => api.get("/api/master/class/fetch"),
  createClass: (data) => api.post("/api/master/class/create", data),
};

// 📚 Academic Zone Endpoints
export const academicService = {
  // Batch Meta
  getMeta: () => api.get("/api/academic/meta"),

  // Co-Scholastic Subjects
  getCoScholasticSubjects: () => api.get("/api/academic/co-scholastic-subjects"),
  createCoScholasticSubject: (data) => api.post("/api/academic/co-scholastic-subjects", data),
  updateCoScholasticSubject: (id, data) => api.put(`/api/academic/co-scholastic-subjects/${id}`, data),
  deleteCoScholasticSubject: (id) => api.delete(`/api/academic/co-scholastic-subjects/${id}`),

  // Class Subject Mapping
  getClassSubjectMappings: () => api.get("/api/academic/class-subjects"),
  saveClassSubjectMapping: (data) => api.post("/api/academic/class-subjects", data),
  deleteClassSubjectMapping: (id) => api.delete(`/api/academic/class-subjects/${id}`),

  // Student Subject Mapping
  getStudentsForMapping: (params) => api.get("/api/academic/students-for-mapping", { params }),
  getStudentSubjectMappings: (params) => api.get("/api/academic/student-subjects", { params }),
  bulkAssignStudentSubjects: (data) => api.post("/api/academic/student-subjects/bulk-assign", data),
  deleteStudentSubjectMapping: (id) => api.delete(`/api/academic/student-subjects/${id}`),
  bulkDeleteStudentSubjectMappings: (ids) => api.post("/api/academic/student-subjects/bulk-delete", { ids }),

  // Reports
  getReportsData: () => api.get("/api/academic/reports-data"),
};

// ⚙️ Admin Panel Endpoints
export const adminPanelService = {
  getMeta: () => api.get("/api/admin-panel/meta"),

  // Fee Scheme
  getFeeScheme: () => api.get("/api/admin-panel/fee-scheme"),
  updateFeeScheme: (data) => api.post("/api/admin-panel/fee-scheme", data),
  addFeeHead: (data) => api.post("/api/admin-panel/fee-scheme/heads", data),
  updateFeeHead: (id, data) => api.put(`/api/admin-panel/fee-scheme/heads/${id}`, data),
  deleteFeeHead: (id) => api.delete(`/api/admin-panel/fee-scheme/heads/${id}`),

  // Fee Plan Name Setup
  getFeePlanNames: () => api.get("/api/admin-panel/fee-plan-names"),
  createFeePlanName: (data) => api.post("/api/admin-panel/fee-plan-names", data),
  updateFeePlanName: (id, data) => api.put(`/api/admin-panel/fee-plan-names/${id}`, data),
  deleteFeePlanName: (id) => api.delete(`/api/admin-panel/fee-plan-names/${id}`),

  // Fee Plan Management
  getFeePlans: (params) => api.get("/api/admin-panel/fee-plans", { params }),
  saveFeePlan: (data) => api.post("/api/admin-panel/fee-plans", data),
  copyFeePlan: (data) => api.post("/api/admin-panel/fee-plans/copy", data),
  deleteFeePlan: (id) => api.delete(`/api/admin-panel/fee-plans/${id}`),

  // Concession Management
  getConcessions: () => api.get("/api/admin-panel/concessions"),
  createConcession: (data) => api.post("/api/admin-panel/concessions", data),
  updateConcession: (id, data) => api.put(`/api/admin-panel/concessions/${id}`, data),
  toggleConcessionStatus: (id) => api.patch(`/api/admin-panel/concessions/${id}/toggle-status`),
  deleteConcession: (id) => api.delete(`/api/admin-panel/concessions/${id}`),

  // Subscription Billing & Reports
  getBilling: () => api.get("/api/admin-panel/billing"),
  getReports: () => api.get("/api/admin-panel/reports"),
};

// 📝 Admissions Endpoints
export const admissionService = {
  getMeta: () => api.get("/api/admissions/meta"),
  getAdmissions: (params) => api.get("/api/admissions", { params }),
  getAdmissionById: (id) => api.get(`/api/admissions/${id}`),
  createAdmission: (data) => api.post("/api/admissions/add", data),
  updateAdmission: (id, data) => api.put(`/api/admissions/${id}`, data),
  deleteAdmission: (id) => api.delete(`/api/admissions/${id}`),
  bulkImportAdmissions: (data) => api.post("/api/admissions/bulk-import", data),

  // Enquiries
  getEnquiries: (params) => api.get("/api/admissions/enquiries", { params }),
  createEnquiry: (data) => api.post("/api/admissions/enquiries", data),
  updateEnquiry: (id, data) => api.put(`/api/admissions/enquiries/${id}`, data),
  updateEnquiryStatus: (id, status) => api.patch(`/api/admissions/enquiries/${id}/status`, { status }),
  deleteEnquiry: (id) => api.delete(`/api/admissions/enquiries/${id}`),

  // Reports
  getReports: () => api.get("/api/admissions/reports"),
};

// 🏢 Reception Desk Endpoints
export const receptionService = {
  // Meta batch
  getMeta: () => api.get("/api/reception/meta"),

  // Enquiry Sources
  getEnquirySources: () => api.get("/api/reception/enquiry-sources"),
  createEnquirySource: (data) => api.post("/api/reception/enquiry-sources", data),
  updateEnquirySource: (id, data) => api.put(`/api/reception/enquiry-sources/${id}`, data),
  deleteEnquirySource: (id) => api.delete(`/api/reception/enquiry-sources/${id}`),

  // Follow-ups
  getFollowUps: () => api.get("/api/reception/follow-ups"),
  createFollowUp: (data) => api.post("/api/reception/follow-ups", data),
  updateFollowUp: (id, data) => api.put(`/api/reception/follow-ups/${id}`, data),
  deleteFollowUp: (id) => api.delete(`/api/reception/follow-ups/${id}`),

  // Gate Passes
  getGatePasses: (params) => api.get("/api/reception/gate-passes", { params }),
  createGatePass: (data) => api.post("/api/reception/gate-passes", data),
  updateGatePassStatus: (id, data) => api.patch(`/api/reception/gate-passes/${id}/status`, data),
  deleteGatePass: (id) => api.delete(`/api/reception/gate-passes/${id}`),

  // Appointments
  getAppointments: (params) => api.get("/api/reception/appointments", { params }),
  createAppointment: (data) => api.post("/api/reception/appointments", data),
  updateAppointmentStatus: (id, status) => api.patch(`/api/reception/appointments/${id}/status`, { status }),
  deleteAppointment: (id) => api.delete(`/api/reception/appointments/${id}`),

  // Visitors
  getVisitors: (params) => api.get("/api/reception/visitors", { params }),
  getApprovedAppointments: () => api.get("/api/reception/visitors/approved-appointments"),
  createVisitor: (data) => api.post("/api/reception/visitors", data),
  updateVisitorStatus: (id, data) => api.patch(`/api/reception/visitors/${id}/status`, data),
  deleteVisitor: (id) => api.delete(`/api/reception/visitors/${id}`),

  // Support & Complaints
  getComplaints: (params) => api.get("/api/reception/complaints", { params }),
  createComplaint: (data) => api.post("/api/reception/complaints", data),
  updateComplaintStatus: (id, data) => api.patch(`/api/reception/complaints/${id}/status`, data),
  deleteComplaint: (id) => api.delete(`/api/reception/complaints/${id}`),

  // Reports
  getReports: () => api.get("/api/reception/reports"),
};

// 🎓 Student Hub Endpoints
export const studentHubService = {
  // Batch Meta
  getMeta: () => api.get("/api/student-hub/meta"),

  // Classes
  getClasses: () => api.get("/api/student-hub/classes"),
  createClass: (data) => api.post("/api/student-hub/classes", data),
  updateClass: (id, data) => api.put(`/api/student-hub/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/api/student-hub/classes/${id}`),

  // Sections
  getSections: (params) => api.get("/api/student-hub/sections", { params }),
  createSection: (data) => api.post("/api/student-hub/sections", data),
  updateSection: (id, data) => api.put(`/api/student-hub/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/api/student-hub/sections/${id}`),

  // Mediums
  getMediums: () => api.get("/api/student-hub/mediums"),
  createMedium: (data) => api.post("/api/student-hub/mediums", data),
  updateMedium: (id, data) => api.put(`/api/student-hub/mediums/${id}`, data),
  deleteMedium: (id) => api.delete(`/api/student-hub/mediums/${id}`),

  // Houses
  getHouses: () => api.get("/api/student-hub/houses"),
  createHouse: (data) => api.post("/api/student-hub/houses", data),
  updateHouse: (id, data) => api.put(`/api/student-hub/houses/${id}`, data),
  deleteHouse: (id) => api.delete(`/api/student-hub/houses/${id}`),

  // House Allocations
  getHouseAllocations: (params) => api.get("/api/student-hub/house-allocations", { params }),
  allocateHouse: (studentId, data) => api.patch(`/api/student-hub/house-allocations/${studentId}`, data),
  bulkAllocateHouse: (data) => api.patch("/api/student-hub/house-allocations/bulk", data),

  // Sibling Groups
  getSiblingGroups: () => api.get("/api/student-hub/sibling-groups"),
  createSiblingGroup: (data) => api.post("/api/student-hub/sibling-groups", data),
  updateSiblingGroup: (id, data) => api.put(`/api/student-hub/sibling-groups/${id}`, data),
  deleteSiblingGroup: (id) => api.delete(`/api/student-hub/sibling-groups/${id}`),

  // Student Search
  searchStudents: (params) => api.get("/api/student-hub/students/search", { params }),

  // Inactive Students
  getInactiveStudents: (params) => api.get("/api/student-hub/students/inactive", { params }),
  deactivateStudent: (id, reason) => api.patch(`/api/student-hub/students/${id}/deactivate`, { reason }),
  restoreStudent: (id) => api.patch(`/api/student-hub/students/${id}/restore`),
  bulkDeactivateStudents: (data) => api.patch("/api/student-hub/students/bulk-deactivate", data),

  // Student Documents
  getDocuments: (params) => api.get("/api/student-hub/student-documents", { params }),
  uploadDocument: (data) => api.post("/api/student-hub/student-documents", data),
  deleteDocument: (id) => api.delete(`/api/student-hub/student-documents/${id}`),

  // Roll Number Update
  getStudentsForRollNumber: (params) => api.get("/api/student-hub/roll-numbers", { params }),
  bulkUpdateRollNumbers: (updates) => api.patch("/api/student-hub/roll-numbers/bulk-update", { updates }),

  // Section Transfer
  getStudentsForTransfer: (params) => api.get("/api/student-hub/section-transfer/students", { params }),
  bulkTransferSection: (data) => api.patch("/api/student-hub/section-transfer/bulk", data),

  // Promotion Management
  getPromotions: () => api.get("/api/student-hub/promotions"),
  getStudentsForPromotion: (params) => api.get("/api/student-hub/promotion/students", { params }),
  promoteStudents: (data) => api.post("/api/student-hub/promotions", data),

  // Alumni Management
  getAlumni: (params) => api.get("/api/student-hub/alumni", { params }),
  markAlumni: (id, data) => api.patch(`/api/student-hub/alumni/${id}/mark`, data),
  bulkMarkAlumni: (data) => api.patch("/api/student-hub/alumni/bulk-mark", data),

  // Bulk Student Update & Data Export
  bulkUpdateStudents: (data) => api.patch("/api/student-hub/students/bulk-update", data),
  getDataExport: (params) => api.get("/api/student-hub/data-export", { params }),

  // Reports
  getReports: () => api.get("/api/student-hub/reports"),
};

// 📋 Attendance System Endpoints
export const attendanceService = {
  getMeta: () => api.get("/api/attendance/meta"),
  getStudentAttendance: (params) => api.get("/api/attendance/students", { params }),
  saveStudentAttendance: (data) => api.post("/api/attendance/students", data),
  getStaffAttendance: (params) => api.get("/api/attendance/staff", { params }),
  saveStaffAttendance: (data) => api.post("/api/attendance/staff", data),
  getGeoSettings: () => api.get("/api/attendance/geo-settings"),
  saveGeoSettings: (data) => api.post("/api/attendance/geo-settings", data),
  getHolidays: () => api.get("/api/attendance/holidays"),
  saveHoliday: (data) => api.post("/api/attendance/holidays", data),
  deleteHoliday: (params) => api.delete("/api/attendance/holidays", { params }),
  getReportsData: (params) => api.get("/api/attendance/reports-data", { params }),
};

// 💰 Fee Manager Endpoints
export const feeService = {
  getMeta: () => api.get("/api/fee-manager/meta"),
  searchStudents: (q) => api.get("/api/fee-manager/students/search", { params: { q } }),
  getDashboard: (studentId, session) =>
    api.get(`/api/fee-manager/students/${studentId}/dashboard`, { params: session ? { session } : {} }),
  getStudentProfile: (studentId) => api.get(`/api/fee-manager/students/${studentId}/profile`),

  addManualFee: (studentId, data) => api.post(`/api/fee-manager/students/${studentId}/manual-fees`, data),
  deleteManualFee: (id) => api.delete(`/api/fee-manager/manual-fees/${id}`),

  allocateTransport: (studentId, data) => api.put(`/api/fee-manager/students/${studentId}/transport`, data),
  removeTransport: (studentId, session) =>
    api.delete(`/api/fee-manager/students/${studentId}/transport`, { params: { session } }),
  setTransportPeriod: (studentId, data) =>
    api.patch(`/api/fee-manager/students/${studentId}/transport/periods`, data),

  createReceipt: (data) => api.post("/api/fee-manager/receipts", data),
  getReceipts: (params) => api.get("/api/fee-manager/receipts", { params }),
  getReceipt: (id) => api.get(`/api/fee-manager/receipts/${id}`),
  cancelReceipt: (id, reason) => api.patch(`/api/fee-manager/receipts/${id}/cancel`, { reason }),

  getReports: (params) => api.get("/api/fee-manager/reports", { params }),
  getDues: (params) => api.get("/api/fee-manager/dues", { params }),
};

// 🚌 Transport Endpoints (routes feed the Transport Fee in Fee Manager)
export const transportService = {
  getRoutes: () => api.get("/api/transport/routes"),
  createRoute: (data) => api.post("/api/transport/routes", data),
  updateRoute: (id, data) => api.put(`/api/transport/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/api/transport/routes/${id}`),
};

export default api;

