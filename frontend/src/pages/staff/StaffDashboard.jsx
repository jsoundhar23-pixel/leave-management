import { useEffect, useState, useCallback } from "react";
import html2pdf from "html2pdf.js";
import QRCode from "qrcode";
import api from "../../services/api";

export default function StaffDashboard() {
  const [profile, setProfile] = useState(null);
  const [studentLeaves, setStudentLeaves] = useState([]);
  const [approvedStudentLeaves, setApprovedStudentLeaves] = useState([]);
  const [staffLeaves, setStaffLeaves] = useState([]);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Separate pagination
  const [studentPage, setStudentPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);
  const [pagination, setPagination] = useState({
    student: {},
    approved: {},
    staff: {},
  });

  const [form, setForm] = useState({
    reason: "",
    fromDate: "",
    toDate: "",
  });

  /* ================= HELPERS ================= */
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

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    return (
      Math.ceil(
        (new Date(to) - new Date(from)) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  const generateGatePass = async (leave) => {
    const verifyUrl = `${window.location.origin}/verify/${leave._id}`;
    let qrCodeBase64 = "";
    try {
      // Generate QR Code as a base64 data URI
      qrCodeBase64 = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
    } catch (err) {
      console.error("Failed to generate QR", err);
    }

    const content = `
      <div style="padding: 40px; font-family: sans-serif; border: 2px solid #333; max-width: 600px; margin: 0 auto; position: relative;">
        <h1 style="text-align: center; color: #4F46E5; margin-bottom: 30px; letter-spacing: 1px;">OFFICIAL GATE PASS</h1>
        
        ${qrCodeBase64 ? `
        <div style="position: absolute; top: 30px; right: 30px;">
          <img src="${qrCodeBase64}" alt="QR Code" style="width: 90px; height: 90px; border: 1px solid #ccc; padding: 4px;" />
          <p style="font-size: 10px; text-align: center; margin-top: 4px; color: #666;">Scan to Verify</p>
        </div>
        ` : ''}

        <div style="border-bottom: 2px solid #ccc; margin-bottom: 20px;"></div>
        <p style="font-size: 18px;"><strong>Staff Name:</strong> ${profile?.name}</p>
        <p style="font-size: 18px;"><strong>Department:</strong> ${profile?.department?.name}</p>
        <div style="border-bottom: 2px solid #ccc; margin-top: 20px; margin-bottom: 20px;"></div>
        <h3 style="color: #333;">Leave Details:</h3>
        <p style="font-size: 16px;"><strong>From:</strong> ${formatDate(leave.fromDate)}</p>
        <p style="font-size: 16px;"><strong>To:</strong> ${formatDate(leave.toDate)}</p>
        <p style="font-size: 16px;"><strong>Total Days:</strong> ${leave.totalDays}</p>
        <p style="font-size: 16px;"><strong>Reason:</strong> ${leave.reason}</p>
        <div style="border-bottom: 2px solid #ccc; margin-top: 20px; margin-bottom: 30px;"></div>
        <div style="text-align: center;">
          <h2 style="color: #10B981; border: 3px solid #10B981; display: inline-block; padding: 10px 20px; transform: rotate(-5deg); letter-spacing: 2px;">APPROVED BY HOD</h2>
        </div>
        <p style="text-align: center; margin-top: 40px; font-size: 14px; color: #666;">This is an automatically generated gate pass from the EduLeave System.</p>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `GatePass_${profile?.name}_${leave.fromDate.slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save();
  };

  /* ================= LOAD DATA ================= */
  const loadData = useCallback(async () => {
    try {
      const profileRes = await api.get("/staff/profile");

      const dashRes = await api.get(
        `/staff/dashboard?studentPage=${studentPage}&approvedPage=${approvedPage}&staffPage=${staffPage}`
      );

      setProfile(profileRes.data);
      setStudentLeaves(dashRes.data.studentLeaves || []);
      setApprovedStudentLeaves(dashRes.data.approvedStudentLeaves || []);
      setStaffLeaves(dashRes.data.staffLeaves || []);
      setSemester(dashRes.data.semester);
      setPagination(dashRes.data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentPage, approvedPage, staffPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ================= LEAVE CALC ================= */
  const usedLeaveDays = staffLeaves
    .filter((l) =>
      ["Approved-HOD", "Approved-Staff", "Pending-HOD"].includes(
        l.status
      )
    )
    .reduce((sum, l) => sum + (l.totalDays || 0), 0);

  const maxLeave = semester?.maxLeaveDays || 0;
  const remainingLeave = maxLeave - usedLeaveDays;

  /* ================= SEMESTER CALCULATIONS ================= */
  const totalSemesterDays = semester
    ? Math.ceil(
        (new Date(semester.endDate) - new Date(semester.startDate)) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 0;

  const leaveUtilization = maxLeave > 0 ? (usedLeaveDays / maxLeave) * 100 : 0;
  const barColor =
    leaveUtilization < 50
      ? "bg-green-600"
      : leaveUtilization < 80
      ? "bg-yellow-500"
      : "bg-red-600";

  /* ================= ACTIONS ================= */
  const updateStudentLeave = async (id, status) => {
    try {
      const response = await api.put(`/staff/approve/${id}`, { status });
      alert(response.data.message || "Leave updated successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating leave");
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/staff/leave", form);
      
      if (res.data.alert) {
        if (res.data.alertType === "maximumReached") {
          // Show maximum reached alert with email notification
          alert(res.data.message);
        } else {
          alert(res.data.message);
        }
      } else {
        alert("Leave applied successfully");
      }
      
      setForm({ reason: "", fromDate: "", toDate: "" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply leave");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold">Staff Dashboard</h2>

      {/* ================= STAFF INFO ================= */}
      <div className="bg-white shadow p-4 rounded">
        <p><b>Name:</b> {profile?.name}</p>
        <p><b>Department:</b> {profile?.department?.name}</p>
      </div>

      {/* ================= SEMESTER INFO ================= */}
      {semester && (
        <div className="bg-blue-50 border p-4 rounded">
          <h3 className="font-semibold text-lg">{semester.name}</h3>
          <p>
            <b>Duration:</b>{" "}
            {formatDate(semester.startDate)} –{" "}
            {formatDate(semester.endDate)}
          </p>

          <p><b>Total Semester Days:</b> {totalSemesterDays}</p>
          <p><b>Max Leave Allowed:</b> {maxLeave} days</p>
          <p><b>Used Leave Days:</b> {usedLeaveDays} days</p>
          <p>
            <b>Remaining Leave:</b>{" "}
            <span
              className={
                remainingLeave < 0
                  ? "text-red-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
            >
              {remainingLeave}
            </span>
          </p>

          {/* ✅ LEAVE UTILIZATION % */}
          <p className="text-xl font-bold mt-3">
            Leave Utilization: {Math.round(leaveUtilization)}%
          </p>

          {/* ✅ LEAVE UTILIZATION BAR */}
          <div className="w-full bg-gray-300 h-5 rounded mt-2">
            <div
              className={`h-5 rounded ${barColor}`}
              style={{ width: `${leaveUtilization}%` }}
            />
          </div>

          {leaveUtilization > 80 && (
            <p className="text-red-600 font-semibold mt-2">
              ⚠ High leave usage (above 80%)
            </p>
          )}
        </div>
      )}

      {/* ================= STUDENT LEAVE HISTORY ================= */}
      <div className="bg-white shadow p-4 rounded">
        <h3 className="text-xl font-semibold mb-3">
          Student Leave Requests (Until HOD Approval)
        </h3>

        {studentLeaves.length === 0 ? (
          <p>No pending student leave requests</p>
        ) : (
          <>
            <table className="w-full border">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="border p-2">Student</th>
                  <th className="border p-2">From</th>
                  <th className="border p-2">To</th>
                  <th className="border p-2">Days</th>
                  <th className="border p-2">Reason</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {studentLeaves.map((l) => (
                  <tr key={l._id}>
                    <td className="border p-2">
                      {l.student?.name}
                    </td>
                    <td className="border p-2">
                      {formatDate(l.fromDate)}
                    </td>
                    <td className="border p-2">
                      {formatDate(l.toDate)}
                    </td>
                    <td className="border p-2 text-center">
                      {l.totalDays}
                    </td>
                    <td className="border p-2">{l.reason}</td>
                    <td className="border p-2">
                      <span className={`px-3 py-1 rounded font-semibold text-sm ${getStatusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="border p-2 flex gap-2">
                      {l.status === "Pending-Staff" && (
                        <>
                          <button
                            onClick={() =>
                              updateStudentLeave(
                                l._id,
                                "Approved-Staff"
                              )
                            }
                            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateStudentLeave(
                                l._id,
                                "Rejected-Staff"
                              )
                            }
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {l.status === "Pending-HOD" && (
                        <span className="text-sm text-gray-600 italic">
                          Awaiting HOD Approval
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* STUDENT PAGINATION */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                disabled={studentPage === 1}
                onClick={() =>
                  setStudentPage(studentPage - 1)
                }
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span>
                Page {pagination.student?.page} of{" "}
                {pagination.student?.totalPages}
              </span>

              <button
                disabled={
                  studentPage ===
                  pagination.student?.totalPages
                }
                onClick={() =>
                  setStudentPage(studentPage + 1)
                }
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* ================= APPROVED STUDENT LEAVE HISTORY ================= */}
      <div className="bg-white shadow p-4 rounded">
        <h3 className="text-xl font-semibold mb-3">
          Approved Student Leave History (Both Staff & HOD Approved ✓)
        </h3>

        {approvedStudentLeaves.length === 0 ? (
          <p>No approved student leave records</p>
        ) : (
          <>
            <table className="w-full border">
              <thead className="bg-green-100">
                <tr>
                  <th className="border p-2">Student</th>
                  <th className="border p-2">From</th>
                  <th className="border p-2">To</th>
                  <th className="border p-2">Days</th>
                  <th className="border p-2">Reason</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedStudentLeaves.map((l) => (
                  <tr key={l._id}>
                    <td className="border p-2">
                      {l.student?.name}
                    </td>
                    <td className="border p-2">
                      {formatDate(l.fromDate)}
                    </td>
                    <td className="border p-2">
                      {formatDate(l.toDate)}
                    </td>
                    <td className="border p-2 text-center">
                      {l.totalDays}
                    </td>
                    <td className="border p-2">{l.reason}</td>
                    <td className="border p-2">
                      <span className={`px-3 py-1 rounded font-semibold text-sm ${getStatusBadge(l.status)}`}>
                        {l.status} ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* APPROVED PAGINATION */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                disabled={approvedPage === 1}
                onClick={() =>
                  setApprovedPage(approvedPage - 1)
                }
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span>
                Page {pagination.approved?.page} of{" "}
                {pagination.approved?.totalPages}
              </span>

              <button
                disabled={
                  approvedPage ===
                  pagination.approved?.totalPages
                }
                onClick={() =>
                  setApprovedPage(approvedPage + 1)
                }
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* ================= STAFF LEAVE HISTORY ================= */}
      <div className="bg-white shadow p-4 rounded">
        <h3 className="text-xl font-semibold mb-3">
          My Leave History
        </h3>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">From</th>
              <th className="border p-2">To</th>
              <th className="border p-2">Days</th>
              <th className="border p-2">Reason</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Gate Pass</th>
            </tr>
          </thead>
          <tbody>
            {staffLeaves.map((l) => (
              <tr key={l._id}>
                <td className="border p-2">
                  {formatDate(l.fromDate)}
                </td>
                <td className="border p-2">
                  {formatDate(l.toDate)}
                </td>
                <td className="border p-2">
                  {l.totalDays}
                </td>
                <td className="border p-2">
                  {l.reason}
                </td>
                <td className="border p-2">
                  <span className={`px-3 py-1 rounded font-semibold text-sm ${getStatusBadge(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {l.status === "Approved-HOD" ? (
                    <button
                      onClick={() => generateGatePass(l)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition font-medium shadow"
                    >
                      Download PDF
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Not Available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* STAFF PAGINATION */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            disabled={staffPage === 1}
            onClick={() =>
              setStaffPage(staffPage - 1)
            }
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {pagination.staff?.page} of{" "}
            {pagination.staff?.totalPages}
          </span>

          <button
            disabled={
              staffPage ===
              pagination.staff?.totalPages
            }
            onClick={() =>
              setStaffPage(staffPage + 1)
            }
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= APPLY STAFF LEAVE ================= */}
      <div className="bg-white shadow p-4 rounded max-w-md">
        <h3 className="text-xl font-semibold mb-3">
          Apply Leave
        </h3>

        <form onSubmit={submitLeave} className="space-y-3">
          <input
            className="w-full border p-2"
            placeholder="Reason"
            value={form.reason}
            onChange={(e) =>
              setForm({ ...form, reason: e.target.value })
            }
            required
          />

          <input
            type="date"
            className="w-full border p-2"
            min={semester?.startDate?.slice(0, 10)}
            max={semester?.endDate?.slice(0, 10)}
            value={form.fromDate}
            onChange={(e) =>
              setForm({ ...form, fromDate: e.target.value })
            }
            required
          />

          <input
            type="date"
            className="w-full border p-2"
            min={form.fromDate}
            max={semester?.endDate?.slice(0, 10)}
            value={form.toDate}
            onChange={(e) =>
              setForm({ ...form, toDate: e.target.value })
            }
            required
          />

          <p className="text-sm">
            Days Applied:{" "}
            <b>{calculateDays(form.fromDate, form.toDate)}</b>
          </p>

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Apply Leave
          </button>
        </form>
      </div>
    </div>
  );
}
