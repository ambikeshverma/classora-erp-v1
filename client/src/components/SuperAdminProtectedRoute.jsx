import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SuperAdminProtectedRoute = ({ children }) => {
  const { hasRole, isSuperAdmin } = useAuth();
  const token = localStorage.getItem("superAdminToken");

  if (!token) {
    return <Navigate to="/super-admin/login" replace />;
  }

  // If role is defined in storage and does not match superAdmin, redirect
  const role = localStorage.getItem("role");
  if (role && !isSuperAdmin && !hasRole("superAdmin")) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return children;
};

export default SuperAdminProtectedRoute;
