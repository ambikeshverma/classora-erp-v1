import React from "react";
import { Navigate } from "react-router-dom";

const SuperAdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("superAdminToken");

  if (!token) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return children;
};

export default SuperAdminProtectedRoute;
