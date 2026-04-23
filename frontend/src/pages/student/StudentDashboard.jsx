import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [leaveAlert, setLeaveAlert] = useState("");

  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  /* ================= LOAD DASHBOARD ================= */

  const loadDashboard = async (pageNo = 1) => {
    try {
      const res = await api.get(`/student/dashboard?page=${pageNo}`);
      setData(res.data);
      setLeaves(res.data.leaves || []);
      setPagination(res.data.pagination || {});
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(page);
  }, [page]);

  /* ================= APPLY LEAVE ================= */

  const applyLeave = async () => {
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
      return alert("Please fill all fields");
    }

    try {
      const res = await api.post("/student/leave", leaveForm);

      if (res.data.alert) {
        if (res.data.alertType === "threshold") {
          // Show threshold alert - continues workflow
          alert(res.data.message);
          setLeaveAlert(res.data.message);
          setTimeout(() => setLeaveAlert(""), 10000);
        } else if (res.data.alertType === "exceeded") {
          // Show exceeded limit alert
          alert(res.data.message);
          setLeaveAlert(res.data.message);
          setTimeout(() => setLeaveAlert(""), 10000);
        } else {
          setLeaveAlert(res.data.message);
          setTimeout(() => setLeaveAlert(""), 8000);
        }
      } else {
        alert("Leave applied successfully");
      }

      setLeaveForm({ fromDate: "", toDate: "", reason: "" });
      loadDashboard(page);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply leave");
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN");

  const getStatusBadge = (status) => {
    const statusStyles = {
      "Pending-Staff": "bg-yellow-100 text-yellow-800",
      "Approved-Staff": "bg-blue-100 text-blue-800",
      "Rejected-Staff": "bg-red-100 text-red-800",
      "Pending-HOD": "bg-yellow-100 text-yellow-800",
      "Approved-HOD": "bg-green-100 text-green-800",
      "Rejected-HOD": "bg-red-100 text-red-800",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!data) return null;

  /* ================= ATTENDANCE VALUES ================= */

  const attendance = data.attendancePercent || 0;
  const totalDays = data.totalSemesterDays || 0;
  const leaveDays = data.approvedLeaveDays || 0;

  const barColor =
    attendance < 60
      ? "bg-red-600"
      : attendance < 75
      ? "bg-yellow-500"
      : "bg-green-600";

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">Student Dashboard</h1>

      {/* ================= STUDENT INFO ================= */}

      <div className="bg-white shadow p-4 rounded">
        <p><b>Name:</b> {data.student?.name}</p>
        <p><b>Department:</b> {data.student?.department?.name}</p>
        <p><b>Year:</b> {data.student?.year}</p>
      </div>

      {/* ================= ALERT ================= */}

      {leaveAlert && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded">
          ⚠ {leaveAlert}
        </div>
      )}

      {/* ================= SEMESTER + ATTENDANCE ================= */}

      {data.semester && (
        <div className="bg-blue-50 border p-4 rounded">

          <h3 className="font-semibold text-lg">
            {data.semester.name}
          </h3>

          <p>
            <b>Duration:</b>{" "}
            {formatDate(data.semester.startDate)} —{" "}
            {formatDate(data.semester.endDate)}
          </p>

          <p><b>Total Semester Days:</b> {totalDays}</p>
          <p><b>Approved Leave Days:</b> {leaveDays}</p>
          <p><b>Present Days:</b> {totalDays - leaveDays}</p>

          {/* ✅ ATTENDANCE % */}

          <p className="text-xl font-bold mt-3">
            Attendance: {attendance}%
          </p>

          {/* ✅ ATTENDANCE BAR */}

          <div className="w-full bg-gray-300 h-5 rounded mt-2">
            <div
              className={`h-5 rounded ${barColor}`}
              style={{ width: `${attendance}%` }}
            />
          </div>

          {attendance < 75 && (
            <p className="text-red-600 font-semibold mt-2">
              ⚠ Attendance below 75%
            </p>
          )}

        </div>
      )}

      {/* ================= APPLY LEAVE ================= */}

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">
          Apply Leave
        </h2>

        <div className="grid gap-3">

          <input
            type="date"
            min={data.semester?.startDate?.slice(0, 10)}
            max={data.semester?.endDate?.slice(0, 10)}
            className="border p-2 rounded"
            value={leaveForm.fromDate}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, fromDate: e.target.value })
            }
          />

          <input
            type="date"
            min={leaveForm.fromDate}
            max={data.semester?.endDate?.slice(0, 10)}
            className="border p-2 rounded"
            value={leaveForm.toDate}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, toDate: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Reason"
            value={leaveForm.reason}
            onChange={(e) =>
              setLeaveForm({ ...leaveForm, reason: e.target.value })
            }
          />

          <button
            onClick={applyLeave}
            className="bg-green-600 text-white py-2 rounded"
          >
            Submit Leave
          </button>

        </div>
      </div>

      {/* ================= LEAVE HISTORY ================= */}

      <div className="bg-white shadow p-4 rounded">

        <h2 className="text-xl font-semibold mb-4">
          My Leave Requests
        </h2>

        {leaves.length === 0 ? (
          <p>No leave requests</p>
        ) : (
          <>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">From</th>
                  <th className="border p-2">To</th>
                  <th className="border p-2">Reason</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td className="border p-2">
                      {formatDate(l.fromDate)}
                    </td>
                    <td className="border p-2">
                      {formatDate(l.toDate)}
                    </td>
                    <td className="border p-2">{l.reason}</td>
                    <td className="border p-2">
                      <span className={`px-3 py-1 rounded font-semibold text-sm ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}

            <div className="flex justify-center gap-4 mt-4">

              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
