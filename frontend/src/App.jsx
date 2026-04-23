import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import HodDashboard from "./pages/hod/HodDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import VerifyPass from "./pages/public/VerifyPass";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify/:id" element={<VerifyPass />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard/></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard/></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute role="staff"><StaffDashboard/></ProtectedRoute>} />
        <Route path="/hod" element={<ProtectedRoute role="hod"><HodDashboard/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
