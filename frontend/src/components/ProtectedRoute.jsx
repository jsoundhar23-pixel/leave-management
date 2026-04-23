import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;
  if (role && role !== userRole) return <Navigate to="/" replace />;

  return children;
}
