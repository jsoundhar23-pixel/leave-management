import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    maxLeaveDays: 20,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const u = await api.get("/admin/pending");
      console.log("Pending users:", u.data);
      setUsers(u.data || []);

      const s = await api.get("/admin/semester/active");
      setSemester(s.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    try {
      await api.put(`/admin/approve/${id}`);
      load();
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.response?.data?.message || "Approve failed");
    }
  };

  const rejectUser = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to reject this user?")) return;
      await api.delete(`/admin/reject/${id}`);
      load();
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.response?.data?.message || "Reject failed");
    }
  };

  const createSemester = async () => {
    await api.post("/admin/semester", form);
    alert("Semester Created");
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      {semester && (
        <div className="border p-4 bg-green-50 rounded">
          <p>{semester.name}</p>
          <p>
            {new Date(semester.startDate).toLocaleDateString()} –{" "}
            {new Date(semester.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      <h3 className="font-bold">Create Semester</h3>

      <input
        placeholder="Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full"
      />

      <input
        type="date"
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        className="border p-2 w-full"
      />

      <input
        type="date"
        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        className="border p-2 w-full"
      />

      <button
        onClick={createSemester}
        className="bg-blue-600 text-white px-4 py-2"
      >
        Save
      </button>

      <h3 className="text-xl font-bold">Pending Approvals</h3>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Loading pending users...</p>}
      {!loading && users.length === 0 && <p>No Pending Users</p>}

      {users.map((u) => (
        <div key={u._id} className="border p-3 flex items-center justify-between">
          <div>
            <p>{u.name} ({u.role})</p>
            <p className="text-sm text-gray-500">{u.email}</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => approve(u._id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => rejectUser(u._id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
