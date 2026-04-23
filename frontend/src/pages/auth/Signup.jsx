import { useState } from "react";
import api from "../../services/api";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DEPARTMENTS = ["IT", "CSE", "EEE", "ECE", "CIVIL", "MECH"];

export default function Signup() {
  const [data, setData] = useState({
    role: "student",
    userId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    year: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!data.role || !data.userId || !data.name || !data.email || !data.password || !data.department) {
      setError("Please fill all required fields");
      return;
    }

    // ✅ Year required for Student & Staff
    if ((data.role === "student" || data.role === "staff") && !data.year) {
      setError("Please select year");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/signup", data);
      alert("Signup successful");

      setData({
        role: "student",
        userId: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        year: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Signup</h2>

        {error && <p className="text-red-600 text-center mb-3">{error}</p>}

        <form onSubmit={submit} className="space-y-4">

          {/* Role */}
          <select name="role" value={data.role} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="hod">HOD</option>
          </select>

          {/* Department */}
          <select name="department" value={data.department} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* ✅ YEAR FOR STUDENT & STAFF */}
          {(data.role === "student" || data.role === "staff") && (
            <select name="year" value={data.year} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Select Year</option>
              {YEARS.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          )}

          <input name="userId" placeholder="User ID" value={data.userId} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="name" placeholder="Name" value={data.name} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="email" type="email" placeholder="Email" value={data.email} onChange={handleChange} className="w-full border p-2 rounded" />
          <input name="password" type="password" placeholder="Password" value={data.password} onChange={handleChange} className="w-full border p-2 rounded" />
          <input
  type="tel"
  name="phone"
  placeholder="Enter 10-digit mobile number"
  value={data.phone}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setData({ ...data, phone: value });
    }
  }}
  className="w-full border p-2 rounded"
/>



          <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">
            {loading ? "Signing up..." : "Signup"}
          </button>
        </form>
      </div>
    </div>
  );
}
