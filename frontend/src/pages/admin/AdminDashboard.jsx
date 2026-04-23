import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSemester, setEditingSemester] = useState(false);

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
    try {
      await api.post("/admin/semester", form);
      toast.success("Semester Created");
      setForm({ name: "", startDate: "", endDate: "", maxLeaveDays: 20 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create semester");
    }
  };

  const handleEditSemester = () => {
    setEditingSemester(true);
    setForm({
      name: semester.name,
      startDate: semester.startDate ? semester.startDate.slice(0, 10) : "",
      endDate: semester.endDate ? semester.endDate.slice(0, 10) : "",
      maxLeaveDays: semester.maxLeaveDays || 20,
    });
  };

  const updateSemester = async () => {
    try {
      await api.put(`/admin/semester/${semester._id}`, form);
      toast.success("Semester Updated");
      setEditingSemester(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update semester");
    }
  };

  const deleteSemester = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete this semester? This action cannot be undone and may affect associated leaves.")) return;
    try {
      await api.delete(`/admin/semester/${semester._id}`);
      toast.success("Semester Deleted");
      setSemester(null);
      setEditingSemester(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete semester");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      {semester && !editingSemester && (
        <div className="border p-4 bg-green-50 rounded flex justify-between items-center">
          <div>
            <p className="font-bold text-lg">{semester.name}</p>
            <p>
              {new Date(semester.startDate).toLocaleDateString()} –{" "}
              {new Date(semester.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="space-x-2">
             <button onClick={handleEditSemester} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
             <button onClick={deleteSemester} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
          </div>
        </div>
      )}

      {editingSemester && (
        <div className="border p-4 bg-white shadow rounded space-y-3">
          <h3 className="font-bold">Edit Semester</h3>

          <input
            placeholder="Name (e.g. Even Semester 2026)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 w-full rounded"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="border p-2 w-full rounded"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="border p-2 w-full rounded"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={updateSemester}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update
            </button>
            <button
              onClick={() => {
                setEditingSemester(false);
                setForm({ name: "", startDate: "", endDate: "", maxLeaveDays: 20 });
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editingSemester && (
        <div className="border p-4 bg-white shadow rounded space-y-3 mt-6">
          <h3 className="font-bold">Create Semester</h3>

          <input
            placeholder="Name (e.g. Even Semester 2026)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 w-full rounded"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="border p-2 w-full rounded"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="border p-2 w-full rounded"
              />
            </div>
          </div>

          <button
            onClick={createSemester}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      )}

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
